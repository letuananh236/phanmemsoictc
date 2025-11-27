import http from 'http';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import {
  initDatabase,
  getSettings as getStoredSettings,
  saveSettings as saveStoredSettings,
  listRecords,
  getRecord,
  upsertRecord,
  deleteRecord,
  resetTable,
  getLicense as getStoredLicense,
  saveLicense as saveStoredLicense
} from './database.js';
import { generateLicenseKey, generateMachineKey } from './hardware-id.js';

const execFileAsync = promisify(execFile);

const packageJson = JSON.parse(
  fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'package.json'), 'utf8')
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const dataDir = path.join(rootDir, 'data');
const imagesDir = path.join(dataDir, 'images');
const logoDir = path.join(publicDir, 'logo');

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
    defaultDoctorAdvice: '',
    allowDeleteData: true
  },
  patients: [],
  exams: [],
  doctors: [{ id: 'D001', name: 'BS Trần Văn B', active: true }],
  templates: [{ id: 'T001', name: 'Bình thường', content: 'Mô tả kết quả bình thường...' }],
  license: {},
  users: [{ username: 'admin', password: '123' }]
};

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function normalizeLicenseKey(key) {
  return (key || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
}

function normalizeLicenseType(type) {
  const value = (type || '').toString().toLowerCase();
  if (['monthly', 'month', '30-day', '30day', '30_days', 'thirty_day'].includes(value)) return 'thirty_day';
  if (value === 'lifetime') return 'lifetime';
  if (value === 'trial') return 'trial';
  return 'yearly';
}

function detectLicenseTypeFromKey(key, machineId) {
  if (!key) return null;
  const normalized = normalizeLicenseKey(key);
  const types = ['thirty_day', 'yearly', 'lifetime'];
  return (
    types.find((type) => normalizeLicenseKey(generateLicenseKey(machineId, type)) === normalized) || null
  );
}

function calculateDaysRemaining(license) {
  const expire = license?.expireDate ? new Date(license.expireDate) : null;
  if (!expire || Number.isNaN(expire)) return 0;
  const diffMs = expire.getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function ensureDateString(value, fallback) {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed)) return fallback;
  return parsed.toISOString().slice(0, 10);
}

function isLicenseValid(license) {
  if (!license) return false;
  const machineId = generateMachineKey();
  const detectedType = detectLicenseTypeFromKey(license.licenseKey, machineId);
  if (!detectedType) return false;
  const expire = new Date(license.expireDate);
  if (Number.isNaN(expire.getTime()) || expire < new Date()) return false;
  return license.machineId === machineId && license.status === 'valid';
}

async function ensureDirectories() {
  await fsPromises.mkdir(dataDir, { recursive: true });
  await fsPromises.mkdir(imagesDir, { recursive: true });
  await ensureDefaultLogo();
  initDatabase(defaultData);
}

async function ensureDefaultLogo() {
  await fsPromises.mkdir(logoDir, { recursive: true });
  const target = path.join(logoDir, 'logo-default.svg');
  try {
    await fsPromises.access(target, fs.constants.F_OK);
  } catch {
    const source = path.join(publicDir, 'assets', 'logo-default.svg');
    await fsPromises.copyFile(source, target);
  }
}

function getSettings() {
  return getStoredSettings(defaultData.settings);
}

function saveSettings(data) {
  return saveStoredSettings(data);
}

async function ensureLicense() {
  const stored = getStoredLicense();
  const machineId = generateMachineKey();
  const now = new Date();
  const startDate = ensureDateString(stored?.startDate, now.toISOString().slice(0, 10));
  const expireDate = (() => {
    if (stored?.expireDate && !Number.isNaN(new Date(stored.expireDate))) return stored.expireDate;
    const fallback = new Date(startDate);
    fallback.setDate(fallback.getDate() + 30);
    return fallback.toISOString().slice(0, 10);
  })();
  const detectedType = detectLicenseTypeFromKey(stored?.licenseKey, machineId);
  const normalizedType = detectedType || normalizeLicenseType(stored?.licenseType || 'trial');
  const normalizedKey = normalizeLicenseKey(stored?.licenseKey || '');
  const normalized = {
    machineId,
    licenseType: normalizedType,
    licenseKey: normalizedKey,
    startDate,
    expireDate,
    status: stored?.status || 'invalid'
  };
  const valid = isLicenseValid(normalized);
  normalized.status = valid ? 'valid' : 'invalid';
  saveStoredLicense(normalized);
  return normalized;
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function sendBuffer(res, status, buffer, headers = {}) {
  res.writeHead(status, headers);
  res.end(buffer);
}

async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('application/json')) {
    return JSON.parse(buffer.toString('utf8') || '{}');
  }
  return buffer;
}

