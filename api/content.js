/* GET /api/content: de gepubliceerde wijzigingen als script, voor index.html en faq.html. */
const { hasStore, readLive } = require('./_lib');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  let content = null;
  if (hasStore()) {
    try { content = (await readLive()).content; } catch (e) { content = null; }
  }
  if (content) {
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=20, stale-while-revalidate=300');
    res.end('window.NUANCE_CONTENT = ' + JSON.stringify(content).replace(/</g, '\\u003c') + ';\n');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=20');
    res.end('/* geen gepubliceerde wijzigingen */\n');
  }
};
