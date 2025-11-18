# phanmemsoictc

Bộ khung phần mềm soi cổ tử cung chạy offline 100% trên Node.js + HTML/CSS/JavaScript thuần. Máy chủ Node phục vụ file tĩnh và lưu toàn bộ dữ liệu vào SQLite (`Data/Database/app.db`) cùng thư mục ảnh `Data/Images/`, cung cấp API CRUD cho bệnh nhân, phiếu khám, bác sỹ, mẫu kết quả, cấu hình, giấy phép, backup/restore.

## Chức năng nổi bật
- **Đăng nhập & bản quyền**: popup đăng nhập (mặc định `admin` / `admin123`) mở khoá thanh menu. Máy chủ tự tạo giấy phép trial 30 ngày, hiển thị màn hình License để kích hoạt các gói trả phí.
- **Thanh menu + phím tắt**: F3 (Khám bệnh), F4 (Lấy hình), Ctrl+P (Tìm bệnh nhân), Ctrl+E (Tìm phiếu). Nút Thoát đưa về màn hình đăng nhập.
- **Khám bệnh (exam-form.js)**: Form 3 vùng (bệnh nhân, phiếu khám, ảnh). Hỗ trợ sinh mã BN/HA, chọn bác sỹ, chèn mô tả mặc định, nhận 2/3/4 ảnh từ màn hình Capture, lưu xuống SQLite và in khổ A4 qua `print.js`.
- **Lấy hình ảnh (capture.js)**: Liệt kê camera `getUserMedia`, bật preview, chụp nhiều ảnh, chọn tối đa số ảnh cấu hình. Khi chấp nhận, ảnh được lưu thành file PNG tại `Data/Images/YYYY/MM/ID_x.png` thông qua API `/api/examinations/:id/images` (alias `/api/images`) rồi đẩy ngược về form.
- **Tìm kiếm & danh sách**: `search-patient.js`, `search-exam.js`, `daily-lists.js` lọc nhanh bệnh nhân, phiếu khám và thống kê trong ngày.
- **Quản trị**: `settings.js` chỉnh thông tin bệnh viện, logo (upload trực tiếp trong giao diện), prefix, số ảnh mặc định, mô tả mẫu, quyền xoá dữ liệu. `doctors.js` quản lý bác sỹ, `result-templates.js` lưu mẫu kết quả. `license-ui.js` hiển thị trạng thái giấy phép, kích hoạt gói tháng/năm/vĩnh viễn. API `/backup/create` (hoặc `/api/backup`) và `/backup/restore` sao lưu/phục hồi toàn bộ thư mục `Data/`.

## Cấu trúc thư mục
```
project-root/
  package.json
  src/
    server.js
    api/ (router các API)
    services/ (business logic: patients, examinations, doctors, license, backup…)
    dal/ (kết nối SQLite, tạo bảng)
    utils/
  public/
    index.html, styles.css, app.js, login.js, exam-form.js, capture.js,
    search-patient.js, search-exam.js, daily-lists.js, settings.js,
    doctors.js, result-templates.js, print.js, license-ui.js, storage.js,
    assets/ (.gitkeep + logo-default.svg mẫu văn bản, có thể thay logo riêng)
  Data/
    Database/app.db   (SQLite, tự tạo khi chạy)
    Images/YYYY/MM/...png
    Config/backups/   (nơi lưu file zip backup)
```
> Server tự tạo file DB và bảng nếu chưa có; sao lưu chỉ cần copy thư mục `Data/`.

**Lưu ý về Git/GitHub**

- Thư mục `Data/Images/` được đưa vào `.gitignore` (kèm file `.gitkeep`) để tránh đẩy các ảnh PNG dung lượng lớn lên GitHub và gặp lỗi "Binary file not supported".
- Logo mặc định nay là file SVG (`public/assets/logo-default.svg`) thuần văn bản nên vẫn nằm trong repo. Khi muốn dùng logo PNG/JPG của bệnh viện, bạn có thể tải trực tiếp tại màn hình **Cấu hình → Logo phiếu khám** (logo sẽ lưu vào `public/assets/` và cập nhật `logoFileName`). Nếu muốn làm thủ công, chép file vào `public/assets/` và chỉnh cấu hình tại màn hình **Cấu hình** cho phù hợp. Nếu cần commit logo riêng, Git vẫn chấp nhận; còn nếu muốn giữ repo thuần văn bản, thêm đường dẫn logo đó vào `.gitignore` trước khi commit.
- Khi cần sao lưu/khôi phục ảnh hoặc DB, hãy copy trực tiếp cả thư mục `Data/` hoặc sử dụng API `/backup/create` và `/backup/restore`.

## Khắc phục lỗi "Tệp nhị phân không được hỗ trợ"

