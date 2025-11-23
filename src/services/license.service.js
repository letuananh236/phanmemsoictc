const licenseModel = require('../models/license.model');
const ready = licenseModel.ensureShape();

async function getStatus() {
  try {
    await ready;
    const row = await licenseModel.getStatus();
    if (row) {
      return {
        license_key: row.license_key || null,
        edition: row.edition || null,
        expire_date: row.expire_date || null,
        status: row.status || 'inactive',
        activated_at: row.activated_at || null,
        created_at: row.created_at || null,
      };
    }
    return { license_key: null, edition: null, expire_date: null, status: 'inactive', activated_at: null, created_at: null, message: 'Chưa có license' };
  } catch (err) {
    console.error('license.service.getStatus failed:', err);
    return { status: 'inactive', message: 'Không thể tải trạng thái license' };
  }
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
  await ready;
  const parsed = parseKey(key);
  if (!parsed.valid) {
    return { success: false, message: parsed.message };
  }
  try {
    const record = await licenseModel.saveKey(parsed.payload);
    return { success: true, status: record, message: 'Kích hoạt thành công.' };
  } catch (err) {
    console.error('license.service.activate failed:', err);
    return { success: false, message: 'Không thể lưu license. Vui lòng thử lại.' };
  }
}

module.exports = { getStatus, activate };
