const examService = require('../services/exam.service');
const doctorService = require('../services/doctor.service');
const printService = require('../services/print.service');

function formatToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function newExam(req, res) {
  const doctors = await doctorService.listActive();
  res.render('exam/form', { exam: null, patient: null, doctors, images: [], error: null, examDateToday: formatToday() });
}

async function createExam(req, res) {
  try {
    const { full_name, birth_year, gender, address, phone, reason, doctor_id, exam_date, exam_time, description, conclusion, treatment, instruction, mark_on_image } = req.body;
    const { patient, exam } = await examService.createPatientAndExam({
      full_name,
      birth_year,
      gender,
      address,
      phone,
      reason,
      doctor_id,
      exam_date,
      exam_time,
      description,
      conclusion,
      treatment,
      instruction,
      mark_on_image: mark_on_image ? 1 : 0
    });
    if (req.body.action === 'save_print') {
      return res.redirect(`/exam/${exam.id}/print`);
    }
    return res.redirect(`/exam/${exam.id}/edit`);
  } catch (err) {
    console.error(err);
    const doctors = await doctorService.listActive();
    res.render('exam/form', { exam: null, patient: null, doctors, images: [], error: 'Không thể lưu phiếu', examDateToday: formatToday() });
  }
}

async function editExam(req, res) {
  const id = req.params.id;
  const detail = await examService.getExamDetail(id);
  if (!detail) return res.redirect('/home');
  res.render('exam/form', { exam: detail.exam, patient: detail.patient, doctors: detail.doctorList, images: detail.images, error: null, examDateToday: formatToday() });
}

async function updateExam(req, res) {
  const id = req.params.id;
  try {
    await examService.updateExam(id, {
      doctor_id: req.body.doctor_id,
      exam_date: req.body.exam_date,
      exam_time: req.body.exam_time,
      description: req.body.description,
      conclusion: req.body.conclusion,
      treatment: req.body.treatment,
      instruction: req.body.instruction,
      mark_on_image: req.body.mark_on_image ? 1 : 0
    });
    if (req.body.action === 'save_print') {
      return res.redirect(`/exam/${id}/print`);
    }
    return res.redirect(`/exam/${id}/edit`);
  } catch (err) {
    console.error(err);
    const detail = await examService.getExamDetail(id);
    res.render('exam/form', { exam: detail.exam, patient: detail.patient, doctors: detail.doctorList, images: detail.images, error: 'Không thể cập nhật', examDateToday: formatToday() });
  }
}

async function printExam(req, res) {
  const id = req.params.id;
  const data = await printService.getPrintData(id);
  if (!data) return res.redirect('/home');
  res.render('exam_print', data);
}

module.exports = { newExam, createExam, editExam, updateExam, printExam };
