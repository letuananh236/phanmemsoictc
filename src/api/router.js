import { ensureLicense, isLicenseValid, summarizeLicense } from '../services/licenseService.js';
import { verifySession } from '../services/authService.js';
import { authRoutes } from './auth.js';
import { patientRoutes } from './patients.js';
import { examRoutes } from './exams.js';
import { imageRoutes } from './images.js';
import { settingsRoutes } from './settings.js';
import { licenseRoutes } from './license.js';
import { backupRoutes } from './backup.js';
import { doctorRoutes } from './doctors.js';
import { templateRoutes } from './templates.js';
import { srsRoutes } from './srs.js';

class ApiError extends Error {
  constructor(status, message, data = null) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

const routeDefinitions = [
  ...authRoutes,
  ...patientRoutes,
  ...examRoutes,
  ...imageRoutes,
  ...settingsRoutes,
  ...licenseRoutes,
  ...backupRoutes,
  ...doctorRoutes,
  ...templateRoutes,
  ...srsRoutes
];

const routes = routeDefinitions.map((route) => compileRoute(route));

function compileRoute(def) {
  const pattern = def.path === '/' ? '/' : def.path.replace(/\/+$/, '') || '/';
  const segments = pattern.split('/').filter(Boolean);
  const keys = [];
  const regex = new RegExp(
    '^/' +
      segments
        .map((segment) => {
          if (segment.startsWith(':')) {
            keys.push(segment.slice(1));
            return '([^/]+)';
          }
          return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        })
        .join('/') +
      '/?$'
  );
  return { ...def, regex, keys };
}

function normalizePath(pathname = '/') {
  let normalized = pathname.split('?')[0] || '/';
  if (!normalized.startsWith('/')) normalized = `/${normalized}`;
  normalized = normalized.replace(/\/+$/, '') || '/';
  if (normalized === '/api') return '/';
  if (normalized.startsWith('/api/')) {
    normalized = normalized.slice(4);
    if (!normalized.startsWith('/')) normalized = `/${normalized}`;
    normalized = normalized.replace(/\/+$/, '') || '/';
  }
  return normalized || '/';
}

function parseCookies(header = '') {
  return header.split(';').reduce((acc, part) => {
    const [key, ...rest] = part.trim().split('=');
    if (!key) return acc;
    acc[key] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
}

function extractToken(req) {
  const header = req.headers['authorization'] || '';
  if (header.toLowerCase().startsWith('bearer ')) {
    return header.slice(7).trim();
  }
  const cookies = parseCookies(req.headers?.cookie || '');
  if (cookies.session) {
    return cookies.session;
  }
  return null;
}

async function readBody(req, bodyType) {
  if (!bodyType || bodyType === 'none' || req.method === 'GET' || req.method === 'DELETE') {
    return null;
  }
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return chunks.length ? Buffer.concat(chunks) : Buffer.alloc(0);
}

function parseBody(rawBody, bodyType, contentType = '') {
  if (!bodyType || bodyType === 'none' || !rawBody) return null;
  if (bodyType === 'buffer') return rawBody;
  if (bodyType === 'text') return rawBody.toString('utf8');
  if (!rawBody.length) return {};
  try {
    return JSON.parse(rawBody.toString('utf8'));
  } catch (error) {
    throw new ApiError(400, 'Dữ liệu JSON không hợp lệ.');
  }
}

function serializeCookie(cookie) {
  if (!cookie || !cookie.name) return null;
  const parts = [`${cookie.name}=${cookie.value ?? ''}`];
  const options = cookie.options || {};
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.httpOnly !== false) parts.push('HttpOnly');
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.maxAge) parts.push(`Max-Age=${options.maxAge}`);
  if (options.secure) parts.push('Secure');
  return parts.join('; ');
}

function formatResponsePayload(result, status) {
  if (!result || typeof result !== 'object') {
    return { success: status < 400, data: result ?? null, message: '' };
  }
  const success = 'success' in result ? result.success : status < 400;
  const data = 'data' in result ? result.data : null;
  const message = result.message ?? (success ? '' : 'Yêu cầu không thành công.');
  return { success, data, message };
}

function applyCookies(headers = {}, cookies = []) {
  const serialized = cookies.map((cookie) => serializeCookie(cookie)).filter(Boolean);
  if (!serialized.length) return headers;
  return { ...headers, 'Set-Cookie': serialized };
}

function sendResponse(res, status, result, cookies = []) {
  if (result?.raw) {
    const headers = applyCookies(result.headers || {}, cookies);
    res.writeHead(status, headers);
    res.end(result.raw);
    return;
  }
  const payload = formatResponsePayload(result, status);
  const headers = applyCookies({ 'Content-Type': 'application/json; charset=utf-8' }, cookies);
  res.writeHead(status, headers);
  res.end(JSON.stringify(payload));
}

function findRoute(method, path) {
  return routes.find((route) => route.method === method && route.regex.test(path));
}

function extractParams(route, path) {
  const match = route.regex.exec(path);
  if (!match) return {};
  const params = {};
  route.keys.forEach((key, index) => {
    params[key] = decodeURIComponent(match[index + 1] || '');
  });
  return params;
}

export async function handleApi(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const method = (req.method || 'GET').toUpperCase();
  const path = normalizePath(url.pathname || '/');
  const route = findRoute(method, path);

  if (!route) {
    sendResponse(res, 404, { success: false, message: 'API không tồn tại.' });
    return;
  }

  try {
    const query = Object.fromEntries(url.searchParams.entries());
    const bodyType = route.bodyType ?? (method === 'GET' || method === 'DELETE' ? null : 'json');
    const rawBody = await readBody(req, bodyType);
    const body = parseBody(rawBody, bodyType, req.headers['content-type']);

    let user = null;
    if (route.authRequired !== false) {
      const token = extractToken(req);
      user = verifySession(token);
      if (!user) {
        sendResponse(res, 401, { success: false, message: 'Yêu cầu đăng nhập hợp lệ.' });
        return;
      }
    }

    const licenseRecord = ensureLicense();
    if (route.licenseRequired !== false && !isLicenseValid(licenseRecord)) {
      sendResponse(res, 403, {
        success: false,
        data: { license: summarizeLicense(licenseRecord) },
        message: 'License đã hết hạn.'
      });
      return;
    }

    const context = {
      req,
      res,
      url,
      path,
      params: extractParams(route, path),
      query,
      body,
      rawBody,
      user,
      license: summarizeLicense(licenseRecord)
    };
    const result = await route.handler(context);
    const cookies = Array.isArray(result?.cookies) ? result.cookies : [];
    sendResponse(res, result?.status || 200, result, cookies);
  } catch (error) {
    if (error instanceof ApiError) {
      sendResponse(res, error.status, { success: false, data: error.data, message: error.message });
      return;
    }
    console.error('[api] unexpected error', error);
    sendResponse(res, 500, { success: false, message: 'Lỗi máy chủ.' });
  }
}
