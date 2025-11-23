const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth.middleware');
const { ensureLicense } = require('../middlewares/license.middleware');
const printController = require('../controllers/print.controller');

router.get('/print/:id', ensureAuthenticated, ensureLicense, printController.printExam);

module.exports = router;
