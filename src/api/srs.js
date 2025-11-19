import { getSrsDocument } from '../services/srsService.js';

export const srsRoutes = [
  {
    method: 'GET',
    path: '/srs',
    authRequired: false,
    licenseRequired: false,
    handler: () => ({ data: getSrsDocument() })
  }
];
