import path from 'path';
import fsPromises from 'fs/promises';
import { getPaths } from '../db.js';

async function saveImageFromDataUrl({ examId, index, dataUrl }) {
  const { imagesDir, rootDir } = getPaths();
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
  return path.relative(rootDir, filePath).replace(/\\/g, '/');
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

export { saveImageFromDataUrl, saveLogoFile };
