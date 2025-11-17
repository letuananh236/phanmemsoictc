import fs from 'node:fs';
import path from 'node:path';
import { getDb } from '../dal/db.js';
import { paths } from '../utils/paths.js';
import { ensureDir } from '../utils/fs.js';

function storeBuffer(examId, order, buffer) {
  const now = new Date();
  const folder = path.join(
    paths.imagesDir,
    String(now.getUTCFullYear()),
    String(now.getUTCMonth() + 1).padStart(2, '0')
  );
  ensureDir(folder);
  const safeExam = examId || 'EXAM';
  const filename = `${safeExam}_${String(order).padStart(2, '0')}.png`;
  const filePath = path.join(folder, filename);
  fs.writeFileSync(filePath, buffer);
  return path.relative(paths.rootDir, filePath).replace(/\\/g, '/');
}

export function saveExamImage(examId, order, dataUrl, note) {
  const matches = dataUrl?.match(/^data:(.+);base64,(.*)$/);
  if (!matches) throw new Error('invalid_image');
  const buffer = Buffer.from(matches[2], 'base64');
  const storedPath = storeBuffer(examId, order, buffer);
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO ExamImages (ExamID, ImageOrder, FilePath, CapturedAt, Note) VALUES (@ExamID, @ImageOrder, @FilePath, @CapturedAt, @Note)'
  ).run({
    ExamID: examId,
    ImageOrder: order,
    FilePath: storedPath,
    CapturedAt: now,
    Note: note || null
  });
  return { path: storedPath, order };
}

export function listImages(examId) {
  const db = getDb();
  return db
    .prepare('SELECT * FROM ExamImages WHERE ExamID = ? ORDER BY ImageOrder')
    .all(examId)
    .map((row) => ({
      id: row.ImageID,
      order: row.ImageOrder,
      path: row.FilePath,
      capturedAt: row.CapturedAt,
      note: row.Note
    }));
}

export function clearImages(examId) {
  const db = getDb();
  db.prepare('DELETE FROM ExamImages WHERE ExamID = ?').run(examId);
}