function normalizePath(requestPath) {
  const safePath = requestPath.replace(/\.\./g, '');
  if (safePath === '/' || safePath === '') return 'index.html';
  return safePath.replace(/^\//, '');
}

function formatCode(prefix, number) {
  const safePrefix = prefix || '';
  const seq = Number.parseInt(number, 10) || 1;
  return `${safePrefix}${String(seq).padStart(5, '0')}`;
}

async function serveDataFile(res, requestPath) {
  try {
    const safePath = normalizePath(requestPath);
    const filePath = path.join(rootDir, safePath);
    if (!filePath.startsWith(dataDir)) {
      sendJson(res, 403, { error: 'forbidden' });
      return;
    }
    const data = await fsPromises.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const type = MIME_TYPES[ext] || 'application/octet-stream';
    sendBuffer(res, 200, data, { 'Content-Type': type });
  } catch (error) {
    if (error.code === 'ENOENT') {
      sendJson(res, 404, { error: 'not_found' });
    } else {
      console.error(error);
      sendJson(res, 500, { error: 'server_error' });
    }
  }
}

async function serveStatic(res, requestPath) {
  try {
    const relative = normalizePath(requestPath);
    const filePath = path.join(publicDir, relative);
    if (!filePath.startsWith(publicDir)) {
      sendJson(res, 403, { error: 'forbidden' });
      return;
    }
    let finalPath = filePath;
    try {
      const stat = await fsPromises.stat(filePath);
      if (stat.isDirectory()) {
        finalPath = path.join(filePath, 'index.html');
      }
    } catch {
      // ignore
    }
    const data = await fsPromises.readFile(finalPath);
    const ext = path.extname(finalPath).toLowerCase();
    const type = MIME_TYPES[ext] || 'application/octet-stream';
    sendBuffer(res, 200, data, { 'Content-Type': type });
  } catch (error) {
    if (error.code === 'ENOENT') {
      sendJson(res, 404, { error: 'not_found' });
    } else {
      console.error(error);
      sendJson(res, 500, { error: 'server_error' });
    }
  }
}

async function saveImageFromDataUrl({ examId, index, dataUrl }) {
  if (!dataUrl) {
    throw new Error('missing_data');
  }
  const matches = dataUrl.match(/^data:(.+);base64,(.*)$/);
  if (!matches) {
    throw new Error('invalid_data');
  }
  const buffer = Buffer.from(matches[2], 'base64');
  const now = new Date();
  const folder = path.join(imagesDir, String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, '0'));
  await fsPromises.mkdir(folder, { recursive: true });
  const safeExam = examId || 'EXAM';
  const name = `${safeExam}_${String(index).padStart(2, '0')}.png`;
  const filePath = path.join(folder, name);
  await fsPromises.writeFile(filePath, buffer);
  return path.relative(rootDir, filePath).replace(/\\/g, '/');
}

async function saveLogoFile({ dataUrl, fileName }) {
  if (!dataUrl) {
    throw new Error('missing_logo');
  }
  const matches = dataUrl.match(/^data:(.+);base64,(.*)$/);
  if (!matches) {
    throw new Error('invalid_logo');
  }
  const buffer = Buffer.from(matches[2], 'base64');
  await fsPromises.mkdir(logoDir, { recursive: true });
  const safeBase = path.basename(fileName || 'logo.png').replace(/[^a-zA-Z0-9._-]/g, '_');
  const finalName = `${Date.now()}_${safeBase}`;
  const filePath = path.join(logoDir, finalName);
  await fsPromises.writeFile(filePath, buffer);
  return finalName;
}

