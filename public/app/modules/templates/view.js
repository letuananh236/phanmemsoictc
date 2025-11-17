import { el } from '../../components/common/dom.js';

const DEMO_TEMPLATES = [
  { id: 'T001', name: 'Bình thường', diag: 'Cổ tử cung bình thường', advice: 'Tái khám định kỳ' },
  { id: 'T002', name: 'Viêm nhẹ', diag: 'Tổn thương viêm nhẹ', advice: 'Điều trị kháng viêm, tái khám sau 1 tháng' }
];

export function renderTemplates() {
  const node = el(`
    <div class="split-layout">
      <section class="panel list-panel">
        <div class="panel-header">
          <h2>Kết quả mặc định</h2>
          <button class="btn primary">Thêm</button>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead><tr><th>Mã</th><th>Tên mẫu</th><th>Mô tả ngắn</th></tr></thead>
            <tbody>
              ${DEMO_TEMPLATES.map((t) => `<tr tabindex="0"><td>${t.id}</td><td>${t.name}</td><td>${t.diag}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </section>
      <section class="panel detail-panel">
        <div class="panel-header">
          <h3>Chi tiết mẫu</h3>
          <div class="actions-row">
            <button class="btn primary">Lưu</button>
            <button class="btn">Xóa</button>
          </div>
        </div>
        <label class="field"><span>Tên mẫu</span><input type="text" value="Bình thường" /></label>
        <label class="field"><span>Chẩn đoán</span><textarea rows="3">Cổ tử cung bình thường</textarea></label>
        <label class="field"><span>Đề nghị</span><textarea rows="3">Tái khám định kỳ</textarea></label>
      </section>
    </div>
  `);
  return node;
}
