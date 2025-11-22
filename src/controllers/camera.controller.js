const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const cameraService = require('../services/camera.service');

async function captureView(req, res) {
  const examId = req.query.examId || null;
  res.render('camera/capture', { examId });
}

const uploadHandler = [upload.single('photo'), async (req, res) => {
  try {
    const path = await cameraService.saveImage(req.body.examId, req.file);
    res.json({ success: true, path });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
}];

module.exports = { captureView, uploadHandler };
