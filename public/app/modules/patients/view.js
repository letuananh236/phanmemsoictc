import { el } from '../../components/common/dom.js';

const DEMO_PATIENTS = [
  { code: 'BN00020', name: 'Đỗ Lan', gender: 'Nữ', dob: '1983-03-12', phone: '0901234567', address: 'Hà Nội' },
  { code: 'BN00021', name: 'Nguyễn Kim', gender: 'Nữ', dob: '1991-10-05', phone: '0939876543', address: 'Đà Nẵng' }
];

export function renderPatients() {
  const node = el(`
    <div class="split-layout">
      <section class="panel list-panel">
        <div class="panel-header">
          <div>
            <h2>Bệnh nhân</h2>
            <p class="muted">Tìm nhanh và chọn bệnh nhân để chỉnh sửa.</p>
          </div>
          <button class="btn primary">Tạo mới</button>
        </div>
        <div class="field">
          <span>Tìm kiếm</span>
          <input type="search" placeholder="Nhập tên, SĐT hoặc mã BN" />
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr><th>Mã BN</th><th>Họ tên</th><th>Giới tính</th><th>Năm sinh</th></tr>
            </thead>
            <tbody>
              ${DEMO_PATIENTS.map((p) => `<tr tabindex="0"><td>${p.code}</td><td>${p.name}</td><td>${p.gender}</td><td>${p.dob.slice(0,4)}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </section>
      <section class="panel detail-panel">
        <div class="panel-header">
          <h3>Thông tin chi tiết</h3>
          <div class="actions-row">
            <button class="btn primary" aria-keyshortcuts="Alt+S">Lưu</button>
            <button class="btn">Tạo mới</button>
            <button class="btn ghost">Xem lịch sử khám</button>
          </div>
        </div>
        <div class="form-grid two-cols">
          <label class="field short">
            <span>Mã BN</span>
            <input type="text" value="BN00020" readonly />
          </label>
          <label class="field">
            <span>Họ tên</span>
            <input type="text" value="Đỗ Lan" />
          </label>
          <label class="field">
            <span>Giới tính</span>
            <select><option>Nữ</option><option>Nam</option></select>
          </label>
          <label class="field">
            <span>Ngày sinh</span>
            <input type="date" value="1983-03-12" />
          </label>
          <label class="field">
            <span>SĐT</span>
            <input type="tel" value="0901234567" />
          </label>
          <label class="field">
            <span>Địa chỉ</span>
            <input type="text" value="Hà Nội" />
          </label>
        </div>
      </section>
    </div>
  `);
  return node;
}
