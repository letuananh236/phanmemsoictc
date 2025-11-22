const licenseModel = require('../models/license.model');

async function getStatus() {
  return licenseModel.getStatus();
}

function parseKey(keyString) {
  const trimmed = (keyString || '').trim();
  if (!trimmed) {
    return { valid: false, message: 'License key không được để trống.' };
  }
  const parts = trimmed.split('-');
  if (parts.length < 6 || parts[0] !== 'CTC') {
    return { valid: false, message: 'License key không đúng định dạng.' };
  }
  const [, edition, expire] = parts;
  return {
    valid: true,
    payload: {
      license_key: trimmed,
      edition,
      expire_date: expire,
      status: 'active',
      activated_at: new Date().toISOString(),
    },
  };
}

async function activate(key) {
  const parsed = parseKey(key);
  if (!parsed.valid) {
    return { success: false, message: parsed.message };
  }
  const record = await licenseModel.saveKey(parsed.payload);
  return { success: true, status: record, message: 'Kích hoạt thành công.' };
}

module.exports = { getStatus, activate };
