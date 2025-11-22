const backupService = require('../services/backup.service');

async function viewPage(req, res) {
  const backups = await backupService.listBackups();
  res.render('backup/backup', { backups, message: null });
}

async function createBackup(req, res) {
  const path = await backupService.createBackup();
  const backups = await backupService.listBackups();
  res.render('backup/backup', { backups, message: `Đã tạo backup: ${path}` });
}

module.exports = { viewPage, createBackup };
