import { getConfig } from './configService.js';
import { ensureLicense, isLicenseValid } from './licenseService.js';

const FALLBACK_USER = {
  username: 'admin',
  password: '123',
  name: 'Quản trị viên',
  role: 'admin'
};

function sanitizeUser(raw = {}) {
  if (typeof raw !== 'object' || raw === null) return { ...FALLBACK_USER };
  const username = typeof raw.username === 'string' && raw.username.trim() ? raw.username.trim() : FALLBACK_USER.username;
  const password = typeof raw.password === 'string' && raw.password.trim() ? raw.password.trim() : FALLBACK_USER.password;
  const name =
    typeof raw.name === 'string' && raw.name.trim()
      ? raw.name.trim()
      : username || FALLBACK_USER.name;
  const role = raw.role || FALLBACK_USER.role;
  return { username, password, name, role };
}

function summarizeLicense(license) {
  const now = new Date();
  const expire = license?.ExpireAt ? new Date(license.ExpireAt) : null;
  const daysLeft = expire ? Math.max(0, Math.ceil((expire.getTime() - now.getTime()) / 86400000)) : 0;
  return {
    ...license,
    daysLeft,
    status: isLicenseValid(license) ? 'valid' : 'expired',
    licenseType: license?.LicenseType || license?.licenseType || 'trial'
  };
}

export function authenticate(username, password) {
  const config = getConfig();
  const expectedUser = sanitizeUser(config.authUser);

  const normalizedUsername = typeof username === 'string' ? username.trim() : '';
  const normalizedPassword = typeof password === 'string' ? password.trim() : '';

  if (normalizedUsername !== expectedUser.username || normalizedPassword !== expectedUser.password) {
    return null;
  }

  const license = summarizeLicense(ensureLicense());
  return {
    user: { username: expectedUser.username, name: expectedUser.name, role: expectedUser.role },
    license,
    config
  };
}

export function getLicenseSummary() {
  return summarizeLicense(ensureLicense());
}
