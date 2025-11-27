import path from 'path';
import fsPromises from 'fs/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { getPaths, getTempDir } from './app-model.js';
import { resetCoreData } from './records-model.js';
import { ensureLicense } from './license-model.js';

const execFileAsync = promisify(execFile);

function windowsPath(p) {
  return p.replace(/\\/g, '/').replace(/\//g, '\\');
}

async function copyDirectory(source, destination) {
  await fsPromises.mkdir(destination, { recursive: true });
  const entries = await fsPromises.readdir(source, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const srcPath = path.join(source, entry.name);
      const destPath = path.join(destination, entry.name);
      if (entry.isDirectory()) {
        await copyDirectory(srcPath, destPath);
      } else if (entry.isFile()) {
        await fsPromises.copyFile(srcPath, destPath);
      }
    })
  );
}

async function createZipBuffer() {
  const { rootDir } = getPaths();
  const tempDir = await getTempDir('pmzip-');
  const zipPath = path.join(tempDir, 'backup.zip');
  if (process.platform === 'win32') {
    const script = `Compress-Archive -Path '${windowsPath(path.join(rootDir, 'data', '*'))}' -DestinationPath '${windowsPath(zipPath)}' -Force`;
    await execFileAsync('powershell', ['-NoLogo', '-Command', script]);
  } else {
    await execFileAsync('zip', ['-r', zipPath, 'data'], { cwd: rootDir });
  }
  const buffer = await fsPromises.readFile(zipPath);
  await fsPromises.rm(tempDir, { recursive: true, force: true });
  return buffer;
}

async function extractZipBuffer(buffer) {
  const { rootDir, dataDir } = getPaths();
  const tempDir = await getTempDir('pmzip-');
  const zipPath = path.join(tempDir, 'upload.zip');
  await fsPromises.writeFile(zipPath, buffer);
  const extractDir = path.join(tempDir, 'extracted');
  await fsPromises.mkdir(extractDir);
  if (process.platform === 'win32') {
    const script = `Expand-Archive -Path '${windowsPath(zipPath)}' -DestinationPath '${windowsPath(extractDir)}' -Force`;
    await execFileAsync('powershell', ['-NoLogo', '-Command', script]);
  } else {
    await execFileAsync('unzip', ['-o', zipPath, '-d', extractDir]);
  }
  const extractedData = path.join(extractDir, 'data');
  const stats = await fsPromises.stat(extractedData).catch(() => null);
  if (!stats) {
    throw new Error('invalid_backup');
  }
  await fsPromises.rm(dataDir, { recursive: true, force: true });
  await copyDirectory(extractedData, dataDir);
  await fsPromises.rm(tempDir, { recursive: true, force: true });
}

async function clearAllData() {
  const { imagesDir } = getPaths();
  await fsPromises.rm(imagesDir, { recursive: true, force: true });
  await fsPromises.mkdir(imagesDir, { recursive: true });
  resetCoreData();
  await ensureLicense();
}

export { clearAllData, createZipBuffer, extractZipBuffer };
