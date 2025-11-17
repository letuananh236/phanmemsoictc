import { React, ReactDOM } from '../../../vendor/react-lite.js';
import { api } from '../../api/client.js';

const { createElement: h, useState, useEffect } = React;

function summarizeLicense(license) {
  if (!license) return { status: 'expired', daysLeft: 0, licenseType: 'trial' };
  const expire = license.ExpireAt ? new Date(license.ExpireAt) : null;
  const now = new Date();
  const daysLeft = expire ? Math.max(0, Math.ceil((expire.getTime() - now.getTime()) / 86400000)) : 0;
  return {
    ...license,
    status: license.status || (expire && expire < now ? 'expired' : 'valid'),
    daysLeft,
    licenseType: license.licenseType || license.LicenseType || 'trial'
  };
}

function Logo({ src, alt }) {
  if (!src) return null;
  return h('div', { className: 'login-logo' }, h('img', { src, alt, loading: 'lazy' }));
}

function FooterStatus({ license }) {
  const info = summarizeLicense(license);
  const label = info.licenseType === 'trial' ? 'Trial' : info.licenseType;
  return h(
    'div',
    { className: 'login-footer' },
    h('div', { className: 'muted' }, `Phiên bản: ${window.APP_VERSION || 'v1.0.0'}`),
    h('div', { className: `license-chip ${info.status === 'expired' ? 'chip-warning' : ''}` }, `${label} – còn ${info.daysLeft} ngày`)
  );
}

function LoginForm({ onAuthenticated }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [license, setLicense] = useState(null);
  const [logo, setLogo] = useState('');

  useEffect(() => {
    api
      .getLicense()
      .then((res) => setLicense(res.license))
      .catch(() => {});
    api
      .getConfig()
      .then((cfg) => setLogo(cfg.logoFileName ? `/assets/${cfg.logoFileName}` : ''))
      .catch(() => {});
    try {
      const savedUser = window.localStorage.getItem('login.username');
      if (savedUser) setUsername(savedUser);
    } catch (_) {
      /* ignore */
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    try {
      const payload = await api.login({ username: trimmedUsername, password: trimmedPassword, remember });
      const licenseInfo = summarizeLicense(payload.license);
      if (remember) {
        try {
          window.localStorage.setItem('login.username', trimmedUsername);
        } catch (_) {
          /* ignore */
        }
      }
      onAuthenticated({
        user: payload.user,
        license: licenseInfo,
        config: payload.config
      });
    } catch (err) {
      const code = err.body?.error;
      if (err.status === 403 && code === 'LICENSE_EXPIRED') {
        const licenseInfo = summarizeLicense(err.body.license);
        setError('Bản quyền đã hết hạn. Vui lòng liên hệ để gia hạn.');
        onAuthenticated({
          user: err.body.user || { username: trimmedUsername, name: trimmedUsername },
          license: licenseInfo,
          config: err.body.config || {}
        });
        return;
      }
      if (err.status === 403 && code === 'USER_INACTIVE') {
        setError('Tài khoản này đang bị khóa. Liên hệ quản trị.');
        return;
      }
      if (err.status === 401 && code === 'INVALID_CREDENTIALS') {
        setError('Tên đăng nhập hoặc mật khẩu không đúng.');
        return;
      }
      setError('Lỗi hệ thống. Vui lòng thử lại hoặc liên hệ hỗ trợ.');
    } finally {
      setLoading(false);
    }
  };

  return h(
    'div',
    { className: 'login-page' },
    h(
      'div',
      { className: 'login-card' },
      h('div', { className: 'login-heading' },
        h('div', { className: 'login-title' }, 'PHẦN MỀM SOI CỔ TỬ CUNG'),
        Logo({ src: logo, alt: 'Logo' })
      ),
      h(
        'form',
        { className: 'login-form', onSubmit: handleSubmit },
        h('label', { className: 'login-field' },
          h('span', null, 'Tên đăng nhập'),
          h('input', {
            type: 'text',
            value: username,
            name: 'username',
            'data-focus-id': 'username',
            autocomplete: 'username',
            placeholder: 'Nhập tên đăng nhập',
            required: true,
            oninput: (e) => setUsername(e.target.value)
          })
        ),
        h('label', { className: 'login-field' },
          h('span', null, 'Mật khẩu'),
          h('input', {
            type: 'password',
            value: password,
            name: 'password',
            'data-focus-id': 'password',
            autocomplete: 'current-password',
            placeholder: '••••••',
            required: true,
            oninput: (e) => setPassword(e.target.value)
          })
        ),
        h(
          'label',
          { className: 'remember-row' },
          h('input', {
            type: 'checkbox',
            checked: remember,
            onchange: (e) => setRemember(e.target.checked)
          }),
          h('span', null, 'Ghi nhớ đăng nhập trên máy này')
        ),
        error ? h('div', { className: 'error-banner' }, error) : null,
        h('button', { className: 'btn primary login-button', type: 'submit', disabled: loading }, loading ? 'Đang đăng nhập…' : 'ĐĂNG NHẬP')
      ),
      FooterStatus({ license })
    )
  );
}

export function renderLoginPage(rootEl, { onAuthenticated }) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(h(LoginForm, { onAuthenticated }));
  return { unmount: () => root.unmount() };
}
