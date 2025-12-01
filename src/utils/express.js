import http from 'http';
import fs from 'fs';
import path from 'path';

function createResHelpers(res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.set = (headers = {}) => {
    Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
    return res;
  };
  res.type = (value) => {
    res.setHeader('Content-Type', value);
    return res;
  };
  res.json = (payload) => {
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    res.end(JSON.stringify(payload));
  };
  res.send = (payload) => {
    if (Buffer.isBuffer(payload) || typeof payload === 'string') {
      res.end(payload);
      return;
    }
    if (payload === undefined || payload === null) {
      res.end();
      return;
    }
    res.json(payload);
  };
  res.sendFile = (filePath, callback = () => {}) => {
    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        callback(err || new Error('file_not_found'));
        return;
      }
      const stream = fs.createReadStream(filePath);
      stream.on('error', (error) => {
        callback(error);
      });
      stream.on('end', () => callback());
      stream.pipe(res);
    });
  };
  return res;
}

function parsePathname(url) {
  return new URL(url, 'http://localhost').pathname;
}

function matchRoute(pattern, pathname) {
  const params = {};
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = pathname.split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;
  for (let i = 0; i < patternParts.length; i += 1) {
    const part = patternParts[i];
    const current = pathParts[i];
    if (part.startsWith(':')) {
      params[part.slice(1)] = decodeURIComponent(current);
      continue;
    }
    if (part !== current) return null;
  }
  return params;
}

function middlewareMatches(prefix, pathname) {
  if (prefix === '/') return true;
  return pathname === prefix || pathname.startsWith(prefix.endsWith('/') ? prefix : `${prefix}` + '/');
}

function express() {
  const stack = [];

  const app = (req, res) => {
    createResHelpers(res);
    const pathname = parsePathname(req.url || '/');
    req.path = pathname;
    let idx = 0;

    const next = (err) => {
      if (err) {
        res.statusCode = 500;
        res.end('Internal Server Error');
        return;
      }
      if (idx >= stack.length) {
        res.statusCode = 404;
        res.end('Not Found');
        return;
      }
      const entry = stack[idx];
      idx += 1;
      if (entry.type === 'middleware') {
        if (!middlewareMatches(entry.path, pathname)) {
          next();
          return;
        }
        const originalUrl = req.url;
        const originalPath = req.path;
        const trimmed = pathname.slice(entry.path.length) || '/';
        req.url = trimmed === '/' ? originalUrl : trimmed;
        req.path = trimmed;
        entry.handler(req, res, (error) => {
          req.url = originalUrl;
          req.path = originalPath;
          next(error);
        });
        return;
      }

      if (entry.method !== req.method) {
        next();
        return;
      }
      const params = matchRoute(entry.path, pathname);
      if (!params) {
        next();
        return;
      }
      req.params = params;
      entry.handler(req, res);
    };

    next();
  };

  app.use = (pathOrFn, maybeFn) => {
    const pathValue = typeof pathOrFn === 'string' ? pathOrFn || '/' : '/';
    const handler = typeof pathOrFn === 'string' ? maybeFn : pathOrFn;
    if (typeof handler !== 'function') return app;
    stack.push({ type: 'middleware', path: pathValue, handler });
    return app;
  };

  const composeHandlers = (handlers) => (req, res) => {
    let routeIdx = 0;
    const routeNext = (err) => {
      if (err) {
        res.statusCode = 500;
        res.end('Internal Server Error');
        return;
      }
      const current = handlers[routeIdx];
      routeIdx += 1;
      if (!current) return;
      try {
        if (current.length >= 3) {
          current(req, res, routeNext);
          return;
        }
        const result = current(req, res);
        if (result && typeof result.then === 'function') {
          result.catch(routeNext);
        }
      } catch (error) {
        routeNext(error);
      }
    };
    routeNext();
  };

  const addRoute = (method, pathValue, handler) => {
    stack.push({ method, path: pathValue || '/', handler, type: 'route' });
  };

  ['get', 'post', 'put', 'delete'].forEach((method) => {
    app[method] = (pathValue, ...handlers) => {
      if (!handlers.length) return app;
      const paths = Array.isArray(pathValue) ? pathValue : [pathValue];
      const composed = composeHandlers(handlers);
      paths.forEach((p) => addRoute(method.toUpperCase(), p, composed));
      return app;
    };
  });

  app.route = (pathValue) => ({
    get(handler) {
      addRoute('GET', pathValue, handler);
      return this;
    },
    post(handler) {
      addRoute('POST', pathValue, handler);
      return this;
    },
    put(handler) {
      addRoute('PUT', pathValue, handler);
      return this;
    },
    delete(handler) {
      addRoute('DELETE', pathValue, handler);
      return this;
    }
  });

  app.listen = (port, cb) => {
    const server = http.createServer(app);
    return server.listen(port, cb);
  };

  app._stack = stack;

  return app;
}

