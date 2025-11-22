const printService = require('../services/print.service');

async function printExam(req, res) {
  const data = await printService.getPrintData(req.params.id);
  if (!data) return res.redirect('/exam-search');
  res.render('exam_print', data);
}

module.exports = { printExam };
