import { getDefaultData, readSettings, writeSettings } from '../db.js';

function getSettings() {
  const defaults = getDefaultData().settings;
  return readSettings(defaults);
}

function saveSettings(data) {
  writeSettings(data);
  return data;
}

function mergeSettings(partial) {
  const defaults = getDefaultData().settings;
  const current = getSettings();
  return { ...defaults, ...(current || {}), ...(partial || {}) };
}

export { getSettings, mergeSettings, saveSettings };
