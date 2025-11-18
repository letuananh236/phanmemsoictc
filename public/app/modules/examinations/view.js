import { React, ReactDOM } from '../../../vendor/react-lite.js';
import { api } from '../../api/client.js';
import { openPrintPreview } from '../../../print.js';

const { createElement: h, useEffect, useMemo, useState } = React;

const DEFAULT_DESCRIPTION_TEMPLATE = 'Âm đạo:\nCổ tử cung:\nSau bôi Axit acetic:\nSau bôi Lugol:\n';

function SectionHeading({ title, subtitle, actions }) {
  return h(
    'div',
    { className: 'section-heading with-actions' },
    h('div', null, h('div', { className: 'eyebrow' }, 'Khám bệnh (F3)'), h('h2', { className: 'title-strong' }, title), subtitle ? h('p', { className: 'muted small' }, subtitle) : null),
    actions
  );
}

function Section({ title, children }) {
  return h('section', { className: 'exam-section' }, h('div', { className: 'section-header' }, title), children);
}

function Field({ label, required, children, className }) {
  return h(
    'label',
    { className: `field ${className || ''}` },
    h('span', null, label, required ? h('span', { className: 'required' }, ' *') : null),
    children
  );
}

function PatientBlock({ patient, onChange, errors }) {
  const age = patient?.age ?? (patient?.dob ? new Date().getFullYear() - new Date(patient.dob).getFullYear() : '');
  return h(
    Section,
    { title: 'Thông tin bệnh nhân' },
    h(
      'div',
      { className: 'radio-row soft' },
      h('label', null, h('input', { type: 'radio', checked: true, readOnly: true }), ' Mới khám lần đầu'),
      h('label', null, h('input', { type: 'radio', checked: false, readOnly: true }), ' Đã khám')
    ),
    h(
      'div',
      { className: 'grid three-col gap tight' },
      h(Field, { label: 'Mã số BN', className: 'short', required: true },
        h('input', { value: patient?.code || '', disabled: true })
      ),
      h(Field, { label: 'Họ tên BN', required: true, className: 'wide' },
        h('input', {
          value: patient?.fullName || '',
          oninput: (e) => onChange({ fullName: e.target.value })
        })
      ),
      h(Field, { label: 'Tuổi', required: true, className: 'short' },
        h('input', {
          type: 'number',
          min: 0,
          value: age || '',
          oninput: (e) => onChange({ age: e.target.value })
        })
      ),
      h(Field, { label: 'Giới tính' },
        h(
          'select',
          { value: patient?.gender ?? '', onchange: (e) => onChange({ gender: Number(e.target.value) || 0 }) },
          [
            h('option', { value: '' }, 'Chọn'),
            h('option', { value: '1' }, 'Nam'),
            h('option', { value: '2' }, 'Nữ'),
            h('option', { value: '3' }, 'Khác')
          ]
        )
      ),
      h(Field, { label: 'Địa chỉ', required: true, className: 'wide' },
        h('input', {
          value: patient?.address || '',
          oninput: (e) => onChange({ address: e.target.value })
        })
      ),
      h(Field, { label: 'Điện thoại LH' },
        h('input', {
          value: patient?.phone || '',
          oninput: (e) => onChange({ phone: e.target.value })
        })
      ),
      h(Field, { label: 'Lý do khám bệnh' },
        h('textarea', {
          rows: 2,
          value: patient?.reason || '',
          oninput: (e) => onChange({ reason: e.target.value })
        })
      )
    ),
    errors?.patient ? h('div', { className: 'inline-hint warning' }, errors.patient) : null
  );
}

