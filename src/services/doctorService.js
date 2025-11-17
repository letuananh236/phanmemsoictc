import { getDb } from '../dal/db.js';
import { generateDoctorId } from './codeService.js';

export function listDoctors() {
  const db = getDb();
  return db.prepare('SELECT * FROM Doctors ORDER BY IsActive DESC, FullName').all().map((row) => ({
    id: row.DoctorID,
    name: row.FullName,
    title: row.Title,
    department: row.Department,
    signatureImagePath: row.SignatureImagePath,
    active: !!row.IsActive
  }));
}

export function saveDoctor(payload) {
  const db = getDb();
  const doctorId = payload.id || generateDoctorId();
  const existing = db.prepare('SELECT DoctorID FROM Doctors WHERE DoctorID = ?').get(doctorId);
  if (existing) {
    db.prepare(
      'UPDATE Doctors SET FullName=@FullName, Title=@Title, Department=@Department, SignatureImagePath=@SignatureImagePath, IsActive=@IsActive WHERE DoctorID=@DoctorID'
    ).run({
      DoctorID: doctorId,
      FullName: payload.name,
      Title: payload.title,
      Department: payload.department,
      SignatureImagePath: payload.signatureImagePath,
      IsActive: payload.active ? 1 : 0
    });
  } else {
    db.prepare(
      'INSERT INTO Doctors (DoctorID, FullName, Title, Department, SignatureImagePath, IsActive) VALUES (@DoctorID, @FullName, @Title, @Department, @SignatureImagePath, @IsActive)'
    ).run({
      DoctorID: doctorId,
      FullName: payload.name,
      Title: payload.title,
      Department: payload.department,
      SignatureImagePath: payload.signatureImagePath,
      IsActive: payload.active ? 1 : 0
    });
  }
  return listDoctors().find((d) => d.id === doctorId);
}

export function deleteDoctor(id) {
  const db = getDb();
  db.prepare('DELETE FROM Doctors WHERE DoctorID = ?').run(id);
  return true;
}
