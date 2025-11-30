import { app, BrowserWindow } from 'electron';
import path from 'path';

const PORT = process.env.PORT || 3000;
let server;
let mainWindow;

async function startServer() {
  if (server) return;
  if (!process.env.APP_DATA_DIR) {
    process.env.APP_DATA_DIR = path.join(app.getPath('userData'), 'database');
  }
  const { createServer } = await import('../src/app.js');
  const httpServer = createServer();
  await new Promise((resolve, reject) => {
    httpServer
      .listen(PORT, resolve)
      .on('error', reject);
  });
  server = httpServer;
}

async function createWindow() {
  await startServer();
  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });
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
