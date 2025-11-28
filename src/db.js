import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import os from 'os';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const databaseDir = path.join(rootDir, 'database');
const imagesDir = path.join(databaseDir, 'images');
const logoDir = path.join(databaseDir, 'logo');
const dbPath = path.join(databaseDir, 'database.sqlite');

const defaultLogoSvg = `<svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2f80ed" />
      <stop offset="100%" stop-color="#56ccf2" />
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="76" height="76" rx="12" fill="url(#grad)" stroke="#1b4f8c" stroke-width="4" />
  <path d="M20 45 L30 30 L38 38 L50 22 L60 35 L68 25 L68 58 L20 58 Z" fill="rgba(255,255,255,0.9)" />
  <circle cx="32" cy="32" r="6" fill="#1b4f8c" opacity="0.6" />
  <text x="40" y="72" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="12" fill="#ffffff">
    MED
  </text>
</svg>`;

const defaultData = {
  settings: {
    hospitalName: '',
    departmentName: '',
    address: '',
    phone: '',
    fax: '',
    website: '',
    email: '',
    logoFileName: 'logo-default.svg',
    patientCodePrefix: 'BN',
    examCodePrefix: 'BN',
    nextPatientNumber: 1,
    nextExamNumber: 1,
    defaultImageCount: 4,
    captureHotkey: 'F9',
    defaultDescription: 'Âm đạo:\nCổ tử cung:\nSau bôi Axit acetic:\nSau bôi Lugol:\n',
    defaultResult: '',
    defaultConclusion: '',
    defaultDoctorAdvice: ''
  },
  patients: [],
  exams: [],
  doctors: [{ id: 'D001', name: 'BS Trần Văn B', active: true }],
  templates: [{ id: 'T001', name: 'Bình thường', content: 'Mô tả kết quả bình thường...' }],
  license: {},
  users: [{ username: 'admin', password: '123' }]
};

let db;

function getPaths() {
  return { rootDir, publicDir: path.join(rootDir, 'public'), imagesDir, logoDir, databaseDir };
}

async function ensureDefaultLogo() {
  await fsPromises.mkdir(logoDir, { recursive: true });
  const target = path.join(logoDir, 'logo-default.svg');
  try {
    await fsPromises.access(target, fs.constants.F_OK);
  } catch {
    await fsPromises.writeFile(target, defaultLogoSvg.trim(), 'utf-8');
  }
}

async function copyIfExists(source, destination) {
  try {
    const stat = await fsPromises.stat(source);
    if (!stat.isDirectory()) return;
  } catch {
    return;
  }
  await fsPromises.mkdir(destination, { recursive: true });
  await fsPromises.cp(source, destination, { recursive: true, force: true });
}

async function migrateLegacyAssets() {
  const legacyImages = path.join(rootDir, 'data', 'images');
  const legacyLogos = path.join(rootDir, 'public', 'images', 'logo');
  await copyIfExists(legacyImages, imagesDir);
  await copyIfExists(legacyLogos, logoDir);
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

function initDatabase() {
  if (db) db.close();
  fs.mkdirSync(databaseDir, { recursive: true });
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

function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

function reloadDatabase() {
  initDatabase();
}

async function ensureInfrastructure() {
  await fsPromises.mkdir(databaseDir, { recursive: true });
  await fsPromises.mkdir(imagesDir, { recursive: true });
  await fsPromises.mkdir(logoDir, { recursive: true });
  await migrateLegacyAssets();
  await ensureDefaultLogo();
  initDatabase();
}

function getDefaultData() {
  return defaultData;
}

function getTempDir(prefix) {
  return fsPromises.mkdtemp(path.join(os.tmpdir(), prefix));
}

function readSettings(defaults) {
  const row = db.prepare('SELECT data FROM settings WHERE id = 1').get();
  const stored = row ? JSON.parse(row.data || '{}') : {};
  return { ...defaults, ...stored };
}

function writeSettings(data) {
  db.prepare('INSERT OR REPLACE INTO settings (id, data) VALUES (1, ?)').run(JSON.stringify(data));
}

function getLicense() {
  const row = db.prepare('SELECT data FROM license WHERE id = 1').get();
  return row ? JSON.parse(row.data || '{}') : {};
}

function saveLicense(data) {
  db.prepare('INSERT OR REPLACE INTO license (id, data) VALUES (1, ?)').run(JSON.stringify(data));
}

function listRecords(table) {
  const rows = db.prepare(`SELECT data FROM ${table}`).all();
  return rows.map((row) => JSON.parse(row.data));
}

function getRecord(table, id) {
  const row = db.prepare(`SELECT data FROM ${table} WHERE id = ?`).get(id);
  return row ? JSON.parse(row.data) : null;
}

function upsertRecord(table, id, data) {
  db.prepare(
    `INSERT INTO ${table} (id, data) VALUES (?, ?)
    ON CONFLICT(id) DO UPDATE SET data = excluded.data`
  ).run(id, JSON.stringify(data));
}

function deleteRecord(table, id) {
  db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
}

function resetTable(table, records = []) {
  db.prepare(`DELETE FROM ${table}`).run();
  const insert = db.prepare(`INSERT INTO ${table} (id, data) VALUES (?, ?)`);
  records.forEach((record, index) => {
    const id = record.id || record.username || `row_${index + 1}`;
    insert.run(id, JSON.stringify(record));
  });
}

function getDatabasePath() {
  return dbPath;
}

export {
  closeDatabase,
  reloadDatabase,
  deleteRecord,
  ensureInfrastructure,
  getDatabasePath,
  getDefaultData,
  getLicense,
  getPaths,
  getRecord,
  getTempDir,
  listRecords,
  readSettings,
  resetTable,
  saveLicense,
  upsertRecord,
  writeSettings
};
