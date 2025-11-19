import { authenticate } from '../services/authService.js';

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

      if (success) {
        const responseData = {
          success: true,
          message: 'login_ok',
          token: payload.token,
          user: payload.user,
          license: payload.license,
          config: payload.config
        };
        return {
          status: 200,
          raw: Buffer.from(JSON.stringify(responseData)),
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          cookies
        };
      }

      const errorCode = payload.error || 'INVALID_CREDENTIALS';
      const errorResponse = {
        success: false,
        error: errorCode,
        message: errorCode
      };
      if (payload.license) {
        errorResponse.license = payload.license;
      }
      if (payload.user) {
        errorResponse.user = payload.user;
      }
      if (payload.config) {
        errorResponse.config = payload.config;
      }
      return {
        status: result.status || 500,
        raw: Buffer.from(JSON.stringify(errorResponse)),
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      };
    }
  }
];
