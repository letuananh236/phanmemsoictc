const licenseService = require('../services/license.service');

async function viewLicense(req, res) {
  const status = await licenseService.getStatus();
  res.render('license/license', { status, message: null });
}

async function activate(req, res) {
  const key = req.body.key || req.body.license_key;
  const result = await licenseService.activate(key);
  const status = result.success ? result.status : await licenseService.getStatus();
  res.render('license/license', {
    status,
    message: result.message,
  });
}

module.exports = { viewLicense, activate };
