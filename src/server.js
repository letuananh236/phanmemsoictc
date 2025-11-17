import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { paths } from './utils/paths.js';
import { ensureDir } from './utils/fs.js';
import { handleApi } from './api/router.js';
import { ensureSeedData } from './dal/db.js';
import { ensureLicense } from './services/licenseService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function normalizePath(requestPath) {
  const safePath = requestPath.replace(/\.\./g, '');
  if (safePath === '/' || safePath === '') return 'index.html';
  return safePath.replace(/^\//, '');
}

function serveStatic(res, requestPath) {
  try {
    const relative = normalizePath(requestPath);
    const filePath = path.join(paths.publicDir, relative);
    if (!filePath.startsWith(paths.publicDir)) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'forbidden' }));
      return;
    }
    let finalPath = filePath;
    try {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        finalPath = path.join(filePath, 'index.html');
      }
    } catch {
      // ignore
    }
    const data = fs.readFileSync(finalPath);
    const ext = path.extname(finalPath).toLowerCase();
    const type = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  } catch (error) {
    console.error(error);
    res.writeHead(error.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: error.code === 'ENOENT' ? 'not_found' : 'server_error' }));
  }
}

const readyPromise = bootstrap();

export function createServer() {
  const server = http.createServer(async (req, res) => {
    await readyPromise;
    if (!req.url) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'invalid_request' }));
      return;
    }

    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    const apiPaths = [
      '/patients',
      '/examinations',
      '/exams',
      '/auth',
      '/doctors',
      '/result-templates',
      '/system-config',
      '/settings',
      '/license',
      '/backup',
      '/backup/create',
      '/backup/restore'
    ];

    const isApi = url.pathname.startsWith('/api/') || apiPaths.some((p) => url.pathname.startsWith(p));
    if (isApi) {
      await handleApi(req, res, url.pathname);
      return;
    }

    serveStatic(res, url.pathname);
  });
  return server;
}

export async function bootstrap() {
  ensureDir(paths.dataDir);
  ensureDir(paths.databaseDir);
  ensureDir(paths.imagesDir);
  ensureDir(paths.configDir);
  ensureSeedData();
  ensureLicense();
}

const shouldStartServer = !process.argv.includes('--test') && process.argv[1] && path.basename(process.argv[1]) === 'server.js';

if (shouldStartServer) {
  readyPromise
    .then(() => {
      const server = createServer();
      const port = Number.parseInt(process.env.PORT ?? '3000', 10);
      server.listen(port, () => {
        console.log(`Ứng dụng phiếu khám bệnh đang chạy tại http://localhost:${port}`);
      });
    })
    .catch((error) => {
      console.error('Không thể khởi động server:', error);
    });
}
