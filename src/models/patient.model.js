const db = require('../config/db.config');

function getLatestCode() {
  return new Promise((resolve, reject) => {
    db.get('SELECT code FROM patients ORDER BY id DESC LIMIT 1', [], (err, row) => {
      if (err) return reject(err);
      resolve(row ? row.code : null);
    });
  });
}

function create(patient) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO patients(code, full_name, birth_year, gender, address, phone, reason) VALUES (?,?,?,?,?,?,?)',
      [patient.code, patient.full_name, patient.birth_year, patient.gender, patient.address, patient.phone, patient.reason],
      function(err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, ...patient });
      }
    );
  });
}

function findById(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM patients WHERE id=?', [id], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

module.exports = { getLatestCode, create, findById };
