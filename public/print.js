const PRINT_STORAGE_KEY = 'ctc.print.payload';

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch (_) {
    return null;
  }
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function openPrintPreview(payload) {
  try {
    sessionStorage.setItem(PRINT_STORAGE_KEY, JSON.stringify(payload || {}));
  } catch (error) {
    console.warn('[print] Không thể lưu dữ liệu in:', error);
  }
  const target = '/print.html';
  const opened = window.open(target, '_blank', 'noopener');
  if (!opened) {
    window.location.assign(target);
  }
}

function createImageBoxes(images = [], examId = 'HA000000') {
  const boxes = images.slice(0, 4).map((img, index) => {
    const src = img?.path ? `/${img.path}` : img?.dataUrl || '';
    const caption = `${examId}_${index + 1}.PNG`;
    if (!src) {
      return `<div class="image-box"><div class="caption">${caption}</div><span class="muted">Chưa có ảnh</span></div>`;
    }
    return `<div class="image-box"><img src="${src}" alt="Ảnh ${index + 1}" loading="lazy" /><div class="caption">${caption}</div></div>`;
  });

  // Pad to configured count for balanced layout
  const total = Math.max(boxes.length, 4);
  while (boxes.length < total) {
    const caption = `${examId}_${boxes.length + 1}.PNG`;
    boxes.push(`<div class="image-box"><div class="caption">${caption}</div><span class="muted">Chưa có ảnh</span></div>`);
  }
  return boxes.join('');
}

function renderPrintPage() {
  const root = document.getElementById('print-root');
  if (!root) return;

  const payload = safeParse(sessionStorage.getItem(PRINT_STORAGE_KEY)) || {};
  const { patient = {}, exam = {}, settings = {}, images = [] } = payload;

  if (!exam?.id && !patient?.code) {
    root.innerHTML = '<div class="print-container"><div class="panel"><p>Không có dữ liệu phiếu khám để in.</p></div></div>';
    return;
  }

  const info = {
    hospitalName: settings.hospitalName || 'Cơ sở khám',
    departmentName: settings.departmentName || 'Khoa',
    address: settings.address || '',
    phone: settings.phone || '',
    website: settings.website || '',
    logoFileName: settings.logoFileName || 'logo-default.svg'
  };

  const patientRows = `
    <div class="info-row"><span class="label">Mã số BN:</span><span>${patient.code || ''}</span><span class="label">Số phiếu khám:</span><span>${exam.examNumber || exam.ticketCode || ''}</span></div>
    <div class="info-row"><span class="label">Họ và tên:</span><span>${patient.fullName || patient.name || ''}</span><span class="label">Tuổi:</span><span>${patient.age || ''} – Giới tính: ${patient.gender || ''}</span></div>
    <div class="info-row"><span class="label">Địa chỉ:</span><span>${patient.address || ''}</span><span class="label">ĐT liên hệ:</span><span>${patient.phone || ''}</span></div>
    <div class="info-row"><span class="label">Lý do khám:</span><span class="full">${patient.reason || exam.reason || ''}</span></div>
  `;

  const sheet = document.createElement('div');
  sheet.className = 'print-container';
  sheet.innerHTML = `
    <div class="print-actions no-print">
      <button type="button" class="secondary" id="close-print">ĐÓNG</button>
      <button type="button" id="do-print">IN PHIẾU</button>
    </div>
    <section class="print-sheet">
      <div class="sheet-header">
        <div class="logo-box"><img src="/assets/${info.logoFileName}" alt="Logo" /></div>
        <div class="header-meta">
          <div class="facility">${info.hospitalName}</div>
          <div class="department">${info.departmentName}</div>
          <div class="contact">${[info.address, info.phone, info.website].filter(Boolean).join(' · ')}</div>
        </div>
      </div>
      <div class="divider"></div>
      <div class="print-title">PHIẾU SOI CỔ TỬ CUNG</div>
      <div class="section patient-block">${patientRows}</div>
      <div class="section">
        <div class="section-title">Mô tả:</div>
        <div class="body-text">${(exam.description || '').replace(/\n/g, '<br/>')}</div>
      </div>
      <div class="image-row">${createImageBoxes(images, exam.id || exam.examId || 'HA000000')}</div>
      <div class="section">
        <div class="section-title">Kết quả soi tử cung:</div>
        <div class="body-text">${(exam.result || '').replace(/\n/g, '<br/>')}</div>
      </div>
      <div class="section">
        <div class="section-title">Các bước điều trị:</div>
        <div class="body-text">${(exam.treatmentSteps || '').replace(/\n/g, '<br/>')}</div>
      </div>
      <div class="section">
        <div class="section-title">Lời dặn của bác sỹ:</div>
        <div class="body-text">${(exam.doctorAdvice || '').replace(/\n/g, '<br/>')}</div>
      </div>
      <div class="signature-block">
        <div></div>
        <div class="signature-area">
          <div class="date-line">Ngày ${formatDate(exam.date || exam.examDate || new Date())}</div>
          <div>Bác sỹ khám bệnh</div>
          <div class="signature-stamp">${exam.doctorSignature ? `<img src="/${exam.doctorSignature}" alt="Chữ ký" />` : ''}</div>
          <div class="doctor-name">${exam.doctorName || ''}</div>
        </div>
      </div>
      <div class="footer-note">Xin hãy giữ lại giấy khám này và mang đến cho lần khám tiếp theo.</div>
    </section>
  `;

  root.innerHTML = '';
  root.appendChild(sheet);

  const closeBtn = document.getElementById('close-print');
  const printBtn = document.getElementById('do-print');
  if (closeBtn) closeBtn.addEventListener('click', () => window.close());
  if (printBtn) printBtn.addEventListener('click', () => window.print());
}

if (window.location.pathname.includes('print.html')) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderPrintPage);
  } else {
    renderPrintPage();
  }
}
