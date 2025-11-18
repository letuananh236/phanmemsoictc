# Đặc tả hệ thống & UML – Phần mềm soi cổ tử cung offline

## 1. Introduction
### 1.1 Purpose
Tài liệu này mô tả yêu cầu và kiến trúc nghiệp vụ cho phần mềm soi cổ tử cung chạy offline, nhằm hướng dẫn đội phát triển và kiểm thử xây dựng hệ thống đáp ứng quy trình khám, chụp ảnh, in phiếu A4, cấp phép, sao lưu và vận hành an toàn.

### 1.2 Scope
Hệ thống phục vụ phòng khám/phòng sản phụ khoa, vận hành trên một hoặc vài máy nội bộ Windows, không phụ thuộc internet, sử dụng backend Node.js + Express và cơ sở dữ liệu SQLite. Người dùng mục tiêu gồm bác sĩ sản, điều dưỡng/lễ tân và quản trị.

### 1.3 Definitions, Acronyms, Abbreviations
- CTC: Cổ tử cung.
- BN: Bệnh nhân.
- HA/PK: Mã phiếu khám/Exam/Visit.
- UI: User Interface.
- FR: Functional Requirement.
- NFR: Nonfunctional Requirement.
- UVC: USB Video Class (thiết bị camera/capture).

### 1.4 References
- ISO/IEC/IEEE 29148:2018 – Systems and software engineering — Life cycle processes — Requirements engineering.

### 1.5 Overview
Tài liệu gồm phần SRS (yêu cầu chức năng, phi chức năng, giao diện) và phần UML (Use Case, Activity, Sequence, ERD) cho hệ thống soi CTC offline.

## 2. Overall Description
### 2.1 Product Perspective
- Ứng dụng chạy offline 100% trên mạng nội bộ, không trao đổi internet.
- Backend Node.js + Express, database SQLite file local (Data/Database/app.db).
- Lưu ảnh soi dưới dạng file trong thư mục dữ liệu nội bộ; DB chỉ lưu đường dẫn.
- Có thể gói thành ứng dụng desktop (Electron) hoặc web nội bộ chạy toàn màn hình.

### 2.2 Product Functions (tóm tắt)
- Auth: đăng nhập, phân quyền Admin/Doctor/Staff.
- Patients: quản lý hồ sơ, sinh mã BN tự động (BNxxxxx).
- Doctors: quản lý bác sĩ, đánh dấu mặc định.
- DefaultResults: mẫu chẩn đoán/đề nghị nhanh.
- Visits/Exam: tạo phiếu khám soi CTC (HAxxxxx), nhập kết quả, lưu trạng thái in.
- VisitImages: chụp, lưu, chọn tối đa 4 ảnh/phiếu.
- Camera Capture: mở camera UVC, preview, chụp, gán vào phiếu.
- Print A4: in phiếu với logo, thông tin BN, 2–4 ảnh.
- Config: thông tin cơ sở, logo, prefix mã, số ảnh, thư mục dữ liệu.
- License: trial 30 ngày, 1 năm, vĩnh viễn; ràng buộc HardwareID, cảnh báo hết hạn.
- Backup & Restore: sao lưu/khôi phục DB + ảnh + config.
- Today’s Visits: lọc và mở phiếu khám trong ngày.

### 2.3 User Classes and Characteristics
- Admin: quản trị hệ thống, cấu hình, license, backup/restore, quản lý người dùng.
- Doctor: khám, chụp ảnh, in phiếu, chọn kết quả mẫu.
- Staff: nhập BN, tạo phiếu, hỗ trợ bác sĩ, không cấu hình hệ thống.

### 2.4 Operating Environment
- Windows PC độ phân giải ≥ 1366×768, offline.
- Camera/capture UVC tương thích `getUserMedia`.
- Node.js runtime, SQLite local, ổ đĩa đủ dung lượng lưu ảnh.

### 2.5 Design and Implementation Constraints
- Không phụ thuộc internet; tất cả dữ liệu lưu nội bộ.
- SQLite file-based; cần khóa file đúng cách để tránh hỏng dữ liệu.
- Ảnh không quá nặng (resize khi lưu, chiều rộng tối đa ~1280px).
- License ràng buộc HardwareID và thời gian hệ thống.

