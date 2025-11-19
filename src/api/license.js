import { ensureLicense, activateLicense, summarizeLicense, isLicenseValid } from '../services/licenseService.js';

export const licenseRoutes = [
  {
    method: 'GET',
    path: '/license',
    authRequired: false,
    licenseRequired: false,
    handler: () => {
      const license = summarizeLicense(ensureLicense());
      return { data: { license, valid: isLicenseValid(license) } };
    }
  },
  {
    method: 'POST',
    path: '/license/activate',
    bodyType: 'json',
    handler: ({ body }) => {
      const license = summarizeLicense(activateLicense(body || {}));
      return { data: { license, valid: isLicenseValid(license) }, message: 'Đã kích hoạt license.' };
    }
  }
];
