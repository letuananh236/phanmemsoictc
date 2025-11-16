import http from 'http';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import os from 'os';
import crypto from 'crypto';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const dataDir = path.join(rootDir, 'data');
const imagesDir = path.join(dataDir, 'images');

const jsonFiles = {
  settings: path.join(dataDir, 'settings.json'),
  patients: path.join(dataDir, 'patients.json'),
  exams: path.join(dataDir, 'exams.json'),
  doctors: path.join(dataDir, 'doctors.json'),
  templates: path.join(dataDir, 'result-templates.json'),
  license: path.join(dataDir, 'license.json')
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
    logoFileName: 'logo-default.png',
    patientCodePrefix: 'BN',
    examCodePrefix: 'HA',
    defaultImageCount: 4,
    defaultDescription: 'Âm đạo:\nCổ tử cung:\nSau bôi Axit acetic:\nSau bôi Lugol:\n',
    defaultResult: '',
    defaultConclusion: '',
    defaultDoctorAdvice: '',
    allowDeleteData: true
  },
  patients: [],
  exams: [],
  doctors: [{ id: 'D001', name: 'BS Trần Văn B', active: true }],
  templates: [
    { id: 'T001', name: 'Bình thường', content: 'Mô tả kết quả bình thường...' }
  ],
  license: {}
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

async function ensureDirectories() {
  await fsPromises.mkdir(dataDir, { recursive: true });
  await fsPromises.mkdir(imagesDir, { recursive: true });
  await Promise.all(
    Object.entries(jsonFiles).map(async ([key, filePath]) => {
      try {
        await fsPromises.access(filePath, fs.constants.F_OK);
      } catch {
        const seed = key === 'license' ? {} : defaultData[key];
        await fsPromises.writeFile(filePath, JSON.stringify(seed, null, 2), 'utf8');
      }
    })
  );
}

async function readJson(filePath) {
  const content = await fsPromises.readFile(filePath, 'utf8');
  return JSON.parse(content || 'null');
}

