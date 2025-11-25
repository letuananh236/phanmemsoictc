import { storage, showToast } from './storage.js';

const PLANS = [
  { id: 'thirty_day', label: 'Kích hoạt 30 ngày' },
  { id: 'yearly', label: 'Kích hoạt 1 năm' },
  { id: 'lifetime', label: 'Kích hoạt vĩnh viễn' }
];

export function createLicenseView(appState) {
  async function renderLicense(wrapper) {
    const { license, valid } = await storage.getLicense();
    appState.license = license;
    wrapper.querySelector('#license-status').textContent = valid ? 'Hợp lệ' : 'Hết hạn';
    wrapper.querySelector('#license-machine').textContent = license.machineId;
    wrapper.querySelector('#license-expire').textContent = license.expireDate;
    const planSelect = wrapper.querySelector('select[name="licenseType"]');
    if (planSelect) {
      const availableIds = PLANS.map((plan) => plan.id);
      const desired = availableIds.includes(license.licenseType) ? license.licenseType : 'thirty_day';
      planSelect.value = desired;
    }
  }

  return {
    render(target) {
      const wrapper = document.createElement('section');
      wrapper.className = 'card license-view';
      wrapper.innerHTML = `
        <h3>Thông tin bản quyền</h3>
        <p>Mọi thắc mắc xin liên hệ: <strong>letuananh236@gmail.com</strong></p>
        <div class="grid-2">
          <div>
            <p>Trạng thái: <strong id="license-status">Đang kiểm tra...</strong></p>
            <p>Mã máy: <span id="license-machine"></span></p>
            <p>Hết hạn: <span id="license-expire"></span></p>
          </div>
          <div>
            <form id="license-form">
              <div class="form-row">
                <label>Chọn gói</label>
                <select name="licenseType">
                  ${PLANS.map((plan) => `<option value="${plan.id}">${plan.label}</option>`).join('')}
                </select>
              </div>
              <div class="form-row">
                <label>Mã kích hoạt</label>
                <input name="licenseKey" placeholder="Nhập key" />
              </div>
              <div class="toolbar license-actions">
                <button type="submit">Kích hoạt</button>
                <button type="button" class="secondary" id="license-reset">Xóa kích hoạt</button>
              </div>
            </form>
          </div>
        </div>
      `;
      target.appendChild(wrapper);

      const form = wrapper.querySelector('#license-form');
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const payload = Object.fromEntries(formData.entries());
        try {
          const result = await storage.activateLicense(payload);
          appState.license = result.license;
          showToast('Đã kích hoạt bản quyền');
          renderLicense(wrapper);
          document.dispatchEvent(new CustomEvent('license:activated'));
        } catch (error) {
          showToast(error.message || 'Kích hoạt thất bại');
        }
      });

      const resetBtn = wrapper.querySelector('#license-reset');
      resetBtn.addEventListener('click', async () => {
        try {
          const result = await storage.resetLicense();
          appState.license = result.license;
          showToast('Đã xóa kích hoạt, quay lại trạng thái thử');
          renderLicense(wrapper);
          document.dispatchEvent(new CustomEvent('license:activated'));
        } catch (error) {
          showToast(error.message || 'Không thể xóa kích hoạt');
        }
      });

      renderLicense(wrapper);
    }
  };
}
