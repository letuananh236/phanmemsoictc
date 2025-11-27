function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function sendBuffer(res, status, buffer, headers = {}) {
  res.writeHead(status, headers);
  res.end(buffer);
}

async function parseBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('application/json')) {
    return JSON.parse(buffer.toString('utf8') || '{}');
  }
  return buffer;
}

export { parseBody, sendBuffer, sendJson };
