import { listExams, saveExam, deleteExam, getExamDetail, getPrintPayload } from '../services/examService.js';
import { listVisitImages, saveExamImage, deleteVisitImagesByVisit } from '../services/imageService.js';

function examListHandler(query) {
  const filters = {
    date: query.date || query.examDate || null,
    doctorId: query.doctorId || query.doctor || null,
    patientId: query.patientId || null,
    search: query.search || ''
  };
  return { data: listExams(filters) };
}

export const examRoutes = [
  { method: 'GET', path: '/exams', handler: ({ query }) => examListHandler(query) },
  { method: 'GET', path: '/visits', handler: ({ query }) => examListHandler(query) },
  { method: 'GET', path: '/examinations', handler: ({ query }) => examListHandler(query) },
  {
    method: 'POST',
    path: '/exams',
    bodyType: 'json',
    handler: async ({ body }) => ({ status: 201, data: await saveExam(body || {}) })
  },
  {
    method: 'GET',
    path: '/exams/:id',
    handler: ({ params }) => {
      const exam = getExamDetail(params.id);
      if (!exam) {
        return { status: 404, success: false, message: 'Không tìm thấy phiếu khám.' };
      }
      return { data: exam };
    }
  },
  {
    method: 'PUT',
    path: '/exams/:id',
    bodyType: 'json',
    handler: async ({ params, body }) => ({ data: await saveExam({ ...body, id: params.id }) })
  },
  {
    method: 'DELETE',
    path: '/exams/:id',
    handler: ({ params }) => {
      deleteExam(params.id);
      deleteVisitImagesByVisit(params.id);
      return { message: 'Đã xóa phiếu khám.', data: { id: params.id } };
    }
  },
  {
    method: 'GET',
    path: '/exams/:id/print-data',
    handler: ({ params }) => {
      const payload = getPrintPayload(params.id);
      if (!payload) {
        return { status: 404, success: false, message: 'Không tìm thấy dữ liệu in.' };
      }
      return { data: payload };
    }
  },
  {
    method: 'GET',
    path: '/exams/:id/images',
    handler: ({ params }) => ({ data: listVisitImages(params.id) })
  },
  {
    method: 'POST',
    path: '/exams/:id/images',
    bodyType: 'json',
    handler: async ({ params, body }) => {
      const items = Array.isArray(body?.images) ? body.images : [body];
      const saved = [];
      for (const item of items) {
        if (!item) continue;
        const order = Number(item.slotNumber || item.order || item.displayOrder || item.index || 0) || undefined;
        const payload = item.dataUrl || item.dataURL || item.base64 || item.buffer;
        if (!payload) continue;
        // eslint-disable-next-line no-await-in-loop
        saved.push(await saveExamImage(params.id, order, payload, item.note));
      }
      return { data: saved };
    }
  }
];
