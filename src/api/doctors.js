import { listDoctors, saveDoctor, deleteDoctor } from '../services/doctorService.js';

export const doctorRoutes = [
  {
    method: 'GET',
    path: '/doctors',
    handler: ({ query }) => ({ data: listDoctors({ activeOnly: query.active === '1' }) })
  },
  {
    method: 'GET',
    path: '/doctors/active',
    handler: () => ({ data: listDoctors({ activeOnly: true }) })
  },
  {
    method: 'POST',
    path: '/doctors',
    bodyType: 'json',
    handler: ({ body }) => ({ status: 201, data: saveDoctor(body || {}) })
  },
  {
    method: 'PUT',
    path: '/doctors/:id',
    bodyType: 'json',
    handler: ({ params, body }) => ({ data: saveDoctor({ ...body, id: params.id }) })
  },
  {
    method: 'DELETE',
    path: '/doctors/:id',
    handler: ({ params }) => {
      deleteDoctor(params.id);
      return { message: 'Đã xóa bác sỹ.', data: { id: params.id } };
    }
  }
];
