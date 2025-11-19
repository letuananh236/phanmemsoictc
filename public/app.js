import { createExamFormView } from './exam-form.js';
import { createCaptureView } from './capture.js';
import { createExamSearchView } from './search-exam.js';
import { createSettingsView } from './settings.js';
import { createLicenseView } from './license-ui.js';
import { storage, showToast } from './storage.js';
import { aboutInfo } from './about.js';

const STORAGE_KEYS = {
  token: 'auth.token',
  user: 'auth.user'
};

const NAV_ITEMS = [
  { id: 'kham-benh', label: 'Khám bệnh (F3)', path: '/kham-benh', factory: (state) => createExamFormView(state) },
  { id: 'chup-anh', label: 'Chụp ảnh (F4)', path: '/chup-anh', factory: (state) => createCaptureView(state) },
  { id: 'tim-phieu-kham', label: 'Tìm phiếu khám', path: '/tim-phieu-kham', factory: () => createExamSearchView() },
  { id: 'cau-hinh', label: 'Cấu hình hệ thống', path: '/cau-hinh', factory: (state) => createSettingsView(state) },
  { id: 'license', label: 'License', path: '/license', factory: (state) => createLicenseView(state) },
  { id: 'backup-restore', label: 'Backup & Restore', path: '/backup-restore', factory: () => createBackupRestoreView() },
  { id: 'gioi-thieu', label: 'Giới thiệu phần mềm', path: '/gioi-thieu', factory: () => createAboutView() }
];

const ROUTE_ALIASES = new Map([
  ['/cauhinh', '/cau-hinh'],
  ['/backup', '/backup-restore'],
  ['/backuprestore', '/backup-restore'],
  ['/kham-soi-ctc', '/kham-benh']
]);

const PATH_TO_ID = new Map(NAV_ITEMS.map((item) => [item.path, item.id]));
const ID_TO_PATH = new Map(NAV_ITEMS.map((item) => [item.id, item.path]));
const DEFAULT_ROUTE = '/kham-benh';

const viewCache = new Map();
const appState = {
  settings: null,
  license: null,
  selectedImages: [],
  user: null
};

let shellInitialized = false;

function normalizePath(pathname = '/') {
  if (!pathname) return '/';
  const normalized = pathname.replace(/\/+$/, '') || '/';
  if (normalized === '') return '/';
  return normalized;
}

function resolveRoute(pathname = '/') {
  const normalized = normalizePath(pathname);
  if (normalized === '/' || normalized === '/login') {
    return normalized;
  }
  const alias = ROUTE_ALIASES.get(normalized);
  const target = alias || normalized;
  if (PATH_TO_ID.has(target)) {
    return target;
  }
  return DEFAULT_ROUTE;
}

function isProtectedRoute(pathname) {
  const normalized = normalizePath(pathname);
  return PATH_TO_ID.has(normalized);
}

function hasSession() {
  try {
    return Boolean(window.sessionStorage.getItem(STORAGE_KEYS.token));
  } catch (error) {
    console.warn('[app] Không thể đọc sessionStorage:', error);
    return false;
  }
}

function readSessionUser() {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEYS.user);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('[app] Không thể parse thông tin người dùng:', error);
    return null;
  }
}

function mountShell() {
  if (shellInitialized) {
    return;
  }
  const loginRoot = document.getElementById('login-root');
  if (loginRoot) {
    loginRoot.style.display = 'none';
  }
  const root = document.getElementById('root');
  if (!root) return;
  root.style.display = '';
  root.innerHTML = `
    <div class="app-shell">
      <header class="app-header">
        <div class="app-title">PHẦN MỀM SOI CỔ TỬ CUNG</div>
        <div class="app-header-meta">
          <span class="clinic-name" id="clinic-name">Đang tải cấu hình…</span>
          <span class="user-chip" id="user-chip"></span>
          <span class="license-pill" id="license-pill">Đang kiểm tra license…</span>
        </div>
      </header>
      <div class="app-body">
        <aside class="sidebar">
          <nav>
            <ul class="nav-list" id="nav-list"></ul>
          </nav>
        </aside>
        <main class="app-content" id="app-content">
          <div class="panel"><p>Đang tải dữ liệu…</p></div>
        </main>
      </div>
      <footer class="app-footer">
        <div class="footer-meta">Phiên bản ${window.APP_VERSION || ''}</div>
        <div class="footer-meta">© ${new Date().getFullYear()} Phần mềm soi cổ tử cung</div>
      </footer>
    </div>
    <div id="toast" class="toast hidden"></div>
  `;

  const navList = document.getElementById('nav-list');
  NAV_ITEMS.forEach((item) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = item.label;
    button.className = 'nav-item';
    button.dataset.viewId = item.id;
    button.addEventListener('click', () => navigate(item.path));
    li.appendChild(button);
    navList.appendChild(li);
  });
  shellInitialized = true;
}

