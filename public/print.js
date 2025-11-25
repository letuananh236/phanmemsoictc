export function openPrintPreview({ patient, exam, settings, images }) {
  const examImages = normalizeImages(images, settings.defaultImageCount || 4);
  const formattedDate = formatExamDate(exam?.date);
  const doctorName = exam?.doctorName || '';
  const reason = patient?.reason || '';

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const sheetHtml = renderPrintSheet({
    patient,
    exam,
    settings,
    formattedDate,
    doctorName,
    reason,
    examImages,
  });

  printWindow.document.write(`
    <html>
      <head>
        <title>Phiếu khám</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 1cm;
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
            min-height: 297mm;
            margin: 0 auto;
            background: #fff;
            padding: 1.4cm 1.6cm;
            box-shadow: 0 18px 45px rgb(0 0 0 / 0.16);
            font-size: 17px;
          }
          header { display: grid; grid-template-columns: 92px 1fr; gap: 16px; align-items: center; padding-bottom: 12px; border-bottom: 1px solid #1f2937; margin-bottom: 14px; }
          .print-logo { width: 84px; height: 84px; object-fit: contain; border-radius: 8px; border: 1px solid #e5e7eb; padding: 6px; }
          .header-text { display: flex; flex-direction: column; gap: 4px; }
          .header-text .hospital-name, .header-text .department-name { text-transform: uppercase; font-weight: 700; }
          .header-text .hospital-name { font-size: 21px; }
          .header-text .department-name { font-size: 18px; }
          .title {
            text-align: center;
            color: #b91c1c;
            font-size: 24px;
            font-weight: 800;
            text-transform: uppercase;
            margin: 6px 0 18px;
            letter-spacing: 0.2px;
          }
          .info-lines { display: flex; flex-direction: column; gap: 6px; margin-bottom: 18px; font-size: 15px; }
          .info-line { display: flex; flex-wrap: wrap; gap: 16px; align-items: baseline; }
          .info-line .label { font-weight: 700; margin-right: 6px; white-space: nowrap; }
          .section { margin: 12px 0 14px; }
          .section-heading { font-weight: 700; margin-bottom: 6px; text-transform: uppercase; }
          .section-heading .roman { margin-right: 6px; }
          .text-content { white-space: pre-wrap; min-height: 32px; padding-left: 4px; }
          .print-images { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-top: 8px; }
          .print-image { width: 100%; aspect-ratio: 4 / 3; border: 1px solid #d1d5db; display: flex; align-items: center; justify-content: center; background: #f8fafc; overflow: hidden; }
          .print-image img { width: 100%; height: 100%; object-fit: cover; }
          .print-image.placeholder { border-style: dashed; color: #94a3b8; font-style: italic; font-size: 13px; }
          .signature-block { margin-top: 26px; text-align: right; line-height: 1.8; }
          .signature-block .doctor-title { font-weight: 700; text-align: center; margin-top: 10px; }
          .signature-block .doctor-name { margin-top: 40px; font-weight: 700; }
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

function renderPrintSheet({ patient, exam, settings, formattedDate, doctorName, reason, examImages }) {
  const patientCode = normalizeExamCode(patient?.id || exam?.examNumber || exam?.id || '');
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
    <div class="print-sheet">
      <header>
        <img class="print-logo" src="./logo/${settings.logoFileName}" alt="Logo bệnh viện" />
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
          <span class="label">Tuổi:</span> ${age}
          <span class="label">Giới tính:</span> ${gender}
          <span class="label">Mã số BN:</span> ${patientCode}
        </div>
          <div class="info-line">
            <span class="label">Họ đã đến khám:</span> ${visitReason || diagnosis || ''}
            <span class="label">Mã số BH:</span> ${insuranceNumber}
          </div>
        <div class="info-line">
          <span class="label">Lý do khám:</span> ${visitReason || ''}
        </div>
        <div class="info-line">
          <span class="label">Địa chỉ:</span> ${address}
        </div>
      </div>

      <div class="section">
        <div class="section-heading"><span class="roman">I.</span>HÌNH ẢNH CHI TIẾT CỔ TỬ CUNG:</div>
        <div class="print-images">${imageRow}</div>
      </div>

      <div class="section">
        <div class="section-heading"><span class="roman">II.</span>Kết quả soi tử cung:</div>
        <div class="text-content">${diagnosis || ''}</div>
      </div>

      <div class="section">
        <div class="section-heading">Các biểu hiện khác:</div>
        <div class="text-content">${exam?.description || ''}</div>
      </div>

      <div class="section">
        <div class="section-heading">Các bước điều trị:</div>
        <div class="text-content">${exam?.treatmentSteps || ''}</div>
      </div>

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
  `;
}
