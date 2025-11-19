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

test('đăng nhập mặc định admin/admin123 thành công', async () => {
  const { server, port } = await startServer();
  try {
    const res = await fetch(`http://localhost:${port}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: ' admin ', password: ' admin123 ' })
    });
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body?.user?.username, 'admin');
    assert.equal(body?.license?.LicenseType || body?.license?.licenseType, 'trial');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('đăng nhập tương thích mật khẩu cũ admin/123', async () => {
  const { server, port } = await startServer();
  try {
    const res = await fetch(`http://localhost:${port}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: '123' })
    });
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body?.user?.username, 'admin');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('đăng nhập vẫn hoạt động với đường dẫn có dấu / cuối', async () => {
  const { server, port } = await startServer();
  try {
    const res = await fetch(`http://localhost:${port}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const body = await res.json();

    assert.equal(res.status, 200);
    assert.equal(body?.user?.username, 'admin');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('đăng nhập sai thông tin trả về 401', async () => {
  const { server, port } = await startServer();
  try {
    const res = await fetch(`http://localhost:${port}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'wrong', password: 'creds' })
    });
    const body = await res.json();

    assert.equal(res.status, 401);
    assert.equal(body.error, 'INVALID_CREDENTIALS');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('thiếu username/password trả về 401', async () => {
  const { server, port } = await startServer();
  try {
    const res = await fetch(`http://localhost:${port}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: '   ', password: '' })
    });
    const body = await res.json();

    assert.equal(res.status, 401);
    assert.equal(body.error, 'INVALID_CREDENTIALS');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
