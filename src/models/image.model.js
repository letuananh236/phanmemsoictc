const db = require('../config/db.config');

function listByExam(examId) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM images WHERE exam_id = ? ORDER BY display_order IS NULL, display_order, created_at DESC', [examId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

function listForCapture(examId) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM images WHERE exam_id = ? OR exam_id IS NULL ORDER BY created_at DESC',
      [examId],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      }
    );
  });
}

function listUnassigned() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM images WHERE exam_id IS NULL ORDER BY created_at DESC', [], (err, rows) => {
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

module.exports = { listByExam, listForCapture, listUnassigned, create, assignToExam };