function windowsPath(p) {
  return p.replace(/\\/g, '/').replace(/\//g, '\\');
}

async function createZipBuffer() {
  const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'pmzip-'));
  const zipPath = path.join(tempDir, 'backup.zip');
  if (process.platform === 'win32') {
    const script = `Compress-Archive -Path '${windowsPath(path.join(dataDir, '*'))}' -DestinationPath '${windowsPath(zipPath)}' -Force`;
    await execFileAsync('powershell', ['-NoLogo', '-Command', script]);
  } else {
    await execFileAsync('zip', ['-r', zipPath, 'data'], { cwd: rootDir });
  }
  const buffer = await fsPromises.readFile(zipPath);
  await fsPromises.rm(tempDir, { recursive: true, force: true });
  return buffer;
}

async function extractZipBuffer(buffer) {
  const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), 'pmzip-'));
  const zipPath = path.join(tempDir, 'upload.zip');
  await fsPromises.writeFile(zipPath, buffer);
  const extractDir = path.join(tempDir, 'extracted');
  await fsPromises.mkdir(extractDir);
  if (process.platform === 'win32') {
    const script = `Expand-Archive -Path '${windowsPath(zipPath)}' -DestinationPath '${windowsPath(extractDir)}' -Force`;
    await execFileAsync('powershell', ['-NoLogo', '-Command', script]);
  } else {
    await execFileAsync('unzip', ['-o', zipPath, '-d', extractDir]);
  }
  const extractedData = path.join(extractDir, 'data');
  const stats = await fsPromises.stat(extractedData).catch(() => null);
  if (!stats) {
    throw new Error('invalid_backup');
  }
  await fsPromises.rm(dataDir, { recursive: true, force: true });
  await copyDirectory(extractedData, dataDir);
  initDatabase(defaultData);
  await fsPromises.rm(tempDir, { recursive: true, force: true });
}

async function copyDirectory(source, destination) {
  await fsPromises.mkdir(destination, { recursive: true });
  const entries = await fsPromises.readdir(source, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const srcPath = path.join(source, entry.name);
      const destPath = path.join(destination, entry.name);
      if (entry.isDirectory()) {
        await copyDirectory(srcPath, destPath);
      } else if (entry.isFile()) {
        await fsPromises.copyFile(srcPath, destPath);
      }
    })
  );
}

async function clearAllData() {
  const currentSettings = getSettings();
  const currentLicense = getStoredLicense();
  await fsPromises.rm(imagesDir, { recursive: true, force: true });
  await fsPromises.mkdir(imagesDir, { recursive: true });
  const resetSettings = {
    ...defaultData.settings,
    ...currentSettings,
    nextPatientNumber: 1,
    nextExamNumber: 1
  };
  resetTable('patients');
  resetTable('exams');
  resetTable('doctors', defaultData.doctors);
  resetTable('templates', defaultData.templates);
  resetTable('users', defaultData.users.map((user) => ({ id: user.username, ...user })));
  saveSettings(resetSettings);
  saveStoredLicense(currentLicense || {});
}

