# phanmemsoictc

Ứng dụng web giúp bác sĩ tạo phiếu khám bệnh khổ A4 với khả năng chụp hình trực tiếp từ camera, tùy chỉnh thông tin bệnh viện và in nhanh chóng.

## Tính năng chính
- **Biểu mẫu khám bệnh** với các trường thông tin bệnh nhân, kết quả soi, chẩn đoán, hướng điều trị và dặn dò.
- **Tải hoặc chụp hình**: bật camera máy tính bảng/máy tính, chụp ảnh và chèn vào phiếu khám hoặc xóa toàn bộ ảnh khi cần.
- **Tuỳ chỉnh logo**: tải tệp hình ảnh để thay thế logo bệnh viện mặc định ngay trên giao diện.
- **Xuất bản in A4**: bố cục mặc định theo khổ giấy A4, ẩn các nút thao tác khi in để có phiếu khám gọn gàng.

## Yêu cầu hệ thống
- Node.js 18 trở lên.
- Trình duyệt hỗ trợ `MediaDevices.getUserMedia` để bật camera (Chrome, Edge, Firefox, Safari phiên bản hiện đại).

## Tải mã nguồn và cài đặt
1. Tải mã về máy bằng Git (thay URL bằng kho lưu trữ của bạn) hoặc tải file `.zip` rồi giải nén:

   ```bash
   git clone https://github.com/<ten-tai-khoan>/phanmemsoictc.git
   cd phanmemsoictc
   ```

2. Cài đặt các phụ thuộc (kể cả khi không có thư viện bên ngoài, lệnh này sẽ tạo `package-lock.json` và chuẩn bị môi trường):

   ```bash
   npm install
   ```

## Cách chạy ứng dụng
1. Khởi động máy chủ tĩnh:

   ```bash
   npm start
   ```

2. Mở trình duyệt tại [http://localhost:3000](http://localhost:3000).
3. Nhấn **"Bật camera"** để cấp quyền sử dụng camera và chụp ảnh. Ảnh được lưu tạm thời trên trang để tiện theo dõi.
4. Nhấn **"In phiếu"** để mở hộp thoại in và xuất ra giấy/ PDF khổ A4.

> **Lưu ý:** Một số trình duyệt yêu cầu kết nối HTTPS hoặc chạy trên localhost mới cho phép truy cập camera. Nếu chạy trên thiết bị di động, đảm bảo sử dụng kết nối bảo mật hoặc thông qua ng-tunnel phù hợp.

## Kiểm thử
Sau khi cài đặt phụ thuộc, bạn có thể chạy bộ kiểm thử tích hợp của Node.js để chắc chắn máy chủ hoạt động bình thường:

```bash
npm test
```
