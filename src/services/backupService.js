import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { getDb } from '../dal/db.js';
import { paths } from '../utils/paths.js';
import { ensureDir } from '../utils/fs.js';

const execFileAsync = promisify(execFile);

function windowsPath(p) {
  return p.replace(/\\/g, '/').replace(/\//g, '\\');
}

async function zipData(targetPath) {
  ensureDir(path.dirname(targetPath));
  if (process.platform === 'win32') {
    const script = `Compress-Archive -Path '${windowsPath(path.join(paths.dataDir, '*'))}' -DestinationPath '${windowsPath(targetPath)}' -Force`;
    await execFileAsync('powershell', ['-NoLogo', '-Command', script]);
  } else {
    await execFileAsync('zip', ['-r', targetPath, 'Data'], { cwd: paths.rootDir });
  }
  return targetPath;
}

async function unzipData(buffer) {
  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'colpo-restore-'));
  const zipPath = path.join(tempDir, 'upload.zip');
  await fs.promises.writeFile(zipPath, buffer);
  const extractDir = path.join(tempDir, 'extracted');
  await fs.promises.mkdir(extractDir);
  if (process.platform === 'win32') {
    const script = `Expand-Archive -Path '${windowsPath(zipPath)}' -DestinationPath '${windowsPath(extractDir)}' -Force`;
    await execFileAsync('powershell', ['-NoLogo', '-Command', script]);
  } else {
    await execFileAsync('unzip', ['-o', zipPath, '-d', extractDir]);
  }
  const extractedData = path.join(extractDir, 'Data');
  await fs.promises.rm(paths.dataDir, { recursive: true, force: true });
  await copyDirectory(extractedData, paths.dataDir);
  await fs.promises.rm(tempDir, { recursive: true, force: true });
}

async function copyDirectory(source, destination) {
  ensureDir(destination);
  const entries = await fs.promises.readdir(source, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const srcPath = path.join(source, entry.name);
      const destPath = path.join(destination, entry.name);
      if (entry.isDirectory()) {
        await copyDirectory(srcPath, destPath);
      } else if (entry.isFile()) {
        await fs.promises.copyFile(srcPath, destPath);
      }
    })
  );
}

export async function createBackup(note = '') {
  const db = getDb();
  const timestamp = new Date();
  const fileName = `backup-${timestamp.toISOString().replace(/[:.]/g, '-')}.zip`;
  const backupDir = path.join(paths.configDir, 'backups');
  const backupPath = path.join(backupDir, fileName);
  await zipData(backupPath);
  db.prepare(
    'INSERT INTO BackupHistory (BackupDateTime, BackupFilePath, BackupType, Note) VALUES (@BackupDateTime, @BackupFilePath, @BackupType, @Note)'
  ).run({
    BackupDateTime: timestamp.toISOString(),
    BackupFilePath: backupPath,
    BackupType: 'manual',
    Note: note
  });
  return { backupPath };
}

export async function restoreBackup(buffer) {
  await unzipData(buffer);
  return { success: true };
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
