import os from 'os';
import crypto from 'crypto';
import { execFileSync } from 'child_process';

function runCommand(command, args = [], pattern) {
  try {
    const output = execFileSync(command, args, { encoding: 'utf8' });
    if (pattern) {
      const match = output.match(pattern);
      return match?.[1]?.trim() || '';
    }
    return output.trim();
  } catch {
    return '';
  }
}

function getCpuSerial() {
  if (process.platform === 'win32') {
    return (
      runCommand('wmic', ['cpu', 'get', 'ProcessorId', '/value'], /ProcessorId=([A-F0-9]+)/i) ||
      runCommand('wmic', ['csproduct', 'get', 'UUID', '/value'], /UUID=([A-F0-9\-]+)/i)
    );
  }
  if (process.platform === 'darwin') {
    return runCommand('ioreg', ['-l'], /IOPlatformSerialNumber" = "([^\"]+)"/i);
  }
  const cpuInfo = runCommand('cat', ['/proc/cpuinfo']);
  const serialMatch = cpuInfo.match(/Serial\s*:\s*([^\n]+)/i);
  if (serialMatch?.[1]) return serialMatch[1].trim();
  return runCommand('lscpu', [], /Serial\s*:\s*([^\n]+)/i);
}

function getDiskSerial() {
  if (process.platform === 'win32') {
    return runCommand('wmic', ['diskdrive', 'get', 'SerialNumber', '/value'], /SerialNumber=([^\r\n]+)/i);
  }
  if (process.platform === 'darwin') {
    return runCommand('system_profiler', ['SPSerialATADataType'], /Serial Number: ([^\n]+)/i);
  }
  return (
    runCommand('udevadm', ['info', '--query=property', '--name=/dev/sda'], /ID_SERIAL_SHORT=([^\n]+)/i) ||
    runCommand('udevadm', ['info', '--query=property', '--name=/dev/nvme0n1'], /ID_SERIAL_SHORT=([^\n]+)/i)
  );
}

function getRamSizeMb() {
  return Math.round(os.totalmem() / 1024 / 1024);
}

export function collectHardwareInfo() {
  const cpuSerial = getCpuSerial();
  const diskSerial = getDiskSerial();
  const ramMb = getRamSizeMb();
  return { cpuSerial, diskSerial, ramMb };
}

export function generateMachineKey() {
  const { cpuSerial, diskSerial, ramMb } = collectHardwareInfo();
  const baseFingerprint = [cpuSerial, diskSerial, ramMb ? `${ramMb}MB` : ''].filter(Boolean).join('|');
  const fallback = os.hostname();
  const hash = crypto
    .createHash('sha256')
    .update(baseFingerprint || fallback)
    .digest('hex')
    .toUpperCase();
  return `${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}`;
}

const LICENSE_SEEDS = {
  yearly: 'SOICTC_LICENSE_V1',
  lifetime: 'SOICTC_LICENSE_V1_LIFETIME',
  thirty_day: 'SOICTC_LICENSE_V1_30DAY',
  trial: 'SOICTC_LICENSE_V1_TRIAL',
  default: 'SOICTC_LICENSE_V1'
};

export function generateLicenseKey(machineKey, licenseType = 'yearly') {
  const normalizedMachine = (machineKey || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const normalizedType = (licenseType || 'yearly').toLowerCase();
  const seed = LICENSE_SEEDS[normalizedType] || LICENSE_SEEDS.default;
  const hash = crypto.createHmac('sha256', seed).update(normalizedMachine).digest('hex').toUpperCase();
  return `${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}`;
}
