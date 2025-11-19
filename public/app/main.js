import { renderShell } from './shell.js';
import { resolveRoute } from './router.js';
import { createKhamBenhView } from './views/khamBenhView.js';
import { createChupAnhView } from './views/chupAnhView.js';
import { createTimPhieuKhamView } from './views/timPhieuKhamView.js';
import { createCauHinhView } from './views/cauHinhView.js';
import { createLicenseViewWrapper } from './views/licenseView.js';
import { createBackupView } from './views/backupView.js';
import { createGioiThieuView } from './views/gioiThieuView.js';

const STORAGE_KEYS = {
  token: 'auth.token',
  user: 'auth.user',
  license: 'auth.license',
  config: 'auth.config'
};

function readSession() {
  try {
    const token = window.sessionStorage.getItem(STORAGE_KEYS.token);
    const user = JSON.parse(window.sessionStorage.getItem(STORAGE_KEYS.user) || 'null');
    const license = JSON.parse(window.sessionStorage.getItem(STORAGE_KEYS.license) || 'null');
    const config = JSON.parse(window.sessionStorage.getItem(STORAGE_KEYS.config) || 'null');
    return { token, user, license, config };
  } catch (error) {
    console.warn('[spa] Không thể đọc session:', error);
    return {};
  }
}

function ensureSession() {
  const { token } = readSession();
  if (!token) {
    window.location.replace('/login');
    return false;
  }
  return true;
}

export function bootstrapSpa() {
  const root = document.getElementById('root');
  if (!root) return;
  if (!ensureSession()) return;

  const session = readSession();
  const appState = {
    token: session.token,
    user: session.user,
    license: session.license,
    settings: session.config,
    selectedImages: []
  };

  const navItems = [
    { id: 'kham-benh', label: 'Khám bệnh', path: '/kham-benh', factory: () => createKhamBenhView(appState) },
    { id: 'chup-anh', label: 'Chụp ảnh', path: '/chup-anh', factory: () => createChupAnhView(appState) },
    { id: 'tim-phieu-kham', label: 'Tìm phiếu khám', path: '/tim-phieu-kham', factory: () => createTimPhieuKhamView() },
    { id: 'cau-hinh', label: 'Cấu hình', path: '/cau-hinh', factory: () => createCauHinhView(appState) },
    { id: 'license', label: 'License', path: '/license', factory: () => createLicenseViewWrapper(appState) },
    { id: 'backup-restore', label: 'Backup & Restore', path: '/backup-restore', factory: () => createBackupView() },
    { id: 'gioi-thieu', label: 'Giới thiệu', path: '/gioi-thieu', factory: () => createGioiThieuView() }
  ];

  const viewRegistry = new Map(navItems.map((item) => [item.id, item.factory]));
  const initialViewId = resolveRoute(window.location.pathname);

  const shell = renderShell(root, initialViewId, navItems, (id) => mountView(id), appState);
  const content = shell.contentEl;
  let currentView = null;

  function mountView(viewId) {
    const factory = viewRegistry.get(viewId) || viewRegistry.get('kham-benh');
    if (!factory) return;
    if (currentView?.destroy) {
      currentView.destroy();
    }
    content.innerHTML = '';
    currentView = factory();
    if (currentView?.render) {
      currentView.render(content);
    }
  }

  function handleRouteChange() {
    if (!ensureSession()) return;
    const viewId = resolveRoute(window.location.pathname);
    mountView(viewId);
    shell.setActive(viewId);
  }

  window.addEventListener('spa:navigate', handleRouteChange);
  window.addEventListener('popstate', handleRouteChange);

  mountView(initialViewId);
}

if (typeof window !== 'undefined') {
  bootstrapSpa();
}
