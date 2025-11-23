const fs = require('fs');
const path = require('path');
const { UPLOAD_DIR } = require('../config/app.config');
const imageModel = require('../models/image.model');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function bufferFromPayload(payload) {
  if (!payload) return null;
  if (Buffer.isBuffer(payload)) return payload;
  if (typeof payload === 'string') {
    const base64 = payload.startsWith('data:') ? payload.split(',')[1] : payload;
    return Buffer.from(base64, 'base64');
  }
  return null;
}

async function saveImageBuffer(examId, payload) {
  const buffer = bufferFromPayload(payload);
  if (!buffer) {
    throw new Error('No image payload provided');
  }
  const safeExam = examId || 'session';
  const folder = ensureDir(path.join(UPLOAD_DIR, 'exams', safeExam.toString()));
  const fileName = `${Date.now()}.jpg`;
  const dest = path.join(folder, fileName);
  await fs.promises.writeFile(dest, buffer);
  const relativePath = `/uploads/exams/${safeExam}/${fileName}`;
  const record = await imageModel.create({ examId: examId || null, filePath: relativePath });
  return record;
}

async function getImagesForExam(examId) {
  if (examId) {
    return imageModel.listForCapture(examId, 10);
  }
  return imageModel.listUnassigned(10);
}

async function assignImagesToExam(examId, imageIds) {
  if (!examId || !imageIds || !imageIds.length) return;
  await imageModel.assignToExam(examId, imageIds);
}

async function deleteImage(imageId) {
  const image = await imageModel.findById(imageId);
  if (!image) return false;
  if (image.exam_id) return false;

  const absolute = path.join(__dirname, '..', '..', 'public', image.file_path.replace(/^\//, ''));
  try {
    if (fs.existsSync(absolute)) {
      await fs.promises.unlink(absolute);
    }
  } catch (err) {
    console.error('delete file error', err);
  }
  await imageModel.remove(imageId);
  return true;
}

async function retakeImage(examId, imageId, payload) {
  const buffer = bufferFromPayload(payload);
  if (!buffer) throw new Error('No image payload provided');

  const image = await imageModel.findById(imageId);
  if (!image) throw new Error('NOT_FOUND');
  if (image.exam_id) throw new Error('IMAGE_SELECTED');

  const absolute = path.join(__dirname, '..', '..', 'public', image.file_path.replace(/^\//, ''));
  ensureDir(path.dirname(absolute));
  await fs.promises.writeFile(absolute, buffer);
  await imageModel.touch(imageId);
  return { ...image, file_path: image.file_path };
}

module.exports = {
  saveImageBuffer,
  getImagesForExam,
  assignImagesToExam,
  deleteImage,
  retakeImage
};
