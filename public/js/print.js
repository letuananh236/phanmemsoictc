export function openPrintPreview({ patient, exam, settings, images }) {
  const examImages = normalizeImages(images, settings.defaultImageCount || 4);
  const formattedDate = formatExamDate(exam?.date);
  const doctorName = exam?.doctorName || '';
  const reason = patient?.reason || '';
  const logoShape = normalizeLogoShape(settings?.logoShape);
  const printImageLayout = normalizePrintImageLayout(settings?.printImageLayout);

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const sheetHtml = renderPrintSheet({
    patient,
    exam,
    settings,
    logoShape,
    formattedDate,
    doctorName,
    reason,
    examImages,
    printImageLayout,
  });

  printWindow.document.write(`
    <html>
      <head>
        <title>Phiếu khám</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 1cm 0.7cm 1cm 1cm;
          }
          :root {
            font-family: 'Times New Roman', 'Times', serif;
            color: #111827;
            line-height: 1.6;
          }
          body { margin: 0; background: #f3f4f6; padding: 16px; }
          .print-wrapper { width: 100%; margin: 0 auto; }
          .print-actions { display: flex; justify-content: flex-end; gap: 10px; margin-bottom: 12px; position: sticky; top: 0; padding: 8px 0; background: #f3f4f6; z-index: 2; }
          .print-actions button { border: 1px solid #cbd5e1; background: #0f5ba7; color: #fff; padding: 8px 14px; border-radius: 6px; font-weight: 700; cursor: pointer; }
          .print-actions button.secondary { background: #6b7280; }
          .print-sheet {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
            background: #fff;
            padding: 1cm 0.84cm 1cm 1cm;
            box-shadow: 0 18px 45px rgb(0 0 0 / 0.16);
            font-size: 16px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            min-height: calc(297mm - 2cm);
          }
          .print-sheet.layout-grid,
          .print-sheet.layout-grid-large {
            font-size: 14px;
            line-height: 1.45;
          }
          .print-sheet.layout-grid-large {
            line-height: 1.28;
          }
          .print-body { flex: 1; display: flex; flex-direction: column; }
          header { display: grid; grid-template-columns: max-content 1fr; gap: 14px; align-items: center; padding-bottom: 10px; border-bottom: 1px solid #1f2937; margin-bottom: 12px; }
          .print-sheet.layout-grid-large header { margin-bottom: 8px; padding-bottom: 8px; }
          .print-logo { object-fit: contain; border: 1px solid #e5e7eb; padding: 6px; background: #fff; }
          .print-logo.square { width: 80px; height: 80px; border-radius: 8px; }
          .print-logo.rectangle { width: 140px; height: 70px; border-radius: 6px; }
          .header-text { display: flex; flex-direction: column; gap: 3px; }
          .header-text .hospital-name, .header-text .department-name { text-transform: uppercase; font-weight: 700; }
          .header-text .hospital-name { font-size: 20px; }
          .header-text .department-name { font-size: 17px; }
          .title {
            text-align: center;
            color: #b91c1c;
            font-size: 22px;
            font-weight: 800;
            text-transform: uppercase;
            margin: 6px 0 14px;
            letter-spacing: 0.2px;
          }
          .print-sheet.layout-grid .title,
          .print-sheet.layout-grid-large .title {
            font-size: 20px;
            margin: 2px 0 6px;
          }
          .info-lines { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; font-size: 14px; }
          .print-sheet.layout-grid .info-lines,
          .print-sheet.layout-grid-large .info-lines { gap: 1px; margin-bottom: 3px; }
          .info-line { display: flex; flex-wrap: wrap; gap: 12px; align-items: baseline; }
          .info-line .label { font-weight: 700; margin-right: 4px; white-space: nowrap; }
          .section { margin: 10px 0 12px; }
          .print-sheet.layout-grid .section,
          .print-sheet.layout-grid-large .section { margin: 2px 0 4px; }
          .section-heading { font-weight: 700; margin-bottom: 5px; text-transform: uppercase; }
          .print-sheet.layout-grid .section-heading,
          .print-sheet.layout-grid-large .section-heading { margin-bottom: 4px; }
          .section-heading .roman { margin-right: 6px; }
          .text-content { white-space: pre-wrap; min-height: 28px; padding-left: 2px; }
          .print-sheet.layout-grid .text-content,
          .print-sheet.layout-grid-large .text-content { min-height: 16px; }
          .advice-row { display: block; }
          .print-sheet.layout-grid-large .advice-row {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 16px;
          }
          .print-images {
            display: grid;
            gap: 4px;
            margin-top: 6px;
          }
          .print-grid-block {
            display: block;
          }
          .print-images.layout-row {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            width: 104%;
            margin-left: -2%;
            margin-right: -2%;
          }
          .print-images.layout-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            width: 100%;
            margin-left: 0;
            margin-right: 0;
            gap: 6px;
          }
          .print-images.layout-grid-large {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            width: 100%;
            margin-left: 0;
            margin-right: 0;
            gap: 6px;
          }
          .print-sheet.layout-grid .print-grid-block {
            display: grid;
            grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.4fr);
            gap: 14px;
            align-items: start;
            margin-top: 4px;
          }
          .print-sheet.layout-grid-large .print-grid-block {
            display: grid;
            grid-template-columns: minmax(0, 1fr);
            gap: 8px;
            align-items: start;
            margin-top: 4px;
          }
          .print-sheet.layout-grid .print-grid-block .section-heading {
            font-size: 14px;
          }
          .print-sheet.layout-grid-large .print-grid-block .section-heading {
            font-size: 14px;
          }
          .print-sheet.layout-grid .print-grid-block .section {
            margin: 0;
          }
          .print-sheet.layout-grid-large .print-grid-block .section {
            margin: 0;
          }
          .print-sheet.layout-grid .print-grid-block .image-section {
            order: 2;
            align-items: flex-end;
          }
          .print-sheet.layout-grid-large .print-grid-block .image-section {
            order: 1;
            align-items: stretch;
          }
          .print-sheet.layout-grid .print-grid-block .result-section {
            order: 1;
          }
          .print-sheet.layout-grid-large .print-grid-block .result-section {
            order: 2;
          }
          .print-sheet.layout-grid .image-section,
          .print-sheet.layout-grid-large .image-section {
            display: flex;
            flex-direction: column;
            width: 100%;
          }
          .print-sheet.layout-grid .image-section .section-heading,
          .print-sheet.layout-grid-large .image-section .section-heading {
            align-self: flex-start;
          }
          .print-sheet.layout-grid .image-section .print-images {
            width: 100%;
            max-width: 924px;
            margin-left: auto;
          }
          .print-sheet.layout-grid-large .image-section .print-images {
            width: 100%;
            max-width: 100%;
            margin-left: 0;
          }
          .print-sheet.layout-grid-large .print-image {
            border: 2px solid #d1d5db;
            background: #fff;
          }
          .print-image { width: 100%; aspect-ratio: 4 / 3; border: 1px solid #d1d5db; display: flex; align-items: center; justify-content: center; background: #f8fafc; overflow: hidden; }
          .print-image img { width: 100%; height: 100%; object-fit: cover; }
          .print-image.placeholder { border-style: dashed; color: #94a3b8; font-style: italic; font-size: 12px; }
          .signature-block { margin-top: 18px; text-align: right; line-height: 1.7; display: flex; flex-direction: column; align-items: flex-end; min-width: 260px; width: 100%; max-width: 420px; margin-left: auto; }
          .signature-block .doctor-title { font-weight: 700; text-align: right; margin-top: 9.6px; width: 100%; }
          .signature-block .doctor-name { margin-top: 40px; font-weight: 700; width: 100%; font-size: 16px; }
          .print-sheet.layout-grid .signature-block { margin-top: 8px; line-height: 1.5; }
          .print-sheet.layout-grid-large .signature-block { margin-top: 0; line-height: 1.2; }
          .print-sheet.layout-grid .signature-block .doctor-name { margin-top: 28px; font-size: 15px; }
          .print-sheet.layout-grid-large .signature-block .doctor-name { margin-top: 32px; font-size: 14px; margin-bottom: 8px; }
          .print-sheet.layout-grid-large .section + .signature-block { margin-top: -4px; }
          .print-note {
            margin-top: auto;
            border-top: 1px solid #111827;
            padding-top: 6px;
            font-style: italic;
            text-align: left;
            text-decoration: underline;
            text-decoration-thickness: 1px;
            text-underline-offset: 3px;
          }
          .print-sheet.layout-grid-large .print-note { padding-top: 24px; }
          @media print {
            body {
              background: #fff;
              padding: 0;
            }
            .print-wrapper,
            .print-sheet {
              box-shadow: none;
              width: auto;
              min-height: auto;
              margin: 0;
              padding: 0;
            }
            .print-sheet {
              padding: 0;
            }
            .print-actions {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-wrapper">
          <div class="print-actions">
            <button class="secondary" onclick="window.close()">Đóng</button>
            <button onclick="window.print()">In phiếu</button>
          </div>
          ${sheetHtml}
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
}

function formatExamDate(dateString) {
  if (!dateString) {
    return 'Ngày ..... tháng ..... năm .....';
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return 'Ngày ..... tháng ..... năm .....';
  }
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = date.getFullYear();
  return `Ngày ${day} tháng ${month} năm ${year}`;
}

function formatVisitDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  const day = `${date.getDate()}`.padStart(2, '0');
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function normalizeImages(images = [], targetCount = 4) {
  const list = (images || []).slice(0, targetCount);
  while (list.length < targetCount) {
    list.push(null);
  }
  return list;
}

function normalizeExamCode(code = '') {
  return code.replace(/^HA/i, 'BN');
}

function normalizeLogoShape(shape) {
  const value = (shape || '').toLowerCase();
  return value === 'rectangle' ? 'rectangle' : 'square';
}

function normalizePrintImageLayout(layout) {
  if (layout === 'grid') return 'layout-grid';
  if (layout === 'grid-large') return 'layout-grid-large';
  return 'layout-row';
}

function renderPrintSheet({ patient, exam, settings, logoShape, formattedDate, doctorName, reason, examImages, printImageLayout }) {
  const patientCode = normalizeExamCode(exam?.examNumber || exam?.id || patient?.id || '');
  const insuranceNumber = exam?.insuranceNumber || '';
  const diagnosis = exam?.diagnosis || exam?.result || '';
  const visitReason = patient?.reason || reason || '';
  const address = patient?.address || '';
  const age = patient?.age || '';
  const gender = patient?.gender || '';

  const imageRow = examImages
    .map((image, index) => {
      if (!image) {
        return `<div class="print-image placeholder">Ảnh ${index + 1}</div>`;
      }
      return `
        <div class="print-image">
          <img src="${image.dataUrl || `/${image.path}`}" alt="Ảnh soi ${index + 1}" />
        </div>`;
    })
    .join('');

  return `
    <div class="print-sheet ${printImageLayout}">
      <div class="print-body">
        <header>
          <img class="print-logo ${logoShape}" src="/database/logo/${settings.logoFileName}" alt="Logo bệnh viện" />
          <div class="header-text">
            <div class="hospital-name">${settings.hospitalName || ''}</div>
            <div class="department-name">${settings.departmentName || ''}</div>
            <div>${settings.address || ''}</div>
            <div>${settings.phone || ''}${settings.website ? ' | ' + settings.website : ''}</div>
          </div>
        </header>

        <div class="title">KẾT QUẢ SOI CỔ TỬ CUNG</div>

        <div class="info-lines">
          <div class="info-line">
            <span class="label">Họ và tên:</span> ${patient?.name || ''}
            <span class="label">Mã số BH:</span> ${insuranceNumber}
            <span class="label">Tuổi:</span> ${age}
            <span class="label">Giới tính:</span> ${gender}
            <span class="label">Mã số BN:</span> ${patientCode}
          </div>
          <div class="info-line">
            <span class="label">Địa chỉ:</span> ${address}
          </div>
          <div class="info-line">
            <span class="label">Lý do khám:</span> ${visitReason}
          </div>
        </div>

        <div class="print-grid-block">
          <div class="section image-section">
            <div class="section-heading">HÌNH ẢNH CHI TIẾT CỔ TỬ CUNG:</div>
            <div class="print-images ${printImageLayout}">${imageRow}</div>
          </div>

          <div class="section result-section">
            <div class="section-heading">Kết quả soi tử cung:</div>
            <div class="text-content">${diagnosis || ''}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-heading">Các biểu hiện khác:</div>
          <div class="text-content">${exam?.description || ''}</div>
        </div>

        <div class="section">
          <div class="section-heading">Các bước điều trị:</div>
          <div class="text-content">${exam?.treatmentSteps || ''}</div>
        </div>

        <div class="advice-row">
          <div class="section">
            <div class="section-heading">Lời dặn của bác sỹ:</div>
            <div class="text-content">${exam?.doctorAdvice || ''}</div>
          </div>

          <div class="signature-block">
            <div>${formattedDate}</div>
            <div class="doctor-title">Bác sỹ khám bệnh</div>
            <div class="doctor-name">${doctorName}</div>
          </div>
        </div>
      </div>

      <div class="print-note">
        Xin hãy giữ lại giấy khám này và mang đến cho lần khám tiếp theo.
      </div>
    </div>
  `;
}
