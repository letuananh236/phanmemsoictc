import { storage } from './storage.js';

export function createExamSearchView() {
  let exams = [];
  let patients = [];

  function renderRows(body, detailPanel, keyword) {
    body.innerHTML = '';
    exams
      .filter((exam) => {
        if (!keyword) return true;
        const normalized = keyword.toLowerCase();
        const patient = patients.find((p) => p.id === exam.patientId);
        return (
          exam.id.toLowerCase().includes(normalized) ||
          exam.result.toLowerCase().includes(normalized) ||
          (patient?.name || '').toLowerCase().includes(normalized)
        );
      })
      .forEach((exam) => {
        const patient = patients.find((p) => p.id === exam.patientId);
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${exam.id}</td>
          <td>${patient?.name || ''}</td>
          <td>${exam.date}</td>
          <td>${exam.result || ''}</td>
        `;
        row.addEventListener('click', () => renderDetail(detailPanel, exam, patient));
        body.appendChild(row);
      });
  }

  function renderDetail(panel, exam, patient) {
    panel.innerHTML = `
      <h4>Chi tiết phiếu</h4>
      <p><strong>Bệnh nhân:</strong> ${patient?.name || ''}</p>
      <p><strong>Kết quả:</strong> ${exam.result || ''}</p>
      <p><strong>Mô tả:</strong></p>
      <pre>${exam.description || ''}</pre>
      <div class="image-grid"></div>
    `;
    const grid = panel.querySelector('.image-grid');
    exam.imagePaths?.forEach((path) => {
      const slot = document.createElement('div');
      slot.className = 'image-slot';
      slot.innerHTML = `<img src="/${path}" alt="Ảnh phiếu" />`;
      grid.appendChild(slot);
    });
  }

  return {
    render(target) {
      const wrapper = document.createElement('section');
      wrapper.className = 'card exam-search-view';
      wrapper.innerHTML = `
        <h3>Tìm phiếu khám</h3>
        <div class="form-row">
          <label>Từ khóa</label>
          <input id="exam-search" placeholder="Tên BN, kết quả hoặc mã HA" />
        </div>
        <div class="grid-2">
          <div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Mã HA</th>
                  <th>Bệnh nhân</th>
                  <th>Ngày</th>
                  <th>Kết quả</th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
          <div class="card" id="exam-detail">
            <p>Chọn phiếu để xem chi tiết</p>
          </div>
        </div>
      `;
      target.appendChild(wrapper);

      const tbody = wrapper.querySelector('tbody');
      const detailPanel = wrapper.querySelector('#exam-detail');
      const input = wrapper.querySelector('#exam-search');
      input.addEventListener('input', () => renderRows(tbody, detailPanel, input.value.trim()));

      Promise.all([storage.listExams(), storage.listPatients()]).then(([examList, patientList]) => {
        exams = examList;
        patients = patientList;
        renderRows(tbody, detailPanel, input.value.trim());
      });
    }
  };
}
