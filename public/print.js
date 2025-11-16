export function openPrintPreview({ patient, exam, settings, images }) {
  const printWindow = window.open('', '_blank');
  const imageHtml = (images || [])
    .map((image) => `<div class="print-image"><img src="${image.dataUrl || `/${image.path}`}" /></div>`)
    .join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>Phiếu kết quả</title>
        <style>
          body { font-family: 'Times New Roman', serif; padding: 32px; }
          header { display: flex; gap: 16px; align-items: center; border-bottom: 2px solid #b91c1c; padding-bottom: 12px; margin-bottom: 12px; }
          h1 { color: #b91c1c; text-align: center; }
          .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .print-images { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 12px; }
          .print-image img { width: 100%; border: 1px solid #cbd5e1; }
          pre { white-space: pre-wrap; background: #fef9c3; padding: 8px; border-radius: 8px; }
        </style>
      </head>
      <body>
        <header>
          <img src="./assets/${settings.logoFileName}" alt="Logo" width="80" />
          <div>
            <strong>${settings.hospitalName}</strong><br />
            <span>${settings.departmentName}</span><br />
            <span>${settings.address}</span>
          </div>
        </header>
        <h1>KẾT QUẢ SOI CỔ TỬ CUNG</h1>
        <section class="info-grid">
          <div><strong>Mã BN:</strong> ${patient.id}</div>
          <div><strong>Số phiếu:</strong> ${exam.examNumber}</div>
          <div><strong>Họ tên:</strong> ${patient.name}</div>
          <div><strong>Ngày khám:</strong> ${exam.date}</div>
        </section>
        <h3>Mô tả</h3>
        <pre>${exam.description}</pre>
        <h3>Kết quả</h3>
        <pre>${exam.result}</pre>
        <h3>Các bước điều trị</h3>
        <pre>${exam.treatmentSteps || ''}</pre>
        <h3>Lời dặn của bác sỹ</h3>
        <pre>${exam.doctorAdvice || ''}</pre>
        <section class="print-images">${imageHtml}</section>
        <p style="text-align:right; margin-top:24px;">Ngày ..... tháng ..... năm .....<br />Bác sỹ khám bệnh</p>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}
