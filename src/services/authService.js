import { getConfig } from './configService.js';
import { ensureLicense, isLicenseValid } from './licenseService.js';

const FALLBACK_USER = {
  username: 'admin',
  password: '123',
  name: 'Quản trị viên',
  role: 'admin'
};

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
  const configuredUser = config.authUser || {};
  const expectedUser = {
    username: configuredUser.username || FALLBACK_USER.username,
    password: configuredUser.password || FALLBACK_USER.password,
    name: configuredUser.name || FALLBACK_USER.name,
    role: configuredUser.role || FALLBACK_USER.role
  };

  if (username !== expectedUser.username || password !== expectedUser.password) {
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