function json(options = {}) {
  const limit = options.limit || '1mb';
  const limitBytes = parseLimit(limit);
  return (req, res, next) => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('application/json')) return next();
    collectBody(req, limitBytes, (err, buffer) => {
      if (err) return next(err);
      try {
        req.body = buffer.length ? JSON.parse(buffer.toString('utf8')) : {};
        req._bodyParsed = true;
      } catch (error) {
        return next(error);
      }
      next();
    });
  };
}

function urlencoded(options = {}) {
  const limitBytes = parseLimit(options.limit || '1mb');
  return (req, res, next) => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('application/x-www-form-urlencoded')) return next();
    collectBody(req, limitBytes, (err, buffer) => {
      if (err) return next(err);
      const params = new URLSearchParams(buffer.toString('utf8'));
      req.body = Object.fromEntries(params.entries());
      req._bodyParsed = true;
      next();
    });
  };
}

function raw(options = {}) {
  const limitBytes = parseLimit(options.limit || '1mb');
  const type = options.type || '*/*';
  return (req, res, next) => {
    const contentType = req.headers['content-type'] || 'application/octet-stream';
    if (!(type === '*/*' || contentType.includes(type))) return next();
    collectBody(req, limitBytes, (err, buffer) => {
      if (err) return next(err);
      req.body = buffer;
      req._bodyParsed = true;
      next();
    });
  };
}

function staticMiddleware(rootDir) {
  return (req, res, next) => {
    const pathname = req.path || parsePathname(req.url || '/');
    const safePath = path.normalize(path.join(rootDir, pathname.replace(/^\/+/, '')));
    if (!safePath.startsWith(path.normalize(rootDir))) {
      return next();
    }
    let finalPath = safePath;
    try {
      const stat = fs.statSync(finalPath);
      if (stat.isDirectory()) {
        finalPath = path.join(finalPath, 'index.html');
      }
    } catch (error) {
      return next();
    }
    try {
      const data = fs.readFileSync(finalPath);
      const ext = path.extname(finalPath).toLowerCase();
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
      res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
      res.end(data);
    } catch (error) {
      next(error);
    }
  };
}

function parseLimit(limit) {
  if (typeof limit === 'number') return limit;
  const match = /^([0-9]+)(mb|kb)?$/i.exec(limit);
  if (!match) return 1024 * 1024;
  const value = parseInt(match[1], 10);
  const unit = (match[2] || 'b').toLowerCase();
  if (unit === 'mb') return value * 1024 * 1024;
  if (unit === 'kb') return value * 1024;
  return value;
}

function collectBody(req, limit, cb) {
  const chunks = [];
  let total = 0;
  req.on('data', (chunk) => {
    total += chunk.length;
    if (total > limit) {
      cb(new Error('Payload too large'));
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });
  req.on('end', () => cb(null, Buffer.concat(chunks)));
  req.on('error', (err) => cb(err));
}

express.json = json;
express.urlencoded = urlencoded;
express.raw = raw;
express.static = staticMiddleware;

export default express;
