# PHẦN MỀM SOI CỔ TỬ CUNG (OFFLINE)

Giải pháp khám soi cổ tử cung chạy hoàn toàn cục bộ: Node.js + Express phục vụ API và file tĩnh, frontend SPA viết bằng JavaScript thuần (React-lite) nằm trong thư mục `public/`. Toàn bộ dữ liệu – bao gồm cơ sở dữ liệu SQLite và ảnh soi – lưu tại `Data/`, vì vậy chỉ cần sao chép thư mục này là có thể sao lưu/khôi phục toàn bộ hệ thống.

## Tính năng chính
- **Đăng nhập & giấy phép**: tài khoản mặc định `admin` / `admin123` (hỗ trợ mật khẩu cũ `123`). Hệ thống tự tạo license trial 30 ngày, cảnh báo khi sắp hết hạn và chặn các chức năng nghiệp vụ sau khi license hết hạn.
- **Khám bệnh (F3)**: form `exam-form.js` hiển thị trực tiếp khi đăng nhập, gồm thông tin bệnh nhân, phiếu khám, mô tả soi CTC, kết quả, điều trị, lời dặn và lưới ảnh 2×2. Hỗ trợ sinh mã BN/HA tự động, chọn bác sĩ, lưu/ghi xuống SQLite và mở trang in A4.
- **Chụp ảnh (F4)**: module `capture.js` sử dụng `getUserMedia` để bật camera/capture card, cho phép chụp nhiều ảnh, chọn tối đa số lượng cấu hình, và tải ảnh lên `Data/Images/<yyyy>/<mm>/` theo định dạng `<VisitCode>_<slot>.png`.
- **Tìm phiếu khám**: `search-exam.js` giúp lọc nhanh theo bệnh nhân, ngày, kết quả và mở lại phiếu để xem/in.
- **Cấu hình & License**: `settings.js` chỉnh thông tin cơ sở, logo, số ảnh mặc định, prefix mã, theme UI; `license-ui.js` quản lý kích hoạt license.
- **Backup & Restore**: `storage.js` cung cấp giao diện tạo file ZIP sao lưu toàn bộ `Data/` và phục hồi khi cần. Có cảnh báo rõ ràng trước khi ghi đè dữ liệu.
- **Giới thiệu**: `about.js` hiển thị thông tin phần mềm, phiên bản và kênh hỗ trợ để người dùng dễ tra cứu.

## Cấu trúc thư mục
```
project/
├─ package.json
├─ Data/
│  ├─ Database/app.db        # SQLite (tự tạo nếu chưa tồn tại)
│  ├─ Images/YYYY/MM/*.png   # Ảnh soi, không commit lên Git
│  └─ Backups/               # File ZIP sao lưu (nếu có)
├─ public/
│  ├─ index.html, styles.css
│  ├─ app.js, login.js, exam-form.js, capture.js, search-exam.js,
│  │   settings.js, license-ui.js, storage.js, about.js, assets/
│  └─ app/                   # SPA React-lite (state, layouts, modules)
└─ src/
   ├─ server.js              # Khởi động Express + middleware tĩnh
   ├─ api/                   # Định tuyến REST (auth, patients, exams...)
   ├─ services/              # Business logic + license + backup
   ├─ dal/                   # Kết nối SQLite, migration/tạo bảng
   └─ utils/                 # Hàm dùng chung (hash, filesystem...)
```
> Máy chủ tự tạo thư mục/file cần thiết nếu chưa tồn tại. Để giữ repo sạch, `Data/Images/` được bỏ qua trong `.gitignore` (kèm `.gitkeep`).

## Cài đặt & chạy
```bash
git clone https://github.com/<ban>/phanmemsoictc.git
cd phanmemsoictc
npm install
npm start
```
- Truy cập `http://localhost:3000`, đăng nhập `admin` / `admin123`.
- Phím tắt: F3 mở form Khám bệnh, F4 mở màn hình Chụp ảnh.
- Để in phiếu A4, lưu phiếu rồi bấm **In phiếu** trong form.

## Sao lưu & khôi phục
- Trong ứng dụng: vào **Backup & Restore** để tạo file ZIP (gồm `Data/Database/app.db`, thư mục Images và cấu hình). Khi phục hồi, hệ thống yêu cầu xác nhận trước khi ghi đè.
- Thủ công: dừng ứng dụng và sao chép toàn bộ thư mục `Data/` sang nơi an toàn.

## Ghi chú triển khai
- Không push ảnh soi lên Git/GitHub: `Data/Images/` đã bị bỏ qua, nếu Git vẫn liệt kê file PNG hãy `git rm --cached` trước khi commit.
- Logo mặc định nằm ở `public/assets/logo-default.svg`. Có thể upload logo riêng trong màn Cấu hình; file sẽ lưu ở `public/assets/` và được tham chiếu trong `settings`.
- Tất cả API nghiệp vụ (patients, exams, capture, backup, settings...) yêu cầu đã đăng nhập và license còn hạn.

## Kiểm thử
```
npm test
```
Bộ test (`node --test`) xác nhận các endpoint chính (đăng nhập, trang chủ) hoạt động đúng và giúp đảm bảo regression khi chỉnh sửa backend.
