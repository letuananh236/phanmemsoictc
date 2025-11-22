const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth.middleware');
const { ensureLicense } = require('../middlewares/license.middleware');
const examController = require('../controllers/exam.controller');

router.get('/exam/new', ensureAuthenticated, ensureLicense, examController.newExam);
router.post('/exam', ensureAuthenticated, ensureLicense, examController.createExam);
router.get('/exam/:id/edit', ensureAuthenticated, ensureLicense, examController.editExam);
router.post('/exam/:id', ensureAuthenticated, ensureLicense, examController.updateExam);
router.get('/exam/:id/print', ensureAuthenticated, ensureLicense, examController.printExam);

module.exports = router;
