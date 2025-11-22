const licenseService = require('../services/license.service');

async function viewLicense(req, res) {
  try {
    const status = await licenseService.getStatus();
    res.render('license/license', { status, message: null });
  } catch (err) {
    console.error('viewLicense failed:', err);
    res.render('license/license', { status: null, message: 'Không thể tải trang bản quyền. Vui lòng thử lại.' });
  }
}

async function activate(req, res) {
  try {
    const key = req.body.key || req.body.license_key;
    const result = await licenseService.activate(key);
    const status = result.success ? result.status : await licenseService.getStatus();
    res.render('license/license', {
      status,
      message: result.message,
    });
  } catch (err) {
    console.error('activate license failed:', err);
    const status = await licenseService.getStatus();
    res.render('license/license', { status, message: 'Không thể kích hoạt license. Vui lòng thử lại.' });
  }
}

module.exports = { viewLicense, activate };
