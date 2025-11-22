const doctorModel = require('../models/doctor.model');

async function listActive() {
  return doctorModel.listActive();
}

async function listAll() { return doctorModel.listAll(); }
async function create(data) { return doctorModel.create(data); }
async function update(id, data) { return doctorModel.update(id, data); }

module.exports = { listActive, listAll, create, update };
