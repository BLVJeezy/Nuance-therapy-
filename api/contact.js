/* POST /api/contact: aanvraag uit het afspraakformulier, met optionele foto's en een spraakbericht.
   Verstuurt een e-mail via Resend naar de praktijk. Niets wordt bewaard op de server.
   Instellingen (Vercel → Settings → Environment Variables):
     RESEND_API_KEY  verplicht
     CONTACT_TO      standaard verbinding@nuance-therapie.be
     CONTACT_FROM    standaard "Website Nuance <website@solynglobal.be>" (afzenderdomein moet geverifieerd zijn in Resend) */
const { send, readBody } = require('./_lib');

const MAX_PHOTOS = 3;
const MAX_PHOTO_BYTES = 2.5 * 1024 * 1024;
const MAX_VOICE_BYTES = 2.5 * 1024 * 1024;

function str(v, max) { return typeof v === 'string' ? v.trim().slice(0, max) : ''; }
function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function decode(dataUrl, kinds) {
  const m = /^data:([a-z]+\/[a-z0-9.+-]+)(;codecs=[a-z0-9.,-]+)?;base64,([A-Za-z0-9+/=]+)$/i.exec(dataUrl || '');
  if (!m || !kinds.test(m[1])) return null;
  return { type: m[1].toLowerCase(), b64: m[3], bytes: Math.floor(m[3].length * 3 / 4) };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Alleen POST.' });
  let b;
  try { b = await readBody(req); } catch (e) { return send(res, 400, { error: 'Ongeldig verzoek.' }); }
  if (str(b.website, 200)) return send(res, 200, { ok: true }); // honeypot: stil negeren

  const f = {
    voornaam: str(b.voornaam, 80), naam: str(b.naam, 80), email: str(b.email, 160),
    telefoon: str(b.telefoon, 40), dienst: str(b.dienst, 120), bericht: str(b.bericht, 6000),
  };
  if (!f.voornaam || !f.naam) return send(res, 400, { error: 'Vul je voornaam en naam in.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return send(res, 400, { error: 'Dit e-mailadres lijkt niet te kloppen.' });
  if (!/^[+0-9 ()./-]{6,}$/.test(f.telefoon)) return send(res, 400, { error: 'Dit telefoonnummer lijkt niet te kloppen.' });
  if (!f.dienst || !f.bericht) return send(res, 400, { error: 'Kies een dienst en schrijf een kort bericht.' });

  const attachments = [];
  const photos = Array.isArray(b.photos) ? b.photos.slice(0, MAX_PHOTOS) : [];
  for (let i = 0; i < photos.length; i++) {
    const p = decode(photos[i], /^image\/(jpeg|png|webp)$/);
    if (!p || p.bytes > MAX_PHOTO_BYTES) return send(res, 400, { error: 'Een van de foto’s kon niet verwerkt worden.' });
    attachments.push({ filename: 'foto-' + (i + 1) + '.' + (p.type === 'image/jpeg' ? 'jpg' : p.type.split('/')[1]), content: p.b64 });
  }
  if (b.voice && b.voice.data) {
    const v = decode(b.voice.data, /^audio\/(webm|mp4|ogg|mpeg|aac|x-m4a)$/);
    if (!v || v.bytes > MAX_VOICE_BYTES) return send(res, 400, { error: 'Het spraakbericht kon niet verwerkt worden.' });
    const ext = { 'audio/webm': 'webm', 'audio/mp4': 'm4a', 'audio/x-m4a': 'm4a', 'audio/ogg': 'ogg', 'audio/mpeg': 'mp3', 'audio/aac': 'aac' }[v.type] || 'webm';
    attachments.push({ filename: 'spraakbericht.' + ext, content: v.b64 });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) return send(res, 503, { error: 'Het formulier is nog niet gekoppeld aan e-mail.', setup: true });

  const rows = [['Voornaam', f.voornaam], ['Naam', f.naam], ['E-mail', f.email], ['Telefoon', f.telefoon], ['Dienst', f.dienst]];
  const extra = [];
  if (photos.length) extra.push(photos.length + ' foto' + (photos.length > 1 ? '’s' : ''));
  if (b.voice && b.voice.data) extra.push('een spraakbericht');
  const html = '<div style="font-family:Arial,sans-serif;font-size:15px;color:#2b1d24;line-height:1.6">'
    + '<h2 style="font-weight:normal;margin:0 0 12px">Nieuwe aanvraag via de website</h2>'
    + '<table style="border-collapse:collapse">' + rows.map(([k, v]) => '<tr><td style="padding:4px 16px 4px 0;color:#7a6470">' + k + '</td><td style="padding:4px 0">' + esc(v) + '</td></tr>').join('') + '</table>'
    + '<p style="margin:18px 0 6px;color:#7a6470">Bericht</p><p style="margin:0;white-space:pre-wrap">' + esc(f.bericht) + '</p>'
    + (extra.length ? '<p style="margin:18px 0 0;color:#7a6470">In bijlage: ' + extra.join(' en ') + '.</p>' : '')
    + '<p style="margin:24px 0 0;font-size:13px;color:#9a8790">Beantwoorden gaat rechtstreeks naar ' + esc(f.email) + '.</p></div>';
  const text = rows.map(([k, v]) => k + ': ' + v).join('\n') + '\n\nBericht:\n' + f.bericht + (extra.length ? '\n\nIn bijlage: ' + extra.join(' en ') + '.' : '');

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM || 'Website Nuance <website@solynglobal.be>',
        to: [process.env.CONTACT_TO || 'verbinding@nuance-therapie.be'],
        reply_to: f.email,
        subject: 'Aanvraag intakegesprek — ' + f.voornaam + ' ' + f.naam + ' (' + f.dienst + ')',
        html, text, attachments,
      }),
    });
    if (!r.ok) throw new Error('resend ' + r.status);
    return send(res, 200, { ok: true });
  } catch (e) {
    console.error('[contact]', e && e.message);
    return send(res, 502, { error: 'Versturen lukte niet. Probeer het opnieuw of mail naar verbinding@nuance-therapie.be.' });
  }
};