### 2.6 Assumptions and Dependencies
- Người dùng cho phép truy cập camera trong trình duyệt.
- Máy có đủ quyền ghi vào thư mục dữ liệu (DB, ảnh, backup).
- Giờ hệ thống chính xác; thay đổi lùi giờ có thể chặn license.

## 3. System Features (Functional Requirements)
> Mỗi mục gồm mô tả, yêu cầu chức năng (FR-xxx), điều kiện và xử lý lỗi.

### 3.1 Auth
- Mô tả: đăng nhập bằng tài khoản/mật khẩu, sinh token phiên, phân quyền.
- FR-001: Hệ thống phải cho phép nhập username/password và xác thực với DB Users.
- FR-002: Nếu sai thông tin → trả lỗi INVALID_CREDENTIALS.
- FR-003: Nếu tài khoản bị khóa → trả lỗi USER_INACTIVE.
- FR-004: Nếu license hết hạn → trả lỗi LICENSE_EXPIRED.
- FR-005: Sau khi đăng nhập thành công, trả thông tin user (role) và token phiên.
- Preconditions: DB Users tồn tại; license kiểm tra thành công.
- Postconditions: Token hợp lệ được lưu để gọi API nghiệp vụ.
- Error handling: trả 401/403 phù hợp; không log mật khẩu.

### 3.2 Patients
- Mô tả: quản lý hồ sơ BN, mã tự sinh BNxxxxx.
- FR-010: Hệ thống phải sinh mã BN mới bằng cách lấy mã lớn nhất, tăng +1, pad 5 số.
- FR-011: Cho phép tạo, sửa, tìm kiếm BN theo mã/tên/SĐT.
- FR-012: Tuổi có thể tự tính từ năm sinh khi nhập.
- FR-013: Không cho xóa BN nếu đã có phiếu khám liên kết (trừ khi cho phép bởi Admin).
- Preconditions: Người dùng đăng nhập; role Doctor/Staff/Admin.
- Error handling: thiếu trường bắt buộc (họ tên, tuổi) → 400; lỗi DB → 500.

### 3.3 Doctors
- Mô tả: quản lý danh sách bác sĩ.
- FR-020: Tạo/sửa thông tin bác sĩ (tên, chuyên khoa, trạng thái, chữ ký nếu có).
- FR-021: Cho phép đánh dấu bác sĩ mặc định trong cấu hình.
- FR-022: Chỉ hiển thị bác sĩ is_active=1 trong dropdown khám.

### 3.4 DefaultResults
- Mô tả: danh sách mẫu chẩn đoán/đề nghị.
- FR-030: CRUD mẫu kết quả với trạng thái kích hoạt.
- FR-031: Chèn nhanh nội dung mẫu vào phiếu khám khi chọn.

### 3.5 Visits/Exam
- Mô tả: phiếu khám soi CTC.
- FR-040: Sinh mã phiếu HAxxxxx bằng quy tắc tăng dần 5 số.
- FR-041: Tạo phiếu mới gắn với BN và (tùy chọn) bác sĩ, ngày/giờ khám.
- FR-042: Cho phép chỉnh sửa các trường: lý do, mô tả soi CTC, kết quả, điều trị, lời dặn, bác sĩ khám, ghi chú.
- FR-043: Lưu trạng thái đã in phiếu (da_in_phieu) sau khi in A4.
- FR-044: Hiển thị danh sách phiếu khám trong ngày, lọc theo ngày/bác sĩ.
- FR-045: Không cho in nếu license hết hạn.

### 3.6 VisitImages
- Mô tả: quản lý ảnh soi gắn với phiếu.
- FR-050: Cho phép lưu tối đa số ảnh theo cấu hình (mặc định 4) cho mỗi phiếu.
- FR-051: Mỗi ảnh có slot/thứ tự, đường dẫn file, thời gian chụp.
- FR-052: Không cho thêm ảnh nếu đã đủ số slot đang chọn.
- FR-053: Cho phép xóa ảnh (cập nhật DB và xóa file vật lý).

### 3.7 Camera Capture
- Mô tả: mở camera UVC, preview, chụp và đẩy ảnh vào phiếu.
- FR-060: Liệt kê thiết bị video input, cho phép chọn và nhớ lựa chọn.
- FR-061: Khi bấm “Chụp hình” hoặc phím F4 → chụp frame video, thêm vào danh sách tạm.
- FR-062: Khi bấm “Chấp nhận” (F10) → upload ảnh tạm lên server, gán vào slots phiếu.
- FR-063: Nếu không chọn camera hoặc bị từ chối quyền → hiển thị cảnh báo và không crash.

