const examModel = require('../models/exam.model');

async function search(filters) {
  return examModel.search(filters);
}

module.exports = { search };
