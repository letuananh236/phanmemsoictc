import fs from 'fs';
import path from 'path';
import { URL } from 'url';
import { ensureInfrastructure, getDefaultData, getPaths } from './db.js';
import { addUser, listUsers } from './models/user.model.js';
import {
  createExam,
  createDoctor,
  getExam,
  listDoctors,
  listExams,
  listTemplates,
  removeDoctor,
  removeExam,
  updateDoctor,
  updateExam
} from './models/exam.model.js';
import { createPatient, getPatient, listPatients, removePatient, updatePatient } from './models/patient.model.js';
import { mergeSettings, getSettings, saveSettings } from './models/settings.model.js';
import {
  calculateDaysRemaining,
  detectLicenseTypeFromKey,
  ensureLicense,
  isLicenseValid,
  normalizeLicenseKey,
  resetLicense
} from './models/license.model.js';
import { saveImageFromDataUrl, saveLogoFile } from './models/image.model.js';
import { clearAllData, createZipBuffer, extractZipBuffer } from './models/backup.model.js';
import { generateMachineKey } from './utils/hardware-id.js';
import { parseBody, sendBuffer, sendJson } from './utils/http-helpers.js';

const viewCache = new Map();
const bootstrapPromise = ensureInfrastructure().then(() => ensureLicense(getDefaultData().license));

function normalizePath(requestPath) {
  const safePath = requestPath.replace(/\.\./g, '');
  if (safePath === '/' || safePath === '') return 'index.html';
  return safePath.replace(/^\//, '');
}

function renderView(viewName) {
  const cacheKey = `view:${viewName}`;
  if (viewCache.has(cacheKey)) return viewCache.get(cacheKey);
  const { rootDir } = getPaths();
  const layoutPath = path.join(rootDir, 'src', 'views', 'layout.ejs');
  const viewPath = path.join(rootDir, 'src', 'views', `${viewName}.ejs`);
  const layout = fs.readFileSync(layoutPath, 'utf8');
  let body = fs.readFileSync(viewPath, 'utf8');

  if (viewName === 'home') {
    const templateNames = ['login', 'exam-form', 'exam-detail', 'camera'];
    const templateMarkup = templateNames
      .map((name) => path.join(rootDir, 'src', 'views', `${name}.ejs`))
      .filter((filePath) => fs.existsSync(filePath))
      .map((filePath) => fs.readFileSync(filePath, 'utf8'))
      .join('\n');

    body = body.replace(
      '<!-- VIEW-TEMPLATES -->',
      `<div id="view-templates" class="sr-only" aria-hidden="true">${templateMarkup}</div>`
    );
  }

  const rendered = layout.replace('<!-- BODY -->', body);
  viewCache.set(cacheKey, rendered);
  return rendered;
}

async function serveStatic(res, requestPath) {
  const { publicDir } = getPaths();
  const relative = normalizePath(requestPath);
  const filePath = path.join(publicDir, relative);
  if (!filePath.startsWith(publicDir)) {
    return false;
  }
  let finalPath = filePath;
  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      finalPath = path.join(filePath, 'index.html');
    }
  } catch {
    // fallthrough
  }
  if (!fs.existsSync(finalPath)) return false;
  const ext = path.extname(finalPath).toLowerCase();
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
  const data = fs.readFileSync(finalPath);
  res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
  res.end(data);
  return true;
}

async function serveDataFile(res, requestPath) {
  const { rootDir, databaseDir, imagesDir, logoDir } = getPaths();
  const safePath = normalizePath(requestPath);
  const filePath = path.join(rootDir, safePath);
  const allowedDirs = [imagesDir, logoDir];
  const isAllowed = allowedDirs.some((dir) => filePath.startsWith(dir));
  if (!isAllowed || filePath.startsWith(databaseDir) && filePath.endsWith('database.sqlite')) {
    sendJson(res, 403, { error: 'forbidden' });
    return true;
  }
  try {
    const data = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const MIME_TYPES = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml'
    };
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(data);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      sendJson(res, 404, { error: 'not_found' });
    } else {
      console.error(error);
      sendJson(res, 500, { error: 'server_error' });
    }
    return true;
  }
}

