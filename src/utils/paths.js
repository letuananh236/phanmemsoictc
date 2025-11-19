import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..', '..');
const dataDir = path.join(rootDir, 'Data');
const databaseDir = path.join(dataDir, 'Database');
const imagesDir = path.join(dataDir, 'Images');
const configDir = path.join(dataDir, 'Config');
const publicDir = path.join(rootDir, 'public');
const assetsDir = path.join(publicDir, 'assets');
const srsFile = path.join(rootDir, 'SRS_UML_Offline_CTC.md');
const readmeFile = path.join(rootDir, 'README.md');
const promptSrsFile = path.join(rootDir, 'PROMPT_Codex_SRS_UML.md');

export const paths = {
  rootDir,
  dataDir,
  databaseDir,
  imagesDir,
  configDir,
  publicDir,
  assetsDir,
  databaseFile: path.join(databaseDir, 'app.db'),
  srsFile,
  readmeFile,
  promptSrsFile
};
