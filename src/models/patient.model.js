import { deleteRecord, getRecord, listRecords, upsertRecord } from '../db.js';
import { getSettings, saveSettings } from './settings.model.js';
import { formatCode } from './exam.model.js';

function listPatients() {
  return listRecords('patients');
}

function getPatient(id) {
  return getRecord('patients', id);
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

export { createPatient, getPatient, listPatients, removePatient, updatePatient };
