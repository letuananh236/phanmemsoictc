import { deleteRecord, getDefaultData, getRecord, listRecords, resetTable, upsertRecord } from '../db.js';
import { getSettings, saveSettings } from './settings.model.js';

function formatCode(prefix, number, width = 5) {
  const safePrefix = prefix || '';
  const seq = Number.parseInt(number, 10) || 1;
  return `${safePrefix}${String(seq).padStart(width, '0')}`;
}

function listDoctors() {
  return listRecords('doctors');
}

function createDoctor(payload) {
  const settings = getSettings();
  const prefix = settings.doctorCodePrefix || '';
  const nextDoctorNumber = settings.nextDoctorNumber || 1;
  const generatedId = formatCode(prefix, nextDoctorNumber, 3);
  const rawId = (payload.id || '').trim();
  const id = rawId || generatedId;
  const name = (payload.name || '').trim();
  const phone = (payload.phone || '').trim();
  if (!id || !name) return { error: 'invalid_doctor' };
  const exists = getRecord('doctors', id);
  if (exists) return { error: 'doctor_exists' };
  const isAssignedDoctor = payload.isAssignedDoctor === true || payload.isAssignedDoctor === 'true';
  const isSpecialistDoctor =
    payload.isSpecialistDoctor === undefined
      ? !isAssignedDoctor
      : payload.isSpecialistDoctor === true || payload.isSpecialistDoctor === 'true';
  const doctor = {
    id,
    name,
    phone,
    doctorCategory: isAssignedDoctor ? 'assigned' : 'specialist',
    isAssignedDoctor,
    isSpecialistDoctor,
    active: payload.active !== false
  };
  upsertRecord('doctors', id, doctor);

  const shouldIncrement = !rawId || rawId === generatedId;
  if (shouldIncrement) {
    saveSettings({ ...settings, nextDoctorNumber: nextDoctorNumber + 1 });
  }

  return doctor;
}

function updateDoctor(id, payload) {
  const doctor = getRecord('doctors', id);
  if (!doctor) return null;
  const updated = {
    ...doctor,
    ...payload,
    phone: ((payload.phone ?? doctor.phone) || '').trim(),
    isAssignedDoctor:
      payload.isAssignedDoctor === undefined
        ? !!doctor.isAssignedDoctor
        : payload.isAssignedDoctor === true || payload.isAssignedDoctor === 'true',
    isSpecialistDoctor:
      payload.isSpecialistDoctor === undefined
        ? doctor.isSpecialistDoctor === undefined
          ? !doctor.isAssignedDoctor
          : !!doctor.isSpecialistDoctor
        : payload.isSpecialistDoctor === true || payload.isSpecialistDoctor === 'true',
    id: doctor.id
  };
  updated.doctorCategory = updated.isAssignedDoctor ? 'assigned' : 'specialist';
  upsertRecord('doctors', id, updated);
  return updated;
}

function removeDoctor(id, canDelete) {
  if (!canDelete) return false;
  deleteRecord('doctors', id);
  return true;
}

function listTemplates() {
  return listRecords('templates');
}

function listExams() {
  return listRecords('exams').map(normalizeExamImages);
}

function getExam(id) {
  const exam = getRecord('exams', id);
  return normalizeExamImages(exam);
}

function createExam(payload) {
  const now = new Date().toISOString();
  const settings = getSettings();
  const nextExamNumber = settings.nextExamNumber || 1;
  const generatedExamId = formatCode(settings.examCodePrefix, nextExamNumber);
  const shouldAutoIncrement = !payload.id || payload.id === generatedExamId;
  const examId = payload.id?.trim() || generatedExamId;
  const examNumber = payload.examNumber || generatedExamId;
  const updatedSettings = {
    ...settings,
    nextExamNumber: shouldAutoIncrement ? nextExamNumber + 1 : settings.nextExamNumber
  };
  saveSettings(updatedSettings);
  const exam = { ...payload, id: examId, examNumber, createdAt: now, updatedAt: now };
  upsertRecord('exams', examId, exam);
  return exam;
}

