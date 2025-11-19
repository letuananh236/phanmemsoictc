# Prompt Codex chuẩn – Sinh SRS + UML cho hệ thống soi cổ tử cung offline

## Cách dùng nhanh
1. Mở Cursor/Copilot/Codex (hoặc bất kỳ AI tương tự).
2. Tạo file mới, dán nguyên khối **PROMPT START/END** bên dưới.
3. Chạy một lần để AI sinh **đủ bộ SRS chuẩn ISO/IEC/IEEE 29148** và **UML đầy đủ** (Use Case, Activity, Sequence, ERD) cho hệ thống soi cổ tử cung offline.
4. Nếu cần chỉnh nội dung (ví dụ đổi prefix mã, đổi quy trình), sửa phần mô tả hệ thống trong prompt rồi chạy lại. Prompt đã cấm sinh code, chỉ cho phép tài liệu phân tích.

## PROMPT START (copy toàn bộ khối này)
Bạn là **Senior System Architect + Business Analyst** trong lĩnh vực y tế, chuyên thiết kế hệ thống phần mềm khám chữa bệnh. Trong lượt này:

- ✅ **Chỉ tạo bộ tài liệu phân tích hệ thống**, bao gồm:
  - **Bản đặc tả SRS** phong cách **ISO/IEC/IEEE 29148** (cấu trúc rõ, heading chuẩn).
  - **Bộ UML đầy đủ**:
    - Use Case (diagram mô tả bằng text + danh sách use case chi tiết)
    - Activity Diagram cho các luồng nghiệp vụ chính
    - Sequence Diagram cho các tương tác quan trọng
    - ERD – Mô hình dữ liệu quan hệ
- ❌ **Tuyệt đối không sinh bất kỳ dòng code nào** (không JS/Node/SQL…). Chỉ sinh tài liệu phân tích.

### 1) Bối cảnh hệ thống
- Phần mềm soi cổ tử cung chạy **offline 100%** cho phòng khám/phòng sản phụ khoa, chạy trên 1 máy (hoặc vài máy nội bộ), **không phụ thuộc Internet**.
- Nền tảng dự kiến: **Backend Node.js + Express**, **Database SQLite (file local)**, ứng dụng web/Electron chạy toàn màn hình.
- Dữ liệu nhạy cảm: thông tin bệnh nhân, ảnh soi cổ tử cung.
- Người dùng chính: Bác sĩ sản phụ khoa (đa phần lớn tuổi, không rành máy tính), Điều dưỡng/lễ tân nhập liệu, Quản trị (chủ phòng khám/IT).

### 2) Các module chức năng bắt buộc (bao phủ trong SRS & UML)
- **Auth**: đăng nhập tài khoản/mật khẩu, phân quyền Admin/Doctor/Staff.
- **Patients**: CRUD bệnh nhân, sinh mã BN tự động (prefix BN + số tăng dần dạng BN00001), tìm kiếm.
- **Doctors**: quản lý danh sách bác sĩ, chọn bác sĩ phụ trách phiếu khám.
- **DefaultResults**: danh sách kết quả/kết luận mẫu để chèn nhanh.
- **Visits/Exam**: tạo phiếu khám soi CTC (VisitCode tự sinh prefix PK/HA + số), lưu bác sĩ, ngày khám, lý do, kết quả, ghi chú chi tiết.
- **VisitImages**: 2/3/4 ảnh tùy cấu hình; lưu file, DB chỉ lưu đường dẫn + thứ tự.
- **Camera Capture**: kết nối camera/capture UVC, preview, chụp ảnh, auto resize/lưu theo VisitCode, không cho chụp nếu chưa có VisitID.
- **Print A4**: in phiếu khám A4 giống mẫu giấy, logo + thông tin phòng khám, thông tin bệnh nhân/phiếu, 2–4 ảnh soi được fit/crop đúng tỉ lệ.
- **Config**: tên phòng khám, logo, địa chỉ, điện thoại, prefix & độ dài mã BN/PK, số ảnh trên phiếu (2/3/4), thư mục lưu ảnh, thư mục backup mặc định.
- **License**: trial 30 ngày, license 1 năm, license vĩnh viễn; ràng buộc HardwareID; lưu LastCheckAt để phát hiện chỉnh lùi giờ; cảnh báo còn X ngày; hết hạn có thể chặn camera/in.
- **Backup & Restore**: backup DB (SQLite), thư mục ảnh soi, file config; restore ghi đè; cảnh báo nguy cơ mất dữ liệu.
- **Today’s Visits**: liệt kê phiếu khám trong ngày, mở xem/in lại.