async function handleApi(req, res, pathname) {
  const license = await ensureLicense();
  const licenseExemptPaths = ['/api/login', '/api/meta'];
  const isLicenseExempt = licenseExemptPaths.includes(pathname);
  if (!pathname.startsWith('/api/license') && !isLicenseExempt && !isLicenseValid(license)) {
    sendJson(res, 403, {
      error: 'license_expired',
      license: { ...license, daysRemaining: calculateDaysRemaining(license) }
    });
    return;
  }

  if (pathname === '/api/login' && req.method === 'POST') {
    const payload = await parseBody(req);
    const users = listRecords('users');
    const matched = users.find(
      (user) => user.username === payload.username && user.password === payload.password
    );
    if (matched) {
      sendJson(res, 200, { success: true, username: matched.username });
    } else {
      sendJson(res, 401, { error: 'invalid_credentials' });
    }
    return;
  }

  if (pathname === '/api/settings') {
    if (req.method === 'GET') {
      const settings = getSettings();
      sendJson(res, 200, settings);
      return;
    }
    if (req.method === 'PUT') {
      const payload = await parseBody(req);
      const current = getSettings();
      const merged = { ...defaultData.settings, ...(current || {}), ...(payload || {}) };
      saveSettings(merged);
      sendJson(res, 200, merged);
      return;
    }
  }

  if (pathname === '/api/users') {
    const users = listRecords('users');
    if (req.method === 'GET') {
      const sanitized = users.map((user) => ({ username: user.username }));
      sendJson(res, 200, sanitized);
      return;
    }
    if (req.method === 'POST') {
      const payload = await parseBody(req);
      if (!payload?.username || !payload?.password) {
        sendJson(res, 400, { error: 'invalid_user' });
        return;
      }
      if (users.some((u) => u.username === payload.username)) {
        sendJson(res, 409, { error: 'user_exists' });
        return;
      }
      const record = { id: payload.username, username: payload.username, password: payload.password };
      upsertRecord('users', record.id, record);
      sendJson(res, 201, { username: payload.username });
      return;
    }
  }

  if (pathname === '/api/patients') {
    if (req.method === 'GET') {
      const patients = listRecords('patients');
      sendJson(res, 200, patients);
      return;
    }
    if (req.method === 'POST') {
      const payload = await parseBody(req);
      const settings = getSettings();
      const nextPatientNumber = settings.nextPatientNumber || 1;
      const generatedId = formatCode(settings.patientCodePrefix, nextPatientNumber);
      const shouldAutoIncrement = !payload.id || payload.id === generatedId;
      const assignedId = payload.id?.trim() || generatedId;
      const updatedSettings = {
        ...settings,
        nextPatientNumber: shouldAutoIncrement ? nextPatientNumber + 1 : settings.nextPatientNumber
      };
      saveSettings(updatedSettings);
      const patient = { ...payload, id: assignedId, createdAt: new Date().toISOString() };
      upsertRecord('patients', assignedId, patient);
      sendJson(res, 201, patient);
      return;
    }
  }

  if (pathname.startsWith('/api/patients/')) {
    const id = decodeURIComponent(pathname.split('/').pop() || '');
    if (req.method === 'PUT') {
      const payload = await parseBody(req);
      const patient = getRecord('patients', id);
      if (!patient) {
        sendJson(res, 404, { error: 'not_found' });
        return;
      }
      const updated = { ...patient, ...payload };
      upsertRecord('patients', id, updated);
      sendJson(res, 200, updated);
      return;
    }
    if (req.method === 'DELETE') {
      const settings = getSettings();
      if (!settings.allowDeleteData) {
        sendJson(res, 403, { error: 'delete_disabled' });
        return;
      }
      deleteRecord('patients', id);
      sendJson(res, 200, { success: true });
      return;
    }
  }

  if (pathname === '/api/exams') {
    if (req.method === 'GET') {
      const exams = listRecords('exams');
      sendJson(res, 200, exams);
      return;
    }
    if (req.method === 'POST') {
      const payload = await parseBody(req);
      const now = new Date().toISOString();
      const settings = getSettings();
      const nextExamNumber = settings.nextExamNumber || 1;
      const generatedExamId = formatCode(settings.examCodePrefix, nextExamNumber);
      const shouldAutoIncrement = !payload.id || payload.id === generatedExamId;
      const examId = payload.id?.trim() || generatedExamId;
      const examNumber = payload.examNumber || generatedExamId;
      const updatedSettings = {
        ...settings,
        nextExamNumber: shouldAutoIncrement ? nextExamNumber + 1 : settings.nextExamNumber
      };
      saveSettings(updatedSettings);
      const exam = { ...payload, id: examId, examNumber, createdAt: now, updatedAt: now };
      upsertRecord('exams', examId, exam);
      sendJson(res, 201, exam);
      return;
    }
  }

  if (pathname.startsWith('/api/exams/')) {
    const id = decodeURIComponent(pathname.split('/').pop() || '');
    if (req.method === 'PUT') {
      const payload = await parseBody(req);
      const exam = getRecord('exams', id);
      if (!exam) {
        sendJson(res, 404, { error: 'not_found' });
        return;
      }
      const updated = { ...exam, ...payload, updatedAt: new Date().toISOString() };
      upsertRecord('exams', id, updated);
      sendJson(res, 200, updated);
      return;
    }
    if (req.method === 'DELETE') {
      const settings = getSettings();
      if (!settings.allowDeleteData) {
        sendJson(res, 403, { error: 'delete_disabled' });
        return;
      }
      deleteRecord('exams', id);
      sendJson(res, 200, { success: true });
      return;
    }
  }

  if (pathname === '/api/doctors') {
    if (req.method === 'GET') {
      const doctors = listRecords('doctors');
      sendJson(res, 200, doctors);
      return;
    }
    if (req.method === 'POST') {
      const payload = await parseBody(req);
      upsertRecord('doctors', payload.id, payload);
      sendJson(res, 201, payload);
      return;
    }
  }

  if (pathname.startsWith('/api/doctors/')) {
    const id = decodeURIComponent(pathname.split('/').pop() || '');
    if (req.method === 'PUT') {
      const payload = await parseBody(req);
      const doctor = getRecord('doctors', id);
      if (!doctor) {
        sendJson(res, 404, { error: 'not_found' });
        return;
      }
      const updated = { ...doctor, ...payload };
      upsertRecord('doctors', id, updated);
      sendJson(res, 200, updated);
      return;
    }
    if (req.method === 'DELETE') {
      const settings = getSettings();
      if (!settings.allowDeleteData) {
        sendJson(res, 403, { error: 'delete_disabled' });
        return;
      }
      deleteRecord('doctors', id);
      sendJson(res, 200, { success: true });
      return;
    }
  }

  if (pathname === '/api/result-templates') {
    if (req.method === 'GET') {
      const templates = listRecords('templates');
      sendJson(res, 200, templates);
      return;
    }
    if (req.method === 'POST') {
      const payload = await parseBody(req);
      upsertRecord('templates', payload.id, payload);
      sendJson(res, 201, payload);
      return;
    }
  }

  if (pathname.startsWith('/api/result-templates/')) {
    const id = decodeURIComponent(pathname.split('/').pop() || '');
    if (req.method === 'PUT') {
      const payload = await parseBody(req);
      const template = getRecord('templates', id);
      if (!template) {
        sendJson(res, 404, { error: 'not_found' });
        return;
      }
      const updated = { ...template, ...payload };
      upsertRecord('templates', id, updated);
      sendJson(res, 200, updated);
      return;
    }
    if (req.method === 'DELETE') {
      const settings = getSettings();
      if (!settings.allowDeleteData) {
        sendJson(res, 403, { error: 'delete_disabled' });
        return;
      }
      deleteRecord('templates', id);
      sendJson(res, 200, { success: true });
      return;
    }
  }

  if (pathname === '/api/license') {
    if (req.method === 'GET') {
      const freshLicense = await ensureLicense();
      sendJson(res, 200, {
        license: { ...freshLicense, daysRemaining: calculateDaysRemaining(freshLicense) },
        valid: isLicenseValid(freshLicense)
      });
      return;
    }
  }

  if (pathname === '/api/meta' && req.method === 'GET') {
    sendJson(res, 200, { version: packageJson.version || '0.0.0' });
    return;
  }

  if (pathname === '/api/license/activate' && req.method === 'POST') {
    const payload = await parseBody(req);
    const machineId = generateMachineKey();
    const providedKey = normalizeLicenseKey(payload.licenseKey);
    const detectedType = detectLicenseTypeFromKey(providedKey, machineId);
    if (!detectedType) {
      sendJson(res, 400, { error: 'invalid_license_key', machineId });
      return;
    }
    const now = new Date();
    const expire = new Date(now);
    if (detectedType === 'lifetime') {
      expire.setFullYear(expire.getFullYear() + 100);
    } else if (detectedType === 'yearly') {
      expire.setFullYear(expire.getFullYear() + 1);
    } else {
      expire.setDate(expire.getDate() + 30);
    }
    const updated = {
      machineId,
      licenseType: detectedType,
      licenseKey: providedKey,
      startDate: now.toISOString().slice(0, 10),
      expireDate: expire.toISOString().slice(0, 10),
      status: 'valid'
    };
    saveStoredLicense(updated);
    sendJson(res, 200, {
      license: { ...updated, daysRemaining: calculateDaysRemaining(updated) },
      valid: true
    });
    return;
  }

  if (pathname === '/api/license/reset' && req.method === 'POST') {
    const machineId = generateMachineKey();
    const now = new Date();
    const expire = new Date(now);
    expire.setDate(expire.getDate() + 30);
    const cleared = {
      machineId,
      licenseType: 'trial',
      licenseKey: '',
      startDate: now.toISOString().slice(0, 10),
      expireDate: expire.toISOString().slice(0, 10),
      status: 'invalid'
    };
    saveStoredLicense(cleared);
    sendJson(res, 200, { license: { ...cleared, daysRemaining: calculateDaysRemaining(cleared) }, valid: false });
    return;
  }

  if (pathname === '/api/logo' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const storedName = await saveLogoFile(body || {});
      if (body?.setDefault) {
        const current = getSettings();
        const merged = { ...defaultData.settings, ...(current || {}), logoFileName: storedName };
        saveSettings(merged);
      }
      sendJson(res, 200, { fileName: storedName });
    } catch (error) {
      console.error(error);
      sendJson(res, 400, { error: 'invalid_logo' });
    }
    return;
  }

  if (pathname === '/api/images' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const storedPath = await saveImageFromDataUrl(body);
      sendJson(res, 200, { path: storedPath });
    } catch (error) {
      console.error(error);
      sendJson(res, 400, { error: 'invalid_image' });
    }
    return;
  }

  if (pathname === '/api/backup' && req.method === 'GET') {
    try {
      const buffer = await createZipBuffer();
      sendBuffer(res, 200, buffer, {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="backup.zip"'
      });
    } catch (error) {
      console.error(error);
      sendJson(res, 500, { error: 'backup_failed' });
    }
    return;
  }

  if (pathname === '/api/restore' && req.method === 'POST') {
    const buffer = await parseBody(req);
    try {
      await extractZipBuffer(buffer);
      sendJson(res, 200, { success: true });
    } catch (error) {
      console.error(error);
      sendJson(res, 500, { error: 'restore_failed' });
    }
    return;
  }

  if (pathname === '/api/data/clear' && req.method === 'POST') {
    const settings = getSettings();
    if (!settings.allowDeleteData) {
      sendJson(res, 403, { error: 'delete_disabled' });
      return;
    }
    try {
      await clearAllData();
      sendJson(res, 200, { success: true });
    } catch (error) {
      console.error(error);
      sendJson(res, 500, { error: 'clear_failed' });
    }
    return;
  }

  sendJson(res, 404, { error: 'not_found' });
}

export function createServer() {
  const server = http.createServer(async (req, res) => {
    await bootstrapPromise;
    if (!req.url) {
      sendJson(res, 400, { error: 'invalid_request' });
      return;
    }
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/health') {
      sendJson(res, 200, { status: 'ok' });
      return;
    }
    if (url.pathname.startsWith('/api/')) {
      await handleApi(req, res, url.pathname);
      return;
    }
    if (url.pathname.startsWith('/data/images/')) {
      await serveDataFile(res, url.pathname);
      return;
    }
    serveStatic(res, url.pathname);
  });
  return server;
}

export async function bootstrap() {
  await ensureDirectories();
  await ensureLicense();
}

const bootstrapPromise = bootstrap();
const shouldStartServer =
  !process.argv.includes('--test') && process.argv[1] && path.basename(process.argv[1]) === 'server.js';

if (shouldStartServer) {
  bootstrapPromise
    .then(() => {
      const server = createServer();
      const port = Number.parseInt(process.env.PORT ?? '3000', 10);
      server.listen(port, () => {
        console.log(`Ứng dụng đang chạy tại http://localhost:${port}`);
      });
    })
    .catch((error) => {
      console.error('Không thể khởi động server:', error);
    });
}
