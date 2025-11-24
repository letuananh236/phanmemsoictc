const DEFAULT_USER = { username: 'admin', password: '123' };

export function initLogin({ onSuccess }) {
  const modal = document.getElementById('login-modal');
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
        <div class="form-row">
          <label>
            <input type="checkbox" id="remember" /> Lưu tên truy cập
          </label>
        </div>
        <div class="toolbar">
          <button type="submit">Đăng nhập</button>
          <button type="button" class="secondary" id="login-exit">Thoát</button>
        </div>
      </form>
    </div>
  `;

  const form = modal.querySelector('#login-form');
  const usernameInput = modal.querySelector('#username');
  const rememberCheckbox = modal.querySelector('#remember');
  const savedUser = localStorage.getItem('pm_username');
  if (savedUser) {
    usernameInput.value = savedUser;
    rememberCheckbox.checked = true;
  }

  modal.querySelector('#login-exit').addEventListener('click', () => {
    window.close();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const username = usernameInput.value.trim();
    const password = modal.querySelector('#password').value.trim();
    if (username === DEFAULT_USER.username && password === DEFAULT_USER.password) {
      if (rememberCheckbox.checked) {
        localStorage.setItem('pm_username', username);
      } else {
        localStorage.removeItem('pm_username');
      }
      modal.classList.add('hidden');
      onSuccess({ username });
    } else {
      alert('Sai tên truy cập hoặc mật khẩu');
    }
  });
}
