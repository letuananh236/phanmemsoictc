const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth.middleware');
const { ensureLicense } = require('../middlewares/license.middleware');
const aboutController = require('../controllers/about.controller');

router.get('/about', ensureAuthenticated, ensureLicense, aboutController.viewAbout);

module.exports = router;
