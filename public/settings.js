import { storage, showToast } from './storage.js';

export function createSettingsView(appState) {
  return {
    render(target) {
      const wrapper = document.createElement('section');
      wrapper.className = 'card settings-view';
      wrapper.innerHTML = `
        <h3>Cấu hình hệ thống</h3>
        <form id="settings-form" class="grid-2">
          <input type="hidden" name="logoFileName" />
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
            <div class="form-row logo-row">
              <label>Logo phiếu khám</label>
              <div class="logo-picker">
                <div class="logo-preview">
                  <img id="logo-preview" src="./assets/logo-default.svg" alt="Logo bệnh viện" />
                </div>
                <div class="logo-actions">
                  <input type="file" id="logo-input" accept=".png,.jpg,.jpeg,.svg" />
                  <button type="button" id="logo-upload">Tải logo</button>
                  <p class="help-text">Chọn logo PNG/JPG/SVG để in trên phiếu (khuyên dùng nền trắng).</p>
                </div>
              </div>
            </div>
          </div>
          <div>
            <div class="form-row">
              <label>Prefix mã BN</label>
              <input name="patientCodePrefix" />
            </div>
            <div class="form-row">
              <label>Prefix mã HA</label>
              <input name="examCodePrefix" />
            </div>
            <div class="form-row">
              <label>Số ảnh mặc định</label>
              <select name="defaultImageCount">
                <option value="2">2</option>
                <option value="3">3</option>
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
      const logoInput = wrapper.querySelector('#logo-input');
      const logoPreview = wrapper.querySelector('#logo-preview');
      const logoHidden = form.querySelector('input[name="logoFileName"]');
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
          logoPreview.src = `./assets/${settings.logoFileName}`;
          logoHidden.value = settings.logoFileName;
        }
      });

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const payload = Object.fromEntries(formData.entries());
        payload.allowDeleteData = form.allowDeleteData.checked;
        payload.defaultImageCount = Number.parseInt(payload.defaultImageCount, 10);
        const saved = await storage.saveSettings(payload);
        appState.settings = saved;
        showToast('Đã lưu cấu hình');
      });

      wrapper.querySelector('#logo-upload').addEventListener('click', async () => {
        const file = logoInput.files?.[0];
        if (!file) {
          showToast('Hãy chọn file logo');
          return;
        }
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const result = await storage.uploadLogo(file.name, reader.result);
            logoPreview.src = `./assets/${result.fileName}`;
            logoHidden.value = result.fileName;
            appState.settings = result.settings;
            showToast('Đã cập nhật logo phiếu khám');
          } catch (error) {
            console.error(error);
            showToast('Không thể tải logo');
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };
}
