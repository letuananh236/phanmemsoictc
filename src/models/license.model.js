const db = require('../config/db.config');

function getStatus() {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM license ORDER BY id DESC LIMIT 1', [], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function save(license) {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO license(license_key, status, activated_at, expire_at) VALUES (?, ?, ?, ?)', [license.license_key, license.status, license.activated_at, license.expire_at], function(err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, ...license });
    });
  });
}

module.exports = { getStatus, save };
