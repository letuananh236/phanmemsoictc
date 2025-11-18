const JSON_HEADERS = { 'Content-Type': 'application/json' };

let authToken = null;
let unauthorizedHandler = null;

function withAuth(headers = {}) {
  if (authToken) {
    return { ...headers, Authorization: `Bearer ${authToken}` };
  }
  return headers;
}

async function handleResponse(res) {
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok) {
    const raw = await res.text();
    const payload = contentType.includes('application/json') && raw ? JSON.parse(raw) : raw;
    const err = new Error(payload?.error || payload?.message || raw || 'Yêu cầu không thành công');
    err.status = res.status;
    err.body = payload;
    if (res.status === 401 && typeof unauthorizedHandler === 'function') {
      unauthorizedHandler();
    }
    throw err;
  }
  if (contentType.includes('application/json')) {
    return res.json();
  }
  return res.text();
}

export const api = {
  setAuthToken(token) {
    authToken = token || null;
  },
  onUnauthorized(handler) {
    unauthorizedHandler = handler;
  },
  async login(payload) {
    const res = await fetch('/auth/login', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(payload) });
    return handleResponse(res);
  },
  async listPatients(query = {}) {
    const qs = new URLSearchParams(query).toString();
    const res = await fetch(`/api/patients${qs ? `?${qs}` : ''}`, { headers: withAuth() });
    return handleResponse(res);
  },
  async getPatient(id) {
    const res = await fetch(`/api/patients/${encodeURIComponent(id)}`, { headers: withAuth() });
    return handleResponse(res);
  },
  async createPatient(payload) {
    const res = await fetch('/api/patients', {
      method: 'POST',
      headers: withAuth(JSON_HEADERS),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  async updatePatient(id, payload) {
    const res = await fetch(`/api/patients/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: withAuth(JSON_HEADERS),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  async listDoctors() {
    const res = await fetch('/api/doctors', { headers: withAuth() });
    return handleResponse(res);
  },
  async listActiveDoctors() {
    const res = await fetch('/api/doctors/active', { headers: withAuth() });
    return handleResponse(res);
  },
  async createDoctor(payload) {
    const res = await fetch('/api/doctors', { method: 'POST', headers: withAuth(JSON_HEADERS), body: JSON.stringify(payload) });
    return handleResponse(res);
  },
  async updateDoctor(id, payload) {
    const res = await fetch(`/api/doctors/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: withAuth(JSON_HEADERS),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  async listExaminations(query = {}) {
    const qs = new URLSearchParams(query).toString();
    const res = await fetch(`/api/visits${qs ? `?${qs}` : ''}`, { headers: withAuth() });
    return handleResponse(res);
  },
  async getExamination(id) {
    const res = await fetch(`/api/visits/${encodeURIComponent(id)}`, { headers: withAuth() });
    return handleResponse(res);
  },
  async getVisitPrintData(id) {
    const res = await fetch(`/api/visits/${encodeURIComponent(id)}/print-data`, { headers: withAuth() });
    return handleResponse(res);
  },
  async updateExamination(id, payload) {
    const res = await fetch(`/api/visits/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: withAuth(JSON_HEADERS),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  async uploadExamImage(examId, payload) {
    const res = await fetch(`/api/visits/${encodeURIComponent(examId)}/images`, {
      method: 'POST',
      headers: withAuth(JSON_HEADERS),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  async listVisitImages(visitId) {
    const qs = new URLSearchParams({ visitId }).toString();
    const res = await fetch(`/api/visit-images?${qs}`, { headers: withAuth() });
    return handleResponse(res);
  },
  async uploadVisitImage(payload) {
    const res = await fetch('/api/visit-images', {
      method: 'POST',
      headers: withAuth(JSON_HEADERS),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  async deleteVisitImage(id) {
    const res = await fetch(`/api/visit-images/${encodeURIComponent(id)}`, { method: 'DELETE', headers: withAuth() });
    return handleResponse(res);
  },
  async listTodayVisits(query = {}) {
    return this.listExaminations(query);
  },
  async getConfig() {
    const res = await fetch('/system-config');
    return handleResponse(res);
  },
  async setConfig(payload) {
    const res = await fetch('/system-config', {
      method: 'PUT',
      headers: withAuth(JSON_HEADERS),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  async uploadLogo({ fileName, dataUrl }) {
    const res = await fetch('/system-config/logo', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ fileName, dataUrl })
    });
    return handleResponse(res);
  },
  async getLicense() {
    const res = await fetch('/license');
    return handleResponse(res);
  },
  async activateLicense(payload) {
    const res = await fetch('/license/activate', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  async listResultTemplates() {
    const res = await fetch('/api/result-templates');
    return handleResponse(res);
  },
  async createResultTemplate(payload) {
    const res = await fetch('/api/result-templates', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(payload) });
    return handleResponse(res);
  },
  async updateResultTemplate(id, payload) {
    const res = await fetch(`/api/result-templates/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  async deleteResultTemplate(id) {
    const res = await fetch(`/api/result-templates/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return handleResponse(res);
  },
  async uploadLogo(file) {
    const form = new FormData();
    form.append('logo', file);
    const res = await fetch('/api/settings/logo', { method: 'POST', headers: withAuth(), body: form });
    return handleResponse(res);
  },
  async getBackupHistory() {
    const res = await fetch('/api/backup/history', { headers: withAuth() });
    return handleResponse(res);
  },
  async createBackup() {
    const res = await fetch('/api/backup/create', { method: 'POST', headers: withAuth() });
    return handleResponse(res);
  },
  async restoreBackup(file) {
    const arrayBuffer = await file.arrayBuffer();
    const res = await fetch('/api/backup/restore', {
      method: 'POST',
      headers: withAuth({ 'Content-Type': 'application/octet-stream' }),
      body: arrayBuffer
    });
    return handleResponse(res);
  },
  async getSrs() {
    const res = await fetch('/api/srs');
    return handleResponse(res);
  }
};