Nếu GitHub vẫn báo lỗi này, hãy kiểm tra hai vị trí sau:

1. **`public/assets/`** – nếu bạn tự chép logo PNG/JPG vào đây và commit, GitHub có thể báo lỗi nếu file quá lớn. Có thể xử lý bằng cách dùng ảnh gọn nhẹ (<1 MB), hoặc loại khỏi index với `git rm --cached public/assets/<ten-logo>.png` nếu chỉ muốn dùng nội bộ.
2. **`Data/Images/`** – mọi ảnh chụp từ màn hình Lấy hình sẽ nằm trong thư mục này. Cấu hình `.gitignore` đã bỏ qua toàn bộ thư mục (trừ `.gitkeep`). Nếu bạn thấy file PNG nào được liệt kê bởi `git status`, hãy chạy `git rm --cached Data/Images/<file>.png` hoặc xoá hẳn file đó rồi chụp lại sau khi push.

Kiểm tra nhanh bằng lệnh `git ls-files | grep -E '\\.png|\\.jpg|\\.zip'`. Nếu lệnh này in ra bất kỳ đường dẫn nào khác ngoài `Data/Images/.gitkeep`, đó chính là tệp nhị phân gây lỗi khi push. Sau khi loại bỏ khỏi index, commit + push sẽ thành công.

## Yêu cầu hệ thống
- Node.js 18+.
- Trình duyệt hiện đại hỗ trợ `MediaDevices.getUserMedia`.
- Máy Windows/offline chỉ cần `npm install` + `npm start`.

## Cài đặt & chạy
```bash
git clone https://github.com/<ten>/phanmemsoictc.git
cd phanmemsoictc
npm install
npm start
```
Sau khi server báo địa chỉ, mở `http://localhost:3000`, đăng nhập `admin` / `admin123`, kiểm tra giấy phép (mặc định trial 30 ngày) rồi sử dụng menu/phím tắt. Nếu muốn thay logo, vào **Cấu hình → Logo phiếu khám**, chọn file PNG/JPG/SVG và bấm "Tải logo" (server sẽ lưu + cập nhật cấu hình trong SQLite). Nếu làm thủ công, chép file (ví dụ `logo-benhvien.png`) vào `public/assets/`, sau đó nhập tên file tương ứng tại màn hình **Cấu hình** và lưu lại.
1. **F3 – Khám bệnh**: điền thông tin BN, phiếu khám, chọn bác sỹ, lưu phiếu. Nút “Lấy hình ảnh (F4)” chuyển sang màn hình camera.
2. **F4 – Lấy hình**: bật camera, chụp, tick tối đa số ảnh cấu hình, bấm “Chấp nhận (F10)” để tải ảnh lên thư mục `Data/Images/` và đưa về form.
3. **In phiếu**: tại Khám bệnh bấm “In phiếu” → `print.js` dựng trang A4 với logo bệnh viện, mô tả, ảnh.
4. **Tìm kiếm/Danh sách**: dùng các màn hình phụ để lọc bệnh nhân, phiếu, danh sách trong ngày.
5. **Cấu hình/Doctor/Mẫu**: quản lý dữ liệu nền trực tiếp qua giao diện, dữ liệu được ghi vào CSDL SQLite và thư mục `Data/`.

## API chính (server.js)
- `GET/PUT /system-config` (alias `/api/settings`)
- `GET/POST/PUT/DELETE /patients`
- `GET/POST/PUT/DELETE /examinations` (alias `/api/exams`)
- `POST /examinations/:id/images` (alias `/api/images`) – upload PNG → `Data/Images/YYYY/MM/ID_x.png`
- `GET/POST/PUT/DELETE /doctors`
- `GET/POST/PUT/DELETE /result-templates`
- `GET /license`, `POST /license/activate`
- `GET/POST /backup/create` (hoặc `GET /api/backup`) – sinh ZIP thư mục `Data/`
- `POST /backup/restore` (hoặc `POST /api/restore`) – upload ZIP để giải nén đè `Data/`

> Máy chủ tạo/giải nén ZIP bằng lệnh hệ điều hành: Linux/macOS dùng `zip`/`unzip`, Windows dùng PowerShell `Compress-Archive`/`Expand-Archive`.

Tất cả API (trừ `/api/license*`) bị chặn khi giấy phép hết hạn.

## Build/triển khai tĩnh
Nếu cần build static cho GitHub Pages (chỉ frontend):
```bash
npm run build   # copy public/ → dist/
npm run deploy  # đẩy dist/ lên gh-pages (yêu cầu quyền push)
```
Lưu ý: chế độ offline/CRUD chỉ hoạt động khi chạy `npm start` vì GitHub Pages không có Node backend.

## Kiểm thử
```bash
npm test
```
Bộ test xác nhận endpoint `/health` hoạt động và trang chủ render thành công.
