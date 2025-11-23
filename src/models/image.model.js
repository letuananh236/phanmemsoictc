const db = require('../config/db.config');

function listByExam(examId) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM images WHERE exam_id = ? ORDER BY display_order IS NULL, display_order, created_at DESC', [examId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

function listForCapture(examId, limit = 10) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM images WHERE exam_id = ? OR exam_id IS NULL ORDER BY created_at DESC LIMIT ?',
      [examId, limit],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      }
    );
  });
}

function listUnassigned(limit = 10) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM images WHERE exam_id IS NULL ORDER BY created_at DESC LIMIT ?', [limit], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

function create({ examId, filePath, displayOrder = null }) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO images(exam_id, file_path, display_order, created_at) VALUES (?,?,?,CURRENT_TIMESTAMP)',
      [examId || null, filePath, displayOrder],
      function insertCb(err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, exam_id: examId || null, file_path: filePath, display_order: displayOrder });
      }
    );
  });
}

function findById(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM images WHERE id = ?', [id], (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });
}

function remove(id) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM images WHERE id = ?', [id], function runCb(err) {
      if (err) return reject(err);
      resolve(this.changes > 0);
    });
  });
}

function touch(id) {
  return new Promise((resolve, reject) => {
    db.run('UPDATE images SET created_at = CURRENT_TIMESTAMP WHERE id = ?', [id], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

function assignToExam(examId, imageIds) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      db.run('UPDATE images SET exam_id = NULL, display_order = NULL WHERE exam_id = ?', [examId]);
      imageIds.forEach((id, idx) => {
        db.run('UPDATE images SET exam_id = ?, display_order = ? WHERE id = ?', [examId, idx + 1, id]);
      });
      db.run('COMMIT', (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  });
}

module.exports = {
  listByExam,
  listForCapture,
  listUnassigned,
  create,
  findById,
  remove,
  touch,
  assignToExam
};
