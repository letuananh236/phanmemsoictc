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

module.exports = {
  showCaptureForm,
  captureImage,
  confirmSelectedImages
};
