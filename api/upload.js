/* POST /api/upload {code, dataUrl}: bewaart één foto en geeft het adres terug. */
const crypto = require('crypto');
const { okCode, hasStore, send, readBody, PREFIX } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Alleen POST.' });
  let body;
  try { body = await readBody(req); } catch (e) { return send(res, 400, { error: 'Ongeldig verzoek.' }); }
  if (!okCode(body.code)) return send(res, 401, { error: 'De toegangscode klopt niet.' });
  if (!hasStore()) return send(res, 503, { error: 'De opslag is nog niet gekoppeld aan de website.', setup: true });
  const m = /^data:(image\/(jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(body.dataUrl || '');
  if (!m) return send(res, 400, { error: 'Dit is geen geldige foto.' });
  const buf = Buffer.from(m[3], 'base64');
  if (buf.length > 3.5 * 1024 * 1024) return send(res, 413, { error: 'Deze foto is te groot.' });
  const ext = m[2] === 'jpeg' ? 'jpg' : m[2];
  const name = PREFIX + 'img/' + crypto.createHash('sha1').update(buf).digest('hex').slice(0, 16) + '.' + ext;
  try {
    const { put } = require('@vercel/blob');
    const r = await put(name, buf, { access: 'public', contentType: m[1], addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 31536000 });
    return send(res, 200, { url: r.url });
  } catch (e) {
    return send(res, 500, { error: 'Uploaden mislukt. Probeer het opnieuw.' });
  }
};
