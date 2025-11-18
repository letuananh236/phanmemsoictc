import { getDb } from '../dal/db.js';
import { generateExamId } from './codeService.js';
import { listVisitImages, clearImages, saveExamImage } from './imageService.js';
import { getPatient } from './patientService.js';

function yearOfBirth(date) {
  if (!date) return '';
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? '' : String(d.getFullYear());
}

function mapRow(row) {
  const images = listVisitImages(row.id || row.ma_phieu);
  const status = row.da_in_phieu
    ? 'Đã in'
    : row.chan_doan || row.mo_ta
      ? 'Đã soi'
      : images.length > 0
        ? 'Đang soi'
        : 'Chưa soi';

  return {
    id: row.ma_phieu,
    visitRowId: row.id,
    date: row.ngay_kham,
    time: row.gio_kham || '',
    patientId: row.ma_bn,
    patientRowId: row.patient_id,
    patientName: row.ho_ten,
    patientDob: row.ngay_sinh,
    patientPhone: row.sdt,
    doctorId: row.bac_si_id,
    doctorName: row.bac_si || row.doctor_name,
    reason: row.ly_do_kham,
    description: row.mo_ta || row.ghi_chu,
    result: row.chan_doan,
    doctorAdvice: row.de_nghi || row.ghi_chu,
    templateVersion: row.templateVersion,
    status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    images,
    yearOfBirth: yearOfBirth(row.ngay_sinh)
  };
}

export function listExams(filters = {}) {
  const db = getDb();
  const conditions = [];
  const params = [];

  if (filters.date) {
    conditions.push('date(v.ngay_kham) = date(?)');
    params.push(filters.date);
  }

  if (filters.doctorId) {
    conditions.push('v.bac_si_id = ?');
    params.push(filters.doctorId);
  }

  if (filters.search) {
    const like = `%${filters.search}%`;
    conditions.push('(p.ho_ten LIKE ? OR p.sdt LIKE ? OR p.ma_bn LIKE ?)');
    params.push(like, like, like);
  }

  if (filters.patientId) {
    conditions.push('p.ma_bn = ?');
    params.push(filters.patientId);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = db
    .prepare(
      `SELECT v.*, p.ma_bn, p.ho_ten, p.ngay_sinh, p.sdt, d.ten AS bac_si
       FROM visits v
       JOIN patients p ON v.patient_id = p.id
       LEFT JOIN doctors d ON v.bac_si_id = d.id
       ${whereClause}
       ORDER BY (v.gio_kham IS NULL), v.gio_kham, v.created_at DESC`
    )
    .all(...params);

  return rows.map(mapRow);
}

export function getExam(examId) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT v.*, p.ma_bn, p.ho_ten, p.ngay_sinh, p.sdt, d.ten AS bac_si, d.id AS doctor_id
       FROM visits v
       JOIN patients p ON v.patient_id = p.id
       LEFT JOIN doctors d ON v.bac_si_id = d.id
       WHERE v.ma_phieu = ? OR v.id = ?`
    )
    .get(examId, Number(examId) || -1);
  return row ? mapRow(row) : null;
}

export async function saveExam(payload) {
  const db = getDb();
  const now = new Date().toISOString();
  const examId = payload.id || generateExamId();
  const images = payload.imagePaths || payload.images || [];

  const patient = payload.patientId ? getPatient(payload.patientId) : null;
  const patientRowId = patient?.rowId || payload.patientRowId;
  if (!patientRowId) throw new Error('patient_required');

  const existing = getExam(examId);
  const record = {
    ma_phieu: examId,
    patient_id: patientRowId,
    bac_si_id: payload.doctorId ? Number(payload.doctorId) : null,
    ngay_kham: payload.date || new Date().toISOString().slice(0, 10),
    gio_kham: payload.time || null,
    ly_do_kham: payload.reason || null,
    mo_ta: payload.description || null,
    chan_doan: payload.result || null,
    de_nghi: payload.doctorAdvice || null,
    ghi_chu: payload.treatmentSteps || payload.note || null,
    da_in_phieu: payload.printed ? 1 : existing?.da_in_phieu || 0,
    updated_at: now
  };

  let visitRowId = existing?.visitRowId || existing?.id;

  if (existing) {
    const result = db.prepare(
      `UPDATE visits SET patient_id=@patient_id, bac_si_id=@bac_si_id, ngay_kham=@ngay_kham, gio_kham=@gio_kham, ly_do_kham=@ly_do_kham, mo_ta=@mo_ta, chan_doan=@chan_doan, de_nghi=@de_nghi, ghi_chu=@ghi_chu, da_in_phieu=@da_in_phieu, updated_at=@updated_at WHERE ma_phieu=@ma_phieu`
    ).run(record);
    visitRowId = visitRowId || existing?.id || result.lastInsertRowid;
  } else {
    const result = db.prepare(
      `INSERT INTO visits (ma_phieu, patient_id, bac_si_id, ngay_kham, gio_kham, ly_do_kham, mo_ta, chan_doan, de_nghi, ghi_chu, da_in_phieu, created_at, updated_at)
       VALUES (@ma_phieu, @patient_id, @bac_si_id, @ngay_kham, @gio_kham, @ly_do_kham, @mo_ta, @chan_doan, @de_nghi, @ghi_chu, @da_in_phieu, @created_at, @updated_at)`
    ).run({ ...record, created_at: now });
    visitRowId = result.lastInsertRowid;
  }

  if (images.length) {
    clearImages(examId);
    for (let index = 0; index < images.length; index += 1) {
      const img = images[index];
      if (img?.dataUrl) {
        await saveExamImage(examId, index + 1, img.dataUrl, img.note);
      } else if (img?.path) {
        db.prepare(
          'INSERT INTO visit_images (visit_id, file_path, display_order, is_selected, created_at) VALUES (@visit_id, @file_path, @display_order, 1, @created_at)'
        ).run({
          visit_id: visitRowId,
          file_path: img.path,
          display_order: index + 1,
          created_at: now
        });
      }
    }
  }

  return getExam(examId);
}

export function deleteExam(examId) {
  const db = getDb();
  db.prepare('DELETE FROM visits WHERE ma_phieu = ? OR id = ?').run(examId, Number(examId) || -1);
  return true;
}

export function getPrintPayload(examId) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT v.*, p.ma_bn, p.ho_ten, p.ngay_sinh, p.gioi_tinh, p.sdt, p.dia_chi, d.ten AS bac_si
       FROM visits v
       JOIN patients p ON v.patient_id = p.id
       LEFT JOIN doctors d ON v.bac_si_id = d.id
       WHERE v.ma_phieu = ? OR v.id = ?`
  )
    .get(examId, Number(examId) || -1);
  if (!row) return null;
  const images = listVisitImages(row.id || row.ma_phieu);
  return {
    visit: mapRow(row),
    patient: {
      code: row.ma_bn,
      name: row.ho_ten,
      gender: row.gioi_tinh === 1 ? 'Nam' : row.gioi_tinh === 2 ? 'Nữ' : row.gioi_tinh === 3 ? 'Khác' : '',
      dob: row.ngay_sinh,
      phone: row.sdt,
      address: row.dia_chi
    },
    doctor: row.bac_si,
    images
  };
}
