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

export const paths = {
  rootDir,
  dataDir,
  databaseDir,
  imagesDir,
  configDir,
  publicDir,
  databaseFile: path.join(databaseDir, 'app.db')
};
