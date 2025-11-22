const licenseModel = require('../models/license.model');

async function getStatus() {
  return licenseModel.getStatus();
}

async function activate(key) {
  const now = new Date();
  const expire = new Date();
  expire.setMonth(expire.getMonth() + 12);
  return licenseModel.save({
    license_key: key,
    status: 'active',
    activated_at: now.toISOString(),
    expire_at: expire.toISOString()
  });
}

module.exports = { getStatus, activate };
