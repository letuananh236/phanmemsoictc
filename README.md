# phanmemsoictc

Ứng dụng soi cổ tử cung chạy offline trên Node.js với frontend HTML/CSS/JS thuần. Server phục vụ file tĩnh và API CRUD lưu vào SQLite (`database/database.sqlite`) kèm thư mục ảnh/logo bên trong `database/`, không còn sử dụng các file JSON.

## Chức năng chính
- Đăng nhập (mặc định `admin` / `123`), kiểm tra bản quyền theo mã máy và hiển thị ngày sử dụng còn lại.
- Khám bệnh: nhập thông tin bệnh nhân/phiếu khám, nhận tối đa 4 ảnh từ màn hình Lấy hình, lưu vào SQLite và in khổ A4.
- Lấy hình ảnh: chọn camera, chụp/chấp nhận ảnh, lưu PNG vào `database/images/YYYY/MM/` rồi trả về form.
- Tìm phiếu: lọc, xem chi tiết, in lại, chỉnh sửa.
- Cấu hình: logo, thông số bệnh viện, số ảnh in, phím chụp nhanh, sao lưu/khôi phục và xoá dữ liệu.

## Cài đặt nhanh
```bash
git clone https://github.com/<ten>/phanmemsoictc.git
cd phanmemsoictc
npm install
npm start
```
Mở `http://localhost:3000`, đăng nhập và nhập mã bản quyền nếu được yêu cầu.

## Sao lưu & khôi phục
- `GET /api/backup`: tải ZIP chứa toàn bộ thư mục `database/` (SQLite + ảnh + logo).
- `POST /api/restore`: tải lên ZIP để ghi đè dữ liệu.

## Cấu trúc dự án (MVC tối giản)
- `src/app.js`: khởi tạo HTTP server, dùng `src/routes.js` để định tuyến.
- `src/routes.js`: tập trung toàn bộ API, trang HTML và phục vụ tĩnh.
- `src/db.js`: cấu hình đường dẫn, khởi tạo SQLite và tiện ích đọc/ghi.
- `src/models/`: xử lý nghiệp vụ (exam, patient, image, license, settings, backup, user).
- `src/views/`: `layout.ejs`, `home.ejs` và các template view (`login.ejs`, `exam-form.ejs`, `exam-detail.ejs`, `camera.ejs`).
- `public/css`: stylesheet; `public/js`: toàn bộ logic frontend.
- `database/`: chứa file SQLite, thư mục ảnh chụp (`database/images/`), thư mục logo tải lên (`database/logo/`) và các `.gitkeep` để giữ cấu trúc; logo mặc định được sinh vào `database/logo/logo-default.svg`.

## Kiểm thử
```bash
npm test
```
