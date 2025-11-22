const licenseModel = require('../models/license.model');

async function ensureLicense(req, res, next) {
  try {
    const status = await licenseModel.getStatus();
    if (status && status.status === 'active') {
      return next();
    }
    if (req.path.startsWith('/license')) {
      return next();
    }
    return res.redirect('/license');
  } catch (err) {
    console.error('License check failed:', err);
    if (req.path.startsWith('/license')) return next();
    return res.redirect('/license');
  }
}

module.exports = { ensureLicense };
