import { getDb } from '../dal/db.js';
import { getConfig } from './configService.js';
import { ensureLicense, isLicenseValid } from './licenseService.js';
import { verifyPassword } from '../utils/password.js';

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
  const normalizedUsername = typeof username === 'string' ? username.trim() : '';
  const normalizedPassword = typeof password === 'string' ? password.trim() : '';

  console.info(`[auth] login request for username="${normalizedUsername}"`);

  const db = getDb();
  const user = db
    .prepare(
      'SELECT UserID, Username, PasswordHash, FullName, Role, IsActive FROM Users WHERE LOWER(Username) = LOWER(@username)'
    )
    .get({ username: normalizedUsername });

  console.info(`[auth] user lookup for "${normalizedUsername}": ${user ? 'found' : 'not_found'}`);

  if (!user) {
    return { status: 401, body: { error: 'INVALID_CREDENTIALS' } };
  }

  if (!user.IsActive) {
    return { status: 403, body: { error: 'USER_INACTIVE' } };
  }

  const passwordOk = normalizedPassword ? verifyPassword(normalizedPassword, user.PasswordHash || '') : false;
  if (!passwordOk) {
    console.info(`[auth] password verification failed for username="${normalizedUsername}"`);
    return { status: 401, body: { error: 'INVALID_CREDENTIALS' } };
  }

  const userPayload = {
    id: user.UserID,
    username: user.Username,
    name: user.FullName || user.Username,
    role: user.Role || 'USER'
  };

  const license = summarizeLicense(ensureLicense());
  console.info(`[auth] license status for "${normalizedUsername}": ${license.status}`);
  if (!isLicenseValid(license)) {
    console.info('[auth] license invalid or expired during login');
    return { status: 403, body: { error: 'LICENSE_EXPIRED', license, user: userPayload, config: getConfig() } };
  }

  return {
    status: 200,
    body: {
      success: true,
      user: userPayload,
      license,
      config: getConfig()
    }
  };
}

export function getLicenseSummary() {
  return summarizeLicense(ensureLicense());
}
