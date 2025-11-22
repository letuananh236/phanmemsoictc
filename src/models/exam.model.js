const db = require('../config/db.config');

function getLatestCode() {
  return new Promise((resolve, reject) => {
    db.get('SELECT ticket_code FROM exams ORDER BY id DESC LIMIT 1', [], (err, row) => {
      if (err) return reject(err);
      resolve(row ? row.ticket_code : null);
    });
  });
}

function create(exam) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO exams(ticket_code, patient_id, doctor_id, exam_date, exam_time, description, conclusion, treatment, instruction, mark_on_image)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        exam.ticket_code,
        exam.patient_id,
        exam.doctor_id || null,
        exam.exam_date,
        exam.exam_time || '',
        exam.description || '',
        exam.conclusion || '',
        exam.treatment || '',
        exam.instruction || '',
        exam.mark_on_image ? 1 : 0
      ],
      function(err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, ...exam });
      }
    );
  });
}

function update(id, exam) {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE exams SET doctor_id=?, exam_date=?, exam_time=?, description=?, conclusion=?, treatment=?, instruction=?, mark_on_image=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      [
        exam.doctor_id || null,
        exam.exam_date,
        exam.exam_time || '',
        exam.description || '',
        exam.conclusion || '',
        exam.treatment || '',
        exam.instruction || '',
        exam.mark_on_image ? 1 : 0,
        id
      ],
      function(err) {
        if (err) return reject(err);
        resolve();
      }
    );
  });
}

function findById(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM exams WHERE id=?', [id], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function search(filters) {
  return new Promise((resolve, reject) => {
    const params = [];
    let sql = `SELECT exams.*, patients.code as patient_code, patients.full_name, doctors.name as doctor_name FROM exams
      JOIN patients ON exams.patient_id = patients.id
      LEFT JOIN doctors ON exams.doctor_id = doctors.id WHERE 1=1`;
    if (filters.name) {
      sql += ' AND patients.full_name LIKE ?';
      params.push(`%${filters.name}%`);
    }
    if (filters.code) {
      sql += ' AND patients.code LIKE ?';
      params.push(`%${filters.code}%`);
    }
    if (filters.fromDate) {
      sql += ' AND exam_date >= ?';
      params.push(filters.fromDate);
    }
    if (filters.toDate) {
      sql += ' AND exam_date <= ?';
      params.push(filters.toDate);
    }
    db.all(sql + ' ORDER BY exam_date DESC, exams.id DESC', params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

module.exports = { getLatestCode, create, update, findById, search };