### 3) UI/UX chung (phản ánh trong SRS & UML nơi phù hợp)
- Đối tượng bác sĩ lớn tuổi → font vừa–to, nút to, bố cục đơn giản.
- Màn hình Khám bệnh: cột trái tìm/chọn BN, cột phải thông tin phiếu + khung ảnh soi + camera preview + nút Chụp; nút Lưu/In.
- Tabs chính: Khám bệnh; Danh sách bệnh nhân; Danh sách khám trong ngày; Bác sĩ; Kết quả mẫu; Cấu hình; Backup & Restore; Bản quyền.
- Trải nghiệm chuẩn: Đăng nhập → Khám bệnh → Chọn/Tạo BN → Tạo phiếu → Mở camera & chụp ảnh → Lưu → In A4.

### 4) Yêu cầu SRS (ISO/IEC/IEEE 29148 style)
Tạo SRS chi tiết với (có thể điều chỉnh tên heading nhưng giữ tinh thần chuẩn):
- Introduction (Purpose, Scope, Definitions/Acronyms, References, Overview)
- Overall Description: Product Perspective (offline, single-site, local DB), Product Functions (overview các module trên), User Classes (Admin/Doctor/Staff), Operating Environment (Windows PC, offline, camera USB), Design Constraints (offline, SQLite, ảnh không quá nặng, không internet), Assumptions/Dependencies.
- System Features (Functional Requirements): mỗi module là một mục con. Mỗi tính năng ghi: Description, **Functional Requirements (FR-xxx)**, Preconditions/Postconditions, Error handling (mất camera, hết ổ cứng, hết license…).
- External Interface Requirements: UI (nguyên tắc UI cho bác sĩ lớn tuổi), Hardware (camera USB, ổ cứng), Software (OS, driver), Communications (nhấn mạnh: không dùng internet).
- Nonfunctional Requirements: Performance (tốc độ load, độ trễ chụp ảnh, in), Security & Privacy (dữ liệu BN/ảnh, license), Reliability & Availability, Usability, Maintainability & Extensibility, Backup & Recovery. Đánh số **NFR-xxx**.
- Other Requirements: quy định backup/restore, log lỗi & thao tác quan trọng.
- Đánh số rõ ràng FR-xxx, NFR-xxx.

### 5) Yêu cầu UML
- **Use Case Diagram & List**: Actors (Admin, Doctor, Staff). Use cases: Đăng nhập; Quản lý bệnh nhân; Tạo phiếu khám; Chụp ảnh soi bằng camera; In phiếu A4; Quản lý bác sĩ; Quản lý kết quả mẫu; Cấu hình hệ thống; Quản lý license; Thực hiện backup; Phục hồi dữ liệu; Xem danh sách khám trong ngày. Cung cấp mô tả text actor ↔ use case + bảng chi tiết (Tên, Actor, Mục tiêu, Main Flow, Alternate/Exception, Preconditions/Postconditions).
- **Activity Diagrams** (text dạng bước/decision) tối thiểu cho: (1) Khám bệnh + Chụp ảnh + In; (2) Backup dữ liệu; (3) Kích hoạt license.
- **Sequence Diagrams** (text message tuần tự) tối thiểu cho: (1) Đăng nhập; (2) Tạo phiếu mới + chụp ảnh + lưu; (3) In phiếu A4; (4) Backup. Lifelines gợi ý: User (Doctor/Staff), UI, Backend, DB, Camera module, Print module, Backup module, License module.
- **ERD**: Entities bắt buộc: Users, Doctors, Patients, Visits, VisitImages, DefaultResults, SystemConfig, License. Nêu PK, thuộc tính chính, quan hệ (1 Patient nhiều Visits; 1 Visit nhiều VisitImages; 1 Doctor nhiều Visits; SystemConfig key–value; License một bản ghi hiện hành).

### 6) Quy tắc trình bày output
- Xuất theo thứ tự: **SRS đầy đủ** → **UML** (Use Case, Activity, Sequence, ERD).
- Dùng heading rõ ràng (Markdown). Không sinh code. Mô tả đủ sâu để đội dev/AI khác có thể dựa vào đó sinh code sau này.

Bắt đầu tạo SRS và UML ngay bây giờ, tuân thủ toàn bộ yêu cầu trên.
## PROMPT END
