import { storage } from './storage.js';
import { openPrintPreview } from './print.js';

function formatCode(prefix, number) {
  return `${prefix}${String(number).padStart(5, '0')}`;
}

function normalizeImages(images = [], count = 4) {
  const mapped = (images || [])
    .map((image) => {
      if (!image) return null;
      if (typeof image === 'string') {
        if (image.startsWith('data:')) return { dataUrl: image };
        return { path: image };
      }
      return image;
    })
    .slice(0, count);

  while (mapped.length < count) {
    mapped.push(null);
  }
  return mapped;
}

export function createExamFormView(appState) {
  let container;
  let doctors = [];
  let templates = [];
  let currentExam = null;
  let currentPatient = null;
  let pendingExamLoad = null;

  function persistDraft(form) {
    if (!form) return;
    const values = getFormValues(form);
    appState.examDraft = values;
  }

  const handleExternalExamLoad = (event) => {
    const detail = event.detail;
    if (container && container.isConnected) {
      const form = container.querySelector('#exam-form');
      loadExamIntoForm(form, detail?.exam, detail?.patient);
    } else {
      pendingExamLoad = detail;
    }
  };

  document.addEventListener('images:selected', (event) => {
    appState.selectedImages = event.detail;
    if (container) {
      renderImageSlots(container.querySelector('.image-grid'), appState.selectedImages);
      const form = container.querySelector('#exam-form');
      persistDraft(form);
    }
  });

  async function loadMetadata() {
    [doctors, templates] = await Promise.all([
      storage.listDoctors(),
      storage.listTemplates()
    ]);
  }

  document.addEventListener('exam:load', handleExternalExamLoad);

  function getImageCount() {
    return appState.settings?.defaultImageCount || 4;
  }

  function updateSaveStatus(message) {
    const statusEl = container?.querySelector('#exam-save-status');
    if (!statusEl) return;

    statusEl.textContent = message || '';
    statusEl.classList.toggle('visible', Boolean(message));

    clearTimeout(updateSaveStatus.timeoutId);
    if (message) {
      updateSaveStatus.timeoutId = setTimeout(() => {
        statusEl.textContent = '';
        statusEl.classList.remove('visible');
      }, 3000);
    }
  }

  function renderImageSlots(wrapper, images) {
    if (!wrapper) return;
    wrapper.innerHTML = '';
    const normalized = normalizeImages(images, getImageCount());
    for (let i = 0; i < normalized.length; i += 1) {
      const slot = document.createElement('div');
      slot.className = 'image-slot';
      const image = normalized[i];
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
      indication: formData.get('patientIndication'),
      assignedDoctor: formData.get('patientAssignedDoctor')
    };
    const doctorSelect = form.querySelector('select[name="doctorId"]');
    const doctorId = formData.get('doctorId');
    const doctor = doctors.find((item) => item.id === doctorId);
    const doctorNameFromSelect = doctorSelect?.selectedOptions?.[0]?.textContent?.trim();
    const doctorNameField = formData.get('doctorName');

    const exam = {
      id: formData.get('examId'),
      examNumber: formData.get('examNumber'),
      date: formData.get('examDate'),
      patientId: patient.id,
      description: formData.get('description'),
      result: formData.get('result'),
      treatmentSteps: formData.get('treatment'),
      doctorAdvice: formData.get('advice'),
      doctorId: doctorId || doctor?.id || '',
      doctorName: doctor?.name || doctorNameFromSelect || doctorNameField || '',
      imagePaths: (appState.selectedImages || [])
        .filter(Boolean)
        .map((img) => img.path || img.dataUrl)
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
    const nextPatientNumber = settings?.nextPatientNumber || 1;
    const nextExamNumber = settings?.nextExamNumber || 1;
    const patientPrefix = settings?.patientCodePrefix || '';
    const examPrefix = settings?.examCodePrefix || patientPrefix || '';

    form.patientId.value = formatCode(patientPrefix, nextPatientNumber);
    form.examId.value = formatCode(examPrefix, nextExamNumber);
    form.examNumber.value = formatCode(examPrefix, nextExamNumber);
    form.patientGender.value = 'Nữ';
    form.examDate.valueAsDate = new Date();
    form.description.value = settings?.defaultDescription || '';
    form.result.value = settings?.defaultResult || '';
    form.advice.value = settings?.defaultDoctorAdvice || '';
    publishContext(form);
    const doctorSelect = form.querySelector('select[name="doctorId"]');
    const doctorNameInput = form.querySelector('input[name="doctorName"]');
    syncDoctorName(doctorSelect, doctorNameInput);
  }

  async function refreshSettings() {
    appState.settings = await storage.getSettings();
  }

  function syncDoctorName(select, hiddenInput) {
    const selectedName = select?.selectedOptions?.[0]?.textContent?.trim() || '';
    if (hiddenInput) {
      hiddenInput.value = selectedName;
    }
    if (select) {
      select.dataset.selectedId = select.value;
      select.dataset.selectedName = selectedName;
    }
  }

  function populateDoctors(select, hiddenInput, selectedId, fallbackName) {
    if (!select) return;

    const desiredId = selectedId || select.dataset.selectedId || '';
    const desiredName = fallbackName || select.dataset.selectedName || select.dataset.fallbackName || '';

    select.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Chọn bác sỹ';
    select.appendChild(placeholder);

    doctors.forEach((doctor) => {
      const option = document.createElement('option');
      option.value = doctor.id;
      option.textContent = doctor.name;
      select.appendChild(option);
    });

    const matchedById = doctors.find((doctor) => doctor.id === desiredId);
    const matchedByName = doctors.find((doctor) => doctor.name === desiredName);

    if (matchedById) {
      select.value = matchedById.id;
    } else if (matchedByName) {
      select.value = matchedByName.id;
    } else if (doctors[0]) {
      select.value = doctors[0].id;
    }

    syncDoctorName(select, hiddenInput);
  }

  async function handleSave(form) {
    if (!form.reportValidity()) {
      updateSaveStatus('Vui lòng nhập đầy đủ các trường bắt buộc');
      return null;
    }

    const { patient, exam } = getFormValues(form);

    let savedPatient;
    if (currentPatient?.id) {
      savedPatient = await storage.updatePatient(currentPatient.id, patient);
    } else {
      savedPatient = await storage.savePatient(patient);
    }

    let savedExam;
    if (currentExam?.id) {
      savedExam = await storage.updateExam(currentExam.id, { ...exam, id: currentExam.id, patientId: savedPatient.id });
    } else {
      savedExam = await storage.saveExam({ ...exam, patientId: savedPatient.id });
    }

    currentExam = savedExam;
    currentPatient = savedPatient;
    appState.examDraft = { patient: savedPatient, exam: savedExam };

    form.patientId.value = savedPatient.id;
    form.examId.value = savedExam.id;
    form.examNumber.value = savedExam.examNumber || savedExam.id;
    await refreshSettings();
    updateSaveStatus('Đã lưu phiếu khám');

    return { patient: savedPatient, exam: savedExam };
  }

  function handlePrint(form, dataOverride) {
    const { patient, exam } = dataOverride || getFormValues(form);
    openPrintPreview({ patient, exam, settings: appState.settings, images: appState.selectedImages });
  }

  async function handleSaveAndPrint(form) {
    const saved = await handleSave(form);
    if (!saved) return;

    handlePrint(form, saved);
  }

  async function handleNew(form) {
    form.reset();
    await refreshSettings();
    fillDefaultValues(form);
    appState.selectedImages = [];
    renderImageSlots(container.querySelector('.image-grid'), []);
    currentExam = null;
    currentPatient = null;
    updateSaveStatus('');
    persistDraft(form);
  }

  function loadExamIntoForm(form, exam, patient, options = {}) {
    const { keepUnsaved = false } = options;
    if (!form) return;

    const fallbackSettings = appState.settings || {};
    const patientPrefix = fallbackSettings.patientCodePrefix || '';
    const examPrefix = fallbackSettings.examCodePrefix || patientPrefix || '';
    form.patientId.value = patient?.id || formatCode(patientPrefix, fallbackSettings.nextPatientNumber || 1);
    form.patientName.value = patient?.name || '';
    form.patientAge.value = patient?.age || '';
    form.patientGender.value = patient?.gender || 'Nữ';
    form.patientAddress.value = patient?.address || '';
    form.patientPhone.value = patient?.phone || '';
    form.patientReason.value = patient?.reason || '';
    form.patientIndication.value = patient?.indication || '';
    form.patientAssignedDoctor.value = patient?.assignedDoctor || '';

    form.examId.value = exam?.id || formatCode(examPrefix, fallbackSettings.nextExamNumber || 1);
    form.examNumber.value = exam?.examNumber || form.examId.value;
    form.examDate.value = exam?.date || '';
    form.description.value = exam?.description || fallbackSettings.defaultDescription || '';
    form.result.value = exam?.result || fallbackSettings.defaultResult || '';
    form.treatment.value = exam?.treatmentSteps || '';
    form.advice.value = exam?.doctorAdvice || fallbackSettings.defaultDoctorAdvice || '';
    form.doctorId.dataset.fallbackName = exam?.doctorName || '';
    form.doctorId.value = exam?.doctorId || form.doctorId.value || '';
    form.doctorName.value = exam?.doctorName || form.doctorName.value || '';
    syncDoctorName(form.querySelector('select[name="doctorId"]'), form.querySelector('input[name="doctorName"]'));

    const imageList = normalizeImages(exam?.imagePaths, getImageCount());
    appState.selectedImages = imageList;
    renderImageSlots(container.querySelector('.image-grid'), imageList);

    currentExam = keepUnsaved ? currentExam : exam || null;
    currentPatient = keepUnsaved ? currentPatient : patient || null;
    publishContext(form);
    persistDraft(form);
  }

  return {
    render(target) {
      const template = document.getElementById('tpl-exam-form');
      if (template?.content) {
        container = template.content.firstElementChild.cloneNode(true);
        const note = container.querySelector('.image-count-note');
        if (note) {
          note.textContent = `Hiển thị ${getImageCount()} ảnh. Chọn tại màn hình Lấy hình ảnh.`;
        }
      } else {
        container = document.createElement('section');
        container.className = 'card exam-view wide-card';
        container.innerHTML = `
          <div class="toolbar">
            <button type="button" data-action="new">Tạo PK mới</button>
            <button type="button" data-action="save-print">Lưu &amp; In phiếu</button>
            <div class="toolbar-group">
              <button type="button" class="secondary" data-action="capture">Lấy hình ảnh (F4)</button>
              <span class="save-status" id="exam-save-status" aria-live="polite"></span>
            </div>
          </div>
          <form class="grid-2" id="exam-form">
            <input type="hidden" name="examId" />
            <input type="hidden" name="examNumber" />
            <input type="hidden" name="doctorName" />
            <div>
              <div class="card patient-card">
                <h3>Thông tin bệnh nhân</h3>
                <div class="patient-grid">
                  <div class="field">
                    <label>Mã</label>
                    <input class="input-short" name="patientId" readonly />
                  </div>
                  <div class="field full-name">
                    <label>Họ tên *</label>
                    <input name="patientName" required />
                  </div>
                  <div class="field compact">
                    <label>Tuổi *</label>
                    <input name="patientAge" type="number" min="0" required />
                  </div>
                  <div class="field compact">
                    <label>Giới tính</label>
                    <select name="patientGender">
                      <option>Nữ</option>
                      <option>Nam</option>
                    </select>
                  </div>
                  <div class="field address">
                    <label>Địa chỉ</label>
                    <input name="patientAddress" />
                  </div>
                  <div class="field phone">
                    <label>Điện thoại</label>
                    <input name="patientPhone" />
                  </div>
                  <div class="field reason">
                    <label>Chẩn đoán lâm sàng</label>
                    <input name="patientReason" />
                  </div>
                  <div class="field indication">
                    <label>Chỉ định</label>
                    <input name="patientIndication" />
                  </div>
                  <div class="field assigned-doctor">
                    <label>Bác sỹ chỉ định</label>
                    <input name="patientAssignedDoctor" />
                  </div>
                </div>
              </div>
              <div class="card exam-details">
                <h3>Kết quả khám</h3>
                <div class="form-row">
                  <label>Ngày khám</label>
                  <input type="date" name="examDate" />
                </div>
                <div class="form-row">
                  <label>KQ soi tử cung</label>
                  <textarea name="result"></textarea>
                </div>
                <div class="form-row">
                  <label>Mô tả soi CTC</label>
                  <textarea name="description"></textarea>
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
                  <select name="doctorId"></select>
                </div>
              </div>
            </div>
            <div>
              <div class="card">
                <h3>Ảnh soi</h3>
                <p>Hiển thị ${getImageCount()} ảnh. Chọn tại màn hình Lấy hình ảnh.</p>
                <div class="image-grid"></div>
              </div>
            </div>
          </form>
        `;
      }

      target.appendChild(container);
      const form = container.querySelector('#exam-form');
      const doctorSelect = form.querySelector('select[name="doctorId"]');
      const doctorNameInput = form.querySelector('input[name="doctorName"]');
      if (pendingExamLoad) {
        loadExamIntoForm(form, pendingExamLoad.exam, pendingExamLoad.patient);
        pendingExamLoad = null;
      } else if (appState.examDraft) {
        loadExamIntoForm(form, appState.examDraft.exam, appState.examDraft.patient, { keepUnsaved: true });
        renderImageSlots(container.querySelector('.image-grid'), appState.selectedImages);
      } else {
        fillDefaultValues(form);
        renderImageSlots(container.querySelector('.image-grid'), appState.selectedImages);
        persistDraft(form);
      }

      loadMetadata().then(() => {
        populateDoctors(
          doctorSelect,
          doctorNameInput,
          doctorSelect?.value || appState.examDraft?.exam?.doctorId,
          doctorNameInput?.value || appState.examDraft?.exam?.doctorName
        );
      });

      form.addEventListener('input', () => {
        publishContext(form);
        persistDraft(form);
      });

      form.addEventListener('change', (event) => {
        if (event.target === doctorSelect) {
          syncDoctorName(doctorSelect, doctorNameInput);
        }
        publishContext(form);
        persistDraft(form);
      });

      container.querySelector('[data-action="new"]').addEventListener('click', () => handleNew(form));
      container.querySelector('[data-action="save-print"]').addEventListener('click', () => handleSaveAndPrint(form));
      container.querySelector('[data-action="capture"]').addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'capture' } }));
      });

    }
  };
}
