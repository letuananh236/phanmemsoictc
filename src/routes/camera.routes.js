const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth.middleware');
const { ensureLicense } = require('../middlewares/license.middleware');
const cameraController = require('../controllers/camera.controller');

router.get('/camera/capture', ensureAuthenticated, ensureLicense, cameraController.captureView);
router.post('/camera/upload', ensureAuthenticated, ensureLicense, ...cameraController.uploadHandler);

module.exports = router;
