import { getSettings as getStoredSettings, saveSettings as saveStoredSettings } from './database.js';
import { getDefaultData } from './app-model.js';

function getSettings() {
  return getStoredSettings(getDefaultData().settings);
}

function saveSettings(data) {
  return saveStoredSettings(data);
}

function mergeSettings(partial) {
  const current = getSettings();
  return { ...getDefaultData().settings, ...(current || {}), ...(partial || {}) };
}

export { getSettings, saveSettings, mergeSettings };
