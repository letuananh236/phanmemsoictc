const express = require('express');
const multer = require('multer');
const router = express.Router();
const { ensureAuthenticated } = require('../middlewares/auth.middleware');
const { ensureLicense } = require('../middlewares/license.middleware');
const cameraController = require('../controllers/camera.controller');

const upload = multer({ storage: multer.memoryStorage() });

// Legacy entry redirected appropriately
router.get('/camera/capture', ensureAuthenticated, ensureLicense, (req, res) => {
  const targetId = req.query.examId || 'session';
  res.redirect(`/camera/${targetId}`);
});

router.get('/camera/:examId', ensureAuthenticated, ensureLicense, cameraController.showCaptureForm);
router.post('/camera/:examId/capture', ensureAuthenticated, ensureLicense, upload.single('image'), cameraController.captureImage);
router.post('/camera/:examId/confirm', ensureAuthenticated, ensureLicense, cameraController.confirmSelectedImages);

module.exports = router;
