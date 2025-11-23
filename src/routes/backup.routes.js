const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth.middleware');
const { ensureLicense } = require('../middlewares/license.middleware');
const backupController = require('../controllers/backup.controller');

router.get('/backup', ensureAuthenticated, ensureLicense, backupController.viewPage);
router.post('/backup/create', ensureAuthenticated, ensureLicense, backupController.createBackup);

module.exports = router;
