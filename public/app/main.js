import { renderShell } from './layouts/AppShell.js';
import { renderLoginPage } from './modules/auth/LoginPage.js';
import { setState } from './state.js';
import { applyTheme } from './theme.js';

window.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root');
  const login = renderLoginPage(root, {
    onAuthenticated: ({ user, license, config }) => {
      login.unmount();
      applyTheme(config);
      setState({
        user: { name: user.name || user.username || 'Người dùng' },
        clinic: { name: config?.hospitalName || 'PHÒNG KHÁM', dbPath: config?.databasePath || 'Data/Database/app.db' },
        license: {
          status: license?.status || 'valid',
          daysLeft: license?.daysLeft ?? 0,
          type: license?.licenseType || 'trial'
        },
        currentView: license?.status === 'expired' ? 'license' : 'daily'
      });
      renderShell();
    }
  });
});
