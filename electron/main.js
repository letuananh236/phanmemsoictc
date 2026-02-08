import { app, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs/promises';

const PORT = process.env.PORT || 3000;
let server;
let mainWindow;

async function startServer() {
  if (server) return;
  if (!process.env.APP_DATA_DIR) {
    process.env.APP_DATA_DIR = path.join(app.getPath('userData'), 'database');
  }
  await copyBundledIntroImages(process.env.APP_DATA_DIR);
  const { createServer } = await import('../src/app.js');
  const httpServer = createServer();
  await new Promise((resolve, reject) => {
    httpServer
      .listen(PORT, resolve)
      .on('error', reject);
  });
  server = httpServer;
}

async function copyBundledIntroImages(dataDir) {
  const introCandidates = app.isPackaged
    ? [path.join(process.resourcesPath, 'intro'), path.join(app.getAppPath(), 'intro')]
    : [path.join(app.getAppPath(), 'intro')];
  const logoDir = path.join(dataDir, 'logo');
  const files = ['Picture1.png', 'Picture2.png'];
  try {
    await fs.mkdir(logoDir, { recursive: true });
  } catch {
    return;
  }
  await Promise.all(
    files.map(async (fileName) => {
      const source = await resolveIntroAsset(introCandidates, fileName);
      const target = path.join(logoDir, fileName);
      try {
        const stat = await fs.stat(target);
        if (stat.size > 0) {
          return;
        }
      } catch {
        // continue
      }
      if (!source) {
        return;
      }
      try {
        await fs.copyFile(source, target);
      } catch {
        // ignore missing bundled files
      }
    })
  );
}

async function resolveIntroAsset(introDirs, fileName) {
  for (const dir of introDirs) {
    const candidate = path.join(dir, fileName);
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // try next
    }
  }
  return null;
}

async function createWindow() {
  await startServer();
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.setMenuBarVisibility(false);
  mainWindow.setMenu(null);
  const startUrl = process.env.ELECTRON_START_URL || `http://localhost:${PORT}`;
  await mainWindow.loadURL(startUrl);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (server) {
    server.close();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
