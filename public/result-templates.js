export function createResultTemplatesView() {
  return {
    render(target) {
      const section = document.createElement('section');
      section.className = 'card templates-view wide-card';
      section.innerHTML = `
        <h3>Giới thiệu phần mềm</h3>
        <p>
          Ứng dụng hỗ trợ phòng khám lưu trữ, tìm kiếm, chụp và in phiếu khám với tối đa 4 ảnh theo
          tỉ lệ 4:3. Giao diện được tối ưu toàn màn hình, tự co giãn khi thay đổi kích thước và giữ
          nguyên bố cục giữa các màn hình Khám bệnh, Lấy hình ảnh và Tìm phiếu khám.
        </p>
        <ol class="intro-steps">
          <li><strong>Đăng nhập & kích hoạt:</strong> nhập tài khoản (có thể lưu thông tin), kiểm tra mã máy và kích hoạt bản quyền. Thông tin phiên bản hiển thị ngay tại màn hình đăng nhập.</li>
          <li><strong>Khám bệnh:</strong> điền thông tin bệnh nhân, kết quả, mô tả, lời dặn; chọn số ảnh in (2-4) và chuyển sang màn hình Lấy hình ảnh để chụp. Dữ liệu được giữ nguyên khi quay lại.</li>
          <li><strong>Lấy hình ảnh:</strong> chọn camera, thiết lập độ phân giải/FPS hoặc preset, dùng phím tắt chụp nhanh (F1–F12) và sắp xếp 4 ảnh vào lưới 2x2. Có thể xóa ảnh đã chọn hoặc xóa trong thư viện riêng.</li>
          <li><strong>Tìm phiếu khám:</strong> tra cứu bằng mã BN hoặc thông tin bệnh nhân, xem chi tiết đầy đủ, chọn dòng để in hoặc sửa. Phiếu in hiển thị 4 ảnh trên 1 hàng và bố cục chuẩn A4.</li>
          <li><strong>Cấu hình:</strong> cập nhật thông tin bệnh viện, logo phiếu, phím chụp, số ảnh mặc định, tài khoản đăng nhập. Tại đây cũng có chức năng sao lưu, khôi phục và xóa dữ liệu.</li>
        </ol>
        <p>
          Lưu ý: luôn sao lưu định kỳ (nút “Tải backup”) và kiểm tra dữ liệu sau khi khôi phục. Khi cần
          hỗ trợ thêm, vui lòng liên hệ đội ngũ triển khai để được hướng dẫn chi tiết.
        </p>
      `;
      target.appendChild(section);
    }
  };
}
