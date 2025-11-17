import { getDb } from '../dal/db.js';
import { generateExamId } from './codeService.js';
import { listImages, clearImages, saveExamImage } from './imageService.js';

function mapRow(row) {
  const images = listImages(row.ExamID);
  const status = row.Diagnosis
    ? 'Đã soi'
    : images.length > 0
      ? 'Đang soi'
      : 'Chưa soi';

  return {
    id: row.ExamID,
    examNumber: row.ExamNumber,
    date: row.ExamDateTime?.slice(0, 10),
    time: row.ExamDateTime ? new Date(row.ExamDateTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '',
    patientId: row.PatientID,
    patientName: row.PatientName,
    patientDob: row.DOB,
    patientPhone: row.Phone,
    doctorId: row.DoctorID,
    doctorName: row.DoctorName || row.DoctorFullName,
    description: row.ColpoFindings,
    result: row.Diagnosis,
    treatmentSteps: row.ClinicalNotes,
    doctorAdvice: row.Recommendation,
    templateVersion: row.TemplateVersion,
    numImages: row.NumImages,
    status,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
    images
  };
}

export function listExams(filters = {}) {
  const db = getDb();
  const conditions = [];
  const params = [];

  if (filters.date) {
    conditions.push('date(e.ExamDateTime) = date(?)');
    params.push(filters.date);
  }

  if (filters.doctorId) {
    conditions.push('e.DoctorID = ?');
    params.push(filters.doctorId);
  }

  if (filters.search) {
    const like = `%${filters.search}%`;
    conditions.push('(p.FullName LIKE ? OR p.Phone LIKE ? OR p.PatientID LIKE ?)');
    params.push(like, like, like);
  }

  if (filters.patientId) {
    conditions.push('e.PatientID = ?');
    params.push(filters.patientId);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = db
    .prepare(
      `SELECT e.*, p.FullName AS PatientName, p.DOB, p.Phone, d.FullName AS DoctorFullName
       FROM Examinations e
       LEFT JOIN Patients p ON e.PatientID = p.PatientID
       LEFT JOIN Doctors d ON e.DoctorID = d.DoctorID
       ${whereClause}
       ORDER BY e.ExamDateTime DESC`
    )
    .all(...params);

  return rows.map(mapRow);
}

export function getExam(examId) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM Examinations WHERE ExamID = ?').get(examId);
  return row ? mapRow(row) : null;
}

export function saveExam(payload) {
  const db = getDb();
  const now = new Date().toISOString();
  const examId = payload.id || generateExamId();
  const images = payload.imagePaths || payload.images || [];
  const existing = getExam(examId);
  const record = {
    ExamID: examId,
    ExamNumber: payload.examNumber || null,
    PatientID: payload.patientId,
    DoctorID: payload.doctorId || null,
    DoctorName: payload.doctorName || null,
    ExamDateTime: payload.date ? new Date(payload.date).toISOString() : now,
    ReasonForVisit: payload.reason || payload.reasonForVisit || null,
    GyneHistory: payload.gyneHistory || null,
    ObstetricHistory: payload.obstetricHistory || null,
    ClinicalNotes: payload.treatmentSteps || null,
    ColpoFindings: payload.description || null,
    Diagnosis: payload.result || null,
    Recommendation: payload.doctorAdvice || null,
    TemplateVersion: payload.templateVersion || null,
    NumImages: images.length,
    CreatedAt: existing?.createdAt || now,
    UpdatedAt: now
  };

  if (existing) {
    db.prepare(
      `UPDATE Examinations SET ExamNumber=@ExamNumber, PatientID=@PatientID, DoctorID=@DoctorID, DoctorName=@DoctorName, ExamDateTime=@ExamDateTime, ReasonForVisit=@ReasonForVisit, GyneHistory=@GyneHistory, ObstetricHistory=@ObstetricHistory, ClinicalNotes=@ClinicalNotes, ColpoFindings=@ColpoFindings, Diagnosis=@Diagnosis, Recommendation=@Recommendation, TemplateVersion=@TemplateVersion, NumImages=@NumImages, UpdatedAt=@UpdatedAt WHERE ExamID=@ExamID`
    ).run(record);
    clearImages(examId);
  } else {
    db.prepare(
      `INSERT INTO Examinations (ExamID, ExamNumber, PatientID, DoctorID, DoctorName, ExamDateTime, ReasonForVisit, GyneHistory, ObstetricHistory, ClinicalNotes, ColpoFindings, Diagnosis, Recommendation, TemplateVersion, NumImages, CreatedAt, UpdatedAt) VALUES (@ExamID, @ExamNumber, @PatientID, @DoctorID, @DoctorName, @ExamDateTime, @ReasonForVisit, @GyneHistory, @ObstetricHistory, @ClinicalNotes, @ColpoFindings, @Diagnosis, @Recommendation, @TemplateVersion, @NumImages, @CreatedAt, @UpdatedAt)`
    ).run(record);
  }

  images.forEach((img, index) => {
    if (img?.dataUrl) {
      saveExamImage(examId, index + 1, img.dataUrl, img.note);
    } else if (img?.path) {
      db.prepare(
        'INSERT INTO ExamImages (ExamID, ImageOrder, FilePath, CapturedAt, Note) VALUES (@ExamID, @ImageOrder, @FilePath, @CapturedAt, @Note)'
      ).run({
        ExamID: examId,
        ImageOrder: index + 1,
        FilePath: img.path,
        CapturedAt: now,
        Note: img.note || null
      });
    }
  });

  return getExam(examId);
}

export function deleteExam(examId) {
  const db = getDb();
  db.prepare('DELETE FROM Examinations WHERE ExamID = ?').run(examId);
  return true;
}