### 3.8 Print A4
- Mô tả: xuất phiếu A4 với logo, thông tin cơ sở, BN, phiếu, ảnh.
- FR-070: Lấy dữ liệu phiếu/BN/bác sĩ/ảnh qua endpoint print-data.
- FR-071: Render mẫu A4 với 2–4 ảnh, fit/crop đúng tỉ lệ, lề ~1.5cm, font dễ đọc.
- FR-072: Gọi lệnh in (window.print hoặc tương đương) và cập nhật trạng thái đã in.

### 3.9 Config
- Mô tả: cấu hình hệ thống.
- FR-080: Lưu/đọc các giá trị: tên cơ sở, địa chỉ, SĐT, logo, prefix mã BN/HA, số ảnh, thư mục dữ liệu/backup, bác sĩ mặc định.
- FR-081: Cho phép chọn và lưu logo; thay đổi áp dụng cho in phiếu.
- FR-082: Cho phép chọn kích thước font, chế độ tương phản cao cho UI.

### 3.10 License
- Mô tả: quản lý bản quyền.
- FR-090: Tạo license trial 30 ngày nếu chưa kích hoạt.
- FR-091: Nhập key để kích hoạt gói 1 năm hoặc vĩnh viễn; ràng buộc HardwareID.
- FR-092: Kiểm tra LastCheckAt để phát hiện chỉnh lùi giờ.
- FR-093: Khi còn <15 ngày → cảnh báo; khi hết hạn → chặn in/chụp, yêu cầu gia hạn.

### 3.11 Backup & Restore
- Mô tả: sao lưu và phục hồi dữ liệu.
- FR-100: Backup DB SQLite + thư mục ảnh + config vào file nén, lưu lịch sử backup.
- FR-101: Restore từ file backup sau khi người dùng xác nhận, cảnh báo ghi đè dữ liệu hiện tại.
- FR-102: Ghi log backup/restore (thời gian, người thực hiện, kết quả).

### 3.12 Today’s Visits
- Mô tả: danh sách phiếu khám trong ngày.
- FR-110: Lọc theo ngày và bác sĩ; tìm kiếm theo tên/SĐT/mã BN/phiếu trên client.
- FR-111: Double-click hoặc nút “Vào khám” mở chi tiết phiếu tương ứng.

## 4. External Interface Requirements
### 4.1 User Interface
- Font tối thiểu 15–16px, nút cao ≥ 44px, bố cục đơn giản, ít popup.
- Màn hình khám bệnh 3 cột: thông tin BN/khám; camera + ảnh; kết quả & in.
- Tabs: Khám bệnh, Bệnh nhân, Khám trong ngày, Bác sĩ, Kết quả mẫu, Cấu hình, Backup & Restore, License.
- Phím tắt: Alt+S (Lưu), Alt+P (In), Alt+N (Tạo mới), F4 (Chụp), F10 (Chấp nhận ảnh).

### 4.2 Hardware Interfaces
- Camera/capture UVC; ổ đĩa nội bộ đủ lưu DB/ảnh/backup; máy in A4.

### 4.3 Software Interfaces
- OS Windows, driver camera hỗ trợ getUserMedia; Node.js runtime; SQLite driver.

### 4.4 Communications Interfaces
- Không yêu cầu kết nối internet; có thể dùng LAN nội bộ cho nhiều máy cùng server.

## 5. Nonfunctional Requirements
### 5.1 Performance
- NFR-001: Màn hình chính tải trong <3 giây trên máy cấu hình phổ thông.
- NFR-002: Thời gian chụp và hiển thị ảnh ≤ 2 giây/ảnh sau khi bấm chụp.
- NFR-003: In phiếu A4 chuẩn bị trong ≤ 2 giây sau khi gọi print.

### 5.2 Security & Privacy
- NFR-010: Không gửi dữ liệu BN/ảnh ra internet; chỉ lưu nội bộ.
- NFR-011: Mật khẩu lưu dạng hash; không log mật khẩu.
- NFR-012: Token phiên phải bảo vệ API; route nghiệp vụ yêu cầu đăng nhập.
- NFR-013: Ảnh/backup lưu trong thư mục bảo vệ quyền truy cập vật lý.

