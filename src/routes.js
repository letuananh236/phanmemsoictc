import fs from 'fs';
import path from 'path';
import express from './utils/express.js';
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
  syncSequenceCounters,
  updateDoctor,
  updateExam
} from './models/exam.model.js';
import { createPatient, listPatients, removePatient, updatePatient } from './models/patient.model.js';
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

const ACTIVATION_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbxEO5SiDFrNmd806nQNW_-9A7WbVVBgiw0lTNpkBBTcNc9wFZXuMeSYYfHB0rfHw4pKBw/exec';
const ACTIVATION_SECRET = 'NEW_SECRET_456';

const viewCache = new Map();
const bootstrapPromise = ensureInfrastructure().then(async () => {
  await ensureLicense(getDefaultData().license);
  await syncSequenceCounters();
});

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

function createApp() {
  const app = express();
  const { publicDir, imagesDir, logoDir, rootDir } = getPaths();

  app.use((req, res, next) => {
    const username = req.headers['x-user'] || '';
    const role = req.headers['x-role'] || '';
    req.user = { username, role };
    next();
  });

  function isAdmin(req) {
    return req.user?.role === 'admin' || req.user?.username === 'admin';
  }

  function requireAdmin(req, res) {
    if (!isAdmin(req)) {
      res.status(403).json({ error: 'forbidden' });
      return false;
    }
    return true;
  }

  app.use(async (req, res, next) => {
    try {
      await bootstrapPromise;
      next();
    } catch (error) {
      next(error);
    }
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/', (req, res) => {
    const html = renderView('home');
    res.type('html').send(html);
  });

  app.use('/database/images', express.static(imagesDir));
  app.use('/database/logo', express.static(logoDir));
  app.get('/data/images/*', (req, res) => {
    const relative = req.path.replace('/data/images/', '');
    const filePath = path.join(imagesDir, relative);
    res.sendFile(filePath, (err) => {
      if (err) {
        res.status(err.code === 'ENOENT' ? 404 : 500).json({ error: 'not_found' });
      }
    });
  });

  const licenseExemptPaths = ['/license', '/license/activate', '/license/reset', '/license/send', '/login', '/meta'];
  app.use('/api', async (req, res, next) => {
    try {
      const license = await ensureLicense(getDefaultData().license);
      req.license = license;
      if (!licenseExemptPaths.includes(req.path) && !isLicenseValid(license)) {
        return res.status(403).json({
          error: 'license_expired',
          license: { ...license, daysRemaining: calculateDaysRemaining(license) }
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/login', (req, res) => {
    const payload = req.body || {};
    const users = listUsers();
    const matched = users.find((user) => user.username === payload.username && user.password === payload.password);
    if (!matched) {
      res.status(401).json({ error: 'invalid_credentials' });
      return;
    }
    res.json({ success: true, username: matched.username, role: matched.role || 'user' });
  });

  app.get('/api/meta', (req, res) => {
    const machineKey = generateMachineKey();
    const pkgPath = path.join(rootDir, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    res.json({ machineKey, version: pkg.version });
  });

  app
    .route('/api/settings')
    .get((req, res) => {
      res.json(getSettings());
    })
    .put((req, res) => {
      if (!requireAdmin(req, res)) return;
      const merged = mergeSettings(req.body || {});
      saveSettings(merged);
      res.json(merged);
    });

  app
    .route('/api/users')
    .get((req, res) => {
      if (!requireAdmin(req, res)) return;
      const sanitized = listUsers().map((user) => ({ username: user.username, role: user.role || 'user' }));
      res.json(sanitized);
    })
    .post((req, res) => {
      if (!requireAdmin(req, res)) return;
      const result = addUser(req.body || {});
      if (result?.error === 'invalid_user') {
        res.status(400).json({ error: 'invalid_user' });
        return;
      }
      if (result?.error === 'user_exists') {
        res.status(409).json({ error: 'user_exists' });
        return;
      }
      res.status(201).json(result);
    });

  app
    .route('/api/patients')
    .get((req, res) => {
      res.json(listPatients());
    })
    .post((req, res) => {
      const patient = createPatient(req.body || {});
      res.status(201).json(patient);
    });

  app
    .route('/api/patients/:id')
    .put((req, res) => {
      const updated = updatePatient(req.params.id, req.body || {});
      res.status(updated ? 200 : 404).json(updated || { error: 'not_found' });
    })
    .delete((req, res) => {
      removePatient(req.params.id, true);
      res.json({ success: true });
    });

  app
    .route('/api/exams')
    .get((req, res) => {
      res.json(listExams());
    })
    .post((req, res) => {
      const exam = createExam(req.body || {});
      res.status(201).json(exam);
    });

  app
    .route('/api/exams/:id')
    .get((req, res) => {
      const exam = getExam(req.params.id);
      res.status(exam ? 200 : 404).json(exam || { error: 'not_found' });
    })
    .put((req, res) => {
      const updated = updateExam(req.params.id, req.body || {});
      res.status(updated ? 200 : 404).json(updated || { error: 'not_found' });
    })
    .delete((req, res) => {
      removeExam(req.params.id, true);
      res.json({ success: true });
    });

  app
    .route('/api/doctors')
    .get((req, res) => {
      res.json(listDoctors());
    })
    .post((req, res) => {
      if (!requireAdmin(req, res)) return;
      const doctor = createDoctor(req.body || {});
      if (doctor?.error === 'doctor_exists') {
        res.status(409).json({ error: 'doctor_exists' });
        return;
      }
      if (doctor?.error) {
        res.status(400).json(doctor);
        return;
      }
      res.status(201).json(doctor);
    });

  app
    .route('/api/doctors/:id')
    .put((req, res) => {
      if (!requireAdmin(req, res)) return;
      const updated = updateDoctor(req.params.id, req.body || {});
      res.status(updated ? 200 : 404).json(updated || { error: 'not_found' });
    })
    .delete((req, res) => {
      if (!requireAdmin(req, res)) return;
      removeDoctor(req.params.id, true);
      res.json({ success: true });
    });

  app.get('/api/templates', (req, res) => {
    res.json(listTemplates());
  });

  app.get('/api/license', (req, res) => {
    const license = req.license || getDefaultData().license;
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
    res.json({ license: enriched, valid });
  });

  app.post('/api/license/send', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    const { machineId } = req.body || {};
    const machineKey = machineId || generateMachineKey();
    const payload = {
      key: ACTIVATION_SECRET,
      machineId: machineKey,
      source: 'app'
    };
    const form = new URLSearchParams(payload);
    try {
      const response = await fetch(ACTIVATION_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString()
      });
      if (!response.ok) {
        const detail = await response.text();
        res.status(502).json({ error: 'Không thể gửi mã kích hoạt', detail });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Activation send failed', error);
      res.status(500).json({ error: 'Không thể gửi mã kích hoạt' });
    }
  });

  app.post(['/api/license', '/api/license/activate'], async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const body = req.body || {};
      const machineId = generateMachineKey();
      const normalizedKey = normalizeLicenseKey(body?.licenseKey || '');
      const detectedType = detectLicenseTypeFromKey(normalizedKey, machineId);
      const startDate = new Date();
      const expireDate = new Date(startDate);
      if (detectedType === 'thirty_day') expireDate.setDate(expireDate.getDate() + 30);
      else if (detectedType === 'lifetime') expireDate.setFullYear(expireDate.getFullYear() + 99);
      else expireDate.setFullYear(expireDate.getFullYear() + 1);

      const saved = await ensureLicense(getDefaultData().license, {
        licenseKey: normalizedKey,
        machineId,
        licenseType: detectedType || body?.licenseType || 'yearly',
        startDate: startDate.toISOString().slice(0, 10),
        expireDate: expireDate.toISOString().slice(0, 10),
        status: 'valid'
      });
      const valid = isLicenseValid(saved);
      res.json({
        license: { ...saved, machineKey: machineId, daysRemaining: calculateDaysRemaining(saved) },
        valid
      });
    } catch (error) {
      res.status(400).json({ error: 'invalid_license' });
    }
  });

  app.post('/api/license/reset', (req, res) => {
    if (!requireAdmin(req, res)) return;
    const cleared = resetLicense();
    res.json({ license: { ...cleared, daysRemaining: calculateDaysRemaining(cleared) }, valid: false });
  });

  app.post('/api/logo', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
      const storedName = await saveLogoFile(req.body || {});
      if (req.body?.setDefault) {
        const merged = mergeSettings({ logoFileName: storedName });
        saveSettings(merged);
      }
      res.json({ fileName: storedName });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: 'invalid_logo' });
    }
  });

  app.post('/api/images', async (req, res) => {
    try {
      const storedPath = await saveImageFromDataUrl(req.body || {});
      res.json({ path: storedPath });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: 'invalid_image' });
    }
  });

  app.get('/api/backup', async (req, res) => {
    try {
      const buffer = await createZipBuffer();
      res.set({
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="backup.zip"'
      });
      res.send(buffer);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'backup_failed' });
    }
  });

  app.post('/api/restore', express.raw({ type: '*/*', limit: '200mb' }), async (req, res) => {
    const buffer = req.body;
    try {
      await extractZipBuffer(buffer);
      await syncSequenceCounters();
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'restore_failed' });
    }
  });

  app.post('/api/data/clear', async (req, res) => {
    try {
      await clearAllData();
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'clear_failed' });
    }
  });

  app.use(express.static(publicDir));

  app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ error: 'not_found' });
      return;
    }
    res.status(404).json({ error: 'not_found' });
  });

  return app;
}

export { createApp };
