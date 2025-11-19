export const aboutInfo = {
  appName: 'PHẦN MỀM SOI CỔ TỬ CUNG',
  version: typeof window !== 'undefined' && window.APP_VERSION ? window.APP_VERSION : 'v1.2.2',
  buildDate: new Date().toISOString().slice(0, 10),
  hospital: 'Giải pháp khám soi cổ tử cung offline cho phòng khám sản phụ khoa',
  description:
    'Phần mềm hỗ trợ bác sĩ nhập liệu, lấy hình ảnh soi cổ tử cung, in phiếu A4 và lưu trữ dữ liệu an toàn trên máy tính nội bộ.',
  support: {
    email: 'letuananh236@gmail.com',
    phone: '0966 000 000'
  },
  copyright:
    '© ' + new Date().getFullYear() + ' Nhóm phát triển phần mềm soi cổ tử cung. Mọi quyền được bảo lưu.',
  notes: [
    'Phiên bản dùng thử hỗ trợ 30 ngày, có thể nâng cấp lên gói 1 năm hoặc vĩnh viễn.',
    'Phần mềm chạy hoàn toàn offline, dữ liệu nằm trong thư mục Data/.'
  ]
};

if (typeof window !== 'undefined') {
  window.APP_ABOUT_INFO = aboutInfo;
}
