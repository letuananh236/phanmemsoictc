const fs = require('fs');
const path = require('path');
const { DATABASE_FILE } = require('../config/app.config');
const backupModel = require('../models/backup.model');

const backupDir = path.join(__dirname, '..', 'database', 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

async function createBackup() {
  const dest = path.join(backupDir, `clinic-backup-${Date.now()}.db`);
  fs.copyFileSync(DATABASE_FILE, dest);
  await backupModel.logBackup(dest);
  return dest;
}

async function listBackups() {
  return backupModel.listBackups();
}

module.exports = { createBackup, listBackups };
