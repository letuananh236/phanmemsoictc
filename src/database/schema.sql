PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'ADMIN',
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  position TEXT,
  status INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  birth_year INTEGER,
  gender TEXT,
  address TEXT,
  phone TEXT,
  reason TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_code TEXT UNIQUE NOT NULL,
  patient_id INTEGER NOT NULL,
  doctor_id INTEGER,
  exam_date TEXT,
  exam_time TEXT,
  description TEXT,
  conclusion TEXT,
  treatment TEXT,
  instruction TEXT,
  mark_on_image INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(patient_id) REFERENCES patients(id),
  FOREIGN KEY(doctor_id) REFERENCES doctors(id)
);

CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id INTEGER,
  file_path TEXT NOT NULL,
  display_order INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(exam_id) REFERENCES exams(id)
);

CREATE TABLE IF NOT EXISTS config (
  key TEXT PRIMARY KEY,
  value TEXT
);

CREATE TABLE IF NOT EXISTS license (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  license_key TEXT,
  edition TEXT,
  expire_date TEXT,
  status TEXT,
  activated_at TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS backup (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_patients_code ON patients(code);
CREATE INDEX IF NOT EXISTS idx_exams_patient ON exams(patient_id);
CREATE INDEX IF NOT EXISTS idx_images_exam ON images(exam_id);
