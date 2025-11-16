import { storage, showToast } from './storage.js';
import { openPrintPreview } from './print.js';

function generateCode(prefix) {
  const random = Math.floor(Math.random() * 999999);
  return `${prefix}${String(random).padStart(6, '0')}`;
}

export function createExamFormView(appState) {
  let container;
  let doctors = [];
  let templates = [];
  let currentExam = null;

  document.addEventListener('images:selected', (event) => {
    appState.selectedImages = event.detail;
    if (container) {
      renderImageSlots(container.querySelector('.image-grid'), appState.selectedImages);
    }
  });

  async function loadMetadata() {
    [doctors, templates] = await Promise.all([
      storage.listDoctors(),
      storage.listTemplates()
    ]);
  }

  function renderImageSlots(wrapper, images) {
    if (!wrapper) return;
    wrapper.innerHTML = '';
    const count = appState.settings?.defaultImageCount || 4;
    for (let i = 0; i < count; i += 1) {
      const slot = document.createElement('div');
      slot.className = 'image-slot';
      const image = images?.[i];
      if (image?.dataUrl) {
        slot.innerHTML = `<img src="${image.dataUrl}" alt="Ảnh ${i + 1}" />`;
      } else if (image?.path) {
        slot.innerHTML = `<img src="/${image.path}" alt="Ảnh ${i + 1}" />`;
      } else {
        slot.innerHTML = `<span>Ảnh ${i + 1}</span>`;
      }
      wrapper.appendChild(slot);
    }
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
    form.description.value = settings?.defaultDescription || '';
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
    renderImageSlots(container.querySelector('.image-grid'), []);
    currentExam = null;
  }

  return {
    render(target) {
      container = document.createElement('section');
      container.className = 'card exam-view';
      container.innerHTML = `
        <div class="toolbar">
          <button type="button" data-action="new">Tạo PK mới</button>
          <button type="button" data-action="save">Lưu</button>
          <button type="button" data-action="print">In phiếu</button>
          <button type="button" class="secondary" data-action="capture">Lấy hình ảnh (F4)</button>
        </div>
        <form class="grid-2" id="exam-form">
          <div>
            <div class="card">
              <h3>Thông tin bệnh nhân</h3>
              <div class="form-row">
                <label>Mã BN</label>
                <input name="patientId" readonly />
              </div>
              <div class="form-row">
                <label>Họ tên *</label>
                <input name="patientName" required />
              </div>
              <div class="form-row">
                <label>Tuổi *</label>
                <input name="patientAge" type="number" min="0" required />
              </div>
              <div class="form-row">
                <label>Giới tính</label>
                <select name="patientGender">
                  <option>Nam</option>
                  <option>Nữ</option>
                </select>
              </div>
              <div class="form-row">
                <label>Địa chỉ</label>
                <input name="patientAddress" />
              </div>
              <div class="form-row">
                <label>Điện thoại</label>
                <input name="patientPhone" />
              </div>
              <div class="form-row">
                <label>Lý do khám</label>
                <input name="patientReason" />
              </div>
            </div>
            <div class="card">
              <h3>Kết quả khám</h3>
              <div class="form-row">
                <label>Mã ID</label>
                <input name="examId" />
              </div>
              <div class="form-row">
                <label>Số phiếu</label>
                <input name="examNumber" />
              </div>
              <div class="form-row">
                <label>Ngày khám</label>
                <input type="date" name="examDate" />
              </div>
              <div class="form-row">
                <label>Mô tả soi CTC</label>
                <textarea name="description"></textarea>
              </div>
              <div class="form-row">
                <label>KQ soi tử cung</label>
                <textarea name="result"></textarea>
              </div>
              <div class="form-row">
                <label>Các bước điều trị</label>
                <textarea name="treatment"></textarea>
              </div>
              <div class="form-row">
                <label>Lời dặn của BS</label>
                <textarea name="advice"></textarea>
              </div>
              <div class="form-row">
                <label>Bác sỹ khám</label>
                <select name="doctorName"></select>
              </div>
            </div>
          </div>
          <div>
            <div class="card">
              <h3>Ảnh soi</h3>
              <p>Hiển thị ${appState.settings?.defaultImageCount || 4} ảnh. Chọn tại màn hình Lấy hình ảnh.</p>
              <div class="image-grid"></div>
            </div>
          </div>
        </form>
      `;

      target.appendChild(container);

      loadMetadata().then(() => {
        populateDoctors(container.querySelector('select[name="doctorName"]'));
      });

      const form = container.querySelector('#exam-form');
      fillDefaultValues(form);
      renderImageSlots(container.querySelector('.image-grid'), appState.selectedImages);

      form.addEventListener('input', () => publishContext(form));

      container.querySelector('[data-action="new"]').addEventListener('click', () => handleNew(form));
      container.querySelector('[data-action="save"]').addEventListener('click', () => handleSave(form));
      container.querySelector('[data-action="print"]').addEventListener('click', () => handlePrint(form));
      container.querySelector('[data-action="capture"]').addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'capture' } }));
      });
    }
  };
}