function ExamBlock({ exam, doctors, onChange, errors, onAddDoctor }) {
  return h(
    Section,
    { title: 'Kết quả khám soi CTC' },
    h(
      'div',
      { className: 'grid three-col gap tight' },
      h(Field, { label: 'Mã số ID', className: 'short' }, h('input', { value: exam?.ticketCode || exam?.id || '', disabled: true })),
      h(Field, { label: 'Số phiếu khám', className: 'short' }, h('input', { value: exam?.ticketCode || exam?.id || '', disabled: true })),
      h(Field, { label: 'Ngày khám' },
        h('input', {
          type: 'date',
          value: exam?.examDate || '',
          onchange: (e) => onChange({ examDate: e.target.value })
        })
      )
    ),
    h(
      'div',
      { className: 'grid single' },
      h(Field, { label: 'Mô tả soi CTC', required: true },
        h('textarea', {
          rows: 5,
          value: exam?.descriptionCtc || '',
          placeholder: DEFAULT_DESCRIPTION_TEMPLATE,
          oninput: (e) => onChange({ descriptionCtc: e.target.value })
        })
      )
    ),
    h(
      'div',
      { className: 'grid single' },
      h(Field, { label: 'KQ soi tử cung', required: true, className: 'highlight' },
        h('textarea', {
          rows: 3,
          value: exam?.resultUterus || '',
          placeholder: 'Hình ảnh soi cổ tử cung hiện tại bình thường.',
          oninput: (e) => onChange({ resultUterus: e.target.value })
        })
      )
    ),
    h(
      'div',
      { className: 'grid single' },
      h(Field, { label: 'Các bước điều trị' },
        h('textarea', {
          rows: 2,
          value: exam?.treatmentSteps || '',
          oninput: (e) => onChange({ treatmentSteps: e.target.value })
        })
      )
    ),
    h(
      'div',
      { className: 'grid single' },
      h(Field, { label: 'Lời dặn của BS', className: 'highlight' },
        h('textarea', {
          rows: 2,
          value: exam?.doctorAdvice || '',
          oninput: (e) => onChange({ doctorAdvice: e.target.value })
        })
      )
    ),
    h(
      'div',
      { className: 'grid two-col gap tight' },
      h(Field, { label: 'Bác sỹ khám', required: true },
        h(
          'div',
          { className: 'inline-actions' },
          h(
            'select',
            {
              value: exam?.doctorId || '',
              onchange: (e) => onChange({ doctorId: e.target.value })
            },
            [h('option', { value: '' }, 'Chọn bác sỹ')].concat(doctors.map((d) => h('option', { value: d.id }, d.name)))
          ),
          h('button', { className: 'btn icon-only', type: 'button', onClick: onAddDoctor }, '+')
        )
      ),
      h(
        'label',
        { className: 'field checkbox-row soft' },
        h('input', {
          type: 'checkbox',
          checked: !!exam?.checkMarkOnImage,
          onchange: (e) => onChange({ checkMarkOnImage: e.target.checked })
        }),
        h('span', null, 'Đánh dấu, khoanh vùng trên hình ảnh số')
      )
    ),
    errors?.exam ? h('div', { className: 'inline-hint warning' }, errors.exam) : null
  );
}

function ImagesPanel({ images, targetCount, ticketCode }) {
  return h(
    Section,
    { title: 'Hình ảnh soi CTC' },
    h(
      'div',
      { className: 'image-grid four' },
      Array.from({ length: targetCount || 4 }).map((_, idx) => {
        const image = images[idx];
        const generatedName = ticketCode ? `${ticketCode}_${idx + 1}.PNG` : `Ảnh ${idx + 1}`;
        const label = image?.fileName || image?.path?.split('/')?.pop() || generatedName;
        return h(
          'div',
          { className: 'image-slot', key: idx },
          image?.fileUrl || image?.url || image?.path
            ? h('img', { src: image.fileUrl || image.url || `/${image.path}`, alt: label })
            : h('div', { className: 'image-placeholder' }, 'Chưa có ảnh'),
          h('div', { className: 'filename-tag' }, label)
        );
      })
    ),
    h('p', { className: 'muted small' }, 'Ảnh hiển thị theo thứ tự, tối đa 4 ảnh. Các ảnh này được gắn từ form chụp hình F4.')
  );
}