### 5.3 Reliability & Availability
- NFR-020: Ứng dụng hoạt động offline; không bị gián đoạn nếu mất mạng ngoài.
- NFR-021: Backup định kỳ; cảnh báo nếu thiếu dung lượng lưu trữ.

### 5.4 Usability
- NFR-030: Giao diện rõ ràng cho bác sĩ lớn tuổi; thông báo lỗi dễ hiểu.

### 5.5 Maintainability & Extensibility
- NFR-040: Mã nguồn tách lớp (API, service, DAL, UI) để dễ nâng cấp.
- NFR-041: Cấu hình số ảnh, prefix mã, logo thay đổi mà không cần sửa code.

### 5.6 Backup & Recovery
- NFR-050: Backup phải bao gồm DB + ảnh + config; restore có xác nhận và log.

### 5.7 Other Requirements
- NFR-060: Log lỗi và thao tác quan trọng (login, backup, restore, kích hoạt license).

## 6. Other Requirements
- Đảm bảo tuân thủ luật bảo vệ dữ liệu y tế địa phương (nếu có).
- Cảnh báo trước khi xóa dữ liệu (BN, ảnh, backup).

---

# UML Documentation
## 1. Use Case Diagram (textual)
- Actors: Admin, Doctor, Staff.
- Use cases và quan hệ:
  - Admin: Đăng nhập; Quản lý bệnh nhân; Quản lý bác sĩ; Quản lý kết quả mẫu; Cấu hình hệ thống; Quản lý license; Thực hiện backup; Phục hồi dữ liệu; Xem danh sách khám trong ngày; Tạo phiếu khám; Chụp ảnh soi; In phiếu A4.
  - Doctor: Đăng nhập; Quản lý bệnh nhân; Tạo phiếu khám; Chụp ảnh soi; In phiếu A4; Xem danh sách khám trong ngày.
  - Staff: Đăng nhập; Quản lý bệnh nhân; Tạo phiếu khám; Chụp ảnh soi; Xem danh sách khám trong ngày; (In phiếu nếu được phân quyền).

### Use Case List (tóm tắt)
| Use Case | Actor | Mục tiêu | Main Flow (rút gọn) | Ngoại lệ |
| --- | --- | --- | --- | --- |
| Đăng nhập | Admin/Doctor/Staff | Truy cập hệ thống | Nhập cred → xác thực → nhận token | Sai cred (401); hết license (403) |
| Quản lý bệnh nhân | Admin/Doctor/Staff | Tạo/sửa/tìm BN | Mở list → tìm kiếm → chọn → lưu | Thiếu trường bắt buộc |
| Tạo phiếu khám | Doctor/Staff | Lập phiếu soi CTC | Chọn BN → sinh mã HA → nhập thông tin → lưu | Không có BN; lỗi license |
| Chụp ảnh soi | Doctor/Staff | Lấy ảnh gắn phiếu | Chọn camera → chụp ≤4 ảnh → lưu | Camera không truy cập; đầy slot |
| In phiếu A4 | Doctor/Staff | In kết quả | Mở phiếu → xem trước → in → đánh dấu đã in | License hết hạn; lỗi máy in |
| Quản lý bác sĩ | Admin | Cập nhật danh sách | Thêm/sửa/trạng thái | Thiếu thông tin |
| Quản lý kết quả mẫu | Admin/Doctor | Tạo mẫu chẩn đoán | Thêm/sửa/xóa mẫu | Thiếu tên |
| Cấu hình hệ thống | Admin | Thiết lập thông tin | Nhập thông tin cơ sở, logo, prefix, số ảnh | Thiếu quyền |
| Quản lý license | Admin | Kích hoạt bản quyền | Nhập key → xác thực → lưu | Key sai/hết hạn |
| Thực hiện backup | Admin | Sao lưu dữ liệu | Chọn backup → tạo file → lưu lịch sử | Thiếu dung lượng |
| Phục hồi dữ liệu | Admin | Khôi phục | Chọn file → cảnh báo → restore | File lỗi; hủy thao tác |
| Xem danh sách khám trong ngày | Admin/Doctor/Staff | Theo dõi phiếu | Chọn ngày/bác sĩ → xem bảng → mở phiếu | Không có dữ liệu |

