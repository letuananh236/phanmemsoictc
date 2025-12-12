export function createResultTemplatesView() {
  return {
    render(target) {
      const section = document.createElement('section');
      section.className = 'card templates-view wide-card';
      section.innerHTML = `
        <h3>Giới thiệu phần mềm</h3>
        <div class="intro-layout">
          <div class="intro-block">
            <h4>A. Hướng dẫn sử dụng phần mềm</h4>
            <ol class="intro-steps">
              <li><strong>Đăng nhập & kích hoạt:</strong> mở ứng dụng, xem mã máy, nhập key bản quyền nếu được yêu cầu rồi đăng nhập (có tùy chọn lưu thông tin).</li>
              <li><strong>Khám bệnh:</strong> nhập mã BN, thông tin bệnh nhân, kết quả/KQ soi, mô tả và lời dặn; chọn 2–4 ảnh in. Bản ghi giữ nguyên khi chuyển sang màn hình Lấy hình.</li>
              <li><strong>Lấy hình ảnh:</strong> chọn camera, chỉnh độ phân giải/FPS hoặc preset, tùy chỉnh độ sáng/tương phản/bão hòa, đặt phím chụp nhanh (F1–F12, mặc định F2) rồi chụp và phân bố ảnh vào lưới 2x2.</li>
              <li><strong>Tìm phiếu khám:</strong> tìm theo mã BN hoặc thông tin bệnh nhân, xem chi tiết đầy đủ, chọn dòng để in lại hoặc chỉnh sửa; ảnh và mã hiển thị đúng cho bản đã lưu.</li>
              <li><strong>Cấu hình & sao lưu:</strong> cập nhật thông tin bệnh viện, logo (vuông/chữ nhật), phím chụp, số ảnh mặc định, tài khoản; tải/khôi phục backup và xóa dữ liệu khi cần.</li>
            </ol>
            <p class="intro-note">
              Mẹo: luôn tải backup định kỳ trước khi nâng cấp hoặc khôi phục dữ liệu. Sau khi khôi phục, kiểm tra lại mã BN/BS, hình ảnh và thông tin cấu hình.
            </p>
          </div>
          <div class="intro-block">
            <h4>B. Hướng dẫn sử dụng máy</h4>
            <div class="intro-device">
              <h5>A. Bàn điều khiển trên camera (Control Panel)</h5>
              <figure class="intro-figure">
                <img src="/database/images/Picture1.png" alt="Sơ đồ nút bấm trên bàn điều khiển camera" />
                <figcaption>Thứ tự phím trên thân máy (tương ứng ký hiệu A–M).</figcaption>
              </figure>
              <ul class="intro-legend">
                <li><strong>A/B – Bật/Tắt:</strong> bật hoặc tắt camera cùng đèn LED.</li>
                <li><strong>C – Trạng thái:</strong> xem trạng thái LED trên máy.</li>
                <li><strong>D – Độ sáng:</strong> tăng/giảm độ sáng đèn LED (5 cấp), nên dùng thử rồi giữ mức phù hợp.</li>
                <li><strong>E – Cân bằng trắng:</strong> cân chỉnh WB theo chế độ, ưu tiên dùng khi màu bị lệch.</li>
                <li><strong>F – E-Zoom:</strong> phóng to/thu nhỏ hình ảnh (Zoom 1–5x).</li>
                <li><strong>G – Đổi đầu lọc:</strong> chuyển bộ lọc màu/green filter để tăng tương phản.</li>
                <li><strong>H/I – Lật hình/E-Flip:</strong> xoay/lật hình 180° khi cần đổi hướng.</li>
                <li><strong>J/K – Đổi màu/Green Filter:</strong> chuyển nhanh 5 cấp tương phản màu & Gamma (N1–N5).</li>
                <li><strong>L – Mirror:</strong> chế độ gương khi cần đảo trục quan sát.</li>
                <li><strong>M – Phóng to:</strong> zoom in/out nhanh bằng phím cạnh trên.</li>
              </ul>
            </div>
            <div class="intro-device">
              <h5>B. Remote control</h5>
              <figure class="intro-figure">
                <img src="/database/images/Picture2.png" alt="Remote điều khiển camera" />
                <figcaption>Ký hiệu A–L tương ứng các nút trên remote.</figcaption>
              </figure>
              <ul class="intro-legend">
                <li><strong>A – Power ON / B – Power OFF:</strong> bật/tắt camera và đèn LED.</li>
                <li><strong>C – Auto Focus:</strong> lấy nét tự động.</li>
                <li><strong>D – Manual Focus:</strong> chỉnh nét thủ công khi cần chính xác.</li>
                <li><strong>E – E-Flip / F – Mirror:</strong> xoay ảnh 180° hoặc lật trái-phải.</li>
                <li><strong>G – Pause/Freeze:</strong> đóng băng hình đang xem hoặc tiếp tục Live.</li>
                <li><strong>H – Zoom In / I – Zoom Out:</strong> phóng to/thu nhỏ (tới ~55x).</li>
                <li><strong>J/K – Green Filter OFF/ON:</strong> tắt/bật bộ lọc xanh và Gamma hỗ trợ độ tương phản.</li>
                <li><strong>L – Center:</strong> đặt ảnh về vị trí trung tâm.</li>
              </ul>
            </div>
          </div>
        </div>
      `;
      target.appendChild(section);
    }
  };
}
