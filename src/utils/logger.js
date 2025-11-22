const fs = require('fs');
const path = require('path');
const { LOG_DIR } = require('../config/app.config');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFile(path.join(LOG_DIR, 'app.log'), line, () => {});
  console.log(message);
}

module.exports = { log };
