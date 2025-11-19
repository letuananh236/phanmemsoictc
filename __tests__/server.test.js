import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from '../src/server.js';

async function startServer() {
  const server = createServer();
  server.listen(0);
  await once(server, 'listening');
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  return { server, port };
}

test('health endpoint trả về trạng thái ok', async () => {
  const { server, port } = await startServer();
  try {
    const response = await fetch(`http://localhost:${port}/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, { status: 'ok' });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('trang chủ trả về nội dung trang đăng nhập', async () => {
  const { server, port } = await startServer();
  try {
    const response = await fetch(`http://localhost:${port}/`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /Đăng nhập/i);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('đường dẫn /login vẫn trả về trang đăng nhập cho SPA', async () => {
  const { server, port } = await startServer();
  try {
    const response = await fetch(`http://localhost:${port}/login`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /Đăng nhập/i);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('API /api/srs trả về nội dung SRS', async () => {
  const { server, port } = await startServer();
  try {
    const response = await fetch(`http://localhost:${port}/api/srs`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.match(body.content || '', /PHẦN MỀM SOI CỔ TỬ CUNG/i);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
