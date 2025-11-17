import { getDb } from '../dal/db.js';
import { generatePatientId } from './codeService.js';

function dobFromAge(age) {
  if (!age || Number.isNaN(Number(age))) return null;
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear() - age, 0, 1)).toISOString().slice(0, 10);
}

function ageFromDob(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const m = now.getUTCMonth() - birth.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < birth.getUTCDate())) {
    age -= 1;
  }
  return age;
}

function mapRow(row) {
  return {
    id: row.PatientID,
    name: row.FullName,
    gender: row.Gender,
    dob: row.DOB,
    age: row.Age ?? ageFromDob(row.DOB),
    phone: row.Phone,
    address: row.Address,
    reason: row.Reason,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt
  };
}

export function listPatients() {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM Patients ORDER BY CreatedAt DESC').all();
  return rows.map(mapRow);
}

export function getPatient(patientId) {
  const db = getDb();
  const row = db.prepare('SELECT * FROM Patients WHERE PatientID = ?').get(patientId);
  return row ? mapRow(row) : null;
}

export function savePatient(payload) {
  const db = getDb();
  const now = new Date().toISOString();
  const patientId = payload.id || generatePatientId();
  const existing = getPatient(patientId);
  if (existing) {
    db.prepare(
      `UPDATE Patients SET FullName=@FullName, Gender=@Gender, DOB=@DOB, Age=@Age, Phone=@Phone, Address=@Address, Reason=@Reason, UpdatedAt=@UpdatedAt WHERE PatientID=@PatientID`
    ).run({
      PatientID: patientId,
      FullName: payload.name,
      Gender: payload.gender,
      DOB: payload.dob || dobFromAge(payload.age),
      Age: payload.age ?? null,
      Phone: payload.phone,
      Address: payload.address,
      Reason: payload.reason,
      UpdatedAt: now
    });
  } else {
    db.prepare(
      `INSERT INTO Patients (PatientID, FullName, Gender, DOB, Age, Phone, Address, Reason, CreatedAt, UpdatedAt) VALUES (@PatientID, @FullName, @Gender, @DOB, @Age, @Phone, @Address, @Reason, @CreatedAt, @UpdatedAt)`
    ).run({
      PatientID: patientId,
      FullName: payload.name,
      Gender: payload.gender,
      DOB: payload.dob || dobFromAge(payload.age),
      Age: payload.age ?? null,
      Phone: payload.phone,
      Address: payload.address,
      Reason: payload.reason,
      CreatedAt: now,
      UpdatedAt: now
    });
  }
  return getPatient(patientId);
}

export function deletePatient(patientId) {
  const db = getDb();
  db.prepare('DELETE FROM Patients WHERE PatientID = ?').run(patientId);
  return true;
}
