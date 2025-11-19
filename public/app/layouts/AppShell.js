import { el } from '../components/common/dom.js';
import { getState, setState } from '../state.js';
import { renderDaily } from '../modules/daily/view.js';
import { renderExaminations } from '../modules/examinations/view.js';
import { renderSettings } from '../modules/settings/view.js';
import { renderLicense } from '../modules/license/view.js';
import { renderBackup } from '../modules/backup/view.js';
import { renderCamera } from '../modules/camera/view.js';
import { renderAbout } from '../modules/about/view.js';

const NAV_ITEMS = [
  { id: 'examinations', label: 'Khám bệnh', path: '/kham-benh' },
  { id: 'camera', label: 'Chụp ảnh', path: '/chup-anh' },
  { id: 'search', label: 'Tìm phiếu khám', path: '/tim-phieu-kham' },
  { id: 'settings', label: 'Cấu hình', path: '/cau-hinh' },
  { id: 'license', label: 'License', path: '/license' },
  { id: 'backup', label: 'Backup & Restore', path: '/backup' },
  { id: 'about', label: 'Giới thiệu phần mềm', path: '/gioi-thieu' }
];

const VIEW_RENDERERS = {
  examinations: renderExaminations,
  camera: renderCamera,
  search: renderDaily,
  settings: renderSettings,
  license: renderLicense,
  backup: renderBackup,
  about: renderAbout
};

export function renderShell() {
  const root = document.getElementById('root');
  if (!root) return;

  const state = getState();
  const node = el(`
    <div class="app-shell">
      <header class="app-header">
        <div class="app-title">PHẦN MỀM SOI CỔ TỬ CUNG</div>
        <div class="app-header-meta">
          <div class="clinic-name">${state.clinic.name || 'Cơ sở khám'}</div>
          <div class="license-pill ${state.license.daysLeft <= 15 ? 'pill-warning' : ''}">License: ${state.license.type || 'trial'} – còn ${state.license.daysLeft} ngày</div>
          <div class="user-chip">${state.user.name}</div>
        </div>
      </header>
      <div class="app-body">
        <nav class="sidebar" aria-label="Điều hướng chính">
          <ul class="nav-list">
            ${NAV_ITEMS.map((item) => `<li><button class="nav-item ${item.id === state.currentView ? 'active' : ''}" data-view="${item.id}">${item.label}</button></li>`).join('')}
          </ul>
        </nav>
        <main id="app-content" class="app-content" aria-live="polite"></main>
      </div>
      <footer class="app-footer">
        <div>Người dùng: ${state.user.name}</div>
        <div class="footer-meta">${new Date().toLocaleDateString('vi-VN')} • DB: ${state.clinic.dbPath}</div>
      </footer>
    </div>
  `);

  root.innerHTML = '';
  root.appendChild(node);

  const content = document.getElementById('app-content');
  const navButtons = root.querySelectorAll('.nav-item');

  const setActive = (view) => {
    navButtons.forEach((btn) => btn.classList.toggle('active', btn.getAttribute('data-view') === view));
  };

  const navigate = (view, extras = {}) => {
    setState({ currentView: view, ...extras });
    setActive(view);
    const target = NAV_ITEMS.find((n) => n.id === view);
    if (view === 'examinations') {
      const examId = extras.selectedExamId || getState().selectedExamId;
      const path = examId
        ? `/kham-soi-ctc/${encodeURIComponent(examId)}`
        : '/kham-benh';
      window.history.replaceState({}, '', path);
    } else if (target?.path) {
      window.history.replaceState({}, '', target.path);
    }
    renderView(view, content, navigate);
  };

  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view');
      navigate(view);
    });
  });

  navigate(state.currentView);
}

function renderView(viewKey, container, navigate) {
  const renderer = VIEW_RENDERERS[viewKey] || renderExaminations;
  if (typeof renderView.cleanup === 'function') {
    renderView.cleanup();
    renderView.cleanup = null;
  }
  const result = renderer(getState(), { navigate });
  const node = result?.node || result;
  renderView.cleanup = result?.cleanup || null;
  container.innerHTML = '';
  container.appendChild(node);
}

renderView.cleanup = null;
