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
    return imageModel.listForCapture(examId);
  }
  return imageModel.listUnassigned();
}

async function assignImagesToExam(examId, imageIds) {
  if (!examId || !imageIds || !imageIds.length) return;
  await imageModel.assignToExam(examId, imageIds);
}

module.exports = {
  saveImageBuffer,
  getImagesForExam,
  assignImagesToExam
};
