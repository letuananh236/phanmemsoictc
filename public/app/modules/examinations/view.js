import { React, ReactDOM } from '../../../vendor/react-lite.js';
import { api } from '../../api/client.js';
import { openPrintPreview } from '../../../print.js';

const { createElement: h, useEffect, useMemo, useState } = React;

function InfoRow({ label, value }) {
  return h(
    'div',
    { className: 'info-row' },
    h('span', { className: 'info-label' }, label),
    h('span', { className: 'info-value' }, value || '—')
  );
}

function ExaminationHeaderInfo({ patient, exam, doctors, onChange, disabled }) {
  return h(
    'section',
    { className: 'panel exam-section left' },
    h(
      'div',
      { className: 'panel-header spaced' },
      h(
        'div',
        null,
        h('p', { className: 'eyebrow' }, 'BỆNH NHÂN'),
        h('h2', { className: 'title-strong' }, patient?.name || 'Chưa chọn bệnh nhân')
      ),
      h(
        'div',
        { className: 'badge-stack' },
        h('span', { className: 'pill soft' }, `Mã BN: ${patient?.id || '---'}`),
        h('span', { className: 'pill' }, `Mã phiếu: ${exam?.id || '---'}`)
      )
    ),
    h(
      'div',
      { className: 'stacked' },
      h(
        'div',
        { className: 'grid two-cols gap' },
        h(InfoRow, { label: 'Năm sinh', value: patient?.dob ? new Date(patient.dob).getFullYear() : '' }),
        h(InfoRow, {
          label: 'Tuổi',
          value: patient?.age ?? (patient?.dob ? new Date().getFullYear() - new Date(patient.dob).getFullYear() : '')
        }),
        h(InfoRow, { label: 'Giới tính', value: patient?.gender || '' }),
        h(InfoRow, { label: 'SĐT', value: patient?.phone || '' })
      ),
      h(InfoRow, { label: 'Địa chỉ', value: patient?.address || '' }),
      h(InfoRow, { label: 'Lý do khám', value: exam?.reason || patient?.reason || '' })
    ),
    h('div', { className: 'divider subtle' }),
    h(
      'div',
      { className: 'panel-header tight' },
      h('div', null, h('p', { className: 'eyebrow' }, 'THÔNG TIN KHÁM'), h('h3', { className: 'title-medium' }, 'Chuẩn bị phiếu khám'))
    ),
    h(
      'div',
      { className: 'form-grid single' },
      h(
        'label',
        { className: 'field' },
        h('span', null, 'Bác sĩ phụ trách'),
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
      ),
      h(
        'label',
        { className: 'field' },
        h('span', null, 'Lý do khám'),
        h('input', {
          type: 'text',
          value: exam?.reason || '',
          disabled,
          oninput: (e) => onChange({ reason: e.target.value })
        })
      ),
      h(
        'label',
        { className: 'field' },
        h('span', null, 'Tiền sử sản/phụ khoa'),
        h('textarea', {
          rows: 2,
          value: exam?.gyneHistory || '',
          disabled,
          oninput: (e) => onChange({ gyneHistory: e.target.value })
        })
      ),
      h(
        'label',
        { className: 'field' },
        h('span', null, 'Ghi chú khác'),
        h('textarea', {
          rows: 2,
          value: exam?.obstetricHistory || '',
          disabled,
          oninput: (e) => onChange({ obstetricHistory: e.target.value })
        })
      )
    )
  );
}

function ImageCard({ image, index, onClick }) {
  return h(
    'button',
    { className: 'image-card thumb-card', type: 'button', onclick: () => onClick(image, index) },
    h('div', { className: 'image-order' }, index + 1),
    image?.path
      ? h('img', { src: image.url || `/${image.path}`, alt: `Ảnh ${index + 1}`, className: 'image-thumb real' })
      : h('div', { className: 'image-thumb placeholder' }, 'Chưa có ảnh'),
    h('div', { className: 'image-label' }, image?.note || `Ảnh ${index + 1}`)
  );
}

function ExaminationImagesPanel({ examId, images, targetCount, onOpenCamera, onRefresh }) {
  return h(
    'section',
    { className: 'panel exam-section middle' },
    h(
      'div',
      { className: 'panel-header spaced' },
      h('div', null, h('p', { className: 'eyebrow' }, 'HÌNH ẢNH SOI'), h('h2', { className: 'title-medium' }, 'Lấy hình ảnh')),
      h(
        'div',
        { className: 'camera-actions' },
        h(
          'button',
          { className: 'btn secondary', type: 'button', onClick: onRefresh },
          'Tải lại ảnh'
        ),
        h(
          'button',
          { className: 'btn primary large', type: 'button', onClick: onOpenCamera, disabled: !examId },
          'Lấy hình ảnh (F4)'
        )
      )
    ),
    h(
      'div',
      { className: 'image-grid roomy' },
      Array.from({ length: targetCount || 4 }).map((_, idx) =>
        h(ImageCard, { key: idx, image: images[idx], index: idx, onClick: (img) => img?.url && window.open(img.url, '_blank') })
      )
    ),
    h('p', { className: 'inline-hint' }, 'Mở form “Lấy hình ảnh” (F4) để chụp và chọn tối đa 4 ảnh cho phiếu khám.')
  );
}

