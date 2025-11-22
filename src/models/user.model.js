const db = require('../config/db.config');
const bcrypt = require('bcryptjs');

function initAdmin() {
  db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
    if (err) return;
    if (row.count === 0) {
      const hash = bcrypt.hashSync('admin123', 10);
      db.run('INSERT INTO users(username, password_hash, role, active) VALUES (?, ?, ?, 1)', ['admin', hash, 'ADMIN']);
    }
  });
}

function findByUsername(username) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

module.exports = { initAdmin, findByUsername };
