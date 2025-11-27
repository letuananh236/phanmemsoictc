import path from 'path';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'database.sqlite');

let db;

export function initDatabase(defaultData) {
  if (db) {
    db.close();
  }
  fs.mkdirSync(dataDir, { recursive: true });
  db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS license (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS patients (id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS exams (id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS doctors (id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS templates (id TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, data TEXT NOT NULL);
  `);

  ensureSingleton('settings', defaultData.settings);
  ensureSingleton('license', {});
  seedList('patients', defaultData.patients || []);
  seedList('exams', defaultData.exams || []);
  seedList('doctors', defaultData.doctors || []);
  seedList('templates', defaultData.templates || []);
  seedList('users', (defaultData.users || []).map((user) => ({ id: user.username, ...user })));
}

function ensureSingleton(table, value) {
  const row = db.prepare(`SELECT data FROM ${table} WHERE id = 1`).get();
  if (!row) {
    db.prepare(`INSERT INTO ${table} (id, data) VALUES (1, ?)`).run(JSON.stringify(value));
  }
}

function seedList(table, values) {
  const row = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
  if (row.count === 0) {
    const insert = db.prepare(`INSERT INTO ${table} (id, data) VALUES (?, ?)`);
    values.forEach((item, index) => {
      const id = item.id || item.username || `row_${index + 1}`;
      insert.run(id, JSON.stringify(item));
    });
  }
}

export function getSettings(defaults) {
  const row = db.prepare('SELECT data FROM settings WHERE id = 1').get();
  const stored = row ? JSON.parse(row.data || '{}') : {};
  return { ...defaults, ...stored };
}

export function saveSettings(data) {
  db.prepare('INSERT OR REPLACE INTO settings (id, data) VALUES (1, ?)').run(JSON.stringify(data));
}

export function getLicense() {
  const row = db.prepare('SELECT data FROM license WHERE id = 1').get();
  return row ? JSON.parse(row.data || '{}') : {};
}

export function saveLicense(data) {
  db.prepare('INSERT OR REPLACE INTO license (id, data) VALUES (1, ?)').run(JSON.stringify(data));
}

export function listRecords(table) {
  const rows = db.prepare(`SELECT data FROM ${table}`).all();
  return rows.map((row) => JSON.parse(row.data));
}

export function getRecord(table, id) {
  const row = db.prepare(`SELECT data FROM ${table} WHERE id = ?`).get(id);
  return row ? JSON.parse(row.data) : null;
}

export function upsertRecord(table, id, data) {
  db.prepare(`INSERT INTO ${table} (id, data) VALUES (?, ?)
    ON CONFLICT(id) DO UPDATE SET data = excluded.data`).run(id, JSON.stringify(data));
}

export function deleteRecord(table, id) {
  db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
}

export function resetTable(table, records = []) {
  db.prepare(`DELETE FROM ${table}`).run();
  const insert = db.prepare(`INSERT INTO ${table} (id, data) VALUES (?, ?)`);
  records.forEach((record, index) => {
    const id = record.id || record.username || `row_${index + 1}`;
    insert.run(id, JSON.stringify(record));
  });
}

export function getDatabasePath() {
  return dbPath;
}
