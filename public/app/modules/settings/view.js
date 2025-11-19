import { React, ReactDOM } from '../../../vendor/react-lite.js';
import { api } from '../../api/client.js';
import { applyTheme } from '../../theme.js';

const { createElement: h, useEffect, useMemo, useState } = React;

function Field({ label, children, note, className }) {
  return h(
    'label',
    { className: `field ${className || ''}`.trim() },
    h('span', null, label),
    children,
    note ? h('small', { className: 'muted' }, note) : null
  );
}

function Tabs({ active, onChange }) {
  const tabs = [
    { id: 'facility', label: 'Thông tin cơ sở' },
    { id: 'print', label: 'In phiếu & logo' },
    { id: 'ui', label: 'Giao diện' },
    { id: 'db', label: 'Cơ sở dữ liệu' }
  ];
  return h(
    'div',
    { className: 'tabs' },
    tabs.map((tab) =>
      h(
        'button',
        {
          key: tab.id,
          className: `tab ${active === tab.id ? 'active' : ''}`,
          type: 'button',
          onclick: () => onChange(tab.id)
        },
        tab.label
      )
    )
  );
}

function FacilityTab({ config, onChange, onSave, saving }) {
  return h(
    'div',
    { className: 'tab-panel active settings-grid two-cols' },
    Field({
      label: 'Tên cơ sở',
      children: h('input', {
        type: 'text',
        value: config.hospitalName || '',
        placeholder: 'Phòng khám, bệnh viện...',
        oninput: (e) => onChange('hospitalName', e.target.value)
      })
    }),
    Field({
      label: 'Địa chỉ',
      children: h('input', {
        type: 'text',
        value: config.address || '',
        oninput: (e) => onChange('address', e.target.value)
      })
    }),
    Field({
      label: 'Điện thoại',
      children: h('input', {
        type: 'tel',
        value: config.phone || '',
        oninput: (e) => onChange('phone', e.target.value)
      })
    }),
    Field({
      label: 'Ghi chú',
      children: h('textarea', {
        rows: 3,
        value: config.facilityNote || '',
        oninput: (e) => onChange('facilityNote', e.target.value),
        placeholder: 'Thông tin bổ sung hiển thị ở đầu phiếu (nếu có)'
      })
    }),
    h(
      'div',
      { className: 'form-actions spanning' },
      h(
        'button',
        { className: 'btn primary', type: 'button', onclick: onSave, disabled: saving },
        saving ? 'Đang lưu...' : 'LƯU THÔNG TIN CƠ SỞ'
      )
    )
  );
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function PrintTab({ config, onChange, onSave, onUploadLogo, saving, uploading }) {
  const logoSrc = config.logoFileName ? `/assets/${config.logoFileName}` : '/assets/logo-default.svg';
  return h(
    'div',
    { className: 'tab-panel active' },
    h(
      'div',
      { className: 'form-grid two-cols compact' },
      h(
        'div',
        { className: 'field wide' },
        h('span', null, 'Logo phiếu khám'),
        h(
          'div',
          { className: 'logo-upload' },
          h('div', { className: 'logo-preview solid' }, h('img', { src: logoSrc, alt: 'Logo hiện tại', onerror: (e) => (e.target.style.display = 'none') })),
          h('div', { className: 'upload-stack' },
            h('input', {
              type: 'file',
              accept: 'image/*',
              onchange: async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const dataUrl = await readFileAsDataUrl(file);
                  onUploadLogo(file.name, dataUrl);
                }
              }
            }),
            h('p', { className: 'muted' }, 'Chọn hình PNG/JPG/SVG từ máy để in lên phiếu.')
          )
        )
      ),
      Field({
        label: 'Số ảnh trên phiếu',
        children: h(
          'select',
          {
            value: config.defaultImageCount || 4,
            onchange: (e) => onChange('defaultImageCount', Number.parseInt(e.target.value, 10))
          },
          h('option', { value: 2 }, '2 ảnh'),
          h('option', { value: 3 }, '3 ảnh'),
          h('option', { value: 4 }, '4 ảnh')
        )
      }),
      Field({
        label: 'Mẫu phiếu (TemplateVersion)',
        children: h('input', {
          type: 'text',
          value: config.templateVersion || '',
          placeholder: 'VD: v1',
          oninput: (e) => onChange('templateVersion', e.target.value)
        }),
        note: 'Dùng để chọn layout in trong tương lai.'
      })
    ),
    h(
      'div',
      { className: 'print-preview-mini' },
      h('div', { className: 'preview-header' },
        h('div', { className: 'preview-logo' }),
        h('div', { className: 'preview-lines' },
          h('div', { className: 'line strong' }, 'TÊN CƠ SỞ'),
          h('div', { className: 'line strong' }, 'TÊN KHOA'),
          h('div', { className: 'line' }, 'Địa chỉ / Điện thoại'),
          h('div', { className: 'line' }, 'Website / Email')
        )
      ),
      h('div', { className: 'preview-title' }, 'KẾT QUẢ SOI CỔ TỬ CUNG'),
      h(
        'div',
        { className: `preview-images count-${config.defaultImageCount || 4}` },
        Array.from({ length: config.defaultImageCount || 4 }).map((_, idx) =>
          h('div', { key: idx, className: 'preview-thumb' }, idx + 1)
        )
      )
    ),
    h(
      'div',
      { className: 'form-actions' },
      h(
        'button',
        { className: 'btn primary', type: 'button', onclick: onSave, disabled: saving || uploading },
        saving || uploading ? 'Đang lưu...' : 'LƯU THIẾT LẬP IN'
      )
    )
  );
}

