const licenseModel = require('../models/license.model');

async function ensureLicense(req, res, next) {
  const status = await licenseModel.getStatus();
  if (status && status.status === 'active') {
    return next();
  }
  return res.redirect('/license');
}

module.exports = { ensureLicense };
