const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth.middleware');
const { ensureLicense } = require('../middlewares/license.middleware');
const mainController = require('../controllers/main.controller');

router.get('/home', ensureAuthenticated, ensureLicense, mainController.home);

module.exports = router;
