import { storage } from './storage.js';
import { openPrintPreview } from './print.js';

function normalizeImages(imagePaths = [], targetCount = 4) {
  const list = (imagePaths || [])
    .map((path) => {
      if (!path) return null;
      if (typeof path === 'string') {
        if (path.startsWith('data:')) return { dataUrl: path };
        return { path };
      }
      return path;
    })
    .slice(0, targetCount);

  while (list.length < targetCount) {
    list.push(null);
  }
  return list;
}

function normalizeExamCode(code = '') {
  return code.replace(/^HA/i, 'BN');
}

export function createExamSearchView(appState) {
  let exams = [];
  let patients = [];
  let selectedExamId = null;

  function renderRows(body, detailPanel, keyword) {
    body.innerHTML = '';
    const filtered = exams.filter((exam) => {
      if (!keyword) return true;
      const normalized = keyword.toLowerCase();
      const patient = patients.find((p) => p.id === exam.patientId);
      const examCode = normalizeExamCode(exam.id || '');
      return (
        exam.id.toLowerCase().includes(normalized) ||
        examCode.toLowerCase().includes(normalized) ||
        (exam.result || '').toLowerCase().includes(normalized) ||
        (patient?.name || '').toLowerCase().includes(normalized)
      );
    });

    let selectedFound = false;
    filtered.forEach((exam) => {
      const patient = patients.find((p) => p.id === exam.patientId);
      const row = document.createElement('tr');
      row.dataset.examId = exam.id;
      row.innerHTML = `
        <td>${normalizeExamCode(exam.id)}</td>
        <td>${patient?.name || ''}</td>
        <td>${exam.date}</td>
        <td>${exam.result || ''}</td>
      `;
      if (exam.id === selectedExamId) {
        row.classList.add('selected');
        selectedFound = true;
      }
      row.addEventListener('click', () => {
        selectedExamId = exam.id;
        body.querySelectorAll('tr').forEach((tr) => tr.classList.toggle('selected', tr === row));
        renderDetail(detailPanel, exam, patient);
      });
      body.appendChild(row);
    });

    if (selectedExamId && !selectedFound) {
      detailPanel.innerHTML = '<p>Chọn phiếu để xem chi tiết</p>';
    }
  }

  function renderDetail(panel, exam, patient) {
    const images = normalizeImages(exam?.imagePaths, appState.settings?.defaultImageCount || 4);
    panel.innerHTML = `
      <h4>Chi tiết phiếu</h4>
      <div class="toolbar detail-actions">
        <button type="button" data-action="print">In lại phiếu</button>
        <button type="button" class="secondary" data-action="edit">Sửa phiếu</button>
      </div>
      <div class="detail-grid">
        <div><strong>Mã phiếu:</strong> ${normalizeExamCode(exam.id)}</div>
        <div><strong>Ngày khám:</strong> ${exam.date || ''}</div>
        <div><strong>Họ và tên:</strong> ${patient?.name || ''}</div>
        <div><strong>Tuổi / Giới tính:</strong> ${patient?.age || ''} / ${patient?.gender || ''}</div>
        <div><strong>Địa chỉ:</strong> ${patient?.address || ''}</div>
        <div><strong>SĐT:</strong> ${patient?.phone || ''}</div>
        <div><strong>Lý do khám:</strong> ${patient?.reason || ''}</div>
        <div><strong>Kết quả:</strong> ${exam.result || ''}</div>
      </div>
      <div class="detail-block">
        <div class="detail-label">Mô tả</div>
        <pre class="detail-text">${exam.description || ''}</pre>
      </div>
      <div class="detail-block">
        <div class="detail-label">Các bước điều trị</div>
        <pre class="detail-text">${exam.treatmentSteps || ''}</pre>
      </div>
      <div class="detail-block">
        <div class="detail-label">Lời dặn của bác sỹ</div>
        <pre class="detail-text">${exam.doctorAdvice || ''}</pre>
      </div>
      <div class="image-grid"></div>
    `;
    const grid = panel.querySelector('.image-grid');
    images.forEach((image, index) => {
      const slot = document.createElement('div');
      slot.className = 'image-slot';
      if (image?.dataUrl) {
        slot.innerHTML = `<img src="${image.dataUrl}" alt="Ảnh phiếu ${index + 1}" />`;
      } else if (image?.path) {
        const src = image.path.startsWith('data:') ? image.path : `/${image.path}`;
        slot.innerHTML = `<img src="${src}" alt="Ảnh phiếu ${index + 1}" />`;
      } else {
        slot.textContent = `Ảnh ${index + 1}`;
      }
      grid.appendChild(slot);
    });

    const printButton = panel.querySelector('[data-action="print"]');
    printButton.addEventListener('click', () => {
      openPrintPreview({ patient, exam, settings: appState.settings || {}, images });
    });

    const editButton = panel.querySelector('[data-action="edit"]');
    editButton.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'exam' } }));
      document.dispatchEvent(
        new CustomEvent('exam:load', {
          detail: { exam, patient }
        })
      );
    });
  }

  return {
    render(target) {
      const wrapper = document.createElement('section');
      wrapper.className = 'card exam-search-view wide-card';
      wrapper.innerHTML = `
        <h3>Tìm phiếu khám</h3>
        <div class="form-row">
          <label>Từ khóa</label>
          <input id="exam-search" placeholder="Tên BN, kết quả hoặc mã phiếu" />
        </div>
        <div class="grid-2">
          <div>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Mã phiếu</th>
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
