import { el } from '../../components/common/dom.js';

const SAMPLE_ROWS = [
  { time: '08:15', code: 'BN00012', name: 'Trần Thị Mai', dob: '1985', doctor: 'BS Lê An', status: 'Chưa soi' },
  { time: '09:30', code: 'BN00013', name: 'Nguyễn Thu', dob: '1990', doctor: 'BS Phạm Vy', status: 'Đã soi' },
  { time: '10:10', code: 'BN00014', name: 'Phạm Hạnh', dob: '1979', doctor: 'BS Lê An', status: 'Đã in' }
];

export function renderDaily(state, { navigate }) {
  const node = el(`
    <div class="panel">
      <div class="panel-header">
        <div>
          <h2>Khám trong ngày</h2>
          <p class="muted">Xem nhanh danh sách phiếu khám hôm nay và vào khám nhanh.</p>
        </div>
        <div class="actions-row">
          <button class="btn primary">Tạo bệnh nhân mới</button>
          <button class="btn accent" aria-keyshortcuts="Enter">Vào khám</button>
        </div>
      </div>
      <div class="filters-grid">
        <label class="field">
          <span>Ngày</span>
          <input type="date" value="${state.today}" />
        </label>
        <label class="field">
          <span>Bác sĩ</span>
          <select>
            <option>-- Tất cả --</option>
            <option>BS Lê An</option>
            <option>BS Phạm Vy</option>
          </select>
        </label>
        <label class="field">
          <span>Tìm kiếm</span>
          <input type="search" placeholder="Tên hoặc SĐT" />
        </label>
      </div>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>Giờ</th>
              <th>Mã BN</th>
              <th>Tên BN</th>
              <th>Năm sinh</th>
              <th>Bác sĩ</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            ${SAMPLE_ROWS.map((row) => `
              <tr tabindex="0">
                <td>${row.time}</td>
                <td>${row.code}</td>
                <td>${row.name}</td>
                <td>${row.dob}</td>
                <td>${row.doctor}</td>
                <td><span class="status-pill status-${row.status.replace(/\s+/g, '').toLowerCase()}">${row.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="hint">Double click dòng để mở màn Khám soi CTC.</div>
    </div>
  `);

  node.querySelectorAll('tbody tr').forEach((row) => {
    row.addEventListener('dblclick', () => navigate('examinations'));
  });

  return node;
}
