# phanmemsoictc

Bộ khung phần mềm soi cổ tử cung chạy offline 100% trên Node.js + HTML/CSS/JavaScript thuần. Máy chủ Node phục vụ file tĩnh, quản lý thư mục `data/` (JSON + ảnh) và cung cấp API CRUD cho bệnh nhân, phiếu khám, bác sỹ, mẫu kết quả, cấu hình, giấy phép, backup/restore.

## Chức năng nổi bật
- **Đăng nhập & bản quyền**: popup đăng nhập (mặc định `admin` / `123`) mở khoá thanh menu. Máy chủ tự tạo giấy phép trial 30 ngày, hiển thị màn hình License để kích hoạt các gói trả phí.
- **Thanh menu + phím tắt**: F3 (Khám bệnh), F4 (Lấy hình), Ctrl+E (Tìm phiếu). Nút Thoát đưa về màn hình đăng nhập.
- **Khám bệnh (exam-form.js)**: Form 3 vùng (bệnh nhân, phiếu khám, ảnh). Hỗ trợ sinh mã BN/HA, chọn bác sỹ, chèn mô tả mặc định, nhận 2/3/4 ảnh từ màn hình Capture, lưu xuống `data/patients.json` & `data/exams.json`, in khổ A4 qua `print.js`.
- **Lấy hình ảnh (capture.js)**: Liệt kê camera `getUserMedia`, bật preview, chụp nhiều ảnh, chọn tối đa số ảnh cấu hình. Khi chấp nhận, ảnh được lưu thành file PNG tại `data/images/YYYY/MM/ID_x.png` thông qua API `/api/images` rồi đẩy ngược về form.
- **Tìm kiếm phiếu**: `search-exam.js` lọc nhanh phiếu khám theo mã/BN/BS.
- **Quản trị**: `settings.js` chỉnh thông tin bệnh viện, logo, prefix, số ảnh mặc định, mô tả mẫu, quyền xoá dữ liệu. `doctors.js` quản lý bác sỹ, `result-templates.js` lưu mẫu kết quả. `license-ui.js` hiển thị trạng thái giấy phép, kích hoạt gói tháng/năm/vĩnh viễn. API `/api/backup` và `/api/restore` cho phép sao lưu/phục hồi toàn bộ thư mục `data/`.

## Cấu trúc thư mục
```
project-root/
  package.json
  src/server.js
  public/
    index.html, styles.css, app.js, login.js, exam-form.js, capture.js,
    search-exam.js, settings.js,
    doctors.js, result-templates.js, print.js, license-ui.js, storage.js,
    assets/ (.gitkeep + logo-default.svg mẫu văn bản, có thể thay logo riêng)
  data/
    settings.json, patients.json, exams.json, doctors.json,
    result-templates.json, license.json, images/
```
> Nếu thiếu JSON, server tự tạo với đúng schema; sao lưu chỉ cần copy thư mục `data/`.

**Lưu ý về Git/GitHub**

- Thư mục `data/images/` được đưa vào `.gitignore` (kèm file `.gitkeep`) để tránh đẩy các ảnh PNG dung lượng lớn lên GitHub và gặp lỗi "Binary file not supported".
- Logo mặc định nay là file SVG (`public/assets/logo-default.svg`) thuần văn bản nên vẫn nằm trong repo. Khi muốn dùng logo PNG/JPG của bệnh viện, chỉ cần chép file vào `public/assets/` và chỉnh `settings.json` → `logoFileName`. Nếu cần commit logo của riêng bạn, Git vẫn chấp nhận; còn nếu muốn giữ repo thuần văn bản, thêm đường dẫn logo đó vào `.gitignore` trước khi commit.
- Khi cần sao lưu/khôi phục ảnh, hãy copy trực tiếp cả thư mục `data/images/` hoặc sử dụng API `/api/backup` và `/api/restore`.

## Khắc phục lỗi "Tệp nhị phân không được hỗ trợ"

Nếu GitHub vẫn báo lỗi này, hãy kiểm tra hai vị trí sau:

