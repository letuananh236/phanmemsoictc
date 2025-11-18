import { React, ReactDOM } from '../../../vendor/react-lite.js';
import { api } from '../../api/client.js';
import { openPrintPreview } from '../../../print.js';

const { createElement: h, useEffect, useMemo, useState } = React;

function Section({ title, children }) {
  return h(
    'section',
    { className: 'classic-section' },
    h('div', { className: 'section-title' }, title),
    children
  );
}

function FieldRow({ label, children, className }) {
  return h(
    'label',
    { className: `field inline ${className || ''}` },
    h('span', null, label),
    children
  );
}

function PatientInfo({ patient, exam, onChangeReason, disabled }) {
  const age = patient?.dob ? new Date().getFullYear() - new Date(patient.dob).getFullYear() : patient?.age || '';

  return h(
    Section,
    { title: 'Thông tin bệnh nhân' },
    h(
      'div',
      { className: 'radio-row' },
      h('label', null, h('input', { type: 'radio', name: 'visitType', checked: true, readOnly: true }), ' Mới khám lần đầu'),
      h('label', null, h('input', { type: 'radio', name: 'visitType', checked: false, readOnly: true }), ' Đã khám')
    ),
    h(
      'div',
      { className: 'grid-inline two' },
      h(FieldRow, { label: 'Mã số BN' }, h('input', { value: patient?.id || '', disabled: true, className: 'short-input' })),
      h(FieldRow, { label: 'Họ tên BN' }, h('input', { value: patient?.name || '', disabled: true }))
    ),
    h(
      'div',
      { className: 'grid-inline two' },
      h(FieldRow, { label: 'Tuổi' }, h('input', { value: age || '', disabled: true, className: 'short-input' })),
      h(FieldRow, { label: 'Giới tính' }, h('input', { value: patient?.gender || '', disabled: true }))
    ),
    h(
      'div',
      { className: 'grid-inline two' },
      h(FieldRow, { label: 'Địa chỉ' }, h('input', { value: patient?.address || '', disabled: true })),
      h(FieldRow, { label: 'Điện thoại LH' }, h('input', { value: patient?.phone || '', disabled: true }))
    ),
    h(
      'div',
      { className: 'grid-inline single' },
      h(FieldRow, { label: 'Lý do KB' },
        h('input', {
          value: exam?.reason || patient?.reason || '',
          disabled,
          oninput: (e) => onChangeReason?.(e.target.value)
        })
      )
    )
  );
}

function ExamDetails({ exam, doctors, onChange, disabled, config }) {
  return h(
    Section,
    { title: 'Kết quả khám' },
    h(
      'div',
      { className: 'grid-inline two' },
      h(FieldRow, { label: 'Mã số ID' }, h('input', { value: exam?.id || '', disabled: true, className: 'short-input' })),
      h(FieldRow, { label: 'Số phiếu khám' }, h('input', { value: exam?.id || '', disabled: true }))
    ),
    h(
      'div',
      { className: 'grid-inline two' },
      h(FieldRow, { label: 'Ngày khám' }, h('input', { type: 'date', value: exam?.date || '', disabled })),
      h(FieldRow, { label: 'Bác sỹ khám' },
        h(
          'select',
          {
            value: exam?.doctorId || '',
            disabled,
            onchange: (e) =>
              onChange({ doctorId: e.target.value, doctorName: doctors.find((d) => d.id === e.target.value)?.name || '' })
          },
          [h('option', { value: '' }, 'Chọn bác sĩ')].concat(doctors.map((d) => h('option', { value: d.id }, d.name)))
        )
      )
    ),
    h(
      'div',
      { className: 'grid-inline single' },
      h(FieldRow, { label: 'Mô tả soi CTC' },
        h('textarea', {
          rows: 4,
          value: exam?.description || config?.defaultDescription || '',
          oninput: (e) => onChange({ description: e.target.value }),
          disabled
        })
      )
    ),
    h(
      'div',
      { className: 'grid-inline single' },
      h(FieldRow, { label: 'KQ soi tử cung' },
        h('textarea', {
          rows: 2,
          value: exam?.result || '',
          oninput: (e) => onChange({ result: e.target.value }),
          disabled
        })
      )
    ),
    h(
      'div',
      { className: 'grid-inline single' },
      h(FieldRow, { label: 'Các bước DT' },
        h('textarea', {
          rows: 2,
          value: exam?.treatmentSteps || '',
          oninput: (e) => onChange({ treatmentSteps: e.target.value }),
          disabled
        })
      )
    ),
    h(
      'div',
      { className: 'grid-inline single' },
      h(FieldRow, { label: 'Lời dặn của BS' },
        h('textarea', {
          rows: 2,
          value: exam?.doctorAdvice || '',
          oninput: (e) => onChange({ doctorAdvice: e.target.value }),
          disabled
        })
      )
    )
  );
}

