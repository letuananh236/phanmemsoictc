import { el } from '../../components/common/dom.js';

const DEMO_DOCTORS = [
  { id: 'D001', name: 'BS Lê An', title: 'BSCKI', department: 'Sản', active: true },
  { id: 'D002', name: 'BS Phạm Vy', title: 'BS', department: 'Sản', active: true }
];

export function renderDoctors() {
  const node = el(`
    <div class="split-layout">
      <section class="panel list-panel">
        <div class="panel-header">
          <h2>Bác sĩ</h2>
          <button class="btn primary">Thêm</button>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead><tr><th>Mã</th><th>Tên</th><th>Chức danh</th><th>Khoa</th></tr></thead>
            <tbody>
              ${DEMO_DOCTORS.map((d) => `<tr tabindex="0"><td>${d.id}</td><td>${d.name}</td><td>${d.title}</td><td>${d.department}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </section>
      <section class="panel detail-panel">
        <div class="panel-header">
          <h3>Thông tin bác sĩ</h3>
          <div class="actions-row">
            <button class="btn primary">Lưu</button>
            <button class="btn">Xóa</button>
          </div>
        </div>
        <div class="form-grid two-cols compact">
          <label class="field short"><span>Mã</span><input type="text" value="D001" readonly /></label>
          <label class="field"><span>Họ tên</span><input type="text" value="BS Lê An" /></label>
          <label class="field"><span>Chức danh</span><input type="text" value="BSCKI" /></label>
          <label class="field"><span>Khoa</span><input type="text" value="Sản" /></label>
          <label class="field full"><span>Chữ ký (ảnh)</span><input type="file" /></label>
          <label class="switch"><input type="checkbox" checked /> <span>Bác sĩ đang hoạt động</span></label>
        </div>
      </section>
    </div>
  `);
  return node;
}
