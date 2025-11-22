const db = require('../config/db.config');

function logBackup(filePath) {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO backup(file_path) VALUES (?)', [filePath], function(err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, file_path: filePath });
    });
  });
}

function listBackups() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM backup ORDER BY created_at DESC LIMIT 20', [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

module.exports = { logBackup, listBackups };
