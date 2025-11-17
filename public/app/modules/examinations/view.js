import { el } from '../../components/common/dom.js';

export function renderExaminations() {
  const node = el(`
    <div class="exam-grid">
      <section class="panel exam-col patient-col">
        <div class="panel-header tight">
          <h2>Bệnh nhân đang khám</h2>
          <span class="muted">Tránh nhầm lẫn bằng cách hiển thị mã và thông tin ngắn gọn.</span>
        </div>
        <div class="badge-block">
          <div class="badge">Mã BN: <strong>BN01234</strong></div>
          <div class="badge">Mã phiếu: <strong>HA04567</strong></div>
        </div>
        <div class="form-grid two-cols compact">
          <label class="field">
            <span>Họ tên</span>
            <input type="text" value="Nguyễn Lan" />
          </label>
          <label class="field short">
            <span>Tuổi</span>
            <input type="number" value="36" />
          </label>
          <label class="field">
            <span>Lý do khám</span>
            <input type="text" placeholder="Nhập lý do" />
          </label>
          <label class="field">
            <span>Bác sĩ</span>
            <select>
              <option>BS Lê An</option>
              <option>BS Phạm Vy</option>
            </select>
          </label>
          <label class="field full">
            <span>Tiền sử sản / phụ khoa</span>
            <textarea rows="2"></textarea>
          </label>
        </div>
      </section>

      <section class="panel exam-col imaging-col">
        <div class="panel-header tight">
          <div>
            <h2>Hình ảnh soi</h2>
            <p class="muted">Giữ preview lớn, chọn camera một lần và lưu cấu hình cho các lần sau.</p>
          </div>
          <div class="actions-row">
            <select class="camera-select" aria-label="Chọn camera">
              <option>Mặc định (lưu cấu hình)</option>
              <option>Camera USB 1</option>
              <option>Capture Card</option>
            </select>
            <button class="btn accent" aria-keyshortcuts="Alt+C">Mở camera</button>
            <button class="btn primary" aria-keyshortcuts="Alt+P">Chụp ảnh</button>
          </div>
        </div>
        <div class="preview-box">
          <div class="video-placeholder">Video preview</div>
        </div>
        <div class="image-grid">
          ${[1, 2, 3, 4].map((idx) => `
            <div class="image-card">
              <div class="image-thumb" aria-label="Ảnh ${idx}"></div>
              <div class="image-label">Ảnh ${idx}</div>
            </div>`).join('')}
        </div>
        <div class="actions-row spaced">
          <button class="btn ghost">Xóa tất cả ảnh</button>
          <button class="btn primary" aria-keyshortcuts="Alt+N">Chụp tiếp</button>
        </div>
      </section>

      <section class="panel exam-col result-col">
        <div class="panel-header tight">
          <div>
            <h2>Kết quả &amp; In</h2>
            <p class="muted">Chọn kết quả mẫu và in phiếu A4 khi hoàn tất.</p>
          </div>
          <button class="btn secondary" aria-keyshortcuts="Alt+L">Chọn mẫu</button>
        </div>
        <label class="field">
          <span>Mô tả hình ảnh</span>
          <textarea rows="4" placeholder="- Âm đạo:\n- Cổ tử cung:\n- Sau bôi Axit acetic:\n- Sau bôi Lugol:"></textarea>
        </label>
        <label class="field">
          <span>Chẩn đoán</span>
          <textarea rows="3"></textarea>
        </label>
        <label class="field">
          <span>Đề nghị / Hướng xử trí</span>
          <textarea rows="3"></textarea>
        </label>
        <div class="actions-column">
          <button class="btn primary large" aria-keyshortcuts="Alt+S">Lưu phiếu khám</button>
          <button class="btn secondary large" aria-keyshortcuts="Alt+P">In phiếu A4</button>
        </div>
      </section>
    </div>
  `);
  return node;
}
