import { getDb } from '../dal/db.js';
import { getConfigValue } from './configService.js';

function nextCode(table, column, prefix) {
  const db = getDb();
  const stmt = db.prepare(
    'SELECT MAX(CAST(SUBSTR(' + column + ', ?) AS INTEGER)) as maxCode FROM ' + table + ' WHERE ' + column + ' LIKE ?'
  );
  const prefixLength = prefix.length + 1;
  const row = stmt.get(prefixLength, `${prefix}%`);
  const next = (row?.maxCode || 0) + 1;
  return `${prefix}${String(next).padStart(5, '0')}`;
}

export function generatePatientId() {
  const prefix = getConfigValue('patientCodePrefix', 'BN');
  return nextCode('Patients', 'PatientID', prefix);
}

export function generateExamId() {
  const prefix = getConfigValue('examCodePrefix', 'HA');
  return nextCode('Examinations', 'ExamID', prefix);
}
