import { authenticate } from '../services/authService.js';

function authMessage(code) {
  switch (code) {
    case 'INVALID_CREDENTIALS':
      return 'Tên đăng nhập hoặc mật khẩu không đúng.';
    case 'USER_INACTIVE':
      return 'Tài khoản đang bị khóa.';
    case 'LICENSE_EXPIRED':
      return 'Bản quyền đã hết hạn.';
    default:
      return 'Không thể đăng nhập.';
  }
}

export const authRoutes = [
  {
    method: 'POST',
    path: '/auth/login',
    authRequired: false,
    licenseRequired: false,
    bodyType: 'json',
    handler: async ({ body }) => {
      const credentials = body || {};
      const result = authenticate(credentials.username, credentials.password);
      const payload = result.body || {};
      const success = result.status === 200 && payload.success;
      const cookies = [];
      if (success && payload.token) {
        cookies.push({ name: 'session', value: payload.token, options: { httpOnly: true, sameSite: 'Strict', path: '/' } });
      }
      return {
        status: result.status,
        success,
        data: success ? payload : payload.license ? { license: payload.license } : null,
        message: success ? 'Đăng nhập thành công.' : authMessage(payload.error),
        cookies
      };
    }
  }
];
