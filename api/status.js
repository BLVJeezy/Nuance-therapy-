/* GET /api/status: is de opslag gekoppeld? (zonder geheimen) */
const { hasStore, send } = require('./_lib');
module.exports = async (req, res) => send(res, 200, { store: hasStore() });
