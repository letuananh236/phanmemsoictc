import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { paths } from '../utils/paths.js';
import { ensureDir } from '../utils/fs.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

ensureDir(paths.dataDir);
ensureDir(paths.databaseDir);
ensureDir(paths.imagesDir);
ensureDir(paths.configDir);
ensureDir(paths.assetsDir);

const db = new DatabaseSync(paths.databaseFile);
db.exec('PRAGMA foreign_keys = ON;');

function ensureUserSchema() {
  const hasUsers = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='Users'")
    .get();

  if (!hasUsers) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS Users (
        UserID INTEGER PRIMARY KEY AUTOINCREMENT,
        Username TEXT UNIQUE NOT NULL,
        PasswordHash TEXT NOT NULL,
        FullName TEXT,
        Role TEXT,
        IsActive INTEGER NOT NULL DEFAULT 1,
        CreatedAt DATETIME,
        UpdatedAt DATETIME
      );
    `);
    return;
  }

  const columns = db.prepare('PRAGMA table_info(Users)').all();
  const columnNames = new Set(columns.map((c) => c.name));

  if (!columnNames.has('IsActive')) {
    db.exec('ALTER TABLE Users ADD COLUMN IsActive INTEGER NOT NULL DEFAULT 1');
  }
  if (!columnNames.has('CreatedAt')) {
    db.exec('ALTER TABLE Users ADD COLUMN CreatedAt DATETIME');
  }
  if (!columnNames.has('UpdatedAt')) {
    db.exec('ALTER TABLE Users ADD COLUMN UpdatedAt DATETIME');
  }
}

ensureUserSchema();

function ensurePatientsTable() {
  const createSql = `
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ma_bn TEXT UNIQUE NOT NULL,
      ho_ten TEXT NOT NULL,
      ngay_sinh TEXT,
      gioi_tinh INTEGER,
      sdt TEXT,
      dia_chi TEXT,
      reason TEXT,
      created_at TEXT,
      updated_at TEXT
    );
  `;
  const legacyInsert = `
    INSERT INTO patients (ma_bn, ho_ten, ngay_sinh, gioi_tinh, sdt, dia_chi, reason, created_at, updated_at)
    SELECT PatientID, FullName, DOB, Gender, Phone, Address, Reason, CreatedAt, UpdatedAt FROM __LEGACY__;
  `;

  const info = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name COLLATE NOCASE = 'patients'").get();
  if (!info) {
    db.exec(createSql);
    return;
  }

  const columns = db.prepare('PRAGMA table_info(patients)').all();
  const hasMaBn = columns.some((c) => c.name === 'ma_bn');
  if (!hasMaBn) {
    const legacy = `patients_legacy_${Date.now()}`;
    db.exec(`ALTER TABLE patients RENAME TO ${legacy};`);
    db.exec(createSql);
    db.exec(legacyInsert.replace(/__LEGACY__/g, legacy));
    return;
  }
}

function ensureDoctorsTable() {
  const createSql = `
    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ten TEXT NOT NULL,
      chuyen_khoa TEXT,
      is_active INTEGER DEFAULT 1
    );
  `;
  const legacyInsert = `
    INSERT INTO doctors (id, ten, chuyen_khoa, is_active)
    SELECT CAST(REPLACE(DoctorID, 'D', '') AS INTEGER), FullName, Department, IsActive FROM __LEGACY__;
  `;

  const info = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name COLLATE NOCASE = 'doctors'").get();
  if (!info) {
    db.exec(createSql);
    return;
  }

  const columns = db.prepare('PRAGMA table_info(doctors)').all();
  const hasTen = columns.some((c) => c.name === 'ten');
  if (!hasTen) {
    const legacy = `doctors_legacy_${Date.now()}`;
    db.exec(`ALTER TABLE doctors RENAME TO ${legacy};`);
    db.exec(createSql);
    db.exec(legacyInsert.replace(/__LEGACY__/g, legacy));
  }
}

function ensureVisitsTable() {
  const createSql = `
    CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ma_phieu TEXT UNIQUE NOT NULL,
      patient_id INTEGER NOT NULL,
      bac_si_id INTEGER,
      ngay_kham TEXT NOT NULL,
      gio_kham TEXT,
      ly_do_kham TEXT,
      mo_ta TEXT,
      chan_doan TEXT,
      de_nghi TEXT,
      ghi_chu TEXT,
      da_in_phieu INTEGER DEFAULT 0,
      created_at TEXT,
      updated_at TEXT,
      FOREIGN KEY(patient_id) REFERENCES patients(id),
      FOREIGN KEY(bac_si_id) REFERENCES doctors(id)
    );
  `;
  const info = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name COLLATE NOCASE = 'visits'").get();
  if (!info) {
    db.exec(createSql);
  }
}

function ensureVisitImagesTable() {
  const createSql = `
    CREATE TABLE IF NOT EXISTS visit_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visit_id INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      display_order INTEGER,
      is_selected INTEGER DEFAULT 1,
      created_at TEXT,
      FOREIGN KEY (visit_id) REFERENCES visits(id)
    );
  `;

  const hasTable = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name COLLATE NOCASE = 'visit_images'")
    .get();

  if (!hasTable) {
    db.exec(createSql);
    const legacy = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name COLLATE NOCASE = 'ExamImages'")
      .get();
    if (legacy) {
      db.exec(
        `INSERT INTO visit_images (visit_id, file_path, display_order, is_selected, created_at)
         SELECT v.id,
                TRIM(REPLACE(REPLACE(e.FilePath, 'Data/Images/', ''), 'Images/', ''), '/') AS normalized_path,
                e.ImageOrder,
                1,
                e.CapturedAt
         FROM ExamImages e
         JOIN visits v ON v.ma_phieu = e.ExamID`
      );
    }
    return;
  }

  const columns = db.prepare('PRAGMA table_info(visit_images)').all();
  const names = new Set(columns.map((c) => c.name));
  if (!names.has('display_order')) {
    db.exec('ALTER TABLE visit_images ADD COLUMN display_order INTEGER');
  }
  if (!names.has('is_selected')) {
    db.exec('ALTER TABLE visit_images ADD COLUMN is_selected INTEGER DEFAULT 1');
  }
  if (!names.has('created_at')) {
    db.exec('ALTER TABLE visit_images ADD COLUMN created_at TEXT');
  }
}

ensurePatientsTable();
ensureDoctorsTable();
ensureVisitsTable();
ensureVisitImagesTable();

db.exec(`
  CREATE TABLE IF NOT EXISTS Patients (
    PatientID TEXT PRIMARY KEY,
    FullName TEXT NOT NULL,
    Gender TEXT,
    DOB DATE,
    Age INTEGER,
    Phone TEXT,
    Address TEXT,
    Reason TEXT,
    CreatedAt DATETIME,
    UpdatedAt DATETIME
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS Doctors (
    DoctorID TEXT PRIMARY KEY,
    FullName TEXT NOT NULL,
    Title TEXT,
    Department TEXT,
    SignatureImagePath TEXT,
    IsActive INTEGER DEFAULT 1
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS Examinations (
    ExamID TEXT PRIMARY KEY,
    ExamNumber TEXT,
    PatientID TEXT,
    DoctorID TEXT,
    DoctorName TEXT,
    ExamDateTime DATETIME,
    ReasonForVisit TEXT,
    GyneHistory TEXT,
    ObstetricHistory TEXT,
    ClinicalNotes TEXT,
    ColpoFindings TEXT,
    Diagnosis TEXT,
    Recommendation TEXT,
    TemplateVersion TEXT,
    NumImages INTEGER,
    CreatedAt DATETIME,
    UpdatedAt DATETIME,
    FOREIGN KEY (PatientID) REFERENCES Patients(PatientID) ON DELETE CASCADE,
    FOREIGN KEY (DoctorID) REFERENCES Doctors(DoctorID) ON DELETE SET NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS ExamImages (
    ImageID INTEGER PRIMARY KEY AUTOINCREMENT,
    ExamID TEXT,
    ImageOrder INTEGER,
    FilePath TEXT,
    CapturedAt DATETIME,
    Note TEXT,
    FOREIGN KEY (ExamID) REFERENCES Examinations(ExamID) ON DELETE CASCADE
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS ResultTemplates (
    TemplateID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    DiagnosisText TEXT,
    RecommendationText TEXT,
    IsActive INTEGER DEFAULT 1
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS SystemConfig (
    ConfigKey TEXT PRIMARY KEY,
    ConfigValue TEXT
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS LicenseInfo (
    LicenseID INTEGER PRIMARY KEY,
    LicenseKey TEXT,
    LicenseType TEXT,
    ActivatedAt DATETIME,
    ExpireAt DATETIME,
    MachineID TEXT,
    LastCheckedAt DATETIME
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS BackupHistory (
    BackupID INTEGER PRIMARY KEY AUTOINCREMENT,
    BackupDateTime DATETIME,
    BackupFilePath TEXT,
    BackupType TEXT,
    Note TEXT
  );
`);

export function getDb() {
  return db;
}

export function toBoolean(value) {
  return value ? 1 : 0;
}

export function fromBoolean(value) {
  return value ? true : false;
}

export function ensureSeedData() {
  const existingAdmin = db
    .prepare(
      'SELECT UserID, Username, PasswordHash, FullName, Role, IsActive FROM Users WHERE LOWER(Username) = LOWER(@username)'
    )
    .get({ username: 'admin' });

  const userCount = db.prepare('SELECT COUNT(*) as count FROM Users').get().count;
  const nowIso = new Date().toISOString();

  if (!existingAdmin && userCount === 0) {
    const defaultHash = hashPassword('admin123');
    db.prepare(
      `INSERT INTO Users (Username, PasswordHash, FullName, Role, IsActive, CreatedAt, UpdatedAt)
       VALUES (@Username, @PasswordHash, @FullName, @Role, @IsActive, @CreatedAt, @UpdatedAt)`
    ).run({
      Username: 'admin',
      PasswordHash: defaultHash,
      FullName: 'Quản trị hệ thống',
      Role: 'ADMIN',
      IsActive: 1,
      CreatedAt: nowIso,
      UpdatedAt: nowIso
    });
    console.info('[seed] created default admin user');
  } else if (existingAdmin && !verifyPassword('admin123', existingAdmin.PasswordHash || '')) {
    const updatedHash = hashPassword('admin123');
    db.prepare(
      'UPDATE Users SET PasswordHash=@PasswordHash, IsActive=1, Role=COALESCE(NULLIF(Role, ""), "ADMIN"), UpdatedAt=@UpdatedAt WHERE UserID=@UserID'
    ).run({
      UserID: existingAdmin.UserID,
      PasswordHash: updatedHash,
      UpdatedAt: nowIso
    });
    console.info('[seed] refreshed default admin credentials');
  }

  const doctorCount = db.prepare('SELECT COUNT(*) as count FROM doctors').get().count;
  if (doctorCount === 0) {
    db.prepare('INSERT INTO doctors (ten, chuyen_khoa, is_active) VALUES (@ten, @chuyen_khoa, @is_active)').run({
      ten: 'BS Trần Văn B',
      chuyen_khoa: 'Sản',
      is_active: 1
    });
  }

  const templateCount = db.prepare('SELECT COUNT(*) as count FROM ResultTemplates').get().count;
  if (templateCount === 0) {
    db.prepare(
      'INSERT INTO ResultTemplates (Name, DiagnosisText, RecommendationText, IsActive) VALUES (@Name, @DiagnosisText, @RecommendationText, @IsActive)'
    ).run({
      Name: 'Bình thường',
      DiagnosisText: 'Mô tả kết quả bình thường...',
      RecommendationText: '',
      IsActive: 1
    });
  }
}

export function closeDb() {
  db.close();
}
