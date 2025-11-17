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

  const doctorCount = db.prepare('SELECT COUNT(*) as count FROM Doctors').get().count;
  if (doctorCount === 0) {
    db.prepare(
      'INSERT INTO Doctors (DoctorID, FullName, Title, Department, IsActive) VALUES (@DoctorID, @FullName, @Title, @Department, @IsActive)'
    ).run({
      DoctorID: 'D001',
      FullName: 'BS Trần Văn B',
      Title: 'Bác sỹ',
      Department: 'Sản',
      IsActive: 1
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
