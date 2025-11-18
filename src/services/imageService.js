import fs from 'node:fs';
import path from 'node:path';
import { getDb } from '../dal/db.js';
import { paths } from '../utils/paths.js';
import { ensureDir } from '../utils/fs.js';

function resolveVisit(visitIdOrCode) {
  const db = getDb();
  const row = db
    .prepare('SELECT id, ma_phieu FROM visits WHERE id = ? OR ma_phieu = ?')
    .get(Number(visitIdOrCode) || -1, String(visitIdOrCode));
  if (!row) throw new Error('visit_not_found');
  return { id: row.id, code: row.ma_phieu };
}

async function resizeBuffer(buffer) {
  try {
    const sharp = await import('sharp');
    return await sharp.default(buffer).resize({ width: 1280, withoutEnlargement: true }).jpeg({ quality: 90 }).toBuffer();
  } catch (err) {
    console.warn('[images] resize unavailable, saving original buffer', err?.message || err);
    return buffer;
  }
}

async function storeBuffer(visitId, order, buffer) {
  const now = new Date();
  const folder = path.join(
    paths.imagesDir,
    String(now.getUTCFullYear()),
    String(now.getUTCMonth() + 1).padStart(2, '0')
  );
  ensureDir(folder);
  const filename = `visit_${visitId}_${String(order).padStart(2, '0')}.jpg`;
  const filePath = path.join(folder, filename);
  const resized = await resizeBuffer(buffer);
  fs.writeFileSync(filePath, resized);
  return path.relative(paths.imagesDir, filePath).replace(/\\/g, '/');
}

function nextOrder(existingOrders, requested) {
  const maxSlots = 4;
  const used = new Set(existingOrders.filter((n) => Number.isInteger(n)));
  if (requested && requested >= 1 && requested <= maxSlots && !used.has(requested)) return requested;
  for (let i = 1; i <= maxSlots; i += 1) {
    if (!used.has(i)) return i;
  }
  return null;
}

export function listVisitImages(visitIdOrCode) {
  const db = getDb();
  const visit = resolveVisit(visitIdOrCode);
  return db
    .prepare(
      'SELECT id, visit_id, file_path, display_order, is_selected, created_at FROM visit_images WHERE visit_id = ? ORDER BY display_order, created_at'
    )
    .all(visit.id)
    .map((row) => ({
      id: row.id,
      visitId: row.visit_id,
      order: row.display_order,
      path: row.file_path,
      url: `/images/${row.file_path}`,
      createdAt: row.created_at,
      selected: !!row.is_selected
    }));
}

export async function saveVisitImage(visitIdOrCode, dataUrl, displayOrder, note) {
  const matches = dataUrl?.match(/^data:(.+);base64,(.*)$/);
  if (!matches) throw new Error('invalid_image');
  const visit = resolveVisit(visitIdOrCode);
  const db = getDb();
  const selected = db
    .prepare('SELECT display_order FROM visit_images WHERE visit_id = ? AND is_selected = 1 ORDER BY display_order')
    .all(visit.id);
  if (selected.length >= 4) {
    const err = new Error('max_images');
    err.status = 400;
    throw err;
  }

  const order = nextOrder(selected.map((s) => s.display_order), Number(displayOrder));
  if (!order) {
    const err = new Error('max_images');
    err.status = 400;
    throw err;
  }

  const buffer = Buffer.from(matches[2], 'base64');
  const storedPath = await storeBuffer(visit.id, order, buffer);
  const now = new Date().toISOString();
  const result = db
    .prepare(
      'INSERT INTO visit_images (visit_id, file_path, display_order, is_selected, created_at) VALUES (@visit_id, @file_path, @display_order, @is_selected, @created_at)'
    )
    .run({
      visit_id: visit.id,
      file_path: storedPath,
      display_order: order,
      is_selected: 1,
      created_at: now
    });

  return { id: result.lastInsertRowid, visitId: visit.id, path: storedPath, order, createdAt: now, selected: true, note: note || '' };
}

export function deleteVisitImage(id) {
  const db = getDb();
  const record = db.prepare('SELECT file_path FROM visit_images WHERE id = ?').get(id);
  db.prepare('DELETE FROM visit_images WHERE id = ?').run(id);
  if (record?.file_path) {
    const abs = path.join(paths.imagesDir, record.file_path);
    if (fs.existsSync(abs)) {
      try {
        fs.unlinkSync(abs);
      } catch (err) {
        console.warn('Không thể xóa file ảnh', err);
      }
    }
  }
}

export function deleteVisitImagesByVisit(visitIdOrCode) {
  const visit = resolveVisit(visitIdOrCode);
  const db = getDb();
  const records = db.prepare('SELECT id FROM visit_images WHERE visit_id = ?').all(visit.id);
  records.forEach((r) => deleteVisitImage(r.id));
}

// Legacy aliases
export async function saveExamImage(examId, order, dataUrl, note) {
  return saveVisitImage(examId, dataUrl, order, note);
}

export function listImages(examId) {
  return listVisitImages(examId);
}

export function clearImages(examId) {
  return deleteVisitImagesByVisit(examId);
}
