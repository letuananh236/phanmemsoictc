import { storage, showToast } from './storage.js';

export function createSettingsView(appState) {
  return {
    render(target) {
      const wrapper = document.createElement('section');
      wrapper.className = 'card settings-view wide-card';
      wrapper.innerHTML = `
        <h3>Cấu hình hệ thống</h3>
        <form id="settings-form" class="grid-2">
          <div>
            <div class="form-row">
              <label>Tên bệnh viện</label>
              <input name="hospitalName" />
            </div>
            <div class="form-row">
              <label>Tên khoa</label>
              <input name="departmentName" />
            </div>
            <div class="form-row">
              <label>Địa chỉ</label>
              <input name="address" />
            </div>
            <div class="form-row">
              <label>Điện thoại</label>
              <input name="phone" />
            </div>
            <div class="form-row">
              <label>Website</label>
              <input name="website" />
            </div>
            <div class="form-row">
              <label>Logo phiếu khám</label>
              <input type="hidden" name="logoFileName" />
              <input type="file" id="logo-file" accept="image/*" />
              <div id="logo-current" style="margin-top: 6px; color: #475569;"></div>
            </div>
            <div class="form-row">
              <label>Kiểu logo</label>
              <select name="logoShape">
                <option value="square">Vuông</option>
                <option value="rectangle">Chữ nhật</option>
              </select>
            </div>
          </div>
          <div>
            <div class="form-row">
              <label>Số ảnh mặc định</label>
              <select name="defaultImageCount">
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </div>
            <div class="form-row">
              <label>Bố trí ảnh phiếu in</label>
              <select name="printImageLayout">
                <option value="row">1 hàng (1x4)</option>
                <option value="grid">2 hàng (2x2)</option>
                <option value="grid-large">2 hàng (2x2 - ảnh to)</option>
              </select>
            </div>
            <div class="form-row">
              <label>Phím chụp nhanh</label>
              <select name="captureHotkey">
                ${Array.from({ length: 12 })
                  .map((_, idx) => `<option value="F${idx + 1}">F${idx + 1}</option>`)
                  .join('')}
              </select>
            </div>
            <div class="form-row">
              <label>Mô tả mặc định</label>
              <textarea name="defaultDescription"></textarea>
            </div>
            <div class="form-row">
              <label>Lời dặn mặc định</label>
              <textarea name="defaultDoctorAdvice"></textarea>
            </div>
          </div>
          <div class="form-row" style="grid-column: 1 / -1;">
            <button type="submit">Lưu cấu hình</button>
          </div>
        </form>
        <div class="card" style="margin-top: 16px;">
          <h4>Thêm tài khoản đăng nhập</h4>
          <form id="user-form" class="grid-3">
            <div class="form-row">
              <label>Tên đăng nhập</label>
              <input name="username" required />
            </div>
            <div class="form-row">
              <label>Mật khẩu</label>
              <input type="password" name="password" required />
            </div>
            <div class="form-row">
              <label>Nhập lại mật khẩu</label>
              <input type="password" name="confirm" required />
            </div>
            <div class="form-row" style="grid-column: 1 / -1;">
              <button type="submit">Thêm tài khoản</button>
            </div>
          </form>
          <div>
            <h5>Danh sách tài khoản</h5>
            <ul id="user-list"></ul>
          </div>
        </div>
        <div class="card" id="data-tools">
          <h4>Sao lưu và dữ liệu</h4>
          <div class="form-row data-actions">
            <button type="button" id="backup-btn">Tải backup</button>
            <label for="restore-file" class="button-like">Khôi phục backup</label>
            <input type="file" id="restore-file" accept=".zip" hidden />
            <span class="hint">Nên sao lưu trước khi khôi phục để tránh mất dữ liệu.</span>
          </div>
          <div class="form-row">
            <button type="button" id="clear-data-btn" class="danger">
              Xóa tất cả dữ liệu
            </button>
            <span class="hint">Xóa toàn bộ bệnh nhân, phiếu khám, bác sỹ, mẫu kết quả và ảnh đã lưu (giữ cấu hình hiện tại).</span>
          </div>
        </div>
      `;
      target.appendChild(wrapper);

      const form = wrapper.querySelector('#settings-form');
      const logoInput = form.querySelector('#logo-file');
      const logoCurrent = form.querySelector('#logo-current');
      const userList = wrapper.querySelector('#user-list');
      const userForm = wrapper.querySelector('#user-form');
      const backupBtn = wrapper.querySelector('#backup-btn');
      const restoreInput = wrapper.querySelector('#restore-file');
      const clearDataBtn = wrapper.querySelector('#clear-data-btn');
      const isAdmin = appState.user?.role === 'admin' || appState.user?.username === 'admin';

      if (isAdmin) {
        storage.listUsers()
          .then((users) => {
            userList.innerHTML = '';
            users.forEach((user) => {
              const li = document.createElement('li');
              li.textContent = user.username;
              userList.appendChild(li);
            });
          })
          .catch(() => {
            userList.innerHTML = '<li>Không tải được danh sách tài khoản</li>';
          });
      }
      storage.getSettings().then((settings) => {
        Object.entries(settings).forEach(([key, value]) => {
          if (form[key]) {
            if (form[key].type === 'checkbox') {
              form[key].checked = Boolean(value);
            } else {
              form[key].value = value;
            }
          }
        });
        if (settings.logoFileName) {
          logoCurrent.textContent = `Logo hiện tại: ${settings.logoFileName}`;
        }
        appState.settings = settings;
      });

      if (!isAdmin) {
        form.querySelectorAll('input, textarea, select, button').forEach((el) => (el.disabled = true));
        userForm.querySelectorAll('input, button').forEach((el) => (el.disabled = true));
        backupBtn.disabled = true;
        restoreInput.disabled = true;
        clearDataBtn.disabled = true;
        showToast('Chỉ tài khoản quản trị mới thay đổi cấu hình và dữ liệu');
        return;
      }

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const payload = { ...appState.settings, ...Object.fromEntries(formData.entries()) };
        delete payload.allowDeleteData;
        payload.defaultImageCount = Number.parseInt(payload.defaultImageCount, 10);
        const saved = await storage.saveSettings(payload);
        appState.settings = saved;
        showToast('Đã lưu cấu hình');
      });

      userForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const data = new FormData(userForm);
        const username = (data.get('username') || '').trim();
        const password = (data.get('password') || '').trim();
        const confirm = (data.get('confirm') || '').trim();
        if (!username || !password) {
          showToast('Nhập đầy đủ tài khoản và mật khẩu');
          return;
        }
        if (password !== confirm) {
          showToast('Mật khẩu nhập lại chưa khớp');
          return;
        }
        try {
          const created = await storage.createUser({ username, password });
          const li = document.createElement('li');
          li.textContent = created.username;
          userList.appendChild(li);
          userForm.reset();
          showToast('Đã thêm tài khoản mới');
        } catch (error) {
          const message = `${error?.message || ''}`;
          if (message.includes('user_exists')) {
            showToast('Tài khoản đã tồn tại');
            return;
          }
          showToast('Không thêm được tài khoản');
        }
      });

      logoInput.addEventListener('change', async () => {
        const file = logoInput.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const uploaded = await storage.uploadLogo({ dataUrl: reader.result, fileName: file.name, setDefault: true });
            form.logoFileName.value = uploaded.fileName;
            logoCurrent.textContent = `Logo hiện tại: ${uploaded.fileName}`;
            appState.settings = { ...appState.settings, logoFileName: uploaded.fileName };
            showToast('Đã cập nhật logo phiếu khám');
          } catch (error) {
            console.error('Logo upload failed', error);
            showToast('Không tải được logo. Vui lòng thử lại');
          }
        };
        reader.readAsDataURL(file);
      });

      backupBtn.addEventListener('click', async () => {
        try {
          const blob = await storage.downloadBackup();
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = `backup-${new Date().toISOString().slice(0, 10)}.zip`;
          anchor.click();
          URL.revokeObjectURL(url);
          showToast('Đã tải backup dữ liệu');
        } catch (error) {
          console.error('Backup failed', error);
          showToast('Không tải được backup');
        }
      });

      restoreInput.addEventListener('change', async () => {
        const file = restoreInput.files?.[0];
        if (!file) return;
        const confirmRestore = window.confirm('Khôi phục backup sẽ ghi đè dữ liệu hiện tại. Tiếp tục?');
        if (!confirmRestore) {
          restoreInput.value = '';
          return;
        }
        try {
          await storage.restoreBackup(file);
          showToast('Đã khôi phục dữ liệu từ backup');
        } catch (error) {
          console.error('Restore failed', error);
          showToast('Không thể khôi phục backup');
        } finally {
          restoreInput.value = '';
        }
      });

      clearDataBtn.addEventListener('click', async () => {
        const confirmed = window.confirm('Xóa toàn bộ dữ liệu (bệnh nhân, phiếu, bác sỹ, mẫu, ảnh)?');
        if (!confirmed) return;
        try {
          await storage.clearData();
          showToast('Đã xóa toàn bộ dữ liệu và đặt lại bộ đếm');
        } catch (error) {
          console.error('Clear data failed', error);
          showToast('Không thể xóa dữ liệu');
        }
      });
    }
  };
}
