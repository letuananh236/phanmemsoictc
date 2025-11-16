import { fileURLToPath } from 'url';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const assetsDir = path.join(rootDir, 'public', 'assets');
const logoPath = path.join(assetsDir, 'logo-default.png');

const base64Logo =
  'iVBORw0KGgoAAAANSUhEUgAAAEAAAAAgCAYAAABU0VYjAAAABHNCSVQICAgIfAhkiAAAAFZJREFUWIXt0TEOwEAQwMC7551sPZCBIVBV4AZOfkaA9a0tPAINl6ZnfXg1VVVVVVVX1Gzqr1X5lH4QyGUTKGUTKGUTKGUTKGUTKGUTKGUTKGUTKGUTKGUTKGUTKGUTKGUTKGUTKGUTKGeQfZih1oEF5u2EAAAAASUVORK5CYII=';

async function ensureLogo() {
  await mkdir(assetsDir, { recursive: true });
  if (fs.existsSync(logoPath)) {
    return;
  }
  await writeFile(logoPath, Buffer.from(base64Logo, 'base64'));
  console.log('Đã tạo logo mặc định từ script.');
}

ensureLogo().catch((error) => {
  console.error('Không thể tạo logo mặc định:', error);
  process.exit(1);
});
