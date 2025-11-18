import { React } from '../../../vendor/react-lite.js';
import { api } from '../../api/client.js';

const { createElement: h, useEffect, useMemo, useState } = React;

function formatExamDate(value) {
  if (!value) return '';
  const d = new Date(value);
  return `Ngày ${String(d.getDate()).padStart(2, '0')} tháng ${String(d.getMonth() + 1).padStart(2, '0')} năm ${d.getFullYear()}`;
}

function InfoRow({ label, value, wide }) {
  return h(
    'div',
    { className: `info-row ${wide ? 'full' : ''}` },
    h('span', { className: 'label' }, `${label}:`),
    h('span', null, value || '.............................................')
  );
}

function ImageRow({ images, targetCount }) {
  const slots = Array.from({ length: targetCount }).map((_, idx) => images[idx] || null);
  return h(
    'div',
    { className: 'image-row' },
    slots.map((img, idx) =>
      h(
        'div',
        { className: 'image-box', key: idx },
        img
          ? [
              h('img', { src: `/${img.path}`, alt: `Ảnh ${idx + 1}` }),
              img.note ? h('div', { className: 'caption' }, img.note) : null
            ]
          : h('span', { className: 'muted' }, `Ảnh ${idx + 1}`)
      )
    )
  );
}

function Header({ config, logoSrc }) {
  return h(
    'header',
    { className: 'sheet-header' },
    h('div', { className: 'logo-box' }, logoSrc ? h('img', { src: logoSrc, alt: 'Logo' }) : h('span', { className: 'muted' }, 'Logo')),
    h(
      'div',
      { className: 'header-meta' },
      h('div', { className: 'facility' }, config?.hospitalName || 'TÊN CƠ SỞ'),
      h('div', { className: 'department' }, config?.departmentName || 'KHOA PHÒNG'),
      h('div', { className: 'contact' }, config?.address || 'Địa chỉ: .........................'),
      h('div', { className: 'contact' }, `ĐT: ${config?.phone || '..................'}  •  Website: ${config?.website || ''}`)
    )
  );
}

function Content({ exam, patient, doctor, config }) {
  const dob = patient?.dob || patient?.DOB;
  const age = dob ? new Date().getFullYear() - new Date(dob).getFullYear() : patient?.age;
  return h(
    'section',
    null,
    h('div', { className: 'info-grid' },
      h(InfoRow, { label: 'Mã số BN', value: patient?.code || patient?.id || patient?.PatientID }),
      h(InfoRow, { label: 'Số bệnh án', value: exam?.examNumber || exam?.ExamNumber || exam?.id }),
      h(InfoRow, { label: 'Họ và tên', value: patient?.name || patient?.FullName || patient?.ho_ten }),
      h('div', { className: 'info-row' },
        h('span', { className: 'label' }, 'Tuổi:'),
        h('span', null, age ?? ''),
        h('span', { className: 'label', style: 'margin-left:10px;' }, 'Giới tính:'),
        h('span', null, patient?.gender || patient?.Gender || '')
      ),
      h(InfoRow, { label: 'Địa chỉ', value: patient?.address || patient?.Address || '', wide: true }),
      h(InfoRow, { label: 'ĐT liên hệ', value: patient?.phone || patient?.Phone || '' }),
      h(InfoRow, { label: 'Lý do khám', value: exam?.reason || exam?.ReasonForVisit || patient?.reason || '', wide: true })
    ),
    h('div', { className: 'section' },
      h('span', { className: 'label' }, 'Mô tả:'),
      h('div', { className: 'body-text' }, exam?.description || exam?.ColpoFindings || '')
    ),
    h(ImageRow, { images: exam?.images || [], targetCount: config?.defaultImageCount || config?.DefaultNumImages || 4 }),
    h('div', { className: 'section' },
      h('span', { className: 'label' }, 'Kết quả soi tử cung:'),
      h('div', { className: 'body-text' }, exam?.result || exam?.Diagnosis || '')
    ),
    h('div', { className: 'section' },
      h('span', { className: 'label', style: 'text-decoration: underline;' }, 'Các bước điều trị:'),
      h('div', { className: 'body-text' }, exam?.treatmentSteps || exam?.ClinicalNotes || '')
    ),
    h('div', { className: 'section' },
      h('span', { className: 'label', style: 'text-decoration: underline;' }, 'Lời dặn của bác sỹ:'),
      h('div', { className: 'body-text' }, exam?.doctorAdvice || exam?.Recommendation || '')
    ),
    h(
      'div',
      { className: 'signature-block' },
      h('div', null),
      h('div', { className: 'signature-area' },
        h('div', { className: 'date-line' }, formatExamDate(exam?.date || exam?.ExamDateTime)),
        h('div', null, 'Bác sỹ khám bệnh'),
        h('div', { className: 'signature-stamp' }, doctor?.SignatureImagePath ? h('img', { src: `/${doctor.SignatureImagePath}` }) : null),
        h('div', null, doctor?.name || doctor?.FullName || doctor?.doctorName || '')
      )
    ),
    h('div', { className: 'footer-note' }, 'Xin hãy giữ lại giấy khám này và mang đến cho lần khám tiếp theo.')
  );
}

export function PrintExaminationPage({ examId }) {
  const [exam, setExam] = useState(null);
  const [patient, setPatient] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [configRes, printPayload] = await Promise.all([api.getConfig(), api.getVisitPrintData(examId)]);
        if (!mounted) return;
        setConfig(configRes);
        setExam(printPayload?.visit || null);
        setPatient(printPayload?.patient || null);
        setDoctor(printPayload?.doctor ? { name: printPayload.doctor } : null);
      } catch (err) {
        console.error(err);
        setError(err?.message || 'Không tải được dữ liệu phiếu khám');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [examId]);

  const logoSrc = useMemo(() => {
    if (!config?.logoFileName && !config?.LogoPath) return '';
    return config.logoFileName ? `/assets/${config.logoFileName}` : `/${config.LogoPath}`;
  }, [config]);

  if (!examId) {
    return h('div', { className: 'error-box' }, 'Thiếu mã phiếu để in.');
  }

  if (loading) {
    return h('div', { className: 'loading' }, 'Đang tải phiếu khám…');
  }

  if (error) {
    return h('div', { className: 'error-box' }, error);
  }

  return h(
    'div',
    { className: 'print-container' },
    h(
      'div',
      { className: 'print-actions' },
      h('button', { className: 'secondary', type: 'button', onclick: () => window.history.back() }, 'Đóng'),
      h('button', { type: 'button', onclick: () => window.print() }, 'In phiếu')
    ),
    h(
      'div',
      { className: 'print-sheet' },
      h(Header, { config, logoSrc }),
      h('div', { className: 'divider' }),
      h('div', { className: 'print-title' }, 'PHIẾU SOI CỔ TỬ CUNG'),
      h(Content, { exam, patient, doctor, config })
    )
  );
}
