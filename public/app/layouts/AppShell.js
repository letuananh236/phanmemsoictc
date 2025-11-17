import { el } from '../components/common/dom.js';
import { getState, setState } from '../state.js';
import { renderDaily } from '../modules/daily/view.js';
import { renderPatients } from '../modules/patients/view.js';
import { renderExaminations } from '../modules/examinations/view.js';
import { renderDoctors } from '../modules/doctors/view.js';
import { renderTemplates } from '../modules/templates/view.js';
import { renderSettings } from '../modules/settings/view.js';
import { renderLicense } from '../modules/license/view.js';
import { renderBackup } from '../modules/backup/view.js';

const NAV_ITEMS = [
  { id: 'daily', label: 'Khám trong ngày' },
  { id: 'patients', label: 'Bệnh nhân' },
  { id: 'examinations', label: 'Khám soi CTC' },
  { id: 'doctors', label: 'Bác sĩ' },
  { id: 'templates', label: 'Kết quả mặc định' },
  { id: 'settings', label: 'Cấu hình' },
  { id: 'license', label: 'License' },
  { id: 'backup', label: 'Backup & Restore' }
];

const VIEW_RENDERERS = {
  daily: renderDaily,
  patients: renderPatients,
  examinations: renderExaminations,
  doctors: renderDoctors,
  templates: renderTemplates,
  settings: renderSettings,
  license: renderLicense,
  backup: renderBackup,
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
  navButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view');
      setState({ currentView: view });
      renderView(view, content);
      navButtons.forEach((b) => b.classList.toggle('active', b === btn));
    });
  });

  renderView(state.currentView, content);
}

function renderView(viewKey, container) {
  const renderer = VIEW_RENDERERS[viewKey] || renderDaily;
  const node = renderer(getState(), { navigate: (next) => setState({ currentView: next }) });
  container.innerHTML = '';
  container.appendChild(node);
}