function ExaminationResultPanel({
  exam,
  templates,
  onApplyTemplate,
  onChange,
  onSave,
  onPrint,
  saving,
  canPrint,
  licenseStatus
}) {
  return h(
    'section',
    { className: 'panel exam-section right' },
    h(
      'div',
      { className: 'panel-header spaced' },
      h('div', null, h('p', { className: 'eyebrow' }, 'MẪU & KẾT QUẢ'), h('h2', { className: 'title-medium' }, 'Kết quả & in phiếu')),
      h('span', { className: `pill ${canPrint ? '' : 'soft'}` }, exam?.status || 'Chưa lưu')
    ),
    h('div', { className: 'templates-box' },
      h('div', { className: 'templates-header' }, 'Mẫu kết quả mặc định'),
      h(
        'ul',
        { className: 'templates-list' },
        templates.length
          ? templates.map((t) =>
              h(
                'li',
                { key: t.id },
                h(
                  'button',
                  { className: 'template-item', type: 'button', onClick: () => onApplyTemplate(t) },
                  h('div', { className: 'template-title' }, t.name),
                  h('p', { className: 'template-desc' }, t.diagnosisText || t.recommendationText || '—')
                )
              )
            )
          : h('li', { className: 'muted' }, 'Chưa có mẫu nào')
      )
    ),
    h('label', { className: 'field' }, h('span', null, 'Mô tả hình ảnh soi cổ tử cung'),
      h('textarea', {
        rows: 3,
        value: exam?.description || '',
        oninput: (e) => onChange({ description: e.target.value }),
        disabled: licenseStatus === 'expired'
      })
    ),
    h('label', { className: 'field' }, h('span', null, 'Chẩn đoán'),
      h('textarea', {
        rows: 2,
        value: exam?.result || '',
        oninput: (e) => onChange({ result: e.target.value }),
        disabled: licenseStatus === 'expired'
      })
    ),
    h('label', { className: 'field' }, h('span', null, 'Đề nghị / Hướng xử trí'),
      h('textarea', {
        rows: 2,
        value: exam?.doctorAdvice || '',
        oninput: (e) => onChange({ doctorAdvice: e.target.value }),
        disabled: licenseStatus === 'expired'
      })
    ),
    h(
      'div',
      { className: 'actions-column gap' },
      h(
        'button',
        {
          className: 'btn primary large',
          type: 'button',
          onClick: onSave,
          disabled: saving || licenseStatus === 'expired'
        },
        saving ? 'Đang lưu…' : 'LƯU PHIẾU KHÁM'
      ),
      h(
        'button',
        {
          className: 'btn secondary large',
          type: 'button',
          onClick: onPrint,
          disabled: !canPrint || licenseStatus === 'expired'
        },
        'IN PHIẾU A4'
      ),
      licenseStatus === 'expired' && h('p', { className: 'inline-hint warning' }, 'License hết hạn – không thể lưu hoặc in.')
    )
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
        images
      };
      const saved = await api.updateExamination(examId, payload);
      setExam((prev) => ({ ...prev, ...saved }));
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
    { className: 'exam-page' },
    loading
      ? h('div', { className: 'skeleton-panel' }, 'Đang tải dữ liệu phiếu khám…')
      : h(
          'div',
          { className: 'exam-columns' },
          h(ExaminationHeaderInfo, {
            patient,
            exam,
            doctors,
            onChange: updateExam,
            disabled: license?.status === 'expired'
          }),
          h(ExaminationImagesPanel, {
            examId,
            images,
            targetCount,
            onOpenCamera: () => onOpenCamera?.(examId),
            onRefresh: () => api
              .listVisitImages(examId)
              .then((imgs) => setImages(imgs || images))
              .catch((err) => setError(err?.message || 'Không tải được ảnh'))
          }),
          h(ExaminationResultPanel, {
            exam,
            templates,
            onApplyTemplate: handleApplyTemplate,
            onChange: updateExam,
            onSave: handleSave,
            onPrint: handlePrint,
            saving,
            canPrint,
            licenseStatus: license?.status
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
