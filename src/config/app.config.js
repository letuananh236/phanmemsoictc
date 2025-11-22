const path = require('path');

module.exports = {
  PORT: process.env.PORT || 3000,
  SESSION_SECRET: process.env.SESSION_SECRET || 'ctc-secret',
  DATABASE_FILE: path.join(__dirname, '..', 'database', 'clinic.db'),
  SCHEMA_FILE: path.join(__dirname, '..', 'database', 'schema.sql'),
  UPLOAD_DIR: path.join(__dirname, '..', '..', 'public', 'uploads'),
  LOG_DIR: path.join(__dirname, '..', '..', 'logs')
};
