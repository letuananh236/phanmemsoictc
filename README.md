# Phần mềm soi cổ tử cung – Khám bệnh

Ứng dụng offline chạy bằng Node.js + Express + SQLite + EJS.

## Cấu trúc thư mục
- `src/` server, route, controller, service, model, view
- `public/` tài sản tĩnh, css, js, uploads
- `src/database/clinic.db` tệp SQLite, `schema.sql` dùng để khởi tạo

## Chạy dự án
```bash
npm install
npm start
```
Truy cập http://localhost:3000 để đăng nhập (tài khoản mặc định: admin / admin123).

## Luồng chính
1. Đăng nhập → /home
2. Menu Khám bệnh để tạo phiếu mới, Lấy hình ảnh từ camera, Lưu & In
3. Tìm kiếm phiếu khám, sửa, in lại qua Tìm kiếm phiếu khám
4. Cấu hình hệ thống, bản quyền, backup qua các mục tương ứng
