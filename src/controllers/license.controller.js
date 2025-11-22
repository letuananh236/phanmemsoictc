const licenseService = require('../services/license.service');

async function viewLicense(req, res, next) {
  try {
    const status = await licenseService.getStatus();
    res.render('license/license', { status, message: null });
  } catch (err) {
    next(err);
  }
}

async function activate(req, res, next) {
  try {
    const key = req.body.key || req.body.license_key;
    const result = await licenseService.activate(key);
    const status = result.success ? result.status : await licenseService.getStatus();
    res.render('license/license', {
      status,
      message: result.message,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { viewLicense, activate };
