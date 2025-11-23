const doctorService = require('../services/doctor.service');

async function list(req, res) {
  const doctors = await doctorService.listAll();
  res.render('doctor/list', { doctors });
}

async function create(req, res) {
  if (req.method === 'POST') {
    await doctorService.create({ name: req.body.name, position: req.body.position, status: req.body.status ? 1 : 0 });
    return res.redirect('/doctor');
  }
  res.render('doctor/form', { doctor: null });
}

async function edit(req, res) {
  const doctors = await doctorService.listAll();
  const doc = doctors.find((d) => d.id === parseInt(req.params.id, 10));
  if (req.method === 'POST') {
    await doctorService.update(req.params.id, { name: req.body.name, position: req.body.position, status: req.body.status ? 1 : 0 });
    return res.redirect('/doctor');
  }
  res.render('doctor/form', { doctor: doc });
}

module.exports = { list, create, edit };
