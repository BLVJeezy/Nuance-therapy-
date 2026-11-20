/* GET  /api/history?code=…            : de laatste gepubliceerde versies.
   POST /api/history {code, pathname}   : zet een eerdere versie terug als live versie. */
const { okCode, hasStore, send, readBody, PREFIX } = require('./_lib');

module.exports = async (req, res) => {
  const { list, put } = require('@vercel/blob');
  if (req.method === 'GET') {
    const code = new URL(req.url, 'http://x').searchParams.get('code');
    if (!okCode(code)) return send(res, 401, { error: 'De toegangscode klopt niet.' });
    if (!hasStore()) return send(res, 200, { versions: [], setup: true });
    const r = await list({ prefix: PREFIX + 'history/', limit: 1000 });
    const versions = r.blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)).slice(0, 15)
      .map((b) => ({ pathname: b.pathname, at: b.uploadedAt }));
    return send(res, 200, { versions });
  }
  if (req.method !== 'POST') return send(res, 405, { error: 'Niet toegestaan.' });
  let body;
  try { body = await readBody(req); } catch (e) { return send(res, 400, { error: 'Ongeldig verzoek.' }); }
  if (!okCode(body.code)) return send(res, 401, { error: 'De toegangscode klopt niet.' });
  if (!hasStore()) return send(res, 503, { error: 'De opslag is nog niet gekoppeld aan de website.', setup: true });
  if (typeof body.pathname !== 'string' || !body.pathname.startsWith(PREFIX + 'history/')) return send(res, 400, { error: 'Onbekende versie.' });
  const r = await list({ prefix: body.pathname, limit: 1 });
  const b = r.blobs.find((x) => x.pathname === body.pathname);
  if (!b) return send(res, 404, { error: 'Die versie bestaat niet meer.' });
  const json = await (await fetch(b.url, { cache: 'no-store' })).text();
  const opts = { access: 'public', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60 };
  await put(PREFIX + 'content.json', json, opts);
  await put(PREFIX + 'history/' + new Date().toISOString().replace(/[:.]/g, '-') + '.json', json, opts);
  return send(res, 200, { ok: true, content: JSON.parse(json) });
};
