const examModel = require('../models/exam.model');
const patientModel = require('../models/patient.model');
const doctorModel = require('../models/doctor.model');
const imageModel = require('../models/image.model');
const configModel = require('../models/config.model');
const { buildPrintData } = require('../utils/print.helper');

async function getPrintData(examId) {
  const exam = await examModel.findById(examId);
  if (!exam) return null;
  const patient = await patientModel.findById(exam.patient_id);
  const doctor = exam.doctor_id ? await doctorModel.listAll().then((list) => list.find((d) => d.id === exam.doctor_id)) : null;
  const images = await imageModel.listByExam(examId);
  const config = await configModel.getAll();
  return buildPrintData(exam, patient, doctor, images, config);
}

module.exports = { getPrintData };
