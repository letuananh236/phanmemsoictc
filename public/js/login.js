import { storage } from './storage.js';

const DEFAULT_USER = { username: 'admin', password: '123456@', role: 'admin' };

export function initLogin({ onSuccess }) {
  const modal = document.getElementById('login-modal');
  modal.classList.add('login-modal');
  modal.classList.remove('hidden');
  const template = document.getElementById('tpl-login-modal');
  if (template?.content) {
    modal.innerHTML = '';
    modal.appendChild(template.content.cloneNode(true));
  } else {
    modal.innerHTML = `
      <div class="modal-card">
        <h2>Đăng nhập</h2>
        <form id="login-form">
          <div class="form-row">
            <label for="username">Tên truy cập</label>
            <input id="username" name="username" required />
          </div>
          <div class="form-row">
            <label for="password">Mật khẩu</label>
            <input id="password" type="password" name="password" required />
          </div>
          <div class="form-row inline-fields">
            <label class="checkbox-label" for="remember">
              <input type="checkbox" id="remember" />
              <span class="checkbox-text">Lưu thông tin đăng nhập</span>
            </label>
          </div>
          <p class="version-text" id="app-version">Phiên bản: ...</p>
          <div class="toolbar">
            <button type="submit">Đăng nhập</button>
            <button type="button" class="secondary" id="login-exit">Thoát</button>
          </div>
        </form>
      </div>
    `;
  }

  const form = modal.querySelector('#login-form');
  const usernameInput = modal.querySelector('#username');
  const passwordInput = modal.querySelector('#password');
  const rememberCheckbox = modal.querySelector('#remember');
  const savedCredentials = localStorage.getItem('pm_credentials');
  if (savedCredentials) {
    try {
      const parsed = JSON.parse(savedCredentials);
      usernameInput.value = parsed.username || '';
      passwordInput.value = parsed.password || '';
      rememberCheckbox.checked = true;
    } catch (error) {
      console.error('Cannot read saved credentials', error);
    }
  }

  modal.querySelector('#login-exit').addEventListener('click', () => {
    window.close();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    try {
      const result = await storage.login({ username, password });
      if (result?.success) {
        if (rememberCheckbox.checked) {
          localStorage.setItem('pm_credentials', JSON.stringify({ username, password }));
        } else {
          localStorage.removeItem('pm_credentials');
        }
        modal.classList.add('hidden');
        onSuccess({ username: result.username, role: result.role || 'user' });
        return;
      }
    } catch (error) {
      const message = `${error?.message || ''}`;
      if (message.includes('invalid_credentials')) {
        alert('Sai tên truy cập hoặc mật khẩu');
        return;
      }
      console.error('Login failed, trying fallback', error);
    }

    if (username === DEFAULT_USER.username && password === DEFAULT_USER.password) {
      if (rememberCheckbox.checked) {
        localStorage.setItem('pm_credentials', JSON.stringify({ username, password }));
      } else {
        localStorage.removeItem('pm_credentials');
      }
      modal.classList.add('hidden');
      onSuccess({ username: DEFAULT_USER.username, role: DEFAULT_USER.role });
    } else {
      alert('Sai tên truy cập hoặc mật khẩu');
    }
  });

  fetch('/api/meta')
    .then((res) => res.json())
    .then((meta) => {
      const label = modal.querySelector('#app-version');
      if (label && meta?.version) {
        label.textContent = `Phiên bản: ${meta.version}`;
      }
    })
    .catch(() => {
      const label = modal.querySelector('#app-version');
      if (label) label.textContent = 'Phiên bản: --';
    });
}