function updateHeaderMeta() {
  const clinicLabel = document.getElementById('clinic-name');
  const userChip = document.getElementById('user-chip');
  const licensePill = document.getElementById('license-pill');
  if (clinicLabel) {
    clinicLabel.textContent = appState.settings?.hospitalName || 'Chưa cấu hình';
  }
  if (userChip) {
    userChip.textContent = appState.user?.fullName || appState.user?.username || 'Người dùng';
  }
  if (licensePill) {
    const license = appState.license;
    if (!license) {
      licensePill.textContent = 'Không có thông tin license';
      return;
    }
    const expireDate = license.expireDate || license.ExpireAt;
    let days = license.daysLeft;
    if (typeof days !== 'number' && expireDate) {
      const expire = new Date(expireDate);
      days = Math.max(0, Math.ceil((expire.getTime() - Date.now()) / 86400000));
    }
    licensePill.textContent = `${(license.licenseType || license.type || 'TRIAL').toUpperCase()} – còn ${days ?? '??'} ngày`;
    if (days !== undefined && days <= 15) {
      licensePill.classList.add('pill-warning');
    } else {
      licensePill.classList.remove('pill-warning');
    }
  }
}

async function hydrateAppState() {
  const [settings, license] = await Promise.all([
    storage.getSettings().catch(() => null),
    storage.getLicense().catch(() => null)
  ]);
  if (settings) {
    appState.settings = settings;
  }
  if (license?.license) {
    appState.license = license.license;
  } else if (license) {
    appState.license = license;
  }
  appState.user = readSessionUser();
  updateHeaderMeta();
}

function getViewInstance(viewId) {
  if (!viewCache.has(viewId)) {
    const nav = NAV_ITEMS.find((item) => item.id === viewId);
    if (!nav) return null;
    viewCache.set(viewId, nav.factory(appState));
  }
  return viewCache.get(viewId);
}

function setActiveNav(viewId) {
  document.querySelectorAll('.nav-item').forEach((button) => {
    if (button.dataset.viewId === viewId) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });
}

function renderRoute(path) {
  const normalized = resolveRoute(path);
  const viewId = PATH_TO_ID.get(normalized) || PATH_TO_ID.get(DEFAULT_ROUTE);
  const view = getViewInstance(viewId);
  const content = document.getElementById('app-content');
  if (!view || !content) return;
  content.innerHTML = '';
  view.render(content);
  setActiveNav(viewId);
}

function navigate(path) {
  const target = resolveRoute(path);
  if (!isProtectedRoute(target)) return;
  if (window.location.pathname !== target) {
    window.history.pushState({}, '', target);
  }
  renderRoute(target);
}

function bindShortcuts() {
  window.addEventListener('keydown', (event) => {
    if (event.key === 'F3') {
      event.preventDefault();
      navigate('/kham-benh');
    }
    if (event.key === 'F4') {
      event.preventDefault();
      navigate('/chup-anh');
    }
  });
}

