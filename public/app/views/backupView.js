import { storage, showToast } from '../../storage.js';

export function createBackupView() {
  return {
    id: 'backup-restore',
    title: 'Backup & Restore',
    render(target) {
      target.innerHTML = '';
      const wrapper = document.createElement('section');
      wrapper.className = 'card backup-view';
      wrapper.innerHTML = `
        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>SAO LƯU DỮ LIỆU</h3>
              <p class="muted">Tạo file .zip chứa CSDL + ảnh ngay trên máy tính.</p>
            </div>
            <button type="button" class="btn primary" id="backup-create">TẠO FILE BACKUP</button>
          </div>
          <div class="summary-block small">File backup được lưu trong thư mục tải xuống của trình duyệt. Hãy sao chép sang USB an toàn.</div>
        </div>
        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>PHỤC HỒI DỮ LIỆU</h3>
              <p class="muted">Chọn file backup (.zip) để ghi đè dữ liệu hiện tại.</p>
            </div>
          </div>
          <div class="actions-row">
            <input type="file" id="backup-file" accept=".zip" />
            <button type="button" class="btn secondary" id="backup-restore">PHỤC HỒI</button>
          </div>
          <p class="hint">Lưu ý: thao tác này sẽ ghi đè toàn bộ dữ liệu hiện có. Sao lưu trước khi phục hồi.</p>
        </div>
      `;
      target.appendChild(wrapper);

      const backupBtn = wrapper.querySelector('#backup-create');
      backupBtn.addEventListener('click', async () => {
        backupBtn.disabled = true;
        backupBtn.textContent = 'Đang tạo...';
        try {
          const blob = await storage.downloadBackup();
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `backup_${new Date().toISOString().slice(0, 10)}.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          showToast('Đã tạo file backup');
        } catch (error) {
          console.error('Không thể tạo backup:', error);
          showToast('Không thể tạo backup. Vui lòng thử lại.');
        } finally {
          backupBtn.disabled = false;
          backupBtn.textContent = 'TẠO FILE BACKUP';
        }
      });

      const restoreBtn = wrapper.querySelector('#backup-restore');
      const fileInput = wrapper.querySelector('#backup-file');
      restoreBtn.addEventListener('click', async () => {
        if (!fileInput.files || fileInput.files.length === 0) {
          showToast('Vui lòng chọn file backup (.zip)');
          return;
        }
        const confirmRestore = window.confirm('Khôi phục sẽ ghi đè dữ liệu hiện tại. Bạn có chắc chắn?');
        if (!confirmRestore) return;
        restoreBtn.disabled = true;
        restoreBtn.textContent = 'Đang phục hồi...';
        try {
          await storage.restoreBackup(fileInput.files[0]);
          showToast('Đã phục hồi dữ liệu. Khởi động lại ứng dụng nếu cần.');
        } catch (error) {
          console.error('Không thể phục hồi backup:', error);
          showToast('Không thể phục hồi backup.');
        } finally {
          restoreBtn.disabled = false;
          restoreBtn.textContent = 'PHỤC HỒI';
          fileInput.value = '';
        }
      });
    }
  };
}
