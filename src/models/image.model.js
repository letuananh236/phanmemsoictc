import path from 'path';
import fsPromises from 'fs/promises';
import { getPaths } from '../db.js';

async function saveImageFromDataUrl({ examId, index, dataUrl }) {
  const { imagesDir, rootDir, databaseDir } = getPaths();
  if (!dataUrl) {
    throw new Error('missing_data');
  }
  const matches = dataUrl.match(/^data:(.+);base64,(.*)$/);
  if (!matches) {
    throw new Error('invalid_data');
  }
  const buffer = Buffer.from(matches[2], 'base64');
  const now = new Date();
  const folder = path.join(imagesDir, String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, '0'));
  await fsPromises.mkdir(folder, { recursive: true });
  const safeExam = examId || 'EXAM';
  const name = `${safeExam}_${String(index).padStart(2, '0')}.png`;
  const filePath = path.join(folder, name);
  await fsPromises.writeFile(filePath, buffer);
  const relativeToDb = path.relative(databaseDir, filePath).replace(/\\/g, '/');
  return `database/${relativeToDb}`;
}

async function saveLogoFile({ dataUrl, fileName }) {
  const { logoDir } = getPaths();
  if (!dataUrl) {
    throw new Error('missing_logo');
  }
  const matches = dataUrl.match(/^data:(.+);base64,(.*)$/);
  if (!matches) {
    throw new Error('invalid_logo');
  }
  const buffer = Buffer.from(matches[2], 'base64');
  await fsPromises.mkdir(logoDir, { recursive: true });
  const safeBase = path.basename(fileName || 'logo.png').replace(/[^a-zA-Z0-9._-]/g, '_');
  const finalName = `${Date.now()}_${safeBase}`;
  const filePath = path.join(logoDir, finalName);
  await fsPromises.writeFile(filePath, buffer);
  return finalName;
}

function sanitizeTargetPath(targetPath) {
  const raw = String(targetPath || '').trim();
  if (!raw) return null;
  const normalized = raw.replace(/\\/g, '/').replace(/^\/+/, '');
  if (normalized.includes('..')) {
    throw new Error('invalid_target_path');
  }
  return normalized;
}

async function saveImageFromDataUrlToTarget({ dataUrl, targetPath }) {
  const { imagesDir, databaseDir } = getPaths();
  if (!dataUrl) {
    throw new Error('missing_data');
  }
  const matches = dataUrl.match(/^data:(.+);base64,(.*)$/);
  if (!matches) {
    throw new Error('invalid_data');
  }

  const safeTarget = sanitizeTargetPath(targetPath);
  if (!safeTarget) {
    throw new Error('missing_target_path');
  }

  const ext = path.extname(safeTarget) || '.png';
  const finalName = path.basename(safeTarget, path.extname(safeTarget)).replace(/[^a-zA-Z0-9._-]/g, '_');
  const finalRelative = path.join(path.dirname(safeTarget), `${finalName}${ext}`).replace(/\\/g, '/');
  const filePath = path.join(imagesDir, finalRelative);
  await fsPromises.mkdir(path.dirname(filePath), { recursive: true });

  const buffer = Buffer.from(matches[2], 'base64');
  await fsPromises.writeFile(filePath, buffer);

  const relativeToDb = path.relative(databaseDir, filePath).replace(/\\/g, '/');
  return `database/${relativeToDb}`;
}

export { saveImageFromDataUrl, saveImageFromDataUrlToTarget, saveLogoFile };
