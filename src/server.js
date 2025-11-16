import http from 'http';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '..', 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
};

async function serveStaticFile(res, filePath) {
  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const type = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Không tìm thấy tài nguyên');
    } else {
      console.error(error);
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Lỗi máy chủ nội bộ');
    }
  }
}

export function createServer() {
  return http.createServer(async (req, res) => {
    if (!req.url) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Yêu cầu không hợp lệ');
      return;
    }

    const { pathname } = new URL(req.url, 'http://localhost');

    if (pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    let requestedPath = pathname;
    if (requestedPath.endsWith('/')) {
      requestedPath = path.join(requestedPath, 'index.html');
    }

    const normalizedPath = path.normalize(requestedPath).replace(/^\.\.(\/|\\|$)/, '');
    const filePath = path.join(publicDir, normalizedPath);
    await serveStaticFile(res, filePath);
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createServer();
  const port = Number.parseInt(process.env.PORT ?? '3000', 10);
  server.listen(port, () => {
    console.log(`Ứng dụng phiếu khám bệnh đang chạy tại http://localhost:${port}`);
  });
}
