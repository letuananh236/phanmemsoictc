const db = require('../config/db.config');

function listByExam(examId) {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM images WHERE exam_id=? ORDER BY display_order', [examId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

function create(examId, filePath, order) {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO images(exam_id, file_path, display_order) VALUES (?,?,?)', [examId, filePath, order], function(err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, exam_id: examId, file_path: filePath, display_order: order });
    });
  });
}

function remove(id) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM images WHERE id=?', [id], function(err) {
      if (err) return reject(err);
      resolve();
    });
  });
}

module.exports = { listByExam, create, remove };
