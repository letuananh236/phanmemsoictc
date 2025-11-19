import { getConfig, setConfig, saveLogoFromData } from '../services/configService.js';

function makeSettingsRoute(path, options = {}) {
  return {
    method: 'GET',
    path,
    authRequired: options.authRequired,
    handler: () => ({ data: getConfig() })
  };
}

export const settingsRoutes = [
  makeSettingsRoute('/settings'),
  makeSettingsRoute('/system-config', { authRequired: false }),
  {
    method: 'PUT',
    path: '/settings',
    bodyType: 'json',
    handler: ({ body }) => ({ data: setConfig(body || {}), message: 'Đã cập nhật cấu hình.' })
  },
  {
    method: 'PUT',
    path: '/system-config',
    bodyType: 'json',
    handler: ({ body }) => ({ data: setConfig(body || {}), message: 'Đã cập nhật cấu hình.' })
  },
  {
    method: 'POST',
    path: '/settings/logo',
    bodyType: 'json',
    handler: ({ body }) => ({ data: saveLogoFromData(body || {}), message: 'Đã cập nhật logo.' })
  },
  {
    method: 'POST',
    path: '/system-config/logo',
    bodyType: 'json',
    handler: ({ body }) => ({ data: saveLogoFromData(body || {}), message: 'Đã cập nhật logo.' })
  }
];
