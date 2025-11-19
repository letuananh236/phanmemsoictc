import os from 'node:os';
import crypto from 'node:crypto';
import { getDb } from '../dal/db.js';

function machineId() {
  const hostname = os.hostname();
  const hash = crypto.createHash('sha1').update(hostname).digest('hex');
  return `${hash.slice(0, 4).toUpperCase()}-${hash.slice(4, 8).toUpperCase()}`;
}

function hashLicenseKey(key = '') {
  return crypto.createHash('sha256').update(`${machineId()}::${key}`).digest('hex');
}

export function isLicenseValid(license) {
  if (!license) return false;
  if (!license.LicenseType) return false;
  const expire = license.ExpireAt ? new Date(license.ExpireAt) : null;
  return !expire || expire >= new Date();
}

export function ensureLicense() {
  const db = getDb();
  const row = db.prepare('SELECT * FROM LicenseInfo WHERE LicenseID = 1').get();
  if (row) return row;
  const now = new Date();
  const expire = new Date(now);
  expire.setDate(expire.getDate() + 30);
  const trial = {
    LicenseID: 1,
    LicenseKey: hashLicenseKey('trial'),
    LicenseType: 'trial',
    ActivatedAt: now.toISOString(),
    ExpireAt: expire.toISOString(),
    MachineID: machineId(),
    LastCheckedAt: now.toISOString()
  };
  db.prepare(
    'INSERT INTO LicenseInfo (LicenseID, LicenseKey, LicenseType, ActivatedAt, ExpireAt, MachineID, LastCheckedAt) VALUES (@LicenseID, @LicenseKey, @LicenseType, @ActivatedAt, @ExpireAt, @MachineID, @LastCheckedAt)'
  ).run(trial);
  return trial;
}

export function getLicense() {
  return ensureLicense();
}

export function activateLicense(payload) {
  const db = getDb();
  const now = new Date();
  const expire = new Date(now);
  if (payload.licenseType === 'lifetime') {
    expire.setFullYear(expire.getFullYear() + 100);
  } else if (payload.licenseType === 'yearly') {
    expire.setFullYear(expire.getFullYear() + 1);
  } else {
    expire.setMonth(expire.getMonth() + 1);
  }
  const updated = {
    LicenseID: 1,
    LicenseKey: hashLicenseKey(payload.licenseKey || ''),
    LicenseType: payload.licenseType || 'trial',
    ActivatedAt: now.toISOString(),
    ExpireAt: expire.toISOString(),
    MachineID: machineId(),
    LastCheckedAt: now.toISOString()
  };
  db.prepare(
    'INSERT INTO LicenseInfo (LicenseID, LicenseKey, LicenseType, ActivatedAt, ExpireAt, MachineID, LastCheckedAt) VALUES (@LicenseID, @LicenseKey, @LicenseType, @ActivatedAt, @ExpireAt, @MachineID, @LastCheckedAt) ON CONFLICT(LicenseID) DO UPDATE SET LicenseKey=excluded.LicenseKey, LicenseType=excluded.LicenseType, ActivatedAt=excluded.ActivatedAt, ExpireAt=excluded.ExpireAt, MachineID=excluded.MachineID, LastCheckedAt=excluded.LastCheckedAt'
  ).run(updated);
  return updated;
}

export function summarizeLicense(license) {
  const now = Date.now();
  const expire = license?.ExpireAt ? new Date(license.ExpireAt).getTime() : null;
  const daysLeft = expire ? Math.max(0, Math.ceil((expire - now) / 86400000)) : null;
  return {
    ...license,
    machineId: license?.MachineID || machineId(),
    daysLeft,
    status: isLicenseValid(license) ? 'valid' : 'expired'
  };
}
