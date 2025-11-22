const patientModel = require('../models/patient.model');
const examModel = require('../models/exam.model');
const imageModel = require('../models/image.model');
const doctorModel = require('../models/doctor.model');

function nextCode(prefix, latest) {
  const num = latest ? parseInt(latest.replace(prefix, ''), 10) + 1 : 1;
  return `${prefix}${num.toString().padStart(5, '0')}`;
}

async function createPatientAndExam(data) {
  const latestPatient = await patientModel.getLatestCode();
  const patientCode = nextCode('BN', latestPatient);
  const patient = await patientModel.create({
    code: patientCode,
    full_name: data.full_name,
    birth_year: data.birth_year,
    gender: data.gender,
    address: data.address,
    phone: data.phone,
    reason: data.reason
  });

  const latestExam = await examModel.getLatestCode();
  const ticketCode = nextCode('HA', latestExam);
  const exam = await examModel.create({
    ticket_code: ticketCode,
    patient_id: patient.id,
    doctor_id: data.doctor_id,
    exam_date: data.exam_date,
    exam_time: data.exam_time,
    description: data.description,
    conclusion: data.conclusion,
    treatment: data.treatment,
    instruction: data.instruction,
    mark_on_image: data.mark_on_image
  });

  return { patient, exam };
}

async function updateExam(id, data) {
  await examModel.update(id, data);
}

async function getExamDetail(id) {
  const exam = await examModel.findById(id);
  if (!exam) return null;
  const patient = await patientModel.findById(exam.patient_id);
  const doctorList = await doctorModel.listActive();
  const images = await imageModel.listByExam(id);
  return { exam, patient, doctorList, images };
}

module.exports = { createPatientAndExam, updateExam, getExamDetail };