async function writeJson(filePath, data) {
  await fsPromises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function getMachineId() {
  const hostname = os.hostname();
  const hash = crypto.createHash('sha1').update(hostname).digest('hex');
  return `${hash.slice(0, 4).toUpperCase()}-${hash.slice(4, 8).toUpperCase()}`;
}

async function ensureLicense() {
  let license;
  try {
    license = await readJson(jsonFiles.license);
  } catch {
    license = null;
  }
  if (!license || !license.startDate) {
    const now = new Date();
    const expire = new Date(now);
    expire.setDate(expire.getDate() + 30);
    license = {
      machineId: getMachineId(),
      licenseType: 'trial',
      licenseKey: '',
      startDate: now.toISOString().slice(0, 10),
      expireDate: expire.toISOString().slice(0, 10),
      status: 'valid'
    };
    await writeJson(jsonFiles.license, license);
  }
  return license;
}

function isLicenseValid(license) {
  if (!license) return false;
  if (license.status !== 'valid') return false;
  const expire = new Date(license.expireDate);
  return !Number.isNaN(expire.getTime()) && expire >= new Date();
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
      // ignore, attempt to read file
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
  const folder = path.join(
    imagesDir,
    String(now.getFullYear()),
    String(now.getMonth() + 1).padStart(2, '0')
  );
  await fsPromises.mkdir(folder, { recursive: true });
  const safeExam = examId || 'EXAM';
  const name = `${safeExam}_${String(index).padStart(2, '0')}.png`;
  const filePath = path.join(folder, name);
  await fsPromises.writeFile(filePath, buffer);
  return path.relative(rootDir, filePath).replace(/\\/g, '/');
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

async function handleApi(req, res, pathname) {
  const license = await ensureLicense();
  if (!pathname.startsWith('/api/license') && !isLicenseValid(license)) {
    sendJson(res, 403, { error: 'license_expired', license });
    return;
  }

  if (pathname === '/api/settings') {
    if (req.method === 'GET') {
      const settings = await readJson(jsonFiles.settings);
      sendJson(res, 200, settings);
      return;
    }
    if (req.method === 'PUT') {
      const payload = await parseBody(req);
      const merged = { ...defaultData.settings, ...(payload || {}) };
      await writeJson(jsonFiles.settings, merged);
      sendJson(res, 200, merged);
      return;
    }
  }

  if (pathname === '/api/patients') {
    if (req.method === 'GET') {
      const patients = await readJson(jsonFiles.patients);
      sendJson(res, 200, patients);
      return;
    }
    if (req.method === 'POST') {
      const payload = await parseBody(req);
      const patients = await readJson(jsonFiles.patients);
      const patient = { ...payload, createdAt: new Date().toISOString() };
      patients.push(patient);
      await writeJson(jsonFiles.patients, patients);
      sendJson(res, 201, patient);
      return;
    }
  }

  if (pathname.startsWith('/api/patients/')) {
    const id = decodeURIComponent(pathname.split('/').pop() || '');
    if (req.method === 'PUT') {
      const payload = await parseBody(req);
      const patients = await readJson(jsonFiles.patients);
      const index = patients.findIndex((p) => p.id === id);
      if (index === -1) {
        sendJson(res, 404, { error: 'not_found' });
        return;
      }
      patients[index] = { ...patients[index], ...payload };
      await writeJson(jsonFiles.patients, patients);
      sendJson(res, 200, patients[index]);
      return;
    }
    if (req.method === 'DELETE') {
      const settings = await readJson(jsonFiles.settings);
      if (!settings.allowDeleteData) {
        sendJson(res, 403, { error: 'delete_disabled' });
        return;
      }
      const patients = await readJson(jsonFiles.patients);
      const remaining = patients.filter((p) => p.id !== id);
      await writeJson(jsonFiles.patients, remaining);
      sendJson(res, 200, { success: true });
      return;
    }
  }

  if (pathname === '/api/exams') {
    if (req.method === 'GET') {
      const exams = await readJson(jsonFiles.exams);
      sendJson(res, 200, exams);
      return;
    }
    if (req.method === 'POST') {
      const payload = await parseBody(req);
      const exams = await readJson(jsonFiles.exams);
      const now = new Date().toISOString();
      const exam = { ...payload, createdAt: now, updatedAt: now };
      exams.push(exam);
      await writeJson(jsonFiles.exams, exams);
      sendJson(res, 201, exam);
      return;
    }
  }

  if (pathname.startsWith('/api/exams/')) {
    const id = decodeURIComponent(pathname.split('/').pop() || '');
    if (req.method === 'PUT') {
      const payload = await parseBody(req);
      const exams = await readJson(jsonFiles.exams);
      const index = exams.findIndex((e) => e.id === id);
      if (index === -1) {
        sendJson(res, 404, { error: 'not_found' });
        return;
      }
      exams[index] = { ...exams[index], ...payload, updatedAt: new Date().toISOString() };
      await writeJson(jsonFiles.exams, exams);
      sendJson(res, 200, exams[index]);
      return;
    }
    if (req.method === 'DELETE') {
      const settings = await readJson(jsonFiles.settings);
      if (!settings.allowDeleteData) {
        sendJson(res, 403, { error: 'delete_disabled' });
        return;
      }
      const exams = await readJson(jsonFiles.exams);
      const remaining = exams.filter((e) => e.id !== id);
      await writeJson(jsonFiles.exams, remaining);
      sendJson(res, 200, { success: true });
      return;
    }
  }

  if (pathname === '/api/doctors') {
    if (req.method === 'GET') {
      const doctors = await readJson(jsonFiles.doctors);
      sendJson(res, 200, doctors);
      return;
    }
    if (req.method === 'POST') {
      const payload = await parseBody(req);
      const doctors = await readJson(jsonFiles.doctors);
      doctors.push(payload);
      await writeJson(jsonFiles.doctors, doctors);
      sendJson(res, 201, payload);
      return;
    }
  }

  if (pathname.startsWith('/api/doctors/')) {
    const id = decodeURIComponent(pathname.split('/').pop() || '');
    if (req.method === 'PUT') {
      const payload = await parseBody(req);
      const doctors = await readJson(jsonFiles.doctors);
      const index = doctors.findIndex((d) => d.id === id);
      if (index === -1) {
        sendJson(res, 404, { error: 'not_found' });
        return;
      }
      doctors[index] = { ...doctors[index], ...payload };
      await writeJson(jsonFiles.doctors, doctors);
      sendJson(res, 200, doctors[index]);
      return;
    }
    if (req.method === 'DELETE') {
      const settings = await readJson(jsonFiles.settings);
      if (!settings.allowDeleteData) {
        sendJson(res, 403, { error: 'delete_disabled' });
        return;
      }
      const doctors = await readJson(jsonFiles.doctors);
      const remaining = doctors.filter((d) => d.id !== id);
      await writeJson(jsonFiles.doctors, remaining);
      sendJson(res, 200, { success: true });
      return;
    }
  }

  if (pathname === '/api/result-templates') {
    if (req.method === 'GET') {
      const templates = await readJson(jsonFiles.templates);
      sendJson(res, 200, templates);
      return;
    }
    if (req.method === 'POST') {
      const payload = await parseBody(req);
      const templates = await readJson(jsonFiles.templates);
      templates.push(payload);
      await writeJson(jsonFiles.templates, templates);
      sendJson(res, 201, payload);
      return;
    }
  }

  if (pathname.startsWith('/api/result-templates/')) {
    const id = decodeURIComponent(pathname.split('/').pop() || '');
    if (req.method === 'PUT') {
      const payload = await parseBody(req);
      const templates = await readJson(jsonFiles.templates);
      const index = templates.findIndex((t) => t.id === id);
      if (index === -1) {
        sendJson(res, 404, { error: 'not_found' });
        return;
      }
      templates[index] = { ...templates[index], ...payload };
      await writeJson(jsonFiles.templates, templates);
      sendJson(res, 200, templates[index]);
      return;
    }
    if (req.method === 'DELETE') {
      const settings = await readJson(jsonFiles.settings);
      if (!settings.allowDeleteData) {
        sendJson(res, 403, { error: 'delete_disabled' });
        return;
      }
      const templates = await readJson(jsonFiles.templates);
      const remaining = templates.filter((t) => t.id !== id);
      await writeJson(jsonFiles.templates, remaining);
      sendJson(res, 200, { success: true });
      return;
    }
  }

  if (pathname === '/api/license') {
    if (req.method === 'GET') {
      const freshLicense = await ensureLicense();
      sendJson(res, 200, { license: freshLicense, valid: isLicenseValid(freshLicense) });
      return;
    }
  }

  if (pathname === '/api/license/activate' && req.method === 'POST') {
    const payload = await parseBody(req);
    const now = new Date();
    const expire = new Date(now);
    if (payload.licenseType === 'lifetime') {
      expire.setFullYear(expire.getFullYear() + 100);
    } else if (payload.licenseType === 'yearly') {
      expire.setFullYear(expire.getFullYear() + 1);
    } else {
      expire.setMonth(expire.getMonth() + 1);
    }
    const updated = {
      machineId: getMachineId(),
      licenseType: payload.licenseType || 'trial',
      licenseKey: payload.licenseKey || '',
      startDate: now.toISOString().slice(0, 10),
      expireDate: expire.toISOString().slice(0, 10),
      status: 'valid'
    };
    await writeJson(jsonFiles.license, updated);
    sendJson(res, 200, { license: updated, valid: true });
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
    serveStatic(res, url.pathname);
  });
  return server;
}

export async function bootstrap() {
  await ensureDirectories();
  await ensureLicense();
}

const bootstrapPromise = bootstrap();

if (import.meta.url === `file://${process.argv[1]}`) {
  bootstrapPromise.then(() => {
    const server = createServer();
    const port = Number.parseInt(process.env.PORT ?? '3000', 10);
    server.listen(port, () => {
      console.log(`Ứng dụng đang chạy tại http://localhost:${port}`);
    });
  }).catch((error) => {
    console.error('Không thể khởi động server:', error);
  });
}
