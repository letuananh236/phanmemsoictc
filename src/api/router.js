import { getConfig, saveLogoFromData, setConfig } from '../services/configService.js';
import { listPatients, savePatient, deletePatient, getPatient } from '../services/patientService.js';
import { listDoctors, saveDoctor, deleteDoctor } from '../services/doctorService.js';
import { listTemplates, saveTemplate, deleteTemplate } from '../services/templateService.js';
import { listExams, saveExam, deleteExam, getExam } from '../services/examService.js';
import { saveExamImage } from '../services/imageService.js';
import { activateLicense, ensureLicense, getLicense, isLicenseValid } from '../services/licenseService.js';
import { authenticate, getLicenseSummary } from '../services/authService.js';
import { createBackup, restoreBackup, listBackupHistory } from '../services/backupService.js';

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  const type = req.headers['content-type'] || '';
  if (type.includes('application/json')) {
    return JSON.parse(buffer.toString('utf8') || '{}');
  }
  return buffer;
}

function normalizePath(pathname) {
  if (pathname.startsWith('/api/')) return pathname.slice(4) || '/';
  return pathname;
}

export async function handleApi(req, res, pathname) {
  const requestUrl = new URL(req.url, 'http://localhost');
  const normalized = normalizePath(requestUrl.pathname);
  if (normalized === '/auth/login') {
    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'method_not_allowed' });
      return;
    }
    const body = await parseBody(req);
    const result = authenticate(body.username, body.password);
    if (!result) {
      sendJson(res, 401, { error: 'invalid_credentials' });
      return;
    }
    sendJson(res, 200, result);
    return;
  }

  const license = ensureLicense();
  if (!normalized.startsWith('/license') && !normalized.startsWith('/auth') && !isLicenseValid(license)) {
    sendJson(res, 403, { error: 'license_expired', license: getLicenseSummary() });
    return;
  }

  try {
    if (normalized === '/system-config') {
      if (req.method === 'GET') {
        sendJson(res, 200, getConfig());
        return;
      }
      if (req.method === 'PUT') {
        const body = await parseBody(req);
        sendJson(res, 200, setConfig(body));
        return;
      }
    }

    if (normalized === '/system-config/logo' && req.method === 'POST') {
      const body = await parseBody(req);
      try {
        const result = saveLogoFromData(body || {});
        sendJson(res, 200, { logoFileName: result.fileName, config: result.config });
      } catch (err) {
        sendJson(res, 400, { error: 'invalid_logo', message: err?.message || 'Không thể lưu logo.' });
      }
      return;
    }

    if (normalized === '/settings') {
      if (req.method === 'GET') {
        sendJson(res, 200, getConfig());
        return;
      }
      if (req.method === 'PUT') {
        const body = await parseBody(req);
        sendJson(res, 200, setConfig(body));
        return;
      }
    }

    if (normalized === '/patients') {
      if (req.method === 'GET') {
        const query = Object.fromEntries(requestUrl.searchParams.entries());
        sendJson(res, 200, listPatients({ search: query.search || '' }));
        return;
      }
      if (req.method === 'POST') {
        const body = await parseBody(req);
        sendJson(res, 201, savePatient(body));
        return;
      }
    }

    if (normalized.startsWith('/patients/')) {
      const id = decodeURIComponent(normalized.split('/').pop());
      if (req.method === 'GET') {
        const patient = getPatient(id);
        if (!patient) {
          sendJson(res, 404, { error: 'not_found' });
          return;
        }
        sendJson(res, 200, patient);
        return;
      }
      if (req.method === 'PUT') {
        const body = await parseBody(req);
        sendJson(res, 200, savePatient({ ...body, id }));
        return;
      }
      if (req.method === 'DELETE') {
        deletePatient(id);
        sendJson(res, 200, { success: true });
        return;
      }
    }

    if (normalized === '/examinations' || normalized === '/exams') {
      if (req.method === 'GET') {
        const query = Object.fromEntries(requestUrl.searchParams.entries());
        const filters = {
          date: query.date || query.examDate,
          doctorId: query.doctor || query.doctorId,
          patientId: query.patientId,
          search: query.search || ''
        };
        sendJson(res, 200, listExams(filters));
        return;
      }
      if (req.method === 'POST') {
        const body = await parseBody(req);
        sendJson(res, 201, saveExam(body));
        return;
      }
    }

    if (normalized.startsWith('/examinations/') || normalized.startsWith('/exams/')) {
      const parts = normalized.split('/').filter(Boolean);
      const id = decodeURIComponent(parts[1]);
      if (parts.length === 2) {
        if (req.method === 'GET') {
          const exam = getExam(id);
          if (!exam) {
            sendJson(res, 404, { error: 'not_found' });
            return;
          }
          sendJson(res, 200, exam);
          return;
        }
        if (req.method === 'PUT') {
          const body = await parseBody(req);
          sendJson(res, 200, saveExam({ ...body, id }));
          return;
        }
        if (req.method === 'DELETE') {
          deleteExam(id);
          sendJson(res, 200, { success: true });
          return;
        }
      }
      if (parts[2] === 'images') {
        if (req.method === 'POST') {
          const body = await parseBody(req);
          const order = body.index ? Number(body.index) + 1 : Number(body.order || 1);
          const saved = saveExamImage(id, order, body.dataUrl, body.note);
          sendJson(res, 200, saved);
          return;
        }
      }
    }

    if (normalized === '/images') {
      if (req.method === 'POST') {
        const body = await parseBody(req);
        const saved = saveExamImage(body.examId, Number(body.index || 0) + 1, body.dataUrl, body.note);
        sendJson(res, 200, saved);
        return;
      }
    }

    if (normalized === '/doctors') {
      if (req.method === 'GET') {
        sendJson(res, 200, listDoctors());
        return;
      }
      if (req.method === 'POST') {
        const body = await parseBody(req);
        sendJson(res, 201, saveDoctor(body));
        return;
      }
    }

    if (normalized.startsWith('/doctors/')) {
      const id = decodeURIComponent(normalized.split('/').pop());
      if (req.method === 'PUT') {
        const body = await parseBody(req);
        sendJson(res, 200, saveDoctor({ ...body, id }));
        return;
      }
      if (req.method === 'DELETE') {
        deleteDoctor(id);
        sendJson(res, 200, { success: true });
        return;
      }
    }

    if (normalized === '/result-templates') {
      if (req.method === 'GET') {
        sendJson(res, 200, listTemplates());
        return;
      }
      if (req.method === 'POST') {
        const body = await parseBody(req);
        sendJson(res, 201, saveTemplate(body));
        return;
      }
    }

    if (normalized.startsWith('/result-templates/')) {
      const id = decodeURIComponent(normalized.split('/').pop());
      if (req.method === 'PUT') {
        const body = await parseBody(req);
        sendJson(res, 200, saveTemplate({ ...body, id: Number(id) }));
        return;
      }
      if (req.method === 'DELETE') {
        deleteTemplate(Number(id));
        sendJson(res, 200, { success: true });
        return;
      }
    }

    if (normalized === '/license') {
      if (req.method === 'GET') {
        const current = getLicenseSummary();
        sendJson(res, 200, { license: current, valid: isLicenseValid(current) });
        return;
      }
    }

    if (normalized === '/license/activate') {
      if (req.method === 'POST') {
        const body = await parseBody(req);
        const lic = activateLicense(body);
        sendJson(res, 200, { license: lic, valid: true });
        return;
      }
    }

    if (normalized === '/backup/create') {
      if (req.method === 'POST' || req.method === 'GET') {
        const info = await createBackup();
        sendJson(res, 200, info);
        return;
      }
    }

    if (normalized === '/backup/history') {
      if (req.method === 'GET') {
        const list = listBackupHistory(20);
        sendJson(res, 200, { items: list });
        return;
      }
    }

    if (normalized === '/backup/restore') {
      if (req.method === 'POST') {
        const body = await parseBody(req);
        const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body.data || []);
        await restoreBackup(buffer);
        sendJson(res, 200, { success: true });
        return;
      }
    }

    // Legacy aliases
    if (normalized === '/backup') {
      if (req.method === 'GET') {
        const info = await createBackup();
        const data = await import('node:fs').then((mod) => mod.readFileSync(info.backupPath));
        res.writeHead(200, {
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename="backup.zip"'
        });
        res.end(data);
        return;
      }
      if (req.method === 'POST') {
        const buffer = await parseBody(req);
        await restoreBackup(buffer);
        sendJson(res, 200, { success: true });
        return;
      }
    }

    sendJson(res, 404, { error: 'not_found' });
  } catch (error) {
    console.error('API error', error);
    sendJson(res, 500, { error: 'server_error', message: error.message });
  }
}
