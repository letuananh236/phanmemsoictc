import { storage, showToast } from './storage.js';

function isSpecialistDoctor(doctor) {
  return doctor?.isSpecialistDoctor !== false;
}

function isAssignedDoctor(doctor) {
  return doctor?.isAssignedDoctor === true;
}

function getNextCode(doctors, prefix, filterFn) {
  const max = doctors
    .filter(filterFn)
    .map((doctor) => {
      const raw = String(doctor.id || '');
      if (!raw.startsWith(prefix)) return 0;
      const num = Number.parseInt(raw.slice(prefix.length), 10);
      return Number.isFinite(num) ? num : 0;
    })
    .reduce((acc, value) => Math.max(acc, value), 0);
  return `${prefix}${String(max + 1).padStart(3, '0')}`;
}

export function createDoctorsView(appState) {
  let doctors = [];

  function renderList(listEl, items, title) {
    listEl.innerHTML = '';
    const heading = document.createElement('li');
    heading.innerHTML = `<strong>${title}</strong>`;
    listEl.appendChild(heading);

    items.forEach((doctor) => {
      const item = document.createElement('li');
      const phoneText = doctor.phone ? ` - ${doctor.phone}` : '';
      item.innerHTML = `
        <span>${doctor.id} - ${doctor.name}${phoneText}</span>
        <button data-id="${doctor.id}">Xóa</button>
      `;
      item.querySelector('button').addEventListener('click', async () => {
        await storage.deleteDoctor(doctor.id);
        doctors = doctors.filter((d) => d.id !== doctor.id);
        rerenderLists();
        syncCodes();
      });
      listEl.appendChild(item);
    });
  }

  let specialistCodeInput;
  let assignedCodeInput;
  let specialistListEl;
  let assignedListEl;

  function syncCodes() {
    if (specialistCodeInput) {
      specialistCodeInput.value = getNextCode(doctors, 'CK', isSpecialistDoctor);
    }
    if (assignedCodeInput) {
      assignedCodeInput.value = getNextCode(doctors, 'CD', isAssignedDoctor);
    }
  }

  function rerenderLists() {
    if (!specialistListEl || !assignedListEl) return;
    renderList(specialistListEl, doctors.filter(isSpecialistDoctor), 'A. Bác sĩ chuyên khoa');
    renderList(assignedListEl, doctors.filter(isAssignedDoctor), 'B. Bác sỹ chỉ định');
  }

  return {
    render(target) {
      const isAdmin = appState.user?.role === 'admin' || appState.user?.username === 'admin';
      const wrapper = document.createElement('section');
      wrapper.className = 'card doctors-view wide-card';
      wrapper.innerHTML = `
        <h3>Quản lý bác sỹ</h3>

        <h4>A. Bác sĩ chuyên khoa</h4>
        <form id="specialist-form" class="grid-3 doctor-form-grid">
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
            <button type="submit" class="doctor-add-button">Lưu bác sĩ chuyên khoa</button>
          </div>
        </form>
        <ul id="specialist-list"></ul>

        <h4>B. Bác sỹ chỉ định</h4>
        <form id="assigned-form" class="grid-3 doctor-form-grid">
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
            <button type="submit" class="doctor-add-button">Lưu bác sỹ chỉ định</button>
          </div>
        </form>
        <ul id="assigned-list"></ul>
      `;
      target.appendChild(wrapper);

      const specialistForm = wrapper.querySelector('#specialist-form');
      const assignedForm = wrapper.querySelector('#assigned-form');
      specialistCodeInput = specialistForm.querySelector('input[name="id"]');
      assignedCodeInput = assignedForm.querySelector('input[name="id"]');
      specialistListEl = wrapper.querySelector('#specialist-list');
      assignedListEl = wrapper.querySelector('#assigned-list');

      storage.listDoctors().then((data) => {
        doctors = data;
        rerenderLists();
        syncCodes();
      });

      if (!isAdmin) {
        wrapper.querySelectorAll('input, button').forEach((el) => (el.disabled = true));
        showToast('Chỉ quản trị viên mới được thêm hoặc xóa bác sỹ');
        return;
      }

      specialistForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(specialistForm);
        const payload = Object.fromEntries(formData.entries());
        payload.isSpecialistDoctor = true;
        payload.isAssignedDoctor = false;
        payload.active = true;
        const saved = await storage.saveDoctor(payload);
        doctors.push(saved);
        rerenderLists();
        specialistForm.reset();
        syncCodes();
        showToast('Đã thêm bác sĩ chuyên khoa');
      });

      assignedForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(assignedForm);
        const payload = Object.fromEntries(formData.entries());
        payload.isSpecialistDoctor = false;
        payload.isAssignedDoctor = true;
        payload.active = true;
        const saved = await storage.saveDoctor(payload);
        doctors.push(saved);
        rerenderLists();
        assignedForm.reset();
        syncCodes();
        showToast('Đã thêm bác sỹ chỉ định');
      });
    }
  };
}
