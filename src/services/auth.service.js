const bcrypt = require('bcryptjs');
const userModel = require('../models/user.model');

userModel.initAdmin();

async function authenticate(username, password) {
  const user = await userModel.findByUsername(username);
  if (!user || !user.active) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return null;
  return { id: user.id, username: user.username, role: user.role };
}

module.exports = { authenticate };
