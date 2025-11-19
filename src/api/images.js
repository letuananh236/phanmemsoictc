import { saveVisitImage, listVisitImages, deleteVisitImage, deleteVisitImagesByVisit, saveExamImage } from '../services/imageService.js';

export const imageRoutes = [
  {
    method: 'POST',
    path: '/images',
    bodyType: 'json',
    handler: async ({ body }) => {
      const saved = await saveExamImage(body.examId, Number(body.index || 0) + 1, body.dataUrl, body.note);
      return { data: saved, message: 'Đã lưu ảnh.' };
    }
  },
  {
    method: 'GET',
    path: '/visit-images',
    handler: ({ query }) => {
      const visitId = query.visitId;
      if (!visitId) {
        return { status: 400, success: false, message: 'Thiếu visitId.' };
      }
      return { data: listVisitImages(visitId) };
    }
  },
  {
    method: 'POST',
    path: '/visit-images',
    bodyType: 'json',
    handler: async ({ body }) => {
      const saved = await saveVisitImage(body.visitId, body.dataUrl || body.buffer, body.displayOrder, body.note);
      return { status: 201, data: saved };
    }
  },
  {
    method: 'DELETE',
    path: '/visit-images/by-visit/:id',
    handler: ({ params }) => {
      deleteVisitImagesByVisit(params.id);
      return { message: 'Đã xóa toàn bộ ảnh của phiếu khám.', data: { visitId: params.id } };
    }
  },
  {
    method: 'DELETE',
    path: '/visit-images/:id',
    handler: ({ params }) => {
      deleteVisitImage(Number(params.id));
      return { message: 'Đã xóa ảnh.', data: { id: Number(params.id) } };
    }
  }
];
