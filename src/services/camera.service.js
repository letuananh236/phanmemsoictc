const fs = require('fs');
const path = require('path');
const { UPLOAD_DIR } = require('../config/app.config');
const imageModel = require('../models/image.model');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

async function saveImage(examId, file) {
  const order = (await imageModel.listByExam(examId)).length + 1;
  const fileName = `${examId}_${order}_${Date.now()}${path.extname(file.originalname || '.jpg')}`;
  const dest = path.join(UPLOAD_DIR, fileName);
  fs.writeFileSync(dest, file.buffer);
  const relative = `/public/uploads/${fileName}`;
  await imageModel.create(examId, relative, order);
  return relative;
}

module.exports = { saveImage };
