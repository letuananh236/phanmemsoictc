import fs from 'node:fs';
import path from 'node:path';
import { getDb } from '../dal/db.js';
import { paths } from '../utils/paths.js';
import { ensureDir } from '../utils/fs.js';

const BACKUP_DIR = path.join(paths.configDir, 'backups');

function ensureBackupDir() {
  ensureDir(BACKUP_DIR);
  return BACKUP_DIR;
}

async function writeBackupRecord(filePath, note = '') {
  const db = getDb();
  db.prepare(
    'INSERT INTO BackupHistory (BackupDateTime, BackupFilePath, BackupType, Note) VALUES (@BackupDateTime, @BackupFilePath, @BackupType, @Note)'
  ).run({
    BackupDateTime: new Date().toISOString(),
    BackupFilePath: filePath,
    BackupType: 'manual',
    Note: note
  });
}

export async function createBackup(note = '') {
  ensureBackupDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `app-${timestamp}.db`;
  const destination = path.join(BACKUP_DIR, fileName);
  await fs.promises.copyFile(paths.databaseFile, destination);
  await writeBackupRecord(destination, note);
  return { backupPath: destination, fileName };
}

export function listBackupHistory(limit = 10) {
  const db = getDb();
  const rows = db
    .prepare(
      'SELECT BackupID, BackupDateTime, BackupFilePath, BackupType, Note FROM BackupHistory ORDER BY datetime(BackupDateTime) DESC LIMIT ?'
    )
    .all(limit);
  return rows.map((row) => ({
    id: row.BackupID,
    time: row.BackupDateTime,
    path: row.BackupFilePath,
    type: row.BackupType,
    note: row.Note
  }));
}

function validateBackupBuffer(buffer) {
  if (!buffer || buffer.length < 100) {
    throw new Error('invalid_backup');
  }
  const header = buffer.subarray(0, 15).toString('utf8');
  if (!header.includes('SQLite format 3')) {
    throw new Error('invalid_backup');
  }
}

export async function restoreBackup(buffer) {
  validateBackupBuffer(buffer);
  const tempFile = `${paths.databaseFile}.restore`;
  await fs.promises.writeFile(tempFile, buffer);
  await fs.promises.copyFile(tempFile, paths.databaseFile);
  await fs.promises.rm(tempFile, { force: true });
  return { success: true };
}