function CameraLauncher({ onOpenCamera, onRefresh, disabled }) {
  return h(
    'div',
    { className: 'camera-launcher' },
    h('div', { className: 'section-title subtle' }, 'Form chụp hình từ camera'),
    h('p', { className: 'muted small' }, 'Bấm F4 hoặc nút dưới để mở form camera, chụp và chọn tối đa 4 ảnh.'),
    h('div', { className: 'actions-row wrap' },
      h('button', { className: 'btn secondary', type: 'button', onClick: onRefresh, disabled }, 'Tải lại ảnh'),
      h('button', { className: 'btn primary', type: 'button', onClick: onOpenCamera, disabled }, 'Mở form chụp hình (F4)')
    )
  );
}

function ImageSlot({ image, index }) {
  const name = image?.file_path || image?.path || '';
  const label = name ? name.split('/').pop() : `HA000000_${index + 1}.PNG`;
  return h(
    'div',
    { className: 'image-slot' },
    image?.path || image?.url
      ? h('img', { src: image.url || `/${image.path || image.file_path}`, alt: label })
      : h('div', { className: 'image-placeholder' }, `Ảnh ${index + 1}`),
    h('div', { className: 'filename-tag' }, label)
  );
}

function ImagesPanel({ examId, images, targetCount, onOpenCamera, onRefresh }) {
  return h(
    Section,
    { title: 'Hình ảnh soi CTC' },
    h(CameraLauncher, { onOpenCamera: () => onOpenCamera?.(examId), onRefresh: onRefresh, disabled: !examId }),
    h(
      'div',
      { className: 'classic-image-grid' },
      Array.from({ length: targetCount || 4 }).map((_, idx) => h(ImageSlot, { key: idx, image: images[idx], index: idx }))
    ),
    h('p', { className: 'muted small' }, 'Ảnh hiển thị theo thứ tự, tối đa 4 ảnh. Các ảnh này sẽ được in trên phiếu A4.')
  );
}

