const DEFAULT_USER = { username: 'admin', password: '123' };

export function initLogin({ onSuccess }) {
  const modal = document.getElementById('login-modal');
  modal.classList.add('login-modal');
  modal.classList.remove('hidden');
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
          <label class="checkbox-label">
            <input type="checkbox" id="remember" /> Lưu thông tin đăng nhập
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

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    if (username === DEFAULT_USER.username && password === DEFAULT_USER.password) {
      if (rememberCheckbox.checked) {
        localStorage.setItem('pm_credentials', JSON.stringify({ username, password }));
      } else {
        localStorage.removeItem('pm_credentials');
      }
      modal.classList.add('hidden');
      onSuccess({ username });
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
