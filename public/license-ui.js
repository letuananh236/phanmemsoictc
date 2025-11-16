import { storage, showToast } from './storage.js';

const PLANS = [
  { id: 'trial', label: 'Dùng thử 30 ngày', price: '0đ' },
  { id: 'monthly', label: 'Gói 1 tháng', price: 'Liên hệ' },
  { id: 'yearly', label: '1 năm - 500.000đ', price: '500k' },
  { id: 'lifetime', label: 'Vĩnh viễn - 1.000.000đ', price: '1tr' }
];

export function createLicenseView(appState) {
  async function renderLicense(wrapper) {
    const { license, valid } = await storage.getLicense();
    appState.license = license;
    wrapper.querySelector('#license-status').textContent = valid ? 'Hợp lệ' : 'Hết hạn';
    wrapper.querySelector('#license-machine').textContent = license.machineId;
    wrapper.querySelector('#license-expire').textContent = license.expireDate;
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
              <button type="submit">Kích hoạt</button>
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
        await storage.activateLicense(payload);
        showToast('Đã kích hoạt bản quyền');
        renderLicense(wrapper);
      });

      renderLicense(wrapper);
    }
  };
}
