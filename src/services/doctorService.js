import { getDb } from '../dal/db.js';

function mapDoctor(row) {
  return {
    id: row.id,
    name: row.ten,
    title: row.title || row.chuyen_khoa || '',
    department: row.chuyen_khoa || '',
    signatureImagePath: row.signatureImagePath,
    active: !!row.is_active
  };
}

export function listDoctors({ activeOnly = false } = {}) {
  const db = getDb();
  const where = activeOnly ? 'WHERE is_active = 1' : '';
  return db.prepare(`SELECT * FROM doctors ${where} ORDER BY is_active DESC, ten`).all().map(mapDoctor);
}

export function saveDoctor(payload) {
  const db = getDb();
  if (payload.id) {
    db.prepare('UPDATE doctors SET ten=@ten, chuyen_khoa=@chuyen_khoa, is_active=@is_active WHERE id=@id').run({
      id: payload.id,
      ten: payload.name,
      chuyen_khoa: payload.department || payload.title || '',
      is_active: payload.active ? 1 : 0
    });
  } else {
    db.prepare('INSERT INTO doctors (ten, chuyen_khoa, is_active) VALUES (@ten, @chuyen_khoa, @is_active)').run({
      ten: payload.name,
      chuyen_khoa: payload.department || payload.title || '',
      is_active: payload.active ? 1 : 0
    });
  }
  const latest = db.prepare('SELECT * FROM doctors WHERE id = last_insert_rowid()').get();
  if (payload.id && !latest) {
    const current = db.prepare('SELECT * FROM doctors WHERE id = @id').get({ id: payload.id });
    return current ? mapDoctor(current) : null;
  }
  return latest ? mapDoctor(latest) : null;
}

export function deleteDoctor(id) {
  const db = getDb();
  db.prepare('DELETE FROM doctors WHERE id = ?').run(id);
  return true;
}
