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
          </div>
          <div>
            <div class="form-row">
              <label>Số ảnh mặc định</label>
              <select name="defaultImageCount">
                <option value="4">4</option>
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
            <div class="form-row">
              <label>Cho phép xóa dữ liệu</label>
              <input type="checkbox" name="allowDeleteData" />
            </div>
          </div>
          <div class="form-row" style="grid-column: 1 / -1;">
            <button type="submit">Lưu cấu hình</button>
          </div>
        </form>
      `;
      target.appendChild(wrapper);

      const form = wrapper.querySelector('#settings-form');
      const logoInput = form.querySelector('#logo-file');
      const logoCurrent = form.querySelector('#logo-current');
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

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const payload = { ...appState.settings, ...Object.fromEntries(formData.entries()) };
        payload.allowDeleteData = form.allowDeleteData.checked;
        payload.defaultImageCount = Number.parseInt(payload.defaultImageCount, 10);
        const saved = await storage.saveSettings(payload);
        appState.settings = saved;
        showToast('Đã lưu cấu hình');
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
    }
  };
}
