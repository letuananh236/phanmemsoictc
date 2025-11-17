const JSON_HEADERS = { 'Content-Type': 'application/json' };

async function handleResponse(res) {
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || 'Yêu cầu không thành công');
  }
  const contentType = res.headers.get('content-type') || '';
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
  async listTodayVisits(query = {}) {
    const res = await fetch(`/examinations?${new URLSearchParams(query)}`);
    return handleResponse(res);
  },
  async getConfig() {
    const res = await fetch('/system-config');
    return handleResponse(res);
  },
  async getLicense() {
    const res = await fetch('/license');
    return handleResponse(res);
  },
  async uploadLogo(file) {
    const form = new FormData();
    form.append('logo', file);
    const res = await fetch('/api/settings/logo', { method: 'POST', body: form });
    return handleResponse(res);
  }
};
