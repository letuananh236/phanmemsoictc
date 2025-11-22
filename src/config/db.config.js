const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { DATABASE_FILE, SCHEMA_FILE } = require('./app.config');

if (!fs.existsSync(path.dirname(DATABASE_FILE))) {
  fs.mkdirSync(path.dirname(DATABASE_FILE), { recursive: true });
}

const db = new sqlite3.Database(DATABASE_FILE);

function runMigrations() {
  const schema = fs.readFileSync(SCHEMA_FILE, 'utf-8');
  db.exec(schema, (err) => {
    if (err) {
      console.error('Failed to apply schema', err);
    }
  });
}

runMigrations();

module.exports = db;
