import { storage } from './storage.js';

export function createPatientSearchView() {
  let patients = [];

  function renderTable(body, keyword) {
    body.innerHTML = '';
    patients
      .filter((patient) => {
        if (!keyword) return true;
        const normalized = keyword.toLowerCase();
        return (
          patient.id.toLowerCase().includes(normalized) ||
          patient.name.toLowerCase().includes(normalized) ||
          (patient.phone || '').toLowerCase().includes(normalized)
        );
      })
      .forEach((patient) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${patient.id}</td>
          <td>${patient.name}</td>
          <td>${patient.age}</td>
          <td>${patient.gender}</td>
          <td>${patient.phone || ''}</td>
        `;
        body.appendChild(row);
      });
  }

  return {
    render(target) {
      const wrapper = document.createElement('section');
      wrapper.className = 'card search-view';
      wrapper.innerHTML = `
        <h3>Tìm kiếm bệnh nhân</h3>
        <div class="form-row">
          <label>Từ khóa</label>
          <input id="patient-search" placeholder="Nhập mã BN, họ tên hoặc SĐT" />
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Mã BN</th>
                <th>Họ tên</th>
                <th>Tuổi</th>
                <th>Giới tính</th>
                <th>Điện thoại</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      `;
      target.appendChild(wrapper);

      const tbody = wrapper.querySelector('tbody');
      const input = wrapper.querySelector('#patient-search');
      input.addEventListener('input', () => renderTable(tbody, input.value.trim()));

      storage.listPatients().then((data) => {
        patients = data;
        renderTable(tbody, input.value.trim());
      });
    }
  };
}
