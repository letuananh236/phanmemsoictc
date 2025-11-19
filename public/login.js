const APP_VERSION = window.APP_VERSION || 'v1.2.2';
const SPA_ENTRY = `./app.js?v=${APP_VERSION}`;
const LOGIN_PATHS = new Set(['/', '/login']);
const SPA_PATHS = [
  '/kham-benh',
  '/chup-anh',
  '/tim-phieu-kham',
  '/cau-hinh',
  '/cauhinh',
  '/license',
  '/backup',
  '/backup-restore',
  '/gioi-thieu'
];
const STORAGE_KEYS = {
  token: 'auth.token',
  user: 'auth.user',
  license: 'auth.license',
  config: 'auth.config'
};

function getPathname() {
  const path = window.location.pathname || '/';
  if (path !== '/' && path.endsWith('/')) {
    return path.replace(/\/+$/, '') || '/';
  }
  return path;
}

function hasSession() {
  try {
    return Boolean(window.sessionStorage.getItem(STORAGE_KEYS.token));
  } catch (error) {
    console.warn('[login] Không thể đọc sessionStorage:', error);
    return false;
  }
}

function persistAuth({ token, user, license, config }) {
  try {
    if (token) {
      window.sessionStorage.setItem(STORAGE_KEYS.token, token);
    } else {
      window.sessionStorage.removeItem(STORAGE_KEYS.token);
    }
    window.sessionStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user || {}));
    window.sessionStorage.setItem(STORAGE_KEYS.license, JSON.stringify(license || {}));
    window.sessionStorage.setItem(STORAGE_KEYS.config, JSON.stringify(config || {}));
  } catch (error) {
    console.warn('[login] Không thể lưu thông tin phiên:', error);
  }
}

function clearAuth() {
  Object.values(STORAGE_KEYS).forEach((key) => {
    try {
      window.sessionStorage.removeItem(key);
    } catch (_) {
      /* ignore */
    }
  });
}

function setRootVisibility({ showLogin }) {
  const loginRoot = document.getElementById('login-root');
  const appRoot = document.getElementById('root');
  if (loginRoot) {
    loginRoot.style.display = showLogin ? '' : 'none';
  }
  if (appRoot) {
    appRoot.style.display = showLogin ? 'none' : '';
  }
}

async function loadSpa() {
  if (window.__SPA_LOADED__) {
    return;
  }
  window.__SPA_LOADED__ = true;
  await import(SPA_ENTRY);
}

function requestJson(url, options = {}) {
  return fetch(url, options).then(async (res) => {
    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const body = isJson ? await res.json().catch(() => ({})) : await res.text();
    if (!res.ok) {
      const error = new Error(body?.error || body?.message || 'Yêu cầu không thành công');
      error.status = res.status;
      error.body = body;
      throw error;
    }
    return body;
  });
}

function formatLicenseChip(info) {
  if (!info) return 'Chưa có thông tin license';
  const expireDate = info.ExpireAt || info.expireDate || info.expire_at;
  let daysLeft = info.daysLeft;
  if (typeof daysLeft !== 'number' && expireDate) {
    const expire = new Date(expireDate);
    daysLeft = Math.max(0, Math.ceil((expire.getTime() - Date.now()) / 86400000));
  }
  const type = info.licenseType || info.LicenseType || info.type || 'trial';
  const status = info.status || (daysLeft === 0 ? 'expired' : 'valid');
  return `${type.toUpperCase()} – ${daysLeft ?? 0} ngày (${status === 'expired' ? 'hết hạn' : 'còn hạn'})`;
}

async function hydrateLoginMetadata() {
  const chip = document.getElementById('license-chip');
  const logoSlot = document.getElementById('login-logo-slot');
  try {
    const license = await requestJson('/license');
    if (chip) {
      chip.textContent = formatLicenseChip(license?.license);
      if (license?.license?.status === 'expired') {
        chip.classList.add('chip-warning');
      }
    }
  } catch (_) {
    if (chip) chip.textContent = 'Không thể tải trạng thái license';
  }
  try {
    const config = await requestJson('/system-config');
    if (logoSlot && config?.logoFileName) {
      logoSlot.innerHTML = `<img src="/assets/${config.logoFileName}" alt="Logo" loading="lazy" />`;
    }
  } catch (_) {
    /* ignore logo errors */
  }
}

