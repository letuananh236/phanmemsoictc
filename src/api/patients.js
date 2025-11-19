import { listPatients, savePatient, deletePatient, getPatient } from '../services/patientService.js';

export const patientRoutes = [
  {
    method: 'GET',
    path: '/patients',
    handler: ({ query }) => ({ data: listPatients({ search: query.search || '' }) })
  },
  {
    method: 'POST',
    path: '/patients',
    bodyType: 'json',
    handler: ({ body }) => ({ status: 201, data: savePatient(body || {}) })
  },
  {
    method: 'GET',
    path: '/patients/:id',
    handler: ({ params }) => {
      const patient = getPatient(params.id);
      if (!patient) {
        return { status: 404, success: false, message: 'Không tìm thấy bệnh nhân.' };
      }
      return { data: patient };
    }
  },
  {
    method: 'PUT',
    path: '/patients/:id',
    bodyType: 'json',
    handler: ({ params, body }) => ({ data: savePatient({ ...body, id: params.id }) })
  },
  {
    method: 'DELETE',
    path: '/patients/:id',
    handler: ({ params }) => {
      deletePatient(params.id);
      return { message: 'Đã xóa bệnh nhân.', data: { id: params.id } };
    }
  }
];
