import { paths } from '../utils/paths.js';
import { getDb } from '../dal/db.js';

const defaultConfig = {
  hospitalName: '',
  departmentName: '',
  address: '',
  phone: '',
  fax: '',
  website: '',
  email: '',
  logoFileName: 'logo-default.svg',
  patientCodePrefix: 'BN',
  examCodePrefix: 'HA',
  defaultImageCount: 4,
  defaultDescription: 'Âm đạo:\nCổ tử cung:\nSau bôi Axit acetic:\nSau bôi Lugol:\n',
  defaultResult: '',
  defaultConclusion: '',
  defaultDoctorAdvice: '',
  allowDeleteData: true,
  databasePath: paths.databaseFile
};

export function getConfig() {
  const db = getDb();
  const rows = db.prepare('SELECT ConfigKey, ConfigValue FROM SystemConfig').all();
  const config = { ...defaultConfig };
  rows.forEach((row) => {
    const parsed = (() => {
      try {
        return JSON.parse(row.ConfigValue);
      } catch {
        return row.ConfigValue;
      }
    })();
    config[row.ConfigKey] = parsed;
  });
  return config;
}

export function setConfig(partial) {
  const db = getDb();
  const merged = { ...getConfig(), ...partial };
  const stmt = db.prepare('INSERT INTO SystemConfig (ConfigKey, ConfigValue) VALUES (@ConfigKey, @ConfigValue) ON CONFLICT(ConfigKey) DO UPDATE SET ConfigValue = excluded.ConfigValue');
  Object.entries(partial || {}).forEach(([key, value]) => {
    stmt.run({ ConfigKey: key, ConfigValue: JSON.stringify(value) });
  });
  // Always keep database path reference fresh
  stmt.run({ ConfigKey: 'databasePath', ConfigValue: JSON.stringify(paths.databaseFile) });
  return merged;
}

export function getConfigValue(key, fallback) {
  const config = getConfig();
  return config[key] ?? fallback;
}
