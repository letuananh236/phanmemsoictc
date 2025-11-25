const JSON_HEADERS = { 'Content-Type': 'application/json' };

async function request(path, options = {}) {
  const response = await fetch(path, options);
  const contentType = response.headers.get('content-type') || '';
  if (!response.ok) {
    if (contentType.includes('application/json')) {
      const errorJson = await response.json();
      throw new Error(errorJson.error || 'Yêu cầu thất bại');
    }
    const errorText = await response.text();
    throw new Error(errorText || 'Yêu cầu thất bại');
  }
  if (contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

export const storage = {
  getSettings: () => request('/api/settings'),
  saveSettings: (payload) => request('/api/settings', {
    method: 'PUT',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload)
  }),
  listPatients: () => request('/api/patients'),
  savePatient: (payload) => request('/api/patients', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload)
  }),
  updatePatient: (id, payload) => request(`/api/patients/${id}`, {
    method: 'PUT',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload)
  }),
  listExams: () => request('/api/exams'),
  saveExam: (payload) => request('/api/exams', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload)
  }),
  updateExam: (id, payload) => request(`/api/exams/${id}`, {
    method: 'PUT',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload)
  }),
  deleteExam: (id) => request(`/api/exams/${id}`, { method: 'DELETE' }),
  deletePatient: (id) => request(`/api/patients/${id}`, { method: 'DELETE' }),
  listDoctors: () => request('/api/doctors'),
  saveDoctor: (payload) => request('/api/doctors', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload)
  }),
  updateDoctor: (id, payload) => request(`/api/doctors/${id}`, {
    method: 'PUT',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload)
  }),
  deleteDoctor: (id) => request(`/api/doctors/${id}`, { method: 'DELETE' }),
  listTemplates: () => request('/api/result-templates'),
  saveTemplate: (payload) => request('/api/result-templates', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload)
  }),
  updateTemplate: (id, payload) => request(`/api/result-templates/${id}`, {
    method: 'PUT',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload)
  }),
  deleteTemplate: (id) => request(`/api/result-templates/${id}`, { method: 'DELETE' }),
  uploadImage: (examId, index, dataUrl) => request('/api/images', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ examId, index, dataUrl })
  }),
  downloadBackup: async () => {
    const response = await fetch('/api/backup');
    if (!response.ok) throw new Error('Không thể tải backup');
    return response.blob();
  },
  restoreBackup: async (file) => {
    const response = await fetch('/api/restore', {
      method: 'POST',
      body: file
    });
    if (!response.ok) {
      throw new Error('Không thể khôi phục backup');
    }
    return response.json();
  },
  login: (payload) => request('/api/login', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload)
  }),
  listUsers: () => request('/api/users'),
  createUser: (payload) => request('/api/users', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload)
  }),
  getLicense: () => request('/api/license'),
  activateLicense: (payload) => request('/api/license/activate', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload)
  }),
  uploadLogo: (payload) => request('/api/logo', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify(payload)
  })
};

export function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(showToast.timeoutId);
  showToast.timeoutId = setTimeout(() => toast.classList.add('hidden'), 3000);
}
