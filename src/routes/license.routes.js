const express = require('express');
const router = express.Router();
const licenseController = require('../controllers/license.controller');

router.get('/license', licenseController.viewLicense);
router.post('/license', licenseController.activate);

module.exports = router;
