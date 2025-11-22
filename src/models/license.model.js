const db = require('../config/db.config');

const REQUIRED_COLUMNS = ['license_key', 'edition', 'expire_date', 'status', 'activated_at', 'created_at'];

function ensureShape() {
  return new Promise((resolve, reject) => {
    db.all("PRAGMA table_info('license')", [], (err, rows) => {
      if (err) return reject(err);
      const columns = rows.map((r) => r.name);
      const alters = [];
      if (!columns.length) {
        db.run(
          'CREATE TABLE IF NOT EXISTS license (id INTEGER PRIMARY KEY AUTOINCREMENT, license_key TEXT, edition TEXT, expire_date TEXT, status TEXT, activated_at TEXT, created_at TEXT)',
          (createErr) => {
            if (createErr) return reject(createErr);
            resolve();
          }
        );
        return;
      }
      REQUIRED_COLUMNS.forEach((col) => {
        if (!columns.includes(col)) {
          alters.push(`ALTER TABLE license ADD COLUMN ${col} TEXT`);
        }
      });
      const runNext = () => {
        const stmt = alters.shift();
        if (!stmt) return resolve();
        db.run(stmt, [], (alterErr) => {
          if (alterErr && !/duplicate column/i.test(alterErr.message)) {
            return reject(alterErr);
          }
          runNext();
        });
      };
      runNext();
    });
  });
}

async function getStatus() {
  try {
    await ensureShape();
    return await new Promise((resolve, reject) => {
      db.get('SELECT * FROM license ORDER BY id DESC LIMIT 1', [], (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });
  } catch (err) {
    console.error('license.model.getStatus failed:', err);
    return null;
  }
}

async function saveKey(data) {
  await ensureShape();
  const createdAt = data.created_at || new Date().toISOString();
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO license(license_key, edition, expire_date, status, activated_at, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [data.license_key, data.edition, data.expire_date, data.status, data.activated_at, createdAt],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, ...data, created_at: createdAt });
      }
    );
  });
}

async function clear() {
  await ensureShape();
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM license', [], function (err) {
      if (err) return reject(err);
      resolve(this.changes);
    });
  });
}

module.exports = { getStatus, saveKey, clear };
