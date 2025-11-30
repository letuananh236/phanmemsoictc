import { storage, showToast } from './storage.js';

export function createDoctorsView(appState) {
  let doctors = [];

  function renderList(listEl) {
    listEl.innerHTML = '';
    doctors.forEach((doctor) => {
      const item = document.createElement('li');
      item.innerHTML = `
        <span>${doctor.id} - ${doctor.name}</span>
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

  return {
    render(target) {
      const isAdmin = appState.user?.role === 'admin' || appState.user?.username === 'admin';
      const wrapper = document.createElement('section');
      wrapper.className = 'card doctors-view';
      wrapper.innerHTML = `
        <h3>Quản lý bác sỹ</h3>
        <form id="doctor-form" class="grid-2">
          <div class="form-row">
            <label>Mã bác sỹ</label>
            <input name="id" required />
          </div>
          <div class="form-row">
            <label>Tên bác sỹ</label>
            <input name="name" required />
          </div>
          <div class="form-row" style="grid-column: 1 / -1;">
            <button type="submit">Thêm</button>
          </div>
        </form>
        <ul id="doctor-list"></ul>
      `;
      target.appendChild(wrapper);

      const form = wrapper.querySelector('#doctor-form');
      const listEl = wrapper.querySelector('#doctor-list');

      storage.listDoctors().then((data) => {
        doctors = data;
        renderList(listEl);
      });

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
        await storage.saveDoctor(payload);
        doctors.push(payload);
        renderList(listEl);
        form.reset();
        showToast('Đã thêm bác sỹ');
      });
    }
  };
}
