const configModel = require('../models/config.model');

async function getAll() { return configModel.getAll(); }
async function set(key, value) { return configModel.setConfig(key, value); }

module.exports = { getAll, set };
