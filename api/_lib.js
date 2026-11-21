/* Gedeelde hulpfuncties voor de beheer-API van Nuance. */
const crypto = require('crypto');

// sha256 van de toegangscode; de code zelf staat nergens in de broncode.
const CODE_HASH = '945b269dc51426f57ccbbc373e1fcdd4153df2527599a36ec1aa38c3c611377f';
const PREFIX = 'nuance/';

function okCode(code) {
  if (typeof code !== 'string') return false;
  const h = crypto.createHash('sha256').update(code.trim().toLowerCase()).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(h), Buffer.from(CODE_HASH));
}

function hasStore() { return !!process.env.BLOB_READ_WRITE_TOKEN; }

function send(res, status, obj) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(obj));
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

/* Alleen de vorm die het beheer maakt; geen ingesloten foto's (die gaan via /api/upload). */
const IMG_OK = /^(https:\/\/[a-z0-9.-]+\.public\.blob\.vercel-storage\.com\/|assets\/|\/_blob\/)/i;
function validContent(c) {
  if (!c || typeof c !== 'object' || Array.isArray(c)) return 'Geen geldige inhoud.';
  const allowed = ['text', 'img', 'style', 'imgpos', 'data', 'lists', 'hidden'];
  for (const k of Object.keys(c)) if (!allowed.includes(k)) return 'Onbekend onderdeel: ' + k;
  const json = JSON.stringify(c);
  if (json.length > 900000) return 'De wijzigingen zijn te groot.';
  if (/"data:/i.test(json)) return 'Er staan nog foto’s in die niet geüpload zijn.';
  for (const v of Object.values(c.img || {})) if (typeof v !== 'string' || !IMG_OK.test(v)) return 'Ongeldige foto.';
  for (const list of Object.values(c.data || {})) {
    if (!Array.isArray(list)) return 'Ongeldige lijst.';
    for (const o of list) if (o && o.img && !IMG_OK.test(o.img)) return 'Ongeldige foto in een lijst.';
  }
  if (c.hidden != null && (!Array.isArray(c.hidden) || c.hidden.some((h) => typeof h !== 'string' || h.length > 80))) return 'Ongeldige secties.';
  for (const [name, arr] of Object.entries(c.lists || {})) {
    if (!/^[a-z]{2,12}$/.test(name) || !Array.isArray(arr) || arr.length > 200) return 'Ongeldige lijst.';
    for (const o of arr) {
      if (!o || typeof o !== 'object') return 'Ongeldig item in een lijst.';
      for (const [k, v] of Object.entries(o)) if (!['t', 'd', 'g'].includes(k) || typeof v !== 'string' || v.length > 6000) return 'Ongeldig item in een lijst.';
    }
  }
  for (const s of Object.values(c.style || {})) {
    if (!s || typeof s !== 'object') return 'Ongeldige opmaak.';
    if (s.s != null && !(s.s >= 0.6 && s.s <= 2)) return 'Ongeldige tekstgrootte.';
    if (s.f != null && !['serif', 'sans'].includes(s.f)) return 'Ongeldig lettertype.';
    if (s.a != null && !['left', 'center', 'right'].includes(s.a)) return 'Ongeldige uitlijning.';
  }
  return null;
}

async function readLive() {
  const { list } = require('@vercel/blob');
  const r = await list({ prefix: PREFIX + 'content.json', limit: 1 });
  const b = r.blobs.find((x) => x.pathname === PREFIX + 'content.json');
  if (!b) return { content: {}, at: null };
  const res = await fetch(b.url + '?t=' + new Date(b.uploadedAt).getTime(), { cache: 'no-store' });
  if (!res.ok) throw new Error('lezen mislukt');
  return { content: await res.json(), at: b.uploadedAt };
}

module.exports = { okCode, hasStore, send, readBody, validContent, readLive, PREFIX };
