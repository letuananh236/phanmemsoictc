import { el } from '../../components/common/dom.js';

const DEMO_BACKUPS = [
  { time: '2025-11-16 21:00', path: 'Data/Backup/backup-20251116.zip', user: 'Admin' },
  { time: '2025-11-15 20:30', path: 'Data/Backup/backup-20251115.zip', user: 'Admin' }
];

export function renderBackup() {
  const node = el(`
    <div class="split-layout">
      <section class="panel">
        <div class="panel-header">
          <h2>Backup</h2>
          <button class="btn primary">Tạo file backup</button>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead><tr><th>Ngày giờ</th><th>Đường dẫn</th><th>Người thực hiện</th></tr></thead>
            <tbody>
              ${DEMO_BACKUPS.map((b) => `<tr><td>${b.time}</td><td>${b.path}</td><td>${b.user}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </section>
      <section class="panel">
        <div class="panel-header">
          <h2>Restore</h2>
          <div class="hint">Phục hồi sẽ ghi đè dữ liệu hiện tại. Vui lòng xác nhận.</div>
        </div>
        <div class="actions-column">
          <input type="file" />
          <button class="btn secondary">Chọn file backup để phục hồi</button>
        </div>
      </section>
    </div>
  `);
  return node;
}
