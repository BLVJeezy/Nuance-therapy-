/* POST /api/publish {code, content}: zet de wijzigingen live en bewaart een kopie in de geschiedenis. */
const { okCode, hasStore, send, readBody, validContent, PREFIX } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return send(res, 405, { error: 'Alleen POST.' });
  let body;
  try { body = await readBody(req); } catch (e) { return send(res, 400, { error: 'Ongeldig verzoek.' }); }
  if (!okCode(body.code)) return send(res, 401, { error: 'De toegangscode klopt niet.' });
  if (!hasStore()) return send(res, 503, { error: 'De opslag is nog niet gekoppeld aan de website.', setup: true });
  const err = validContent(body.content);
  if (err) return send(res, 400, { error: err });
  const { put } = require('@vercel/blob');
  const json = JSON.stringify(body.content);
  const opts = { access: 'public', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60 };
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    await put(PREFIX + 'history/' + stamp + '.json', json, opts);
    await put(PREFIX + 'content.json', json, opts);
    return send(res, 200, { ok: true, at: new Date().toISOString() });
  } catch (e) {
    return send(res, 500, { error: 'Publiceren mislukt. Probeer het zo meteen opnieuw.' });
  }
};
