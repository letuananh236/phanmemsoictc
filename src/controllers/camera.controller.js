const cameraService = require('../services/camera.service');

async function showCaptureForm(req, res) {
  const examId = req.params.examId && req.params.examId !== 'session' ? req.params.examId : '';
  const images = await cameraService.getImagesForExam(examId);
  res.render('camera/capture', { examId, images });
}

async function captureImage(req, res) {
  try {
    const examId = req.params.examId && req.params.examId !== 'session' ? req.params.examId : '';
    const payload = req.file ? req.file.buffer : req.body.image;
    const image = await cameraService.saveImageBuffer(examId, payload);
    return res.json({ success: true, image: { id: image.id, filePath: image.file_path, examId: image.exam_id } });
  } catch (err) {
    console.error('captureImage error', err);
    return res.status(500).json({ success: false, message: 'Không thể lưu ảnh' });
  }
}

async function confirmSelectedImages(req, res) {
  const examId = req.params.examId;
  if (!examId || examId === 'session') {
    return res.redirect('/exam/new');
  }
  try {
    const ids = (req.body.selectedImages || '')
      .split(',')
      .map((id) => parseInt(id, 10))
      .filter((id) => !Number.isNaN(id));
    await cameraService.assignImagesToExam(examId, ids);
    return res.redirect(`/exam/${examId}/edit`);
  } catch (err) {
    console.error('confirmSelectedImages error', err);
    return res.redirect(`/camera/${examId}`);
  }
}

async function deleteImage(req, res) {
  try {
    const imageId = parseInt(req.params.imageId, 10);
    if (Number.isNaN(imageId)) {
      return res.status(400).json({ success: false, error: 'INVALID_ID' });
    }
    const removed = await cameraService.deleteImage(imageId);
    if (!removed) {
      return res.status(400).json({ success: false, error: 'CANNOT_DELETE' });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('deleteImage error', err);
    return res.status(500).json({ success: false, error: 'DELETE_FAILED' });
  }
}

async function retakeImage(req, res) {
  try {
    const examId = req.params.examId && req.params.examId !== 'session' ? req.params.examId : '';
    const imageId = parseInt(req.params.imageId, 10);
    if (Number.isNaN(imageId)) {
      return res.status(400).json({ success: false, error: 'INVALID_ID' });
    }
    const payload = req.file ? req.file.buffer : req.body.image;
    const updated = await cameraService.retakeImage(examId, imageId, payload);
    return res.json({ success: true, image: { id: updated.id, filePath: updated.file_path } });
  } catch (err) {
    console.error('retakeImage error', err);
    return res.status(500).json({ success: false, error: 'RETAKE_FAILED' });
  }
}

module.exports = {
  showCaptureForm,
  captureImage,
  confirmSelectedImages,
  deleteImage,
  retakeImage
};
