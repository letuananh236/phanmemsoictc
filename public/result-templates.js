export function createResultTemplatesView() {
  return {
    render(target) {
      const section = document.createElement('section');
      section.className = 'card templates-view wide-card';
      section.innerHTML = `
        <h3>Giới thiệu phần mềm</h3>
        <p>
          Ứng dụng quản lý phiếu khám hỗ trợ nhập liệu, lưu trữ, tìm kiếm, chụp và in ảnh soi với
          các tùy chọn cấu hình linh hoạt cho phòng khám. Màn hình khám, chụp hình và tìm phiếu
          đều chia sẻ cùng bố cục rộng, hiển thị tối đa 4 ảnh theo tỉ lệ chuẩn, và cho phép tùy
          chỉnh số ảnh in ra phiếu.
        </p>
        <p>
          Khu vực cấu hình cho phép cập nhật thông tin bệnh viện, logo in phiếu, số ảnh mặc định,
          cũng như thêm tài khoản đăng nhập để bảo vệ dữ liệu. Các thay đổi được áp dụng ngay lập
          tức khi lưu.
        </p>
        <p>
          Nếu cần hỗ trợ, vui lòng liên hệ đội ngũ triển khai để được hướng dẫn và cập nhật các tính
          năng mới nhất.
        </p>
      `;
      target.appendChild(section);
    }
  };
}
