const licenseService = require('../services/license.service');

async function viewLicense(req, res) {
  const status = await licenseService.getStatus();
  res.render('license/license', { status, message: null });
}

async function activate(req, res) {
  const key = req.body.license_key;
  await licenseService.activate(key);
  const status = await licenseService.getStatus();
  res.render('license/license', { status, message: 'Kích hoạt thành công' });
}

module.exports = { viewLicense, activate };
