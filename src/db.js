import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import os from 'os';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');
const dataRoot = process.env.APP_DATA_DIR ? path.resolve(process.env.APP_DATA_DIR) : path.join(projectRoot, 'database');
const databaseDir = dataRoot;
const imagesDir = path.join(databaseDir, 'images');
const logoDir = path.join(databaseDir, 'logo');
const publicDir = path.join(projectRoot, 'public');
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

const introImages = {
  'Picture1.png':
    'iVBORw0KGgoAAAANSUhEUgAAA4QAAAIICAYAAAA2SyAsAAASSUlEQVR42u3dMW4bOxSGUa9EK1Ht5aTWrawsLNs3nAsWiJpUAiZJD7AxbBzBI94vXKUJ5Rfcv4t+aBciq/3kOlyAEAjKP7twIAUAkAkjEAkAkAkgmACAeAOQSQSwDoAYgkgkgHoOCn+e8AyP+ydV8cCkBlAAgGkEgEECkAkAkAkglAEAIkEkEsA6AGIJIJIB6ASAQAKQSASQSAQQKQCSCQCSCUAQAiQSQSQAQAiCSCSASgHgH+j6M1a+v8bLwOAGQSQSwDoAYgkgkgHoARAIAKQSQSQAIJ4Xxn9vGxdK3mACABIJIBKBwAaSSCTCUASCOCqC8+zNZ3QOgAgCSCSAegBAIAJJIJAIgEgjg7z6O6YenT50bUJwAoBJBJAAgnheTf2wvrbWWv+0gEIEkEkAEAIkEkAkAkgkAkglAEAIkEkEkAEAIkEkEkAEAIkEkAkAkgkgkglAEAIkkgkgEgEgjg7p7b0NK6PvuYBAgSQSwDoAYgkgkgHoA4O9Avbph6XwbUhwAoBJBJAAgnjfIfte+o5UCACTCSAegAgQaASASQSAQQKQCSCQCSCUAQAiQSQSQAQAiCSCSASAegl3Zw9u/7i/WPTxsAUAmAkglAEAEgkgkgEoBkEgEECkAkAkAkgkgkgHoAWg8dzf3PhhWEQAkglAEAEgkgkgkgEoBJBIABEgpAJAJAIgkgkgHoOWHl1jW29jQdQHAJgJAIgkgkgkgEoBJBIABEgpAJAJAIgkgkgEoDkFi3t6B68HoCECSCSASAQAKQSASQSAQQKQCSAQCQCSCQCSCUAQAiQSQSQAQAiCSCSASAQAKQSASQSAQQKQCSCQCSCUAQAiQSQSQAIJLr/b96aLsmQFEEkEkAEAIkEkAkAkgkgkgEoBJBIABEgkgkgEoBJBIABEgkgkgEoBJBIABEgpAJAJAIgkgkgEoBJBIABEgkgkgEoBJBIABEgpAJAJAIgkgkgEoBJBIABEgkgkgEgEgjg99YzvE+i/H67r1zpBQCSCSASAQAKQSASQSAQQKQCSAQCQCSCQCSCUAQAiQSQSQAQAiCSCSASAQAKQSASQSAQQKQCSCQCSCUAQAiQSQSQAQAiCSCSASAQAKQSASAQwWsAnT4KAPk2KpQVACQSQAQAiCSCSASAQAKQSASQSAQQKQCSCQCSCUAQAiQSQSQAQAiCSCSASAQAKQSASQSAQQKQCSAQCQCSCQCSCUAQAiQSQSQAQAiCSCSASAQAKQSASQSAQQKQCSCQCSCUAQAiQSQSQAIJ4fC3/dJ6rHgUAkgkgEgEACkEgEkEgEECkAkgkAkAkgkgkgEoB4LeCtZ9f7PuBYAJIJIBIBAApBIBJBIABBCpAIABIJICIE0AkEiHCSAChf7rlPUwCAEhkgkgEgEwCSCSASAQAKQSASAQJAIgkgkgHoD4i/wBsOoq5avvByCSASAQAKQSASQSAQQKQCSAQCQCSCQCSCUAQAiQSQSQAQAiCSCSAegH8P1ujM6u8JqwsAiCSCQCSAQAKQSASQSAQQKQCSAQCQCSCQCSCUAQAiQSQSQAQAiCSCSASAQAKQSASQSAQQKQCSCQCSCUAQAiQSQSQAQAiCSCSAegH8GA3tV+XlqyQAAAABJRU5ErkJggg==',
  'Picture2.png':
    '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'
};


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
    logoShape: 'square',
    patientCodePrefix: 'BN',
    examCodePrefix: 'BN',
    doctorCodePrefix: 'BS',
    nextPatientNumber: 1,
    nextExamNumber: 1,
    nextDoctorNumber: 1,
    defaultImageCount: 4,
    printImageLayout: 'row',
    captureHotkey: 'F2',
    captureSavePath: 'user_uploads/anh_chup.png',
    defaultDescription: 'Âm đạo:\nCổ tử cung:\nSau bôi Axit acetic:\nSau bôi Lugol:\n',
    defaultResult: '',
    defaultConclusion: '',
    defaultDoctorAdvice: ''
  },
  patients: [],
  exams: [],
  doctors: [{ id: 'BS001', name: 'BS Trần Văn B', phone: '', active: true }],
  templates: [{ id: 'T001', name: 'Bình thường', content: 'Mô tả kết quả bình thường...' }],
  license: {},
  users: [{ username: 'admin', password: '123456@', role: 'admin' }]
};

let db;

function getPaths() {
  return { rootDir: projectRoot, publicDir, imagesDir, logoDir, databaseDir };
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

async function ensureDefaultIntroImages() {
  await fsPromises.mkdir(logoDir, { recursive: true });
  await Promise.all(
    Object.entries(introImages).map(async ([fileName, base64]) => {
      const target = path.join(logoDir, fileName);
      try {
        await fsPromises.access(target, fs.constants.F_OK);
        return;
      } catch {
        // fall through
      }
      const buffer = Buffer.from(base64, 'base64');
      await fsPromises.writeFile(target, buffer);
      const legacy = path.join(imagesDir, fileName);
      try {
        await fsPromises.unlink(legacy);
      } catch {
        /* ignore */
      }
    })
  );
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
  const legacyImages = path.join(projectRoot, 'data', 'images');
  const legacyLogos = path.join(projectRoot, 'public', 'images', 'logo');
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
  ensureAdminAccount();
}

function ensureAdminAccount() {
  const admin = getRecord('users', 'admin');
  const desired = { id: 'admin', username: 'admin', password: '123456@', role: 'admin' };
  if (!admin) {
    upsertRecord('users', desired.id, desired);
    return;
  }
  const shouldUpdate = admin.password !== desired.password || admin.role !== desired.role;
  if (shouldUpdate) {
    upsertRecord('users', desired.id, { ...admin, ...desired });
  }
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
  await ensureDefaultIntroImages();
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
