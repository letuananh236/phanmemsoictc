const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth.middleware');
const { ensureLicense } = require('../middlewares/license.middleware');
const examSearchController = require('../controllers/examSearch.controller');

router.get('/exam-search', ensureAuthenticated, ensureLicense, examSearchController.searchView);
router.get('/exam-search/results', ensureAuthenticated, ensureLicense, examSearchController.search);

module.exports = router;
