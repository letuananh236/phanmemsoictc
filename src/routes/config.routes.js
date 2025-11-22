const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth.middleware');
const { ensureLicense } = require('../middlewares/license.middleware');
const configController = require('../controllers/config.controller');

router.all('/config/system', ensureAuthenticated, ensureLicense, configController.systemConfig);

module.exports = router;
