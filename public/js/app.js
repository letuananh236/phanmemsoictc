import { initLogin } from './login.js';
import { createExamFormView } from './exam-form.js';
import { createCaptureView } from './capture.js';
import { createExamSearchView } from './search-exam.js';
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

let activeViewKey = null;

function updateUiScale() {
  const baseWidth = 1366;
  const baseHeight = 768;
  const scale = Math.max(
    0.85,
    Math.min(window.innerWidth / baseWidth, window.innerHeight / baseHeight, 1.2)
  );
  document.documentElement.style.setProperty('--ui-scale', scale.toFixed(3));
}

window.addEventListener('resize', updateUiScale);
updateUiScale();

const views = {
  exam: createExamFormView(appState),
  capture: createCaptureView(appState),
  'search-exam': createExamSearchView(appState),
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
}

async function checkLicense() {
  const data = await storage.getLicense();
  appState.license = data.license;
  if (!data.valid) {
    setMenuEnabled(false);
    showToast('Bản quyền hết hạn - hãy kích hoạt để tiếp tục');
    renderView('license');
    return false;
  }
  setMenuEnabled(true);
  return true;
}

function renderView(viewKey) {
  const previousView = activeViewKey ? views[activeViewKey] : null;
  if (previousView?.destroy) {
    previousView.destroy();
  }
  const view = views[viewKey];
  if (!view) {
    console.warn('View not found', viewKey);
    return;
  }
  appState.currentView = viewKey;
  activeViewKey = viewKey;
  content.innerHTML = '';
  view.render(content);
  const activeButton = menu.querySelector(`button[data-view="${viewKey}"]`);
  const parentView = activeButton?.dataset.parent;
  menu.querySelectorAll('button').forEach((btn) => {
    const isActive = btn.dataset.view === viewKey;
    const isParentActive = parentView && btn.dataset.view === parentView;
    btn.classList.toggle('active', isActive);
    btn.classList.toggle('active-parent', isParentActive);
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
    const valid = await checkLicense();
    if (!valid) return;
    await loadSettings();
    renderView('exam');
  }
});

document.addEventListener('license:activated', async () => {
  const valid = await checkLicense();
  if (!valid) return;
  await loadSettings();
  renderView('exam');
});

setMenuEnabled(false);
renderView('license');
