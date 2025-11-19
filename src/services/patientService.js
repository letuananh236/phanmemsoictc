import { getDb, runInTransaction } from '../dal/db.js';
import { generateExamId, generatePatientId } from './codeService.js';

const GENDER_TO_INT = { Nam: 1, 'Nữ': 2, Khác: 3 };
const INT_TO_GENDER = { 1: 'Nam', 2: 'Nữ', 3: 'Khác' };

function normalizeGender(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number') return value;
  return GENDER_TO_INT[value] || null;
}

function toGenderLabel(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  return INT_TO_GENDER[value] || '';
}

function mapRow(row) {
  return {
    rowId: row.id,
    id: row.ma_bn,
    name: row.ho_ten,
    gender: toGenderLabel(row.gioi_tinh),
    dob: row.ngay_sinh,
    phone: row.sdt,
    address: row.dia_chi,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function listPatients(filters = {}) {
  const db = getDb();
  const conditions = [];
  const params = [];

  if (filters.search) {
    const like = `%${filters.search}%`;
    conditions.push('(ho_ten LIKE ? OR sdt LIKE ? OR ma_bn LIKE ?)');
    params.push(like, like, like);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = db.prepare(`SELECT * FROM patients ${whereClause} ORDER BY created_at DESC`).all(...params);
  return rows.map(mapRow);
}

export function getPatient(idOrCode, dbInstance = getDb()) {
  const db = dbInstance;
  const row = db
    .prepare('SELECT * FROM patients WHERE ma_bn = ? OR id = ?')
    .get(idOrCode, Number.isNaN(Number(idOrCode)) ? -1 : Number(idOrCode));
  return row ? mapRow(row) : null;
}

function insertVisitForPatient(db, patientRowId, doctorId, dateIso = new Date().toISOString().slice(0, 10), note = '') {
  const now = new Date().toISOString();
  const examId = generateExamId();
  const insert = db.prepare(
    `INSERT INTO visits (ma_phieu, patient_id, bac_si_id, ngay_kham, gio_kham, ly_do_kham, created_at, updated_at)
     VALUES (@ma_phieu, @patient_id, @bac_si_id, @ngay_kham, @gio_kham, @ly_do_kham, @created_at, @updated_at)`
  );
  insert.run({
    ma_phieu: examId,
    patient_id: patientRowId,
    bac_si_id: doctorId ? Number(doctorId) : null,
    ngay_kham: dateIso,
    gio_kham: null,
    ly_do_kham: note || null,
    created_at: now,
    updated_at: now
  });
  const visit = db
    .prepare(
      `SELECT v.*, p.ma_bn, p.ho_ten, p.ngay_sinh, p.sdt, d.ten AS bac_si
       FROM visits v
       JOIN patients p ON p.id = v.patient_id
       LEFT JOIN doctors d ON d.id = v.bac_si_id
       WHERE v.ma_phieu = ?`
    )
    .get(examId);
  return visit;
}

export function savePatient(payload) {
  return runInTransaction((db) => {
    const now = new Date().toISOString();
    const patientCode = payload.id || generatePatientId();
    const existing = getPatient(patientCode, db);
    const record = {
      ma_bn: patientCode,
      ho_ten: payload.name,
      gioi_tinh: normalizeGender(payload.gender),
      ngay_sinh: payload.dob || null,
      sdt: payload.phone || null,
      dia_chi: payload.address || null,
      reason: payload.reason || null,
      updated_at: now
    };

    if (existing) {
      db.prepare(
        `UPDATE patients SET ho_ten=@ho_ten, gioi_tinh=@gioi_tinh, ngay_sinh=@ngay_sinh, sdt=@sdt, dia_chi=@dia_chi, reason=@reason, updated_at=@updated_at WHERE ma_bn=@ma_bn`
      ).run(record);
      return { patient: getPatient(patientCode, db) };
    }

    db.prepare(
      `INSERT INTO patients (ma_bn, ho_ten, gioi_tinh, ngay_sinh, sdt, dia_chi, reason, created_at, updated_at)
       VALUES (@ma_bn, @ho_ten, @gioi_tinh, @ngay_sinh, @sdt, @dia_chi, @reason, @created_at, @updated_at)`
    ).run({ ...record, created_at: now });

    const createdPatient = getPatient(patientCode, db);
    let createdVisit = null;
    if (payload.createVisit) {
      createdVisit = insertVisitForPatient(db, createdPatient.rowId, payload.doctorId, payload.visitDate, payload.reason);
    }

    return { patient: createdPatient, visit: createdVisit };
  });
}

export function deletePatient(patientId) {
  const db = getDb();
  db.prepare('DELETE FROM patients WHERE ma_bn = ? OR id = ?').run(patientId, Number(patientId) || -1);
  return true;
}
