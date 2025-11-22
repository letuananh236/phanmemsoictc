async function home(req, res) {
  res.render('main/home', { user: req.session.user });
}

module.exports = { home };
