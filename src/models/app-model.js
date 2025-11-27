import path from 'path';
import fs from 'fs';
import fsPromises from 'fs/promises';
import { fileURLToPath } from 'url';
import os from 'os';
import { initDatabase } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..', '..');
const publicDir = path.join(rootDir, 'public');
const dataDir = path.join(rootDir, 'data');
const imagesDir = path.join(dataDir, 'images');
const logoDir = path.join(publicDir, 'logo');

const defaultData = {
  settings: {
    hospitalName: '',
    departmentName: '',
    address: '',
    phone: '',
    fax: '',
    website: '',
    email: '',
    logoFileName: 'logo-default.svg',
    patientCodePrefix: 'BN',
    examCodePrefix: 'BN',
    nextPatientNumber: 1,
    nextExamNumber: 1,
    defaultImageCount: 4,
    captureHotkey: 'F9',
    defaultDescription: 'Âm đạo:\nCổ tử cung:\nSau bôi Axit acetic:\nSau bôi Lugol:\n',
    defaultResult: '',
    defaultConclusion: '',
    defaultDoctorAdvice: '',
    allowDeleteData: true
  },
  patients: [],
  exams: [],
  doctors: [{ id: 'D001', name: 'BS Trần Văn B', active: true }],
  templates: [{ id: 'T001', name: 'Bình thường', content: 'Mô tả kết quả bình thường...' }],
  license: {},
  users: [{ username: 'admin', password: '123' }]
};

function getPaths() {
  return { rootDir, publicDir, dataDir, imagesDir, logoDir };
}

async function ensureDefaultLogo() {
  await fsPromises.mkdir(logoDir, { recursive: true });
  const target = path.join(logoDir, 'logo-default.svg');
  try {
    await fsPromises.access(target, fs.constants.F_OK);
  } catch {
    const source = path.join(publicDir, 'assets', 'logo-default.svg');
    await fsPromises.copyFile(source, target);
  }
}

async function ensureInfrastructure() {
  await fsPromises.mkdir(dataDir, { recursive: true });
  await fsPromises.mkdir(imagesDir, { recursive: true });
  await ensureDefaultLogo();
  initDatabase(defaultData);
}

function getDefaultData() {
  return defaultData;
}

function getTempDir(prefix) {
  return fsPromises.mkdtemp(path.join(os.tmpdir(), prefix));
}

export { getPaths, getDefaultData, ensureInfrastructure, getTempDir };
