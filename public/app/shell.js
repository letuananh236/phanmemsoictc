import { navigate, pathForView } from './router.js';

const STORAGE_KEYS = {
  token: 'auth.token',
  user: 'auth.user'
};

function clearSession() {
  Object.values(STORAGE_KEYS).forEach((key) => {
    try {
      window.sessionStorage.removeItem(key);
    } catch (_) {
      /* ignore */
    }
  });
}

export function renderShell(root, initialViewId, navItems, loadView, appState) {
  root.innerHTML = '';
  root.style.display = '';

  const shell = document.createElement('div');
  shell.className = 'app-shell';

  const header = document.createElement('header');
  header.className = 'app-header';
  const title = document.createElement('div');
  title.className = 'app-title';
  title.textContent = 'PHẦN MỀM SOI CỔ TỬ CUNG';
  const meta = document.createElement('div');
  meta.className = 'app-meta';
  const facility = appState?.settings?.hospitalName || 'Cơ sở khám';
  const user = appState?.user?.fullName || appState?.user?.username || 'Người dùng';
  meta.textContent = `${facility} • ${user}`;
  const logoutBtn = document.createElement('button');
  logoutBtn.className = 'btn btn-secondary btn-sm';
  logoutBtn.type = 'button';
  logoutBtn.textContent = 'Đăng xuất';
  logoutBtn.addEventListener('click', () => {
    clearSession();
    window.location.assign('/login');
  });
  header.append(title, meta, logoutBtn);

  const body = document.createElement('div');
  body.className = 'app-body';

  const sidebar = document.createElement('aside');
  sidebar.className = 'app-sidebar';
  const navList = document.createElement('ul');
  navList.className = 'app-nav';
  navItems.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'app-nav-item';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'app-nav-btn';
    button.dataset.viewId = item.id;
    button.dataset.path = item.path;
    button.textContent = item.label;
    button.addEventListener('click', () => {
      const targetPath = pathForView(item.id);
      navigate(targetPath);
      loadView(item.id);
      setActive(item.id);
    });
    li.appendChild(button);
    navList.appendChild(li);
  });
  sidebar.appendChild(navList);

  const content = document.createElement('main');
  content.className = 'app-content';
  content.id = 'app-content';

  body.append(sidebar, content);
  shell.append(header, body);
  root.appendChild(shell);

  function setActive(id) {
    const buttons = navList.querySelectorAll('.app-nav-btn');
    buttons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.viewId === id);
    });
  }

  setActive(initialViewId);

  return { contentEl: content, setActive };
}
