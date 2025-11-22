const aboutService = require('../services/about.service');

async function viewAbout(req, res) {
  const info = aboutService.getInfo();
  res.render('about/about', { info });
}

module.exports = { viewAbout };
