import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createServer } from '../src/app.js';
import { generateLicenseKey } from '../src/utils/hardware-id.js';

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

test('trang chủ trả về nội dung biểu mẫu khám bệnh', async () => {
  const { server, port } = await startServer();
  try {
    const response = await fetch(`http://localhost:${port}/`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /Phiếu khám bệnh/i);
    assert.match(html, /BỆNH VIỆN XYZ/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('kích hoạt key bản quyền hợp lệ trả về trạng thái còn hạn', async () => {
  const { server, port } = await startServer();
  try {
    await fetch(`http://localhost:${port}/api/license/reset`, { method: 'POST' });

    const meta = await (await fetch(`http://localhost:${port}/api/meta`)).json();
    const licenseKey = generateLicenseKey(meta.machineKey, 'thirty_day');

    const response = await fetch(`http://localhost:${port}/api/license`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey })
    });

    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.valid, true);
    assert.equal(body.license.status, 'valid');
    assert.equal(body.license.machineKey, meta.machineKey);
    assert.equal(body.license.licenseType, 'thirty_day');
    assert.ok(body.license.daysRemaining >= 28 && body.license.daysRemaining <= 31);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
