const JSON_HEADERS = { 'Content-Type': 'application/json' };

async function handleResponse(res) {
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok) {
    const raw = await res.text();
    const payload = contentType.includes('application/json') && raw ? JSON.parse(raw) : raw;
    const err = new Error(payload?.error || payload?.message || raw || 'Yêu cầu không thành công');
    err.status = res.status;
    err.body = payload;
    throw err;
  }
  if (contentType.includes('application/json')) {
    return res.json();
  }
  return res.text();
}

export const api = {
  async login(payload) {
    const res = await fetch('/auth/login', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(payload) });
    return handleResponse(res);
  },
  async listPatients(query = {}) {
    const qs = new URLSearchParams(query).toString();
    const res = await fetch(`/patients${qs ? `?${qs}` : ''}`);
    return handleResponse(res);
  },
  async getPatient(id) {
    const res = await fetch(`/patients/${encodeURIComponent(id)}`);
    return handleResponse(res);
  },
  async createPatient(payload) {
    const res = await fetch('/patients', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(payload) });
    return handleResponse(res);
  },
  async updatePatient(id, payload) {
    const res = await fetch(`/patients/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  async listDoctors() {
    const res = await fetch('/doctors');
    return handleResponse(res);
  },
  async createDoctor(payload) {
    const res = await fetch('/doctors', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(payload) });
    return handleResponse(res);
  },
  async updateDoctor(id, payload) {
    const res = await fetch(`/doctors/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  async listExaminations(query = {}) {
    const qs = new URLSearchParams(query).toString();
    const res = await fetch(`/examinations${qs ? `?${qs}` : ''}`);
    return handleResponse(res);
  },
  async getExamination(id) {
    const res = await fetch(`/examinations/${encodeURIComponent(id)}`);
    return handleResponse(res);
  },
  async updateExamination(id, payload) {
    const res = await fetch(`/examinations/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  async uploadExamImage(examId, payload) {
    const res = await fetch(`/examinations/${encodeURIComponent(examId)}/images`, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload)
    });
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
    const res = await fetch('/system-config', { method: 'PUT', headers: JSON_HEADERS, body: JSON.stringify(payload) });
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
    const res = await fetch('/result-templates');
    return handleResponse(res);
  },
  async createResultTemplate(payload) {
    const res = await fetch('/result-templates', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(payload) });
    return handleResponse(res);
  },
  async updateResultTemplate(id, payload) {
    const res = await fetch(`/result-templates/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  async deleteResultTemplate(id) {
    const res = await fetch(`/result-templates/${encodeURIComponent(id)}`, { method: 'DELETE' });
    return handleResponse(res);
  },
  async uploadLogo(file) {
    const form = new FormData();
    form.append('logo', file);
    const res = await fetch('/api/settings/logo', { method: 'POST', body: form });
    return handleResponse(res);
  }
};
