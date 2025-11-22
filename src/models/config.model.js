const db = require('../config/db.config');

function setConfig(key, value) {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO config(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', [key, value], function(err) {
      if (err) return reject(err);
      resolve();
    });
  });
}

function getConfig(key) {
  return new Promise((resolve, reject) => {
    db.get('SELECT value FROM config WHERE key=?', [key], (err, row) => {
      if (err) return reject(err);
      resolve(row ? row.value : null);
    });
  });
}

function getAll() {
  return new Promise((resolve, reject) => {
    db.all('SELECT key, value FROM config', [], (err, rows) => {
      if (err) return reject(err);
      const map = {};
      rows?.forEach((r) => { map[r.key] = r.value; });
      resolve(map);
    });
  });
}

module.exports = { setConfig, getConfig, getAll };