async function handleApi(req, res, pathname) {
  const license = await ensureLicense(getDefaultData().license);
  const licenseExemptPaths = ['/api/login', '/api/meta'];
  const isLicenseExempt = licenseExemptPaths.includes(pathname);
  if (!pathname.startsWith('/api/license') && !isLicenseExempt && !isLicenseValid(license)) {
    sendJson(res, 403, {
      error: 'license_expired',
      license: { ...license, daysRemaining: calculateDaysRemaining(license) }
    });
    return true;
  }

  if (pathname === '/api/login' && req.method === 'POST') {
    const payload = await parseBody(req);
    const users = listUsers();
    const matched = users.find((user) => user.username === payload.username && user.password === payload.password);
    sendJson(res, matched ? 200 : 401, matched ? { success: true, username: matched.username } : { error: 'invalid_credentials' });
    return true;
  }

  if (pathname === '/api/meta' && req.method === 'GET') {
    const machineKey = generateMachineKey();
    const { rootDir } = getPaths();
    const pkgPath = path.join(rootDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    sendJson(res, 200, { machineKey, version: pkg.version });
    return true;
  }

  if (pathname === '/api/settings') {
    if (req.method === 'GET') {
      sendJson(res, 200, getSettings());
      return true;
    }
    if (req.method === 'PUT') {
      const payload = await parseBody(req);
      const merged = mergeSettings(payload);
      saveSettings(merged);
      sendJson(res, 200, merged);
      return true;
    }
  }

  if (pathname === '/api/users') {
    if (req.method === 'GET') {
      const sanitized = listUsers().map((user) => ({ username: user.username }));
      sendJson(res, 200, sanitized);
      return true;
    }
    if (req.method === 'POST') {
      const payload = await parseBody(req);
      const result = addUser(payload);
      if (result.error === 'invalid_user') {
        sendJson(res, 400, { error: 'invalid_user' });
        return true;
      }
      if (result.error === 'user_exists') {
        sendJson(res, 409, { error: 'user_exists' });
        return true;
      }
      sendJson(res, 201, result);
      return true;
    }
  }

  if (pathname === '/api/patients') {
    if (req.method === 'GET') {
      sendJson(res, 200, listPatients());
      return true;
    }
    if (req.method === 'POST') {
      const payload = await parseBody(req);
      const patient = createPatient(payload);
      sendJson(res, 201, patient);
      return true;
    }
  }

  if (pathname.startsWith('/api/patients/')) {
    const id = decodeURIComponent(pathname.split('/').pop() || '');
    if (req.method === 'PUT') {
      const payload = await parseBody(req);
      const updated = updatePatient(id, payload);
      sendJson(res, updated ? 200 : 404, updated || { error: 'not_found' });
      return true;
    }
    if (req.method === 'DELETE') {
      const settings = getSettings();
      if (!settings.allowDeleteData) {
        sendJson(res, 403, { error: 'delete_disabled' });
        return true;
      }
      removePatient(id, true);
      sendJson(res, 200, { success: true });
      return true;
    }
  }

  if (pathname === '/api/exams') {
    if (req.method === 'GET') {
      sendJson(res, 200, listExams());
      return true;
    }
    if (req.method === 'POST') {
      const payload = await parseBody(req);
      const exam = createExam(payload);
      sendJson(res, 201, exam);
      return true;
    }
  }

  if (pathname.startsWith('/api/exams/')) {
    const id = decodeURIComponent(pathname.split('/').pop() || '');
    if (req.method === 'GET') {
      const exam = getExam(id);
      sendJson(res, exam ? 200 : 404, exam || { error: 'not_found' });
      return true;
    }
    if (req.method === 'PUT') {
      const payload = await parseBody(req);
      const updated = updateExam(id, payload);
      sendJson(res, updated ? 200 : 404, updated || { error: 'not_found' });
      return true;
    }
    if (req.method === 'DELETE') {
      const settings = getSettings();
      if (!settings.allowDeleteData) {
        sendJson(res, 403, { error: 'delete_disabled' });
        return true;
      }
      removeExam(id, true);
      sendJson(res, 200, { success: true });
      return true;
    }
  }

  if (pathname === '/api/doctors') {
    if (req.method === 'GET') {
      sendJson(res, 200, listDoctors());
      return true;
    }
    if (req.method === 'POST') {
      const payload = await parseBody(req);
      const doctor = createDoctor(payload);
      if (doctor?.error === 'doctor_exists') {
        sendJson(res, 409, { error: 'doctor_exists' });
        return true;
      }
      if (doctor?.error) {
        sendJson(res, 400, doctor);
        return true;
      }
      sendJson(res, 201, doctor);
      return true;
    }
  }

  if (pathname.startsWith('/api/doctors/')) {
    const id = decodeURIComponent(pathname.split('/').pop() || '');
    if (req.method === 'PUT') {
      const payload = await parseBody(req);
      const updated = updateDoctor(id, payload);
      sendJson(res, updated ? 200 : 404, updated || { error: 'not_found' });
      return true;
    }
    if (req.method === 'DELETE') {
      const settings = getSettings();
      if (!settings.allowDeleteData) {
        sendJson(res, 403, { error: 'delete_disabled' });
        return true;
      }
      removeDoctor(id, true);
      sendJson(res, 200, { success: true });
      return true;
    }
  }

  if (pathname === '/api/templates' && req.method === 'GET') {
    sendJson(res, 200, listTemplates());
    return true;
  }

  if (pathname === '/api/license' && req.method === 'GET') {
    const machineId = generateMachineKey();
    const detectedType = detectLicenseTypeFromKey(license?.licenseKey, machineId);
    const enriched = {
      ...license,
      machineId: license?.machineId || machineId,
      machineKey: machineId,
      daysRemaining: calculateDaysRemaining(license),
      licenseType: detectedType || license.licenseType || 'trial'
    };
    const valid = isLicenseValid(enriched);
    sendJson(res, 200, { license: enriched, valid });
    return true;
  }

  if ((pathname === '/api/license' || pathname === '/api/license/activate') && req.method === 'POST') {
    const body = await parseBody(req);
    const machineId = generateMachineKey();
    const detectedType = detectLicenseTypeFromKey(body?.licenseKey, machineId);
    const normalizedKey = normalizeLicenseKey(body?.licenseKey || '');
    const expire = new Date();
    if (detectedType === 'thirty_day') expire.setDate(expire.getDate() + 30);
    else if (detectedType === 'lifetime') expire.setFullYear(expire.getFullYear() + 99);
    else expire.setFullYear(expire.getFullYear() + 1);
    const saved = {
      licenseKey: normalizedKey,
      licenseType: detectedType || 'yearly',
      startDate: new Date().toISOString().slice(0, 10),
      expireDate: expire.toISOString().slice(0, 10),
      machineId,
      status: detectedType ? 'valid' : 'invalid'
    };
    const valid = detectedType && saved.machineId === machineId && expire > new Date();
    saved.status = valid ? 'valid' : 'invalid';
    await ensureLicense(getDefaultData().license, saved);
    sendJson(res, valid ? 200 : 400, {
      license: { ...saved, machineKey: machineId, daysRemaining: calculateDaysRemaining(saved) },
      valid
    });
    return true;
  }

  if (pathname === '/api/license/reset' && req.method === 'POST') {
    const cleared = resetLicense();
    sendJson(res, 200, { license: { ...cleared, daysRemaining: calculateDaysRemaining(cleared) }, valid: false });
    return true;
  }

  if (pathname === '/api/logo' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const storedName = await saveLogoFile(body || {});
      if (body?.setDefault) {
        const merged = mergeSettings({ logoFileName: storedName });
        saveSettings(merged);
      }
      sendJson(res, 200, { fileName: storedName });
    } catch (error) {
      console.error(error);
      sendJson(res, 400, { error: 'invalid_logo' });
    }
    return true;
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
    return true;
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
    return true;
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
    return true;
  }

  if (pathname === '/api/data/clear' && req.method === 'POST') {
    const settings = getSettings();
    if (!settings.allowDeleteData) {
      sendJson(res, 403, { error: 'delete_disabled' });
      return true;
    }
    try {
      await clearAllData();
      sendJson(res, 200, { success: true });
    } catch (error) {
      console.error(error);
      sendJson(res, 500, { error: 'clear_failed' });
    }
    return true;
  }

  return false;
}

async function handleRequest(req, res) {
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
  if (url.pathname === '/') {
    const html = renderView('home');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
    return;
  }
  if (url.pathname.startsWith('/api/')) {
    const handled = await handleApi(req, res, url.pathname);
    if (handled) return;
    sendJson(res, 404, { error: 'not_found' });
    return;
  }
  if (url.pathname.startsWith('/database/images/') || url.pathname.startsWith('/database/logo/')) {
    const served = await serveDataFile(res, url.pathname);
    if (served) return;
  }
  if (url.pathname.startsWith('/data/images/')) {
    const mappedPath = url.pathname.replace('/data/images/', '/database/images/');
    const served = await serveDataFile(res, mappedPath);
    if (served) return;
  }
  const served = await serveStatic(res, url.pathname);
  if (!served) {
    sendJson(res, 404, { error: 'not_found' });
  }
}

export { handleRequest };