function ExaminationPage({ examId, onLicenseExpired, onBackToDaily, onOpenCamera, license, refreshKey }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [exam, setExam] = useState(null);
  const [patient, setPatient] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [images, setImages] = useState([]);
  const [config, setConfig] = useState({ defaultImageCount: 4 });
  const [status, setStatus] = useState('Chưa lưu');

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const [doctorList, templateList, cfg] = await Promise.all([
          api.listDoctors(),
          api.listResultTemplates(),
          api.getConfig()
        ]);
        if (cancelled) return;
        setDoctors(doctorList);
        setTemplates(templateList);
        setConfig(cfg || {});

        if (!examId) {
          setLoading(false);
          return;
        }

        const loadedExam = await api.getExamination(examId);
        if (cancelled) return;
        setExam({
          ...loadedExam,
          doctorAdvice: loadedExam?.doctorAdvice || loadedExam?.recommendation,
          gyneHistory: loadedExam?.gyneHistory,
          obstetricHistory: loadedExam?.obstetricHistory
        });
        setStatus(loadedExam?.status || 'Chưa lưu');
        const imgs = await api.listVisitImages(examId);
        if (!cancelled) setImages(imgs || loadedExam?.images || []);
        if (loadedExam?.patientId) {
          const p = await api.getPatient(loadedExam.patientId);
          if (!cancelled) setPatient(p);
        }
      } catch (err) {
        console.error(err);
        if (err?.status === 403 && onLicenseExpired) onLicenseExpired();
        setError(err?.message || 'Không thể tải dữ liệu');
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

  const targetCount = config?.defaultImageCount || 4;

  const canPrint = useMemo(() => !!examId && !!exam?.id && !!patient?.id, [examId, exam, patient]);

  async function handleSave() {
    if (!examId) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        patientId: exam?.patientId,
        doctorId: exam?.doctorId,
        doctorName: doctors.find((d) => d.id === exam?.doctorId)?.name,
        reason: exam?.reason,
        gyneHistory: exam?.gyneHistory,
        obstetricHistory: exam?.obstetricHistory,
        description: exam?.description,
        result: exam?.result,
        doctorAdvice: exam?.doctorAdvice,
        templateVersion: exam?.templateVersion,
        treatmentSteps: exam?.treatmentSteps,
        images
      };
      const saved = await api.updateExamination(examId, payload);
      setExam((prev) => ({ ...prev, ...saved }));
      setStatus(saved?.status || 'Đã lưu');
    } catch (err) {
      console.error(err);
      if (err?.status === 403 && onLicenseExpired) onLicenseExpired();
      setError(err?.message || 'Lưu phiếu khám thất bại');
    } finally {
      setSaving(false);
    }
  }

  function handleApplyTemplate(tpl) {
    setExam((prev) => ({
      ...prev,
      templateVersion: tpl?.id,
      result: tpl?.diagnosisText || prev?.result || '',
      doctorAdvice: tpl?.recommendationText || prev?.doctorAdvice || ''
    }));
  }

  function handlePrint() {
    if (!canPrint) return;
    openPrintPreview({ patient, exam, settings: config, images });
  }

  function updateExam(partial) {
    setExam((prev) => ({ ...prev, ...partial }));
  }

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
    { className: 'exam-page classic-layout' },
    loading
      ? h('div', { className: 'skeleton-panel' }, 'Đang tải dữ liệu phiếu khám…')
      : h(
          'div',
          { className: 'classic-grid' },
          h(
            'div',
            { className: 'classic-left' },
            h(
              'div',
              { className: 'toolbar-row' },
              h(
                'div',
                { className: 'toolbar-title' },
                h('div', { className: 'eyebrow' }, 'PHIẾU KHÁM'),
                h('div', { className: 'title-strong' }, patient?.name || 'Chưa chọn bệnh nhân')
              ),
              h(
                'div',
                { className: 'actions-row wrap' },
                h('span', { className: 'pill soft' }, status || 'Chưa lưu'),
                h('button', { className: 'btn secondary', type: 'button', onClick: () => onOpenCamera?.(examId), disabled: !examId }, 'Lấy hình ảnh (F4)'),
                h('button', { className: 'btn primary', type: 'button', onClick: handleSave, disabled: saving || license?.status === 'expired' }, saving ? 'Đang lưu…' : 'Lưu'),
                h('button', { className: 'btn ghost', type: 'button', onClick: handlePrint, disabled: !canPrint || license?.status === 'expired' }, 'In phiếu')
              )
            ),
            h(PatientInfo, { patient, exam, onChangeReason: (reason) => updateExam({ reason }), disabled: license?.status === 'expired' }),
            h(ExamDetails, { exam, doctors, onChange: updateExam, disabled: license?.status === 'expired', config }),
            h(
              'div',
              { className: 'templates-box compact' },
              h('div', { className: 'templates-header' }, 'Mẫu kết quả mặc định'),
              h(
                'ul',
                { className: 'templates-list slim' },
                templates.length
                  ? templates.map((t) =>
                      h(
                        'li',
                        { key: t.id },
                        h(
                          'button',
                          { className: 'template-item', type: 'button', onClick: () => handleApplyTemplate(t) },
                          h('div', { className: 'template-title' }, t.name),
                          h('p', { className: 'template-desc' }, t.diagnosisText || t.recommendationText || '—')
                        )
                      )
                    )
                  : h('li', { className: 'muted' }, 'Chưa có mẫu nào')
              )
            )
          ),
          h(ImagesPanel, {
            examId,
            images,
            targetCount,
            onOpenCamera,
            onRefresh: () =>
              api
                .listVisitImages(examId)
                .then((imgs) => setImages(imgs || images))
                .catch((err) => setError(err?.message || 'Không tải được ảnh'))
          })
        ),
    error && h('div', { className: 'inline-hint warning' }, error)
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
      onOpenCamera: (id) => navigate('camera', { selectedExamId: id })
    })
  );
  return { node: container, cleanup: () => root.unmount() };
}
