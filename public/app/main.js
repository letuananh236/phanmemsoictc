import { renderShell } from './layouts/AppShell.js';
import { renderLoginPage } from './modules/auth/LoginPage.js';
import { setState, resetState } from './state.js';
import { applyTheme } from './theme.js';
import { api } from './api/client.js';

const STORAGE_KEYS = {
  token: 'auth.token',
  user: 'auth.user',
  license: 'auth.license',
  config: 'auth.config'
};

function parsePath(pathname) {
  if (pathname.startsWith('/kham-soi-ctc')) {
    const parts = pathname.split('/').filter(Boolean);
    const selectedExamId = parts[1] ? decodeURIComponent(parts[1]) : null;
    return { view: 'examinations', selectedExamId };
  }
  if (pathname === '/kham-benh') return { view: 'examinations' };
  if (pathname === '/chup-anh') return { view: 'camera' };
  if (pathname === '/tim-phieu-kham' || pathname === '/kham-trong-ngay') return { view: 'search' };
  if (pathname === '/cauhinh' || pathname === '/cau-hinh') return { view: 'settings' };
  if (pathname === '/license') return { view: 'license' };
  if (pathname === '/backup') return { view: 'backup' };
  if (pathname === '/gioi-thieu') return { view: 'about' };
  return { view: 'examinations' };
}

function persistAuth({ token, user, license, config }) {
  try {
    window.sessionStorage.setItem(STORAGE_KEYS.token, token);
    window.sessionStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user || {}));
    window.sessionStorage.setItem(STORAGE_KEYS.license, JSON.stringify(license || {}));
    window.sessionStorage.setItem(STORAGE_KEYS.config, JSON.stringify(config || {}));
  } catch (_) {
    /* ignore */
  }
}

function loadPersistedAuth() {
  try {
    const token = window.sessionStorage.getItem(STORAGE_KEYS.token);
    if (!token) return null;
    const user = JSON.parse(window.sessionStorage.getItem(STORAGE_KEYS.user) || '{}');
    const license = JSON.parse(window.sessionStorage.getItem(STORAGE_KEYS.license) || '{}');
    const config = JSON.parse(window.sessionStorage.getItem(STORAGE_KEYS.config) || '{}');
    return { token, user, license, config };
  } catch (_) {
    return null;
  }
}

function clearPersistedAuth() {
  try {
    Object.values(STORAGE_KEYS).forEach((k) => window.sessionStorage.removeItem(k));
  } catch (_) {
    /* ignore */
  }
}

function redirectTo(path) {
  if (window.location.pathname !== path) {
    window.history.replaceState({}, '', path);
  }
}

function showLogin(root) {
  resetState();
  clearPersistedAuth();
  api.setAuthToken(null);
  redirectTo('/login');
  if (root) root.innerHTML = '';
  renderLoginPage(root, {
    onAuthenticated: ({ user, license, config, token }) => {
      applyTheme(config);
      api.setAuthToken(token);
      persistAuth({ token, user, license, config });
      const parsed = parsePath(window.location.pathname);
      const nextView = license?.status === 'expired' ? 'license' : parsed.view;
      setState({
        user: { name: user.name || user.username || 'Người dùng' },
        clinic: { name: config?.hospitalName || 'PHÒNG KHÁM', dbPath: config?.databasePath || 'Data/Database/app.db' },
        license: {
          status: license?.status || 'valid',
          daysLeft: license?.daysLeft ?? 0,
          type: license?.licenseType || 'trial'
        },
        currentView: nextView,
        selectedExamId: parsed.selectedExamId || null,
        token
      });
      if (nextView === 'examinations' && parsed.selectedExamId) {
        redirectTo(`/kham-soi-ctc/${encodeURIComponent(parsed.selectedExamId)}`);
      } else {
        const fallbackPath =
          nextView === 'examinations'
            ? '/kham-benh'
            : nextView === 'search'
              ? '/tim-phieu-kham'
              : nextView === 'camera'
                ? '/chup-anh'
                : nextView === 'settings'
                  ? '/cau-hinh'
                  : nextView === 'backup'
                    ? '/backup'
                    : nextView === 'license'
                      ? '/license'
                      : nextView === 'about'
                        ? '/gioi-thieu'
                        : window.location.pathname;
        redirectTo(fallbackPath);
      }
      renderShell();
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root');
  api.onUnauthorized(() => {
    showLogin(root);
  });

  const restored = loadPersistedAuth();
  if (restored?.token && restored.user) {
    api.setAuthToken(restored.token);
    applyTheme(restored.config);
    const parsed = parsePath(window.location.pathname);
    const nextView = restored.license?.status === 'expired' ? 'license' : parsed.view;
    setState({
      user: { name: restored.user.name || restored.user.username || 'Người dùng' },
      clinic: { name: restored.config?.hospitalName || 'PHÒNG KHÁM', dbPath: restored.config?.databasePath || 'Data/Database/app.db' },
      license: {
        status: restored.license?.status || 'valid',
        daysLeft: restored.license?.daysLeft ?? 0,
        type: restored.license?.licenseType || 'trial'
      },
      currentView: nextView,
      selectedExamId: parsed.selectedExamId || null,
      token: restored.token
    });
    if (nextView === 'examinations' && parsed.selectedExamId) {
      redirectTo(`/kham-soi-ctc/${encodeURIComponent(parsed.selectedExamId)}`);
    } else {
      const fallbackPath =
        nextView === 'examinations'
          ? '/kham-benh'
          : nextView === 'search'
            ? '/tim-phieu-kham'
            : nextView === 'camera'
              ? '/chup-anh'
              : nextView === 'settings'
                ? '/cau-hinh'
                : nextView === 'backup'
                  ? '/backup'
                  : nextView === 'license'
                    ? '/license'
                    : nextView === 'about'
                      ? '/gioi-thieu'
                      : window.location.pathname;
      redirectTo(fallbackPath);
    }
    renderShell();
    return;
  }

  showLogin(root);
});
