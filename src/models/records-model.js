import { listRecords, getRecord, upsertRecord, deleteRecord, resetTable } from './database.js';
import { getSettings, saveSettings } from './settings-model.js';
import { getDefaultData } from './app-model.js';

function formatCode(prefix, number) {
  const safePrefix = prefix || '';
  const seq = Number.parseInt(number, 10) || 1;
  return `${safePrefix}${String(seq).padStart(5, '0')}`;
}

function listPatients() {
  return listRecords('patients');
}

function listDoctors() {
  return listRecords('doctors');
}

function listTemplates() {
  return listRecords('templates');
}

function getPatient(id) {
  return getRecord('patients', id);
}

function getExam(id) {
  return getRecord('exams', id);
}

function listExams() {
  return listRecords('exams');
}

function listUsers() {
  return listRecords('users');
}

function createPatient(payload) {
  const settings = getSettings();
  const nextPatientNumber = settings.nextPatientNumber || 1;
  const generatedId = formatCode(settings.patientCodePrefix, nextPatientNumber);
  const shouldAutoIncrement = !payload.id || payload.id === generatedId;
  const assignedId = payload.id?.trim() || generatedId;
  const updatedSettings = {
    ...settings,
    nextPatientNumber: shouldAutoIncrement ? nextPatientNumber + 1 : settings.nextPatientNumber
  };
  saveSettings(updatedSettings);
  const patient = { ...payload, id: assignedId, createdAt: new Date().toISOString() };
  upsertRecord('patients', assignedId, patient);
  return patient;
}

function updatePatient(id, payload) {
  const patient = getPatient(id);
  if (!patient) return null;
  const updated = { ...patient, ...payload };
  upsertRecord('patients', id, updated);
  return updated;
}

function removePatient(id, canDelete) {
  if (!canDelete) return false;
  deleteRecord('patients', id);
  return true;
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

function addUser(payload) {
  const users = listUsers();
  if (!payload?.username || !payload?.password) return { error: 'invalid_user' };
  if (users.some((u) => u.username === payload.username)) {
    return { error: 'user_exists' };
  }
  const record = { id: payload.username, username: payload.username, password: payload.password };
  upsertRecord('users', record.id, record);
  return { username: payload.username };
}

function resetCoreData() {
  const defaults = getDefaultData();
  const currentSettings = getSettings();
  resetTable('patients');
  resetTable('exams');
  resetTable('doctors', defaults.doctors);
  resetTable('templates', defaults.templates);
  resetTable('users', defaults.users.map((user) => ({ id: user.username, ...user })));
  saveSettings({
    ...defaults.settings,
    ...currentSettings,
    nextPatientNumber: 1,
    nextExamNumber: 1
  });
}

export {
  addUser,
  createExam,
  createPatient,
  formatCode,
  getExam,
  getPatient,
  listDoctors,
  listExams,
  listPatients,
  listTemplates,
  listUsers,
  removeExam,
  removePatient,
  resetCoreData,
  updateExam,
  updatePatient
};