function Toolbar({ status, onSave, onSavePrint, onBack, onOpenCamera, disablePrint, disableSave }) {
  return h(
    'div',
    { className: 'toolbar-row actions-row wrap' },
    h('span', { className: 'pill soft' }, status || 'Chưa lưu'),
    h('div', { className: 'actions-row wrap' },
      h('button', { className: 'btn secondary', type: 'button', onClick: onOpenCamera }, 'Lấy hình ảnh (F4)'),
      h('button', { className: 'btn primary', type: 'button', onClick: onSave, disabled: disableSave }, 'Lưu'),
      h('button', { className: 'btn ghost', type: 'button', onClick: onSavePrint, disabled: disablePrint }, 'Lưu & In phiếu'),
      h('button', { className: 'btn secondary', type: 'button', onClick: onBack }, 'Quay lại')
    )
  );
}

function ExaminationPage({ examId, onLicenseExpired, onBackToDaily, onOpenCamera, onAddDoctor, license, refreshKey }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [exam, setExam] = useState(null);
  const [patient, setPatient] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [images, setImages] = useState([]);
  const [config, setConfig] = useState({ defaultImageCount: 4 });
  const targetCount = config?.defaultImageCount || 4;

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const [doctorList, cfg] = await Promise.all([api.listActiveDoctors(), api.getConfig()]);
        if (cancelled) return;
        setDoctors(doctorList?.doctors || doctorList || []);
        setConfig(cfg || {});
        if (!examId) {
          setLoading(false);
          return;
        }
        const detail = await api.getExamination(examId);
        if (cancelled) return;
        const descriptionCtc = detail.exam?.descriptionCtc && detail.exam.descriptionCtc.trim()
          ? detail.exam.descriptionCtc
          : DEFAULT_DESCRIPTION_TEMPLATE;
        setExam({
          ...detail.exam,
          descriptionCtc,
          resultUterus: detail.exam?.resultUterus || detail.exam?.result || '',
          examDate: detail.exam?.examDate || detail.exam?.date || ''
        });
        setPatient({
          ...(detail.patient || {}),
          code: detail.patient?.code || detail.patient?.id,
          age: detail.patient?.age
        });
        setImages(detail.images || []);
      } catch (err) {
        console.error(err);
        if (err?.status === 403 && onLicenseExpired) onLicenseExpired();
        setError(err?.message || 'Không thể tải dữ liệu phiếu khám');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => {
      cancelled = true;
    };
  }, [examId, refreshKey]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'F4') {
        e.preventDefault();
        onOpenCamera?.(examId);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [examId, onOpenCamera]);

  const canPrint = useMemo(() => !!examId && !!exam?.ticketCode && !!patient?.code, [examId, exam, patient]);

  const ageToDob = (ageValue) => {
    const ageNum = Number(ageValue);
    if (!Number.isFinite(ageNum) || ageNum <= 0) return patient?.dob || '';
    const year = new Date().getFullYear() - ageNum;
    return `${year}-01-01`;
  };

  const validate = () => {
    if (!patient?.fullName || !(patient?.age || patient?.dob)) return 'Vui lòng nhập Họ tên và Tuổi bệnh nhân.';
    if (!exam?.descriptionCtc || !exam?.resultUterus) return 'Vui lòng nhập Mô tả soi CTC và KQ soi tử cung.';
    if (!exam?.doctorId) return 'Vui lòng chọn bác sỹ khám.';
    return '';
  };

  const refreshImages = async () => {
    try {
      const imgs = await api.listVisitImages(examId);
      setImages(imgs || []);
    } catch (err) {
      setError(err?.message || 'Không tải được ảnh');
    }
  };

  const handleSave = async (alsoPrint = false) => {
    if (!examId) return;
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const payload = {
        patientId: patient?.code,
        doctorId: exam?.doctorId,
        reason: exam?.reason,
        descriptionCtc: exam?.descriptionCtc,
        resultUterus: exam?.resultUterus,
        treatmentSteps: exam?.treatmentSteps,
        doctorAdvice: exam?.doctorAdvice,
        checkMarkOnImage: !!exam?.checkMarkOnImage,
        date: exam?.examDate,
        time: exam?.examTime,
        patient: {
          id: patient?.code,
          code: patient?.code,
          fullName: patient?.fullName,
          gender: patient?.gender,
          address: patient?.address,
          phone: patient?.phone,
          dob: patient?.age ? ageToDob(patient.age) : patient?.dob,
          reason: patient?.reason
        }
      };
      const saved = await api.updateExamination(examId, payload);
      setExam((prev) => ({ ...prev, ...saved.exam, examDate: saved.exam?.examDate || saved.exam?.date }));
      setPatient((prev) => ({ ...prev, ...saved.patient }));
      setNotice('Đã lưu phiếu khám.');
      if (alsoPrint) {
        const printPayload = await api.getVisitPrintData(examId);
        openPrintPreview(printPayload);
      }
    } catch (err) {
      console.error(err);
      if (err?.status === 403 && onLicenseExpired) onLicenseExpired();
      setError(err?.message || 'Lưu phiếu khám thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (!examId) {
    return h(
      'div',
      { className: 'empty-state card' },
      h('p', null, 'Chưa chọn phiếu khám. Vui lòng chọn từ màn “Khám bệnh”.'),
      h('button', { className: 'btn primary', type: 'button', onClick: onBackToDaily }, 'Quay lại danh sách khám')
    );
  }

  return h(
    'div',
    { className: 'exam-page detail-layout' },
    loading
      ? h('div', { className: 'skeleton-panel' }, 'Đang tải dữ liệu phiếu khám…')
      : h(
          'div',
          { className: 'exam-content' },
          h(SectionHeading, {
            title: 'Khám bệnh',
            subtitle: 'Nhập thông tin bệnh nhân, mô tả soi CTC và gắn ảnh từ form camera.',
            actions: h('div', { className: 'actions-row wrap' },
              h('span', { className: 'pill soft' }, 'Khám bệnh (F3)'),
              h('button', { className: 'btn primary', type: 'button', onClick: () => onOpenCamera?.(examId) }, 'Lấy hình ảnh (F4)')
            )
          }),
          h(Toolbar, {
            status: notice || 'Đang chỉnh sửa',
            onSave: () => handleSave(false),
            onSavePrint: () => handleSave(true),
            onBack: onBackToDaily,
            onOpenCamera: () => onOpenCamera?.(examId),
            disablePrint: !canPrint || saving || license?.status === 'expired',
            disableSave: saving || license?.status === 'expired'
          }),
          h(PatientBlock, {
            patient: patient || {},
            onChange: (partial) => setPatient((prev) => ({ ...prev, ...partial })),
            errors: { patient: error && error.includes('Họ tên') ? error : '' }
          }),
          h(
            'div',
            { className: 'grid two-col gap wide' },
            h(ExamBlock, {
              exam: exam || {},
              doctors,
              onChange: (partial) => setExam((prev) => ({ ...prev, ...partial })),
              errors: { exam: error && !error.includes('Họ tên') ? error : '' },
              onAddDoctor
            }),
            h(ImagesPanel, { images, targetCount, ticketCode: exam?.ticketCode || exam?.id })
          ),
          h(
            'div',
            { className: 'actions-row wrap' },
            h('button', { className: 'btn secondary', type: 'button', onClick: refreshImages }, 'Tải lại ảnh'),
            h('span', { className: 'muted small' }, 'Ảnh được gắn từ form camera (F4).')
          )
        ),
    error && !error.includes('Họ tên') ? h('div', { className: 'inline-hint warning' }, error) : null
  );
}

export function renderExaminations(state, { navigate }) {
  const container = document.createElement('div');
  const root = ReactDOM.createRoot(container);
  root.render(
    h(ExaminationPage, {
      examId: state.selectedExamId,
      refreshKey: state.imageRefreshToken,
      license: state.license,
      onLicenseExpired: () => navigate('license'),
      onBackToDaily: () => navigate('daily'),
      onOpenCamera: (id) => navigate('camera', { selectedExamId: id }),
      onAddDoctor: () => navigate('doctors')
    })
  );
  return { node: container, cleanup: () => root.unmount() };
}
