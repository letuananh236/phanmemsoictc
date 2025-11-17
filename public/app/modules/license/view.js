import { el } from '../../components/common/dom.js';

export function renderLicense(state) {
  const node = el(`
    <section class="panel">
      <div class="panel-header">
        <div>
          <h2>Thông tin License</h2>
          <p class="muted">Hiển thị loại, hạn dùng và mã máy. Không gửi dữ liệu ra Internet.</p>
        </div>
        <div class="license-badge ${state.license.daysLeft <= 15 ? 'warning' : ''}">
          ${state.license.type?.toUpperCase() || 'TRIAL'} • còn ${state.license.daysLeft} ngày
        </div>
      </div>
      <div class="grid two-cols">
        <div>
          <div class="field"><span>Loại license</span><input type="text" value="${state.license.type || 'trial'}" readonly /></div>
          <div class="field"><span>Ngày kích hoạt</span><input type="text" value="2025-01-01" readonly /></div>
          <div class="field"><span>Ngày hết hạn</span><input type="text" value="2025-12-31" readonly /></div>
        </div>
        <div>
          <div class="field"><span>Mã máy</span><input type="text" value="ABC-123-XYZ" readonly /></div>
          <div class="field"><span>Trạng thái</span><input type="text" value="${state.license.daysLeft <= 0 ? 'Hết hạn' : 'Hợp lệ'}" readonly /></div>
          <div class="field"><span>Nhắc hết hạn</span><input type="text" value="Còn ${state.license.daysLeft} ngày" readonly /></div>
        </div>
      </div>
      <div class="panel-footer">
        <label class="field"><span>Mã kích hoạt</span><input type="text" placeholder="Nhập key" /></label>
        <div class="actions-row">
          <button class="btn primary">Kích hoạt</button>
          <button class="btn ghost">Sao chép mã máy</button>
        </div>
      </div>
    </section>
  `);
  return node;
}
