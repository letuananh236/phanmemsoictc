import { storage, showToast } from './storage.js';

export function createDoctorsView(appState) {
  let doctors = [];

  function renderList(listEl) {
    listEl.innerHTML = '';
    doctors.forEach((doctor) => {
      const item = document.createElement('li');
      const phoneText = doctor.phone ? ` - ${doctor.phone}` : '';
      item.innerHTML = `
        <span>${doctor.id} - ${doctor.name}${phoneText}</span>
        <button data-id="${doctor.id}">Xóa</button>
      `;
      item.querySelector('button').addEventListener('click', async () => {
        await storage.deleteDoctor(doctor.id);
        doctors = doctors.filter((d) => d.id !== doctor.id);
        renderList(listEl);
      });
      listEl.appendChild(item);
    });
  }

  async function setNextDoctorCode(input) {
    const settings = await storage.getSettings();
    const prefix = settings.doctorCodePrefix || '';
    const next = settings.nextDoctorNumber || 1;
    input.value = `${prefix}${String(next).padStart(3, '0')}`;
  }

  return {
    render(target) {
      const isAdmin = appState.user?.role === 'admin' || appState.user?.username === 'admin';
      const wrapper = document.createElement('section');
      wrapper.className = 'card doctors-view wide-card';
      wrapper.innerHTML = `
        <h3>Quản lý bác sỹ</h3>
        <form id="doctor-form" class="grid-3 doctor-form-grid">
          <div class="form-row">
            <label>Mã bác sỹ</label>
            <input name="id" required readonly />
          </div>
          <div class="form-row">
            <label>Tên bác sỹ</label>
            <input name="name" required />
          </div>
          <div class="form-row">
            <label>Số điện thoại</label>
            <input name="phone" />
          </div>
          <div class="form-row doctor-submit-row" style="grid-column: 1 / -1;">
            <button type="submit" class="doctor-add-button">Thêm</button>
          </div>
        </form>
        <ul id="doctor-list"></ul>
      `;
      target.appendChild(wrapper);

      const form = wrapper.querySelector('#doctor-form');
      const listEl = wrapper.querySelector('#doctor-list');
      const codeInput = form.querySelector('input[name="id"]');

      storage.listDoctors().then((data) => {
        doctors = data;
        renderList(listEl);
      });

      setNextDoctorCode(codeInput);

      if (!isAdmin) {
        form.querySelectorAll('input, button').forEach((el) => (el.disabled = true));
        showToast('Chỉ quản trị viên mới được thêm hoặc xóa bác sỹ');
        return;
      }

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const payload = Object.fromEntries(formData.entries());
        payload.active = true;
        const saved = await storage.saveDoctor(payload);
        doctors.push(saved);
        renderList(listEl);
        form.reset();
        await setNextDoctorCode(codeInput);
        showToast('Đã thêm bác sỹ');
      });
    }
  };
}
