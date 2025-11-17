import { el } from '../../components/common/dom.js';

export function renderSettings() {
  const node = el(`
    <div class="panel tabs-panel">
      <div class="panel-header">
        <h2>Cấu hình hệ thống</h2>
        <span class="muted">Điều chỉnh thông tin in ấn, giao diện và dữ liệu.</span>
      </div>
      <div class="tabs">
        <button class="tab active" data-tab="facility">Thông tin cơ sở</button>
        <button class="tab" data-tab="print">In phiếu & Logo</button>
        <button class="tab" data-tab="ui">Giao diện</button>
        <button class="tab" data-tab="db">Cơ sở dữ liệu</button>
      </div>
      <div class="tab-panels">
        <div class="tab-panel active" data-tab="facility">
          <div class="form-grid two-cols">
            <label class="field"><span>Tên đơn vị</span><input type="text" placeholder="Phòng khám" /></label>
            <label class="field"><span>Địa chỉ</span><input type="text" /></label>
            <label class="field"><span>Số điện thoại</span><input type="tel" /></label>
            <label class="field"><span>Website</span><input type="text" /></label>
          </div>
        </div>
        <div class="tab-panel" data-tab="print">
          <div class="form-grid two-cols">
            <label class="field">
              <span>Logo phiếu khám</span>
              <div class="logo-upload">
                <div class="logo-preview">Logo A4</div>
                <input type="file" />
              </div>
            </label>
            <label class="field">
              <span>Số ảnh trên phiếu</span>
              <select><option>2</option><option>3</option><option selected>4</option></select>
            </label>
          </div>
          <div class="print-preview-box">Khung preview A4 (tối giản)</div>
        </div>
        <div class="tab-panel" data-tab="ui">
          <div class="form-grid two-cols">
            <label class="field"><span>Cỡ chữ</span><select><option>Nhỏ</option><option selected>Vừa</option><option>Lớn</option></select></label>
            <label class="field switch"><input type="checkbox" /> <span>Chế độ tương phản cao</span></label>
          </div>
        </div>
        <div class="tab-panel" data-tab="db">
          <p class="muted">Đường dẫn DB SQLite (read-only):</p>
          <div class="db-path">Data/Database/app.db</div>
          <button class="btn ghost">Mở thư mục dữ liệu</button>
        </div>
      </div>
    </div>
  `);

  const tabs = node.querySelectorAll('.tab');
  const panels = node.querySelectorAll('.tab-panel');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      tabs.forEach((t) => t.classList.toggle('active', t === tab));
      panels.forEach((p) => p.classList.toggle('active', p.getAttribute('data-tab') === target));
    });
  });

  return node;
}