## 2. Activity Diagrams (textual)
### 2.1 Khám bệnh + Chụp ảnh + In
Start → Đăng nhập → Chọn BN hoặc tạo BN → Tạo phiếu (sinh mã HA) → Mở camera → Chọn thiết bị → Chụp ảnh (<=4) → Lưu ảnh → Nhập mô tả/kết quả/đề nghị → Lưu phiếu → (Decision) License hợp lệ? → [Yes] Mở xem trước A4 → In phiếu → Đánh dấu đã in → End; [No] Hiển thị cảnh báo, dừng in.

### 2.2 Backup dữ liệu
Start → Đăng nhập (Admin) → Mở màn Backup → Bấm “Tạo file backup” → Thu thập DB + ảnh + config → Đóng gói file → Lưu file + ghi lịch sử → Thông báo thành công → End. Ngoại lệ: thiếu dung lượng → Thông báo lỗi → End.

### 2.3 Kích hoạt license
Start → Đăng nhập (Admin) → Mở màn License → Nhập mã kích hoạt → Gửi xác thực (offline/logic nội bộ) → (Decision) Key hợp lệ? → [Yes] Lưu LicenseInfo + cập nhật ngày hết hạn → Hiển thị trạng thái mới → End; [No] Thông báo key sai → End.

## 3. Sequence Diagrams (textual)
### 3.1 Đăng nhập
User → UI: nhập username/password → UI → Backend `/auth/login`: gửi cred → Backend → DB: truy vấn Users → DB → Backend: trả user/hash → Backend: kiểm hash & license → Backend → UI: 200 với token hoặc lỗi → UI: lưu token hoặc hiển thị lỗi.

### 3.2 Tạo phiếu mới + chụp ảnh + lưu
User → UI: chọn BN, bấm “Tạo phiếu” → UI → Backend `/api/visits`: yêu cầu tạo → Backend → DB: sinh mã HA, insert visit → Backend → UI: trả visitId → User → UI: bấm “Chụp” → UI → Camera module: lấy frame → UI → Backend `/api/visit-images`: upload ảnh → Backend → File system: lưu ảnh → Backend → DB: insert visit_images → Backend → UI: trả danh sách ảnh → User → UI: nhập kết quả → UI → Backend `/api/exams/:id`: PUT cập nhật → Backend → DB: update → Backend → UI: xác nhận lưu.

### 3.3 In phiếu A4
User → UI: bấm “In phiếu” → UI → Backend `/api/visits/:id/print-data`: lấy dữ liệu → Backend → DB: join visit/patient/doctor/images → Backend → UI: trả JSON → UI: render template → UI: gọi `window.print()` → (Optional) UI → Backend: đánh dấu đã in.

### 3.4 Backup
Admin → UI: bấm “Tạo backup” → UI → Backend `/api/backup/create`: yêu cầu backup → Backend → File system: đóng gói DB+ảnh+config → Backend → DB: ghi lịch sử backup → Backend → UI: trả đường dẫn file → UI: hiển thị thông báo.

## 4. ERD (textual)
- **Users**(UserID PK, Username, PasswordHash, FullName, Role, IsActive, CreatedAt, UpdatedAt)
- **Doctors**(DoctorID PK, FullName, Title, Department, SignatureImagePath, IsActive)
- **Patients**(PatientID PK, FullName, Gender, DOB, Phone, Address, CreatedAt, UpdatedAt)
- **Visits**(VisitID PK, PatientID FK→Patients, DoctorID FK→Doctors, ExamDateTime, ReasonForVisit, GyneHistory, ObstetricHistory, ClinicalNotes, ColpoFindings, Diagnosis, Recommendation, TemplateVersion, NumImages, CreatedAt, UpdatedAt, PrintedFlag)
- **VisitImages**(ImageID PK, VisitID FK→Visits, ImageOrder, FilePath, CapturedAt, Note, IsSelected)
- **DefaultResults**(TemplateID PK, Name, DiagnosisText, RecommendationText, IsActive)
- **SystemConfig**(ConfigKey PK, ConfigValue)
- **License**(LicenseID PK, LicenseKey, LicenseType, ActivatedAt, ExpireAt, MachineID, LastCheckedAt, Status)

Quan hệ:
- 1 Patient có nhiều Visits (1-n).
- 1 Visit có nhiều VisitImages (1-n).
- 1 Doctor có nhiều Visits (1-n).
- DefaultResults dùng tham chiếu mềm (chọn vào Visit khi lưu).
- SystemConfig là cặp key–value, một bản ghi cho mỗi cấu hình.
- License: một bản ghi hiện hành, quản lý trạng thái cấp phép.
