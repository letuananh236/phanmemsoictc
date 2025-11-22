const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth.middleware');
const { ensureLicense } = require('../middlewares/license.middleware');
const doctorController = require('../controllers/doctor.controller');

router.get('/doctor', ensureAuthenticated, ensureLicense, doctorController.list);
router.all('/doctor/new', ensureAuthenticated, ensureLicense, doctorController.create);
router.all('/doctor/:id/edit', ensureAuthenticated, ensureLicense, doctorController.edit);

module.exports = router;
