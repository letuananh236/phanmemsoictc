const examSearchService = require('../services/examSearch.service');

async function searchView(req, res) {
  res.render('examSearch/search', { results: null, filters: {} });
}

async function search(req, res) {
  const filters = {
    name: req.query.name || '',
    code: req.query.code || '',
    fromDate: req.query.fromDate || '',
    toDate: req.query.toDate || ''
  };
  const results = await examSearchService.search(filters);
  res.render('examSearch/search', { results, filters });
}

module.exports = { searchView, search };
