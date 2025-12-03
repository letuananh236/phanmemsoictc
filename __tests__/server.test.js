import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import crypto from 'node:crypto';
import { createServer } from '../src/app.js';

async function startServer() {
  const server = createServer();
  server.listen(0);
  await once(server, 'listening');
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  return { server, port };
}

const LICENSE_SEEDS = {
  yearly: 'SOICTC_LICENSE_V1',
  lifetime: 'SOICTC_LICENSE_V1_LIFETIME',
  thirty_day: 'SOICTC_LICENSE_V1_30DAY',
  trial: 'SOICTC_LICENSE_V1_TRIAL',
  default: 'SOICTC_LICENSE_V1'
};

function generateLicenseKey(machineKey, licenseType = 'yearly') {
  const normalizedMachine = (machineKey || '').replace(/[^A-Z0-9]/gi, '').toUpperCase();
  const normalizedType = (licenseType || 'yearly').toLowerCase();
  const seed = LICENSE_SEEDS[normalizedType] || LICENSE_SEEDS.default;
  const hash = crypto.createHmac('sha256', seed).update(normalizedMachine).digest('hex').toUpperCase();
  return `${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}`;
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
    const adminHeaders = { 'Content-Type': 'application/json', 'x-user': 'admin', 'x-role': 'admin' };
    await fetch(`http://localhost:${port}/api/license/reset`, { method: 'POST', headers: adminHeaders });

    const meta = await (await fetch(`http://localhost:${port}/api/meta`)).json();
    const licenseKey = generateLicenseKey(meta.machineKey, 'thirty_day');

    const response = await fetch(`http://localhost:${port}/api/license`, {
      method: 'POST',
      headers: adminHeaders,
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

test('license hết hạn hoặc chưa kích hoạt không hiển thị ngày hết hạn sai', async () => {
  const { server, port } = await startServer();
  try {
    const adminHeaders = { 'x-user': 'admin', 'x-role': 'admin' };
    await fetch(`http://localhost:${port}/api/license/reset`, { method: 'POST', headers: adminHeaders });

    const response = await fetch(`http://localhost:${port}/api/license`);
    const body = await response.json();

    assert.equal(body.valid, false);
    assert.equal(body.license.status, 'invalid');
    assert.equal(body.license.expireDate, null);
    assert.equal(body.license.daysRemaining, 0);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('tự động sinh mã bác sỹ với tiền tố BS và tăng dần', async () => {
  const { server, port } = await startServer();
  try {
    const adminHeaders = { 'Content-Type': 'application/json', 'x-user': 'admin', 'x-role': 'admin' };

    await fetch(`http://localhost:${port}/api/license/reset`, { method: 'POST', headers: adminHeaders });
    const meta = await (await fetch(`http://localhost:${port}/api/meta`)).json();
    const licenseKey = generateLicenseKey(meta.machineKey, 'thirty_day');
    await fetch(`http://localhost:${port}/api/license`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ licenseKey })
    });

    const first = await fetch(`http://localhost:${port}/api/doctors`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ name: 'BS A' })
    });
    const firstBody = await first.json();

    const second = await fetch(`http://localhost:${port}/api/doctors`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ name: 'BS B', phone: '0123456789' })
    });
    const secondBody = await second.json();

    assert.equal(first.status, 201);
    assert.equal(firstBody.id, 'BS002');
    assert.equal(second.status, 201);
    assert.equal(secondBody.id, 'BS003');
    assert.equal(secondBody.phone, '0123456789');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
