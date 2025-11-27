import { deleteRecord, getDefaultData, getRecord, listRecords, resetTable, upsertRecord } from '../db.js';
import { getSettings, saveSettings } from './settings.model.js';

function formatCode(prefix, number) {
  const safePrefix = prefix || '';
  const seq = Number.parseInt(number, 10) || 1;
  return `${safePrefix}${String(seq).padStart(5, '0')}`;
}

function listDoctors() {
  return listRecords('doctors');
}

function createDoctor(payload) {
  const id = (payload.id || '').trim();
  const name = (payload.name || '').trim();
  if (!id || !name) return { error: 'invalid_doctor' };
  const exists = getRecord('doctors', id);
  if (exists) return { error: 'doctor_exists' };
  const doctor = { id, name, active: payload.active !== false };
  upsertRecord('doctors', id, doctor);
  return doctor;
}

function updateDoctor(id, payload) {
  const doctor = getRecord('doctors', id);
  if (!doctor) return null;
  const updated = { ...doctor, ...payload, id: doctor.id };
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
  return listRecords('exams');
}

function getExam(id) {
  return getRecord('exams', id);
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
    nextExamNumber: 1
  });
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
  updateExam
};
