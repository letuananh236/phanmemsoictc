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
        <title>Xem trước phiếu khám</title>
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
          body {
            margin: 0;
            background: #e5e7eb;
            padding: 16px;
          }
          .print-wrapper {
            width: 100%;
            margin: 0 auto;
          }
          .print-actions {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-bottom: 12px;
            position: sticky;
            top: 0;
            padding: 8px 0;
            background: #e5e7eb;
            z-index: 2;
          }
          .print-actions button {
            border: 1px solid #cbd5e1;
            background: #0f5ba7;
            color: #fff;
            padding: 8px 14px;
            border-radius: 6px;
            font-weight: 700;
            cursor: pointer;
          }
          .print-actions button.secondary {
            background: #6b7280;
          }
          .print-sheet {
            width: 100%;
            max-width: 210mm;
            min-height: 297mm;
            margin: 0 auto;
            background: #fff;
            padding: 1cm 1.5cm;
            box-shadow: 0 18px 45px rgb(0 0 0 / 0.18);
            font-size: 16px;
          }
          header {
            display: grid;
            grid-template-columns: 88px 1fr;
            gap: 16px;
            align-items: center;
            padding-bottom: 12px;
            border-bottom: 1px solid #0f172a;
            margin-bottom: 16px;
          }
          .print-logo {
            width: 80px;
            height: 80px;
            object-fit: contain;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
            padding: 6px;
          }
          .header-text {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .header-text .hospital-name,
          .header-text .department-name {
            text-transform: uppercase;
            font-weight: 700;
          }
          .header-text .hospital-name {
            font-size: 21px;
          }
          .header-text .department-name {
            font-size: 18px;
          }
          .title {
            text-align: center;
            color: #b91c1c;
            font-size: 24px;
            font-weight: 800;
            text-transform: uppercase;
            margin: 6px 0 20px;
            letter-spacing: 0.3px;
          }
          .info-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0 6px;
            margin-bottom: 12px;
            font-size: 15px;
          }
          .info-table td {
            padding: 2px 10px 2px 0;
            vertical-align: top;
          }
          .info-table tr td:first-child,
          .info-table tr td:nth-child(2) {
            width: 50%;
          }
          .label {
            font-weight: 700;
          }
          .inline-label {
            font-weight: 700;
            margin-left: 14px;
          }
          .print-body {
            display: grid;
            grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
            gap: 16px;
            align-items: start;
            margin-top: 10px;
          }
          .content-sections > div {
            margin-bottom: 14px;
          }
          .section-heading {
            font-weight: 700;
            margin-bottom: 4px;
            text-decoration: underline;
          }
          .text-content {
            white-space: pre-wrap;
            margin-left: 4px;
            min-height: 40px;
          }
          .image-panel-title {
            font-weight: 700;
            margin-bottom: 8px;
          }
          .print-images {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            margin-top: 6px;
          }
          .print-image {
            width: 100%;
            aspect-ratio: 4 / 3;
            border: 1px solid #d1d5db;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
            overflow: hidden;
          }
          .print-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .print-image.placeholder {
            border-style: dashed;
            color: #94a3b8;
            font-style: italic;
            font-size: 13px;
          }
          .signature-block {
            margin-top: 10px;
            text-align: right;
          }
          .signature-block .doctor-title {
            font-weight: 700;
            text-align: center;
            margin-top: 10px;
          }
          .footer-note {
            border-top: 1px solid #111827;
            margin-top: 22px;
            padding-top: 10px;
            font-style: italic;
            font-size: 14px;
          }
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
            <button class="secondary" onclick="window.close()">Đóng xem trước</button>
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
  const diagnosis = exam?.diagnosis || exam?.result || reason;

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

      <table class="info-table">
        <tr>
          <td colspan="2"><span class="label">Họ và tên:</span> ${patient?.name || ''} <span class="inline-label">Mã BN:</span> ${patientCode}</td>
        </tr>
        <tr>
          <td><span class="label">Tuổi:</span> ${patient?.age || ''} &nbsp;&nbsp; <span class="label">Giới tính:</span> ${patient?.gender || ''}</td>
          <td><span class="label">Mã số BH:</span> ${insuranceNumber}</td>
        </tr>
        <tr>
          <td><span class="label">Địa chỉ:</span> ${patient?.address || ''}</td>
          <td><span class="label">ĐT liên hệ:</span> ${patient?.phone || ''}</td>
        </tr>
        <tr>
          <td colspan="2"><span class="label">Bệnh:</span> ${diagnosis || ''}</td>
        </tr>
        <tr>
          <td colspan="2"><span class="label">Trực nhật:</span> ${doctorName}</td>
        </tr>
      </table>

      <div class="print-body">
        <div class="content-sections">
          <div class="description-block">
            <div class="section-heading">Mô tả</div>
            <div class="text-content">${exam?.description || ''}</div>
          </div>
          <div class="result-block">
            <div class="section-heading">Kết quả soi cổ tử cung</div>
            <div class="text-content">${exam?.result || ''}</div>
          </div>
          <div class="treatment-block">
            <div class="section-heading">Các bước điều trị</div>
            <div class="text-content">${exam?.treatmentSteps || ''}</div>
          </div>
          <div class="advice-block">
            <div class="section-heading">Lời dặn của bác sỹ</div>
            <div class="text-content">${exam?.doctorAdvice || ''}</div>
          </div>
        </div>

        <div class="image-panel">
          <div class="image-panel-title">Kết quả soi cổ tử cung</div>
          <div class="print-images">${imageRow}</div>
        </div>
      </div>

      <div class="signature-block">
        <div>${formattedDate}</div>
        <div class="doctor-title">Bác sỹ khám bệnh</div>
        <div style="margin-top: 48px; font-weight: 700;">${doctorName}</div>
      </div>

      <div class="footer-note">Xin hãy giữ lại giấy khám này và mang đến cho lần khám tiếp theo.</div>
    </div>
  `;
}
