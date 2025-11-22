const configService = require('../services/config.service');

async function systemConfig(req, res) {
  if (req.method === 'POST') {
    const entries = Object.entries(req.body || {});
    for (const [key, value] of entries) {
      await configService.set(key, value);
    }
  }
  const config = await configService.getAll();
  res.render('config/system', { config });
}

module.exports = { systemConfig };