function InterfaceTab({ config, onChange, onApply, saving }) {
  return h(
    'div',
    { className: 'tab-panel active' },
    h(
      'div',
      { className: 'form-grid two-cols compact' },
      Field({
        label: 'Cỡ chữ toàn hệ thống',
        children: h(
          'div',
          { className: 'segmented' },
          ['small', 'medium', 'large'].map((size) =>
            h(
              'button',
              {
                key: size,
                type: 'button',
                className: `segment ${config.uiFontSize === size || (!config.uiFontSize && size === 'medium') ? 'active' : ''}`,
                onclick: () => onChange('uiFontSize', size)
              },
              size === 'small' ? 'Nhỏ' : size === 'large' ? 'Lớn' : 'Vừa'
            )
          )
        )
      }),
      Field({
        label: 'Tương phản cao',
        children: h(
          'label',
          { className: 'switch-row' },
          h('input', {
            type: 'checkbox',
            checked: !!config.uiHighContrastMode,
            onchange: (e) => onChange('uiHighContrastMode', e.target.checked)
          }),
          h('span', null, 'Bật chế độ tương phản cao cho bác sĩ lớn tuổi')
        )
      })
    ),
    h(
      'div',
      { className: 'form-actions' },
      h(
        'button',
        { className: 'btn primary', type: 'button', onclick: onApply, disabled: saving },
        saving ? 'Đang áp dụng...' : 'ÁP DỤNG GIAO DIỆN'
      )
    )
  );
}

function DatabaseTab({ config }) {
  const dbDir = useMemo(() => {
    const path = config.databasePath || '';
    if (!path) return '';
    return path.replace(/app\.db$/, '');
  }, [config.databasePath]);

  const openFolder = () => {
    if (!dbDir) return;
    try {
      window.open(`file://${dbDir}`);
    } catch (err) {
      console.warn('Không thể mở thư mục dữ liệu', err);
    }
  };

  return h(
    'div',
    { className: 'tab-panel active' },
    h('p', { className: 'muted' }, 'Đường dẫn DB SQLite (chỉ đọc):'),
    h('div', { className: 'db-path' }, config.databasePath || 'Data/Database/app.db'),
    h('div', { className: 'warning-box' }, 'Không tự ý sửa/xóa file DB hoặc thư mục Data/Images.'),
    h(
      'div',
      { className: 'actions-row' },
      h('button', { className: 'btn', type: 'button', onclick: openFolder, disabled: !dbDir }, 'MỞ THƯ MỤC DATA'),
      h('span', { className: 'muted' }, `Phiên bản DB: ${config.dbVersion || 'chưa cung cấp'}`)
    )
  );
}

function SettingsPage({ onLicenseExpired }) {
  const [activeTab, setActiveTab] = useState('facility');
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleError = (err) => {
    if (err?.status === 403) {
      onLicenseExpired?.(err.body?.license);
      return;
    }
    setError(err?.message || 'Không thể tải cấu hình.');
  };

  const loadConfig = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getConfig();
      setConfig(data || {});
      applyTheme(data || {});
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const updateField = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const savePartial = async (partial, successMessage) => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const updated = await api.setConfig(partial);
      setConfig(updated || {});
      if ('uiFontSize' in partial || 'uiHighContrastMode' in partial) {
        applyTheme(updated || partial);
      }
      setMessage(successMessage || 'Đã lưu cấu hình.');
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async (fileName, dataUrl) => {
    setUploading(true);
    setMessage('');
    setError('');
    try {
      const result = await api.uploadLogo({ fileName, dataUrl });
      const merged = result?.config || { ...config, logoFileName: result?.logoFileName };
      setConfig(merged);
      setMessage('Đã cập nhật logo.');
    } catch (err) {
      handleError(err);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return h('div', { className: 'panel' }, h('div', { className: 'skeleton-block tall' }));
  }

  return h(
    'div',
    { className: 'panel tabs-panel settings-page' },
    h('div', { className: 'panel-header' }, h('div', null, h('h2', null, 'Cấu hình hệ thống'), h('p', { className: 'muted' }, 'Điều chỉnh thông tin in ấn, giao diện và dữ liệu.'))),
    Tabs({ active: activeTab, onChange: setActiveTab }),
    error ? h('div', { className: 'error-banner' }, error) : null,
    message ? h('div', { className: 'success-banner' }, message) : null,
    activeTab === 'facility'
      ? h(FacilityTab, {
          config,
          onChange: updateField,
          onSave: () => savePartial({
            hospitalName: config.hospitalName || '',
            address: config.address || '',
            phone: config.phone || '',
            facilityNote: config.facilityNote || ''
          }),
          saving
        })
      : null,
    activeTab === 'print'
      ? h(PrintTab, {
          config,
          onChange: updateField,
          onSave: () => savePartial({
            logoFileName: config.logoFileName,
            defaultImageCount: config.defaultImageCount || 4,
            templateVersion: config.templateVersion || ''
          }),
          onUploadLogo: uploadLogo,
          saving,
          uploading
        })
      : null,
    activeTab === 'ui'
      ? h(InterfaceTab, {
          config,
          onChange: updateField,
          onApply: () => savePartial({
            uiFontSize: config.uiFontSize || 'medium',
            uiHighContrastMode: !!config.uiHighContrastMode
          }, 'Đã áp dụng giao diện'),
          saving
        })
      : null,
    activeTab === 'db'
      ? h(DatabaseTab, {
          config
        })
      : null
  );
}

export function renderSettings(state, { navigate }) {
  const container = document.createElement('div');
  const root = ReactDOM.createRoot(container);
  root.render(h(SettingsPage, { onLicenseExpired: () => navigate('license') }));
  return { node: container, cleanup: () => root.unmount() };
}