function createBackupRestoreView() {
  return {
    render(target) {
      const wrapper = document.createElement('section');
      wrapper.className = 'card backup-view';
      wrapper.innerHTML = `
        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>SAO LƯU DỮ LIỆU</h3>
              <p class="muted">Tạo file .zip chứa CSDL + ảnh ngay trên máy tính.</p>
            </div>
            <button type="button" class="btn primary" id="backup-create">TẠO FILE BACKUP</button>
          </div>
          <div class="summary-block small">File backup được lưu trong thư mục tải xuống của trình duyệt. Hãy sao chép sang USB an toàn.</div>
        </div>
        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>PHỤC HỒI DỮ LIỆU</h3>
              <p class="muted">Chọn file backup (.zip) để ghi đè dữ liệu hiện tại.</p>
            </div>
          </div>
          <div class="actions-row">
            <input type="file" id="backup-file" accept=".zip" />
            <button type="button" class="btn secondary" id="backup-restore">PHỤC HỒI</button>
          </div>
          <p class="hint">Lưu ý: thao tác này sẽ ghi đè toàn bộ dữ liệu hiện có. Sao lưu trước khi phục hồi.</p>
        </div>
      `;
      target.appendChild(wrapper);

      const backupBtn = wrapper.querySelector('#backup-create');
      backupBtn.addEventListener('click', async () => {
        backupBtn.disabled = true;
        backupBtn.textContent = 'Đang tạo...';
        try {
          const blob = await storage.downloadBackup();
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `backup_${new Date().toISOString().slice(0, 10)}.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          showToast('Đã tạo file backup');
        } catch (error) {
          console.error('Không thể tạo backup:', error);
          showToast('Không thể tạo backup. Vui lòng thử lại.');
        } finally {
          backupBtn.disabled = false;
          backupBtn.textContent = 'TẠO FILE BACKUP';
        }
      });

      const restoreBtn = wrapper.querySelector('#backup-restore');
      const fileInput = wrapper.querySelector('#backup-file');
      restoreBtn.addEventListener('click', async () => {
        if (!fileInput.files || fileInput.files.length === 0) {
          showToast('Vui lòng chọn file backup (.zip)');
          return;
        }
        const confirmRestore = window.confirm('Khôi phục sẽ ghi đè dữ liệu hiện tại. Bạn có chắc chắn?');
        if (!confirmRestore) return;
        restoreBtn.disabled = true;
        restoreBtn.textContent = 'Đang phục hồi...';
        try {
          await storage.restoreBackup(fileInput.files[0]);
          showToast('Đã phục hồi dữ liệu. Khởi động lại ứng dụng nếu cần.');
        } catch (error) {
          console.error('Không thể phục hồi backup:', error);
          showToast('Không thể phục hồi backup.');
        } finally {
          restoreBtn.disabled = false;
          restoreBtn.textContent = 'PHỤC HỒI';
          fileInput.value = '';
        }
      });
    }
  };
}

function createAboutView() {
  const info = window.APP_ABOUT_INFO || aboutInfo;
  return {
    render(target) {
      const wrapper = document.createElement('section');
      wrapper.className = 'card about-view';
      wrapper.innerHTML = `
        <h3>${info.appName}</h3>
        <p><strong>Phiên bản:</strong> ${info.version}</p>
        <p><strong>Mô tả:</strong> ${info.description}</p>
        <p><strong>Liên hệ:</strong> ${info.support?.email || ''} • ${info.support?.phone || ''}</p>
        <p>${info.copyright}</p>
        <ul>
          ${(info.notes || []).map((note) => `<li>${note}</li>`).join('')}
        </ul>
      `;
      target.appendChild(wrapper);
    }
  };
}

function handleCustomNavigation(event) {
  const detail = event.detail || {};
  let viewId = detail.view;
  if (!viewId) return;
  if (ID_TO_PATH.has(viewId)) {
    navigate(ID_TO_PATH.get(viewId));
    return;
  }
  if (viewId === 'capture') {
    navigate('/chup-anh');
  } else if (viewId === 'exam') {
    navigate('/kham-benh');
  }
}

async function bootstrap() {
  const initialPath = resolveRoute(window.location.pathname);
  if (!isProtectedRoute(initialPath)) {
    return;
  }
  if (!hasSession()) {
    window.location.replace('/login');
    return;
  }
  mountShell();
  bindShortcuts();
  document.addEventListener('navigate', handleCustomNavigation);
  await hydrateAppState();
  renderRoute(initialPath);
  window.addEventListener('popstate', () => {
    const next = resolveRoute(window.location.pathname);
    if (!isProtectedRoute(next)) {
      window.location.replace('/kham-benh');
      return;
    }
    renderRoute(next);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
