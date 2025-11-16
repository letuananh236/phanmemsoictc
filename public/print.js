export function openPrintPreview({ patient, exam, settings, images }) {
  const printWindow = window.open('', '_blank');
  const examImages = (images || []).slice(0, settings.defaultImageCount || 4);
  const imageHtml = examImages
    .map(
      (image) => `
        <div class="print-image">
          <img src="${image.dataUrl || `/${image.path}`}" alt="Ảnh soi" />
        </div>`
    )
    .join('');

  const formattedDate = formatExamDate(exam?.date);
  const doctorName = exam?.doctorName || '';
  const reason = patient?.reason || '';

  printWindow.document.write(`
    <html>
      <head>
        <title>Phiếu kết quả</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 1.5cm;
          }
          body {
            font-family: 'Times New Roman', 'Times', serif;
            font-size: 12px;
            line-height: 1.5;
            margin: 0;
            color: #111827;
          }
          .print-container {
            width: 100%;
          }
          header {
            display: flex;
            align-items: center;
            gap: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid #111;
            margin-bottom: 12px;
          }
          .header-text {
            flex: 1;
          }
          .header-text .hospital-name,
          .header-text .department-name {
            text-transform: uppercase;
            font-weight: 700;
          }
          .header-text .hospital-name {
            font-size: 16px;
          }
          .header-text .department-name {
            font-size: 14px;
          }
          .print-logo {
            width: 70px;
            height: 70px;
            object-fit: contain;
          }
          .title {
            text-align: center;
            color: #b91c1c;
            font-size: 18px;
            font-weight: 700;
            text-transform: uppercase;
            margin: 8px 0 16px;
          }
          .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
          }
          .info-table td {
            padding: 4px 8px 4px 0;
            vertical-align: top;
          }
          .info-table tr td:first-child,
          .info-table tr td:nth-child(2) {
            width: 50%;
          }
          .label {
            font-weight: 700;
          }
          .description-block,
          .result-block,
          .treatment-block,
          .advice-block {
            margin-bottom: 12px;
          }
          .text-content {
            white-space: pre-wrap;
            margin-left: 4px;
          }
          .print-images {
            display: flex;
            justify-content: center;
            gap: 12px;
            margin: 12px 0 16px;
          }
          .print-image img {
            width: 190px;
            height: 130px;
            object-fit: cover;
            border: 1px solid #d1d5db;
          }
          .section-heading {
            font-weight: 700;
            text-decoration: underline;
            margin-bottom: 4px;
          }
          .signature-block {
            margin-top: 24px;
            text-align: right;
          }
          .signature-block .doctor-title {
            font-weight: 700;
            text-align: center;
            margin-top: 8px;
          }
          .footer-note {
            border-top: 1px solid #111;
            margin-top: 24px;
            padding-top: 8px;
            font-style: italic;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <header>
            <img class="print-logo" src="./assets/${settings.logoFileName}" alt="Logo bệnh viện" />
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
              <td><span class="label">Mã số BN:</span> ${patient?.id || ''}</td>
              <td><span class="label">Số bệnh án:</span> ${exam?.examNumber || ''}</td>
            </tr>
            <tr>
              <td><span class="label">Họ và tên:</span> ${patient?.name || ''}</td>
              <td>
                <span class="label">Tuổi:</span> ${patient?.age || ''}
                &nbsp;&nbsp;
                <span class="label">Giới tính:</span> ${patient?.gender || ''}
              </td>
            </tr>
            <tr>
              <td><span class="label">Địa chỉ:</span> ${patient?.address || ''}</td>
              <td><span class="label">ĐT liên hệ:</span> ${patient?.phone || ''}</td>
            </tr>
            <tr>
              <td colspan="2"><span class="label">Lý do khám:</span> ${reason}</td>
            </tr>
          </table>

          <div class="description-block">
            <span class="label">Mô tả:</span>
            <div class="text-content">${exam?.description || ''}</div>
          </div>

          <div class="print-images">${imageHtml}</div>

          <div class="result-block">
            <span class="label">Kết quả soi tử cung:</span>
            <div class="text-content">${exam?.result || ''}</div>
          </div>

          <div class="treatment-block">
            <div class="section-heading">Các bước điều trị:</div>
            <div class="text-content">${exam?.treatmentSteps || ''}</div>
          </div>

          <div class="advice-block">
            <div class="section-heading">Lời dặn của bác sỹ:</div>
            <div class="text-content">${exam?.doctorAdvice || ''}</div>
          </div>

          <div class="signature-block">
            <div>${formattedDate}</div>
            <div class="doctor-title">Bác sỹ khám bệnh</div>
            <div style="margin-top: 48px; font-weight: 700;">${doctorName}</div>
          </div>

          <div class="footer-note">Xin hãy giữ lại giấy khám này và mang đến cho lần khám tiếp theo.</div>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
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