function renderLogin() {
  const root = document.getElementById('login-root');
  if (!root) return;
  root.innerHTML = `
    <div class="login-page">
      <div class="login-card">
        <div class="login-heading">
          <div class="login-title">PHẦN MỀM SOI CỔ TỬ CUNG</div>
          <div class="login-logo" id="login-logo-slot"></div>
        </div>
        <form id="login-form" class="login-form" autocomplete="on">
          <label class="login-field">
            <span>Tên đăng nhập</span>
            <input type="text" id="login-username" name="username" autocomplete="username" required placeholder="Nhập tên đăng nhập" />
          </label>
          <label class="login-field">
            <span>Mật khẩu</span>
            <input type="password" id="login-password" name="password" autocomplete="current-password" required placeholder="••••••" />
          </label>
          <label class="remember-row">
            <input type="checkbox" id="login-remember" checked />
            <span>Ghi nhớ đăng nhập trên máy này</span>
          </label>
          <div id="login-error" class="error-banner" style="display: none"></div>
          <button type="submit" class="btn primary login-button" id="login-submit">ĐĂNG NHẬP</button>
        </form>
        <div class="login-footer">
          <div class="muted">Phiên bản: ${APP_VERSION}</div>
          <div class="license-chip" id="license-chip">Đang kiểm tra license…</div>
        </div>
      </div>
    </div>
  `;
  hydrateLoginMetadata();
  const usernameInput = document.getElementById('login-username');
  const remember = document.getElementById('login-remember');
  try {
    const savedUser = window.localStorage.getItem('login.username');
    if (savedUser && usernameInput) {
      usernameInput.value = savedUser;
    }
  } catch (_) {
    /* ignore */
  }
  if (usernameInput) {
    usernameInput.focus();
    usernameInput.select();
  }
  const form = document.getElementById('login-form');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      handleLoginSubmit({
        usernameInput,
        rememberCheckbox: remember,
        passwordInput: document.getElementById('login-password')
      });
    });
  }
}

function setErrorMessage(message) {
  const errorBox = document.getElementById('login-error');
  if (!errorBox) return;
  if (!message) {
    errorBox.style.display = 'none';
    errorBox.textContent = '';
    return;
  }
  errorBox.style.display = 'block';
  errorBox.textContent = message;
}

function setLoadingState(isLoading) {
  const submit = document.getElementById('login-submit');
  if (!submit) return;
  submit.disabled = isLoading;
  submit.textContent = isLoading ? 'Đang đăng nhập…' : 'ĐĂNG NHẬP';
}

async function handleLoginSubmit({ usernameInput, passwordInput, rememberCheckbox }) {
  if (!usernameInput || !passwordInput || !rememberCheckbox) return;
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  if (!username || !password) {
    setErrorMessage('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
    return;
  }
  setErrorMessage('');
  setLoadingState(true);
  try {
    const payload = await requestJson('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, remember: rememberCheckbox.checked })
    });
    persistAuth({ token: payload.token, user: payload.user, license: payload.license, config: payload.config });
    if (rememberCheckbox.checked) {
      try {
        window.localStorage.setItem('login.username', username);
      } catch (_) {
        /* ignore */
      }
    } else {
      try {
        window.localStorage.removeItem('login.username');
      } catch (_) {
        /* ignore */
      }
    }
    window.location.assign('/kham-benh');
  } catch (error) {
    const code = error?.body?.error;
    if (error.status === 403 && code === 'LICENSE_EXPIRED') {
      persistAuth({ token: '', user: error.body?.user || { username }, license: error.body?.license, config: error.body?.config });
      setErrorMessage('Bản quyền đã hết hạn. Vui lòng liên hệ để gia hạn.');
      window.location.assign('/license');
      return;
    }
    if (error.status === 403 && code === 'USER_INACTIVE') {
      setErrorMessage('Tài khoản này đang bị khóa. Liên hệ quản trị.');
      return;
    }
    if (error.status === 401 && code === 'INVALID_CREDENTIALS') {
      setErrorMessage('Tên đăng nhập hoặc mật khẩu không đúng.');
      return;
    }
    if (!error.status) {
      setErrorMessage('Không thể kết nối tới máy chủ. Vui lòng kiểm tra server.');
      return;
    }
    setErrorMessage('Lỗi hệ thống. Vui lòng thử lại hoặc liên hệ hỗ trợ.');
  } finally {
    setLoadingState(false);
  }
}

function isSpaRoute(path) {
  if (path.startsWith('/kham-soi-ctc')) return true;
  return SPA_PATHS.includes(path);
}

function normalizeLoginPath(path) {
  if (path === '/') {
    window.history.replaceState({}, '', '/login');
    return '/login';
  }
  if (path === '/login/') {
    window.history.replaceState({}, '', '/login');
    return '/login';
  }
  return path;
}

async function bootstrap() {
  let path = normalizeLoginPath(getPathname());
  const authenticated = hasSession();
  if (isSpaRoute(path)) {
    if (!authenticated) {
      clearAuth();
      window.location.replace('/login');
      return;
    }
    setRootVisibility({ showLogin: false });
    await loadSpa();
    return;
  }

  if (LOGIN_PATHS.has(path)) {
    if (authenticated) {
      window.location.replace('/kham-benh');
      return;
    }
    setRootVisibility({ showLogin: true });
    renderLogin();
    return;
  }

  // Unknown route → force login
  window.location.replace('/login');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
