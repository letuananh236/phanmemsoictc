import { fileURLToPath } from 'url';
import path from 'path';
import { mkdir, writeFile, access } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const iconDir = path.join(rootDir, 'build');
const iconPath = path.join(iconDir, 'icon.ico');

const ICON_BASE64 =
  'AAABAAEAAQEAAAEAIABDAAAAFgAAAIlQTkcNChoKAAAADUlIRFIAAAABAAAAAQgEAAAAtRwMAgAAAAtJREFUeJxjAAEAAAUAAQ0KLbQAAAAASUVORK5CYII=';

async function ensureIcon() {
  try {
    await access(iconPath);
    return;
  } catch {
    // continue to create
  }
  await mkdir(iconDir, { recursive: true });
  const iconBuffer = Buffer.from(ICON_BASE64, 'base64');
  await writeFile(iconPath, iconBuffer);
}

ensureIcon().catch((error) => {
  console.error('Lỗi tạo icon ứng dụng:', error);
  process.exit(1);
});
