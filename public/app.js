import { initLogin } from './login.js';
import { createExamFormView } from './exam-form.js';
import { createCaptureView } from './capture.js';
import { createPatientSearchView } from './search-patient.js';
import { createExamSearchView } from './search-exam.js';
import { createDailyListsView } from './daily-lists.js';
import { createSettingsView } from './settings.js';
import { createDoctorsView } from './doctors.js';
import { createResultTemplatesView } from './result-templates.js';
import { createLicenseView } from './license-ui.js';
import { storage, showToast } from './storage.js';

const menu = document.getElementById('app-menu');
const content = document.getElementById('app-content');

const appState = {
  currentView: 'exam',
  selectedImages: [],
  user: null,
  license: null,
  settings: null
};

const views = {
  exam: createExamFormView(appState),
  capture: createCaptureView(appState),
  'search-patient': createPatientSearchView(appState),
  'search-exam': createExamSearchView(appState),
  'daily-lists': createDailyListsView(appState),
  settings: createSettingsView(appState),
  doctors: createDoctorsView(appState),
  'result-templates': createResultTemplatesView(appState),
  license: createLicenseView(appState)
};

function setMenuEnabled(enabled) {
  menu.querySelectorAll('button').forEach((btn) => {
    btn.disabled = !enabled && btn.dataset.view !== 'license';
  });
  menu.style.opacity = enabled ? '1' : '0.4';
}

async function loadSettings() {
  appState.settings = await storage.getSettings();
  document.querySelector('.brand-text strong').textContent = appState.settings.hospitalName || 'BỆNH VIỆN';
}

async function checkLicense() {
  const data = await storage.getLicense();
  appState.license = data.license;
  if (!data.valid) {
    showToast('Bản quyền hết hạn - hãy kích hoạt để tiếp tục');
    renderView('license');
  }
}

function renderView(viewKey) {
  const view = views[viewKey];
  if (!view) {
    console.warn('View not found', viewKey);
    return;
  }
  appState.currentView = viewKey;
  content.innerHTML = '';
  view.render(content);
  menu.querySelectorAll('button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === viewKey);
  });
}

menu.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.action === 'logout') {
    window.location.reload();
    return;
  }
  if (button.dataset.view) {
    renderView(button.dataset.view);
  }
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'F3') {
    event.preventDefault();
    renderView('exam');
  }
  if (event.key === 'F4') {
    event.preventDefault();
    renderView('capture');
  }
  if (event.ctrlKey && (event.key === 'p' || event.key === 'P')) {
    event.preventDefault();
    renderView('search-patient');
  }
  if (event.ctrlKey && (event.key === 'e' || event.key === 'E')) {
    event.preventDefault();
    renderView('search-exam');
  }
});

document.addEventListener('navigate', (event) => {
  if (event.detail?.view) {
    renderView(event.detail.view);
  }
});

initLogin({
  onSuccess: async (user) => {
    appState.user = user;
    await loadSettings();
    await checkLicense();
    setMenuEnabled(true);
    renderView('exam');
  }
});

setMenuEnabled(false);
renderView('license');
