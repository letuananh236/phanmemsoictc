import { storage, showToast } from './storage.js';

export function createLicenseView(appState) {
  async function renderLicense(wrapper) {
    const { license, valid } = await storage.getLicense();
    appState.license = license;
    wrapper.querySelector('#license-status').textContent = valid ? 'Hợp lệ' : 'Hết hạn';
    wrapper.querySelector('#license-machine').textContent = license.machineId;
    wrapper.querySelector('#license-expire').textContent = license.expireDate;
    const remaining = wrapper.querySelector('#license-remaining');
    if (remaining) {
      remaining.textContent = `${license.daysRemaining ?? 0} ngày`;
    }
  }

  return {
    render(target) {
      const wrapper = document.createElement('section');
      wrapper.className = 'card license-view wide-card';
      wrapper.innerHTML = `
        <h3>Thông tin bản quyền</h3>
        <p>Mọi thắc mắc xin liên hệ: <strong>letuananh236@gmail.com</strong></p>
        <div class="grid-2">
          <div>
            <p>Trạng thái: <strong id="license-status">Đang kiểm tra...</strong></p>
            <p>Mã máy: <span id="license-machine"></span></p>
            <p>Hết hạn: <span id="license-expire"></span></p>
            <p>Ngày còn lại: <span id="license-remaining">0 ngày</span></p>
          </div>
          <div>
            <form id="license-form">
              <div class="form-row">
                <label>Mã kích hoạt</label>
                <input name="licenseKey" placeholder="Nhập key" />
              </div>
              <div class="toolbar license-actions">
                <button type="submit">Kích hoạt</button>
                <button type="button" class="secondary" id="license-send">Gửi mã kích hoạt</button>
                <button type="button" class="secondary" id="license-reset">Xóa kích hoạt</button>
              </div>
            </form>
          </div>
        </div>
      `;
      target.appendChild(wrapper);

      const isAdmin =
        !appState.user || appState.user?.role === 'admin' || appState.user?.username === 'admin';
      const form = wrapper.querySelector('#license-form');
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!isAdmin) {
          showToast('Chỉ tài khoản quản trị mới kích hoạt được bản quyền');
          return;
        }
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

      const sendBtn = wrapper.querySelector('#license-send');
      sendBtn.addEventListener('click', async () => {
        if (!isAdmin) {
          showToast('Chỉ tài khoản quản trị mới gửi yêu cầu kích hoạt');
          return;
        }
        const machineId =
          appState.license?.machineId || wrapper.querySelector('#license-machine')?.textContent || '';
        if (!machineId) {
          showToast('Chưa có thông tin mã máy để gửi');
          return;
        }
        try {
          await storage.sendActivationRequest({ machineId });
          showToast('Đã gửi mã kích hoạt');
        } catch (error) {
          showToast(error.message || 'Không thể gửi mã kích hoạt');
        }
      });

      const resetBtn = wrapper.querySelector('#license-reset');
      resetBtn.addEventListener('click', async () => {
        if (!isAdmin) {
          showToast('Chỉ tài khoản quản trị mới xóa kích hoạt');
          return;
        }
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

      if (!isAdmin) {
        form.querySelectorAll('input, button').forEach((el) => {
          el.disabled = true;
        });
        wrapper.classList.add('read-only');
      }

      renderLicense(wrapper);
    }
  };
}
