import { storage, showToast } from './storage.js';
import { openPrintPreview } from './print.js';

function generateCode(prefix) {
  const random = Math.floor(Math.random() * 999999);
  return `${prefix}${String(random).padStart(6, '0')}`;
}

export function createExamFormView(appState) {
  let container;
  let page;
  let doctors = [];
  let currentExam = null;

  function renderImageSlots(wrapper, images) {
    if (!wrapper) return;
    wrapper.innerHTML = '';
    const count = appState.settings?.defaultImageCount || 4;
    for (let i = 0; i < count; i += 1) {
      const slot = document.createElement('div');
      slot.className = 'image-slot';
      const image = images?.[i];
      if (image?.dataUrl) {
        slot.innerHTML = `<div class="filename-tag">${currentExam?.id || 'HA000000'}_${i + 1}.PNG</div><img src="${image.dataUrl}" alt="Ảnh ${i + 1}" />`;
      } else if (image?.path) {
        slot.innerHTML = `<div class="filename-tag">${currentExam?.id || 'HA000000'}_${i + 1}.PNG</div><img src="/${image.path}" alt="Ảnh ${i + 1}" />`;
      } else {
        slot.innerHTML = `<div class="filename-tag muted">HA_____${i + 1}.PNG</div><div class="image-placeholder">Chưa có ảnh</div>`;
      }
      wrapper.appendChild(slot);
    }
  }

  function handleSelectedImages(event) {
    appState.selectedImages = event.detail;
    if (page) {
      renderImageSlots(page.querySelector('.image-grid'), appState.selectedImages);
    }
  }

  document.addEventListener('images:selected', handleSelectedImages);

  async function loadMetadata() {
    [doctors] = await Promise.all([
      storage.listDoctors()
    ]);
  }

  function getFormValues(form) {
    const formData = new FormData(form);
    const patient = {
      id: formData.get('patientId'),
      name: formData.get('patientName'),
      age: Number.parseInt(formData.get('patientAge') || '0', 10),
      gender: formData.get('patientGender'),
      address: formData.get('patientAddress'),
      phone: formData.get('patientPhone'),
      reason: formData.get('patientReason'),
      createdAt: new Date().toISOString()
    };
    const exam = {
      id: formData.get('examId'),
      examNumber: formData.get('examNumber'),
      date: formData.get('examDate'),
      patientId: patient.id,
      description: formData.get('description'),
      result: formData.get('result'),
      treatmentSteps: formData.get('treatment'),
      doctorAdvice: formData.get('advice'),
      doctorName: formData.get('doctorName'),
      imagePaths: (appState.selectedImages || []).map((img) => img.path || img.dataUrl)
    };
    return { patient, exam };
  }

  function publishContext(form) {
    document.dispatchEvent(new CustomEvent('exam:context', {
      detail: {
        examId: form.examId.value,
        patientId: form.patientId.value
      }
    }));
  }

  function fillDefaultValues(form) {
    const settings = appState.settings;
    form.patientId.value = generateCode(settings?.patientCodePrefix || 'BN');
    form.examId.value = generateCode(settings?.examCodePrefix || 'HA');
    form.examNumber.value = new Date().getTime().toString().slice(-6);
    form.examDate.valueAsDate = new Date();
    form.description.value = settings?.defaultDescription || '- Âm đạo:\n- Cổ tử cung:\n- Sau bôi Acid acetic:\n- Sau bôi Lugol:';
    form.result.value = settings?.defaultResult || '';
    form.advice.value = settings?.defaultDoctorAdvice || '';
    publishContext(form);
  }

  function populateDoctors(select) {
    select.innerHTML = '';
    doctors.forEach((doctor) => {
      const option = document.createElement('option');
      option.value = doctor.name;
      option.textContent = doctor.name;
      select.appendChild(option);
    });
  }

  async function handleSave(form) {
    const { patient, exam } = getFormValues(form);
    await storage.savePatient(patient);
    await storage.saveExam(exam);
    currentExam = exam;
    showToast('Đã lưu phiếu khám');
  }

  function handlePrint(form) {
    const { patient, exam } = getFormValues(form);
    openPrintPreview({ patient, exam, settings: appState.settings, images: appState.selectedImages });
  }

  function handleNew(form) {
    form.reset();
    fillDefaultValues(form);
    appState.selectedImages = [];
    renderImageSlots(page.querySelector('.image-grid'), []);
    currentExam = null;
  }

  function renderEmptyState(target) {
    const empty = document.createElement('div');
    empty.className = 'empty-state subtle';
    empty.innerHTML = '<p>Chưa có phiếu khám. Vui lòng dùng "Tìm phiếu khám" hoặc tạo phiếu mới.</p>';
    target.appendChild(empty);
  }

  return {
    id: 'kham-benh',
    title: 'Khám bệnh',
    render(target) {
      target.innerHTML = '';
      page = document.createElement('div');
      page.className = 'exam-page panel';
      container = page;

      const header = document.createElement('div');
      header.className = 'exam-header';
      header.innerHTML = `
        <div class="heading-stack">
          <p class="eyebrow">KHÁM BỆNH</p>
          <h1 class="page-title">Khám bệnh</h1>
          <p class="muted">Nhập thông tin bệnh nhân, mô tả soi CTC và kiểm tra hình ảnh.</p>
        </div>
        <div class="exam-actions">
          <button type="button" class="btn secondary" data-action="new">Tạo PK mới</button>
          <button type="button" class="btn" data-action="capture">Lấy hình ảnh (F4)</button>
          <button type="button" class="btn" data-action="save">Lưu</button>
          <button type="button" class="btn primary" data-action="print">In phiếu</button>
        </div>
      `;

      const form = document.createElement('form');
      form.id = 'exam-form';
      form.className = 'exam-body';
      form.innerHTML = `
        <input type="hidden" name="examId" />
        <input type="hidden" name="examNumber" />
        <div class="exam-sidebar">
          <div class="panel-section">
            <div class="section-title">Thông tin bệnh nhân</div>
            <div class="grid-inline two">
              <label class="field inline"><span>Mã BN</span><input name="patientId" readonly /></label>
              <label class="field inline required"><span>Họ tên *</span><input name="patientName" required /></label>
            </div>
            <div class="grid-inline two">
              <label class="field inline required"><span>Tuổi *</span><input name="patientAge" type="number" min="0" required class="short-input" /></label>
              <label class="field inline"><span>Giới tính</span>
                <select name="patientGender">
                  <option>Nam</option>
                  <option>Nữ</option>
                  <option>Khác</option>
                </select>
              </label>
            </div>
            <label class="field inline"><span>Địa chỉ</span><input name="patientAddress" /></label>
            <label class="field inline"><span>Điện thoại LH</span><input name="patientPhone" /></label>
            <label class="field inline"><span>Lý do khám</span><input name="patientReason" /></label>
          </div>
        </div>
        <div class="exam-main">
          <div class="panel-section">
            <div class="section-title">Kết quả khám soi CTC</div>
            <div class="grid-inline two">
              <label class="field inline"><span>Mã số ID</span><input name="examIdDisplay" readonly value="--" /></label>
              <label class="field inline"><span>Số phiếu</span><input name="examNumberDisplay" readonly value="--" /></label>
            </div>
            <label class="field inline"><span>Ngày khám</span><input type="date" name="examDate" /></label>
            <label class="field inline required"><span>Mô tả soi CTC *</span><textarea name="description" rows="5"></textarea></label>
            <label class="field inline required"><span>KQ soi tử cung *</span><textarea name="result" rows="3"></textarea></label>
            <label class="field inline"><span>Các bước điều trị</span><textarea name="treatment" rows="3"></textarea></label>
            <label class="field inline"><span>Lời dặn của BS</span><textarea name="advice" rows="3"></textarea></label>
            <div class="grid-inline two">
              <label class="field inline required"><span>Bác sĩ khám *</span>
                <select name="doctorName"></select>
              </label>
              <label class="field inline"><span>Đánh dấu trên ảnh</span><input type="checkbox" name="markImage" /></label>
            </div>
          </div>
        </div>
        <div class="exam-images">
          <div class="panel-section">
            <div class="section-title">Hình ảnh soi CTC</div>
            <p class="muted small">Ảnh từ màn "Lấy hình ảnh" sẽ tự đẩy về đây khi xác nhận.</p>
            <div class="image-grid"></div>
          </div>
        </div>
      `;

      page.appendChild(header);
      page.appendChild(form);

      target.appendChild(page);

      if (!currentExam) {
        renderEmptyState(page);
      }

      loadMetadata().then(() => {
        populateDoctors(form.querySelector('select[name="doctorName"]'));
      });

      fillDefaultValues(form);
      form.querySelector('input[name="examIdDisplay"]').value = form.examId.value;
      form.querySelector('input[name="examNumberDisplay"]').value = form.examNumber.value;
      renderImageSlots(page.querySelector('.image-grid'), appState.selectedImages);

      form.addEventListener('input', () => publishContext(form));

      page.querySelector('[data-action="new"]').addEventListener('click', () => handleNew(form));
      page.querySelector('[data-action="save"]').addEventListener('click', () => handleSave(form));
      page.querySelector('[data-action="print"]').addEventListener('click', () => handlePrint(form));
      page.querySelector('[data-action="capture"]').addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'capture' } }));
      });
    },
    destroy() {
      document.removeEventListener('images:selected', handleSelectedImages);
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }
  };
}
