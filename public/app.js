const APP_VERSION = window.APP_VERSION || 'v1.2.2';
const MAIN_ENTRY = `./app/main.js?v=${APP_VERSION}`;
const STORAGE_KEYS = {
  token: 'auth.token',
  user: 'auth.user'
};
const SPA_PATHS = new Set(['/kham-benh', '/chup-anh', '/tim-phieu-kham', '/cau-hinh', '/cauhinh', '/license', '/backup', '/backup-restore', '/gioi-thieu']);

function hasSession() {
  try {
    return Boolean(window.sessionStorage.getItem(STORAGE_KEYS.token) && window.sessionStorage.getItem(STORAGE_KEYS.user));
  } catch (error) {
    console.warn('[app] Không thể đọc sessionStorage:', error);
    return false;
  }
}

function normalizeSpaPath(path) {
  if (path.startsWith('/kham-soi-ctc')) {
    return path;
  }
  if (SPA_PATHS.has(path)) {
    if (path === '/cauhinh') return '/cau-hinh';
    if (path === '/backup-restore') return '/backup';
    return path;
  }
  return '/kham-benh';
}

function redirectToLogin() {
  if (window.location.pathname !== '/login') {
    window.location.replace('/login');
  }
}

async function bootstrapSpa() {
  if (window.__APP_BOOTSTRAPPED__) {
    return;
  }
  window.__APP_BOOTSTRAPPED__ = true;
  const path = window.location.pathname || '/';
  if (path === '/' || path === '/login') {
    redirectToLogin();
    return;
  }
  if (!hasSession()) {
    redirectToLogin();
    return;
  }
  const targetPath = normalizeSpaPath(path);
  if (targetPath !== path) {
    window.history.replaceState({}, '', targetPath);
  }
  await import(MAIN_ENTRY);
  if (document.readyState !== 'loading') {
    window.dispatchEvent(new Event('DOMContentLoaded'));
  }
}

bootstrapSpa();
