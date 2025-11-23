const { formatDate } = require('./date.helper');

function buildPrintData(exam, patient, doctor, images, config) {
  return {
    clinic: config || {},
    exam,
    patient,
    doctor,
    images,
    formattedDate: formatDate(exam.exam_date || new Date())
  };
}

module.exports = { buildPrintData };
