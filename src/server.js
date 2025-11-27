import http from 'http';
import { ensureInfrastructure } from './models/app-model.js';
import { ensureLicense } from './models/license-model.js';
import { handleApi } from './controllers/api-controller.js';
import { serveStatic, serveDataFile } from './controllers/static-controller.js';
import { sendJson } from './utils/http-helpers.js';

async function bootstrap() {
  await ensureInfrastructure();
  await ensureLicense();
}

const bootstrapPromise = bootstrap();

export function createServer() {
  const server = http.createServer(async (req, res) => {
    await bootstrapPromise;
    if (!req.url) {
      sendJson(res, 400, { error: 'invalid_request' });
      return;
    }
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/health') {
      sendJson(res, 200, { status: 'ok' });
      return;
    }

    if (url.pathname.startsWith('/api/')) {
      const handled = await handleApi(req, res, url.pathname);
      if (handled) return;
      sendJson(res, 404, { error: 'not_found' });
      return;
    }

    if (url.pathname.startsWith('/data/images/')) {
      const served = await serveDataFile(res, url.pathname);
      if (served) return;
    }

    const served = await serveStatic(res, url.pathname);
    if (!served) {
      sendJson(res, 404, { error: 'not_found' });
    }
  });
  return server;
}

export async function bootstrapServer() {
  await bootstrapPromise;
}
