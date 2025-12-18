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
              <p class="intro-note">Hướng dẫn sử dụng nhanh Digital Video Colposcope – COLpro 222DX-OZview và Digital Video Colposcope – COLpro777 Full HD.</p>
              <figure class="intro-figure">
                <img src="/database/logo/Picture1.png" alt="Sơ đồ nút bấm trên bàn điều khiển camera" />
                <figcaption>Thứ tự phím trên thân máy (tương ứng ký hiệu A–M).</figcaption>
              </figure>
              <ul class="intro-legend">
                <li><strong>A – Đèn báo nguồn:</strong> hiển thị trạng thái nguồn.</li>
                <li><strong>B – Công tắc BẬT/TẮT:</strong> nhấn một lần để bật camera và bộ chiếu sáng, nhấn lần nữa để tắt.</li>
                <li><strong>D – Lấy nét Tự động/Thủ công:</strong> mặc định ở chế độ Tự động (LED C sáng); nhấn để chuyển sang Lấy nét Thủ công (LED C tắt).</li>
                <li><strong>E – Cường độ chiếu sáng / Lấy nét Thủ công:</strong> khi LED sáng là chọn cường độ ánh sáng (I1–I5, I1 sáng nhất); khi LED tắt nhấn để lấy nét thủ công.</li>
                <li><strong>F – Tạm dừng hoặc Đóng băng:</strong> đóng băng hình ảnh cần lưu trữ; nhấn lại để bỏ đóng băng.</li>
                <li><strong>G – Bật Bộ lọc Xanh & Xanh Lam:</strong> bật Green Filter (4 cấp G1–G4), nhấn tiếp để dùng Blue Filter.</li>
                <li><strong>H – Tắt Bộ lọc Xanh, chọn Tương phản màu & Gamma:</strong> nhấn để về ảnh Normal (N1), các lần tiếp theo chọn N1–N5 và bật/tắt Gamma.</li>
                <li><strong>J – Phóng to (Zoom In):</strong> phóng to hình (Zoom 1–55x).</li>
                <li><strong>I – Thu nhỏ (Zoom Out):</strong> thu nhỏ mức phóng.</li>
                <li><strong>K – Hiển thị hẹn giờ (Timer):</strong> bật/tắt bộ đếm thời gian trên màn hình.</li>
                <li><strong>L – E-Flip:</strong> xoay ngược hình ảnh (ký hiệu “E” hiển thị khi bật).</li>
                <li><strong>M – Mirror Image:</strong> chế độ ảnh gương (ký hiệu “M” khi bật) để đổi hướng quan sát.</li>
              </ul>
            </div>
            <div class="intro-device">
              <h5>B. Remote control</h5>
              <figure class="intro-figure">
                <img src="/database/logo/Picture2.png" alt="Remote điều khiển camera" />
                <figcaption>Ký hiệu A–L tương ứng các nút trên remote.</figcaption>
              </figure>
              <ul class="intro-legend">
                <li><strong>A – Power ON:</strong> bật thiết bị, khởi động camera và LED.</li>
                <li><strong>B – Power OFF:</strong> tắt toàn bộ hệ thống.</li>
                <li><strong>C – Auto Focus:</strong> lấy nét tự động.</li>
                <li><strong>D – Manual Focus:</strong> chỉnh nét thủ công khi Auto Focus không chính xác (dùng khi nhiều dịch hoặc ánh sáng yếu).</li>
                <li><strong>E – E-Flip:</strong> xoay ảnh 180° khi cần lật dọc.</li>
                <li><strong>F – Mirror Image:</strong> ảnh gương trái ↔ phải để đổi hướng hiển thị.</li>
                <li><strong>G – Pause / Freeze:</strong> đóng băng khung hình để quan sát/chụp, nhấn lại để về Live.</li>
                <li><strong>H – Zoom In:</strong> phóng lớn (tới 55x).</li>
                <li><strong>L – Zoom Out:</strong> thu nhỏ để xem tổng quan.</li>
                <li><strong>I – Green Filter Off / Gamma:</strong> khi đang dùng Green Filter, nhấn để về Normal; nhấn tiếp để bật/tắt Gamma (tăng chi tiết vùng tối).</li>
                <li><strong>J – Green Filter ON:</strong> bật Green Filter (G1 → G4) để nổi bật mạch máu.</li>
                <li><strong>K – Timer:</strong> hiển thị/tắt bộ đếm thời gian soi.</li>
              </ul>
            </div>
          </div>
        </div>
      `;
      target.appendChild(section);
    }
  };
}
