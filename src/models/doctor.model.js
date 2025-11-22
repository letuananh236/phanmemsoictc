const db = require('../config/db.config');

function listActive() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM doctors WHERE status = 1 ORDER BY name', [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

function listAll() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM doctors ORDER BY name', [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

function create(data) {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO doctors(name, position, status) VALUES (?, ?, ?)', [data.name, data.position || '', data.status ? 1 : 0], function(err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, ...data });
    });
  });
}

function update(id, data) {
  return new Promise((resolve, reject) => {
    db.run('UPDATE doctors SET name=?, position=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [data.name, data.position || '', data.status ? 1 : 0, id], function(err) {
      if (err) return reject(err);
      resolve();
    });
  });
}

module.exports = { listActive, listAll, create, update };