1. **`public/assets/`** – nếu bạn tự chép logo PNG/JPG vào đây và commit, GitHub có thể báo lỗi nếu file quá lớn. Có thể xử lý bằng cách dùng ảnh gọn nhẹ (<1 MB), hoặc loại khỏi index với `git rm --cached public/assets/<ten-logo>.png` nếu chỉ muốn dùng nội bộ.
2. **`data/images/`** – mọi ảnh chụp từ màn hình Lấy hình sẽ nằm trong thư mục này. Cấu hình `.gitignore` đã bỏ qua toàn bộ thư mục (trừ `.gitkeep`). Nếu bạn thấy file PNG nào được liệt kê bởi `git status`, hãy chạy `git rm --cached data/images/<file>.png` hoặc xoá hẳn file đó rồi chụp lại sau khi push.

Kiểm tra nhanh bằng lệnh `git ls-files | grep -E '\\.png|\\.jpg|\\.zip'`. Nếu lệnh này in ra bất kỳ đường dẫn nào khác ngoài `data/images/.gitkeep`, đó chính là tệp nhị phân gây lỗi khi push. Sau khi loại bỏ khỏi index, commit + push sẽ thành công.

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
Sau khi server báo địa chỉ, mở `http://localhost:3000`, đăng nhập `admin` / `123`, kiểm tra giấy phép (mặc định trial 30 ngày) rồi sử dụng menu/phím tắt. Nếu muốn thay logo, chép file (ví dụ `logo-benhvien.png`) vào `public/assets/` và chỉnh `data/settings.json` → `"logoFileName": "logo-benhvien.png"`, sau đó khởi động lại server.
1. **F3 – Khám bệnh**: điền thông tin BN, phiếu khám, chọn bác sỹ, lưu phiếu. Nút “Lấy hình ảnh (F4)” chuyển sang màn hình camera.
2. **F4 – Lấy hình**: bật camera, chụp, tick tối đa số ảnh cấu hình, bấm “Chấp nhận (F10)” để tải ảnh lên thư mục `data/images/` và đưa về form.
3. **In phiếu**: tại Khám bệnh bấm “In phiếu” → `print.js` dựng trang A4 với logo bệnh viện, mô tả, ảnh.
4. **Tìm phiếu**: dùng màn hình phụ để lọc phiếu khám.
5. **Cấu hình/Doctor/Mẫu**: quản lý dữ liệu nền trực tiếp qua giao diện, dữ liệu được ghi vào JSON tương ứng.

## Tạo key phần mềm theo phần cứng
- Chạy `node scripts/generate-license-key.js` để đọc serial CPU, serial ổ cứng chính (nếu OS cho phép) và dung lượng RAM, sau đó băm SHA-256 để tạo `machineId` dạng `XXXX-XXXX-XXXX` cho giấy phép.
- Mã được dùng ngay trong API `/api/license/activate` và hiển thị ở `data/license.json`.
- Nếu không lấy được serial từ hệ điều hành, key sẽ rơi về hostname để đảm bảo luôn sinh ra giá trị ổn định.

Mẫu code (nằm trong `scripts/generate-license-key.js`):

```js
import { collectHardwareInfo, generateMachineKey } from '../src/hardware-id.js';

const info = collectHardwareInfo();
const key = generateMachineKey();

console.log('CPU Serial:', info.cpuSerial);
console.log('Ổ cứng Serial:', info.diskSerial);
console.log('RAM (MB):', info.ramMb);
console.log('Machine key:', key);
```

## API chính (server.js)
- `GET/PUT /api/settings`
- `GET/POST/PUT/DELETE /api/patients`
- `GET/POST/PUT/DELETE /api/exams`
- `GET/POST/PUT/DELETE /api/doctors`
- `GET/POST/PUT/DELETE /api/result-templates`
- `GET /api/license`, `POST /api/license/activate`
- `POST /api/images` (upload PNG → `data/images/YYYY/MM/ID_x.png`)
- `GET /api/backup` (trả về ZIP thư mục `data/`)
- `POST /api/restore` (upload ZIP để giải nén đè `data/`)

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
