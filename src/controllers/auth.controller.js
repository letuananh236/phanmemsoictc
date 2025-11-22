const authService = require('../services/auth.service');

async function showLogin(req, res) {
  res.render('auth/login', { error: null, layout: false });
}

async function login(req, res) {
  const { username, password } = req.body;
  const user = await authService.authenticate(username, password);
  if (!user) {
    return res.render('auth/login', { error: 'Sai tài khoản hoặc mật khẩu', layout: false });
  }
  req.session.user = user;
  return res.redirect('/home');
}

function logout(req, res) {
  req.session.destroy(() => {
    res.redirect('/login');
  });
}

module.exports = { showLogin, login, logout };