function updateExam(id, payload) {
  const exam = getExam(id);
  if (!exam) return null;
  const updated = { ...exam, ...payload, updatedAt: new Date().toISOString() };
  upsertRecord('exams', id, updated);
  return updated;
}

function removeExam(id, canDelete) {
  if (!canDelete) return false;
  deleteRecord('exams', id);
  return true;
}

function resetCoreData() {
  const defaults = getDefaultData();
  const currentSettings = getSettings();
  resetTable('patients');
  resetTable('exams');
  resetTable('doctors', defaults.doctors);
  resetTable('templates', defaults.templates);
  resetTable('users', defaults.users.map((user, index) => ({ id: user.username || `user_${index}`, ...user })));
  saveSettings({
    ...defaults.settings,
    ...currentSettings,
    nextPatientNumber: 1,
    nextExamNumber: 1,
    nextDoctorNumber: 1
  });
}

function extractNumberFromId(id, prefix) {
  if (!id) return 0;
  const withoutPrefix = prefix && id.startsWith(prefix) ? id.slice(prefix.length) : id;
  const match = withoutPrefix.match(/(\d+)/);
  return match ? Number.parseInt(match[1], 10) : 0;
}

function syncSequenceCounters() {
  const settings = getSettings();
  const patients = listRecords('patients');
  const exams = listRecords('exams');
  const doctors = listRecords('doctors');

  const maxPatient = patients.reduce(
    (max, patient) => Math.max(max, extractNumberFromId(patient.id, settings.patientCodePrefix)),
    0
  );
  const maxExam = exams.reduce(
    (max, exam) => Math.max(max, extractNumberFromId(exam.id || exam.examNumber, settings.examCodePrefix)),
    0
  );
  const maxDoctor = doctors.reduce(
    (max, doctor) => Math.max(max, extractNumberFromId(doctor.id, settings.doctorCodePrefix)),
    0
  );

  const desiredPatientNext = Math.max(settings.nextPatientNumber || 1, maxPatient + 1);
  const desiredExamNext = Math.max(settings.nextExamNumber || 1, maxExam + 1);
  const desiredDoctorNext = Math.max(settings.nextDoctorNumber || 1, maxDoctor + 1);

  if (
    desiredPatientNext !== settings.nextPatientNumber ||
    desiredExamNext !== settings.nextExamNumber ||
    desiredDoctorNext !== settings.nextDoctorNumber
  ) {
    saveSettings({
      ...settings,
      nextPatientNumber: desiredPatientNext,
      nextExamNumber: desiredExamNext,
      nextDoctorNumber: desiredDoctorNext
    });
  }
}

function normalizeImagePath(pathValue) {
  if (!pathValue) return pathValue;
  const cleaned = String(pathValue).replace(/^\/+/, '').replace(/^\\+/, '').replace(/\\/g, '/');
  const lower = cleaned.toLowerCase();
  const dbIndex = lower.indexOf('database/images/');
  if (dbIndex !== -1) {
    return cleaned.slice(dbIndex);
  }
  const imgIndex = lower.indexOf('images/');
  if (imgIndex !== -1) {
    return `database/${cleaned.slice(imgIndex)}`;
  }
  return cleaned;
}

function normalizeExamImages(exam) {
  if (!exam) return exam;
  const images = (exam.images || []).map((image) => {
    if (!image) return image;
    if (typeof image === 'string') {
      return normalizeImagePath(image);
    }
    if (image.path) {
      return { ...image, path: normalizeImagePath(image.path) };
    }
    return image;
  });
  return { ...exam, images };
}

export {
  createExam,
  formatCode,
  getExam,
  listDoctors,
  listExams,
  listTemplates,
  createDoctor,
  updateDoctor,
  removeDoctor,
  removeExam,
  resetCoreData,
  syncSequenceCounters,
  updateExam
};
