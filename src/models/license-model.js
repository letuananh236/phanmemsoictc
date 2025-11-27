import { getLicense as getStoredLicense, saveLicense as saveStoredLicense } from './database.js';
import { generateLicenseKey, generateMachineKey } from '../utils/hardware-id.js';

function normalizeLicenseKey(key) {
  return (key || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
}

function normalizeLicenseType(type) {
  const value = (type || '').toString().toLowerCase();
  if (['monthly', 'month', '30-day', '30day', '30_days', 'thirty_day'].includes(value)) return 'thirty_day';
  if (value === 'lifetime') return 'lifetime';
  if (value === 'trial') return 'trial';
  return 'yearly';
}

function detectLicenseTypeFromKey(key, machineId) {
  if (!key) return null;
  const normalized = normalizeLicenseKey(key);
  const types = ['thirty_day', 'yearly', 'lifetime'];
  return (
    types.find((type) => normalizeLicenseKey(generateLicenseKey(machineId, type)) === normalized) || null
  );
}

function calculateDaysRemaining(license) {
  const expire = license?.expireDate ? new Date(license.expireDate) : null;
  if (!expire || Number.isNaN(expire)) return 0;
  const diffMs = expire.getTime() - Date.now();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function ensureDateString(value, fallback) {
  const parsed = value ? new Date(value) : null;
  if (!parsed || Number.isNaN(parsed)) return fallback;
  return parsed.toISOString().slice(0, 10);
}

function isLicenseValid(license) {
  if (!license) return false;
  const machineId = generateMachineKey();
  const detectedType = detectLicenseTypeFromKey(license.licenseKey, machineId);
  if (!detectedType) return false;
  const expire = new Date(license.expireDate);
  if (Number.isNaN(expire.getTime()) || expire < new Date()) return false;
  return license.machineId === machineId && license.status === 'valid';
}

async function ensureLicense(defaults = {}, override = null) {
  const base = override || getStoredLicense();
  const machineId = generateMachineKey();
  const now = new Date();
  const startDate = ensureDateString(base?.startDate, now.toISOString().slice(0, 10));
  const expireDate = (() => {
    if (base?.expireDate && !Number.isNaN(new Date(base.expireDate))) return base.expireDate;
    const fallback = new Date(startDate);
    fallback.setDate(fallback.getDate() + 30);
    return fallback.toISOString().slice(0, 10);
  })();
  const detectedType = detectLicenseTypeFromKey(base?.licenseKey, machineId);
  const normalizedType =
    detectedType || normalizeLicenseType(base?.licenseType || defaults?.licenseType || 'trial');
  const normalizedKey = normalizeLicenseKey(base?.licenseKey || '');
  const normalized = {
    machineId,
    licenseType: normalizedType,
    licenseKey: normalizedKey,
    startDate,
    expireDate,
    status: base?.status || 'invalid'
  };
  const valid = isLicenseValid(normalized);
  normalized.status = valid ? 'valid' : 'invalid';
  saveStoredLicense(normalized);
  return normalized;
}

function resetLicense() {
  const machineId = generateMachineKey();
  const now = new Date();
  const expire = new Date(now);
  expire.setDate(expire.getDate() + 30);
  const cleared = {
    machineId,
    licenseType: 'trial',
    licenseKey: '',
    startDate: now.toISOString().slice(0, 10),
    expireDate: expire.toISOString().slice(0, 10),
    status: 'invalid'
  };
  saveStoredLicense(cleared);
  return cleared;
}

export {
  calculateDaysRemaining,
  detectLicenseTypeFromKey,
  ensureDateString,
  ensureLicense,
  isLicenseValid,
  normalizeLicenseKey,
  normalizeLicenseType,
  resetLicense
};
