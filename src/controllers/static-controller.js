import path from 'path';
import fsPromises from 'fs/promises';
import { getPaths } from '../models/app-model.js';

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

async function serveStatic(res, requestPath) {
  const { publicDir } = getPaths();
  try {
    const relative = normalizePath(requestPath);
    const filePath = path.join(publicDir, relative);
    if (!filePath.startsWith(publicDir)) {
      return false;
    }
    let finalPath = filePath;
    try {
      const stat = await fsPromises.stat(filePath);
      if (stat.isDirectory()) {
        finalPath = path.join(filePath, 'index.html');
      }
    } catch {
      // ignore
    }
    const data = await fsPromises.readFile(finalPath);
    const ext = path.extname(finalPath).toLowerCase();
    const type = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'not_found' }));
    } else {
      console.error(error);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'server_error' }));
    }
    return true;
  }
}

async function serveDataFile(res, requestPath) {
  const { rootDir, dataDir } = getPaths();
  try {
    const safePath = normalizePath(requestPath);
    const filePath = path.join(rootDir, safePath);
    if (!filePath.startsWith(dataDir)) {
      res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'forbidden' }));
      return true;
    }
    const data = await fsPromises.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const type = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'not_found' }));
    } else {
      console.error(error);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'server_error' }));
    }
    return true;
  }
}

export { serveStatic, serveDataFile };
