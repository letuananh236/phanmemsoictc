import { listTemplates, saveTemplate, deleteTemplate } from '../services/templateService.js';

export const templateRoutes = [
  {
    method: 'GET',
    path: '/result-templates',
    handler: () => ({ data: listTemplates() })
  },
  {
    method: 'POST',
    path: '/result-templates',
    bodyType: 'json',
    handler: ({ body }) => ({ status: 201, data: saveTemplate(body || {}) })
  },
  {
    method: 'PUT',
    path: '/result-templates/:id',
    bodyType: 'json',
    handler: ({ params, body }) => ({ data: saveTemplate({ ...body, id: Number(params.id) }) })
  },
  {
    method: 'DELETE',
    path: '/result-templates/:id',
    handler: ({ params }) => {
      deleteTemplate(Number(params.id));
      return { message: 'Đã xóa mẫu kết quả.', data: { id: Number(params.id) } };
    }
  }
];
