import { React, ReactDOM } from '../../../vendor/react-lite.js';
import { api } from '../../api/client.js';

const { createElement: h, useEffect, useMemo, useState } = React;

function DoctorsTable({ doctors, searchText, onSearchChange, onSelect, onCreate, selectedId, defaultDoctorId, onMakeDefault, loading }) {
  const filtered = useMemo(() => {
    if (!searchText) return doctors;
    const term = searchText.toLowerCase();
    return doctors.filter((d) =>
      (d.name || '').toLowerCase().includes(term) || (d.id || '').toLowerCase().includes(term) || (d.department || '').toLowerCase().includes(term)
    );
  }, [doctors, searchText]);

  return h(
    'section',
    { className: 'panel list-panel doctors-list' },
    h(
      'div',
      { className: 'panel-header' },
      h('div', null, h('h2', null, 'DANH SÁCH BÁC SĨ'), h('p', { className: 'muted' }, 'Quản lý danh sách bác sĩ và đánh dấu mặc định.')),
      h('button', { className: 'btn primary', type: 'button', onClick: onCreate }, 'THÊM BÁC SĨ')
    ),
    h(
      'div',
      { className: 'field' },
      h('span', null, 'Tìm kiếm nhanh'),
      h('input', {
        type: 'search',
        placeholder: 'Nhập tên hoặc mã bác sĩ',
        value: searchText,
        oninput: (e) => onSearchChange(e.target.value)
      })
    ),
    h(
      'div',
      { className: 'table-wrapper tall' },
      h(
        'table',
        { className: 'data-table roomy' },
        h(
          'thead',
          null,
          h(
            'tr',
            null,
            h('th', null, 'Mã bác sĩ'),
            h('th', null, 'Họ tên'),
            h('th', null, 'Học vị / chức danh'),
            h('th', null, 'Khoa/phòng'),
            h('th', null, 'Trạng thái'),
            h('th', null, 'Mặc định')
          )
        ),
        h(
          'tbody',
          null,
          loading
            ? Array.from({ length: 6 }).map((_, idx) =>
                h(
                  'tr',
                  { key: idx },
                  Array.from({ length: 6 }).map((__, col) => h('td', { key: col }, h('div', { className: 'skeleton-block' })))
                )
              )
            : filtered.length
              ? filtered.map((d) =>
                  h(
                    'tr',
                    {
                      key: d.id,
                      className: selectedId === d.id ? 'row-selected' : '',
                      onclick: () => onSelect(d)
                    },
                    h('td', null, d.id),
                    h('td', null, d.name),
                    h('td', null, d.title || '—'),
                    h('td', null, d.department || '—'),
                    h('td', null, h('span', { className: `status-pill ${d.active ? 'pill-active' : 'pill-inactive'}` }, d.active ? 'Đang làm việc' : 'Ngừng')), 
                    h(
                      'td',
                      { className: 'center' },
                      h('input', {
                        type: 'radio',
                        name: 'default-doctor',
                        checked: defaultDoctorId === d.id,
                        onclick: (e) => {
                          e.stopPropagation();
                          onMakeDefault(d.id);
                        }
                      })
                    )
                  )
                )
              : h('tr', null, h('td', { colSpan: 6, className: 'muted empty-cell' }, 'Không có bác sĩ.'))
        )
      )
    )
  );
}

function DoctorFormDialog({ open, doctor, onClose, onSave, saving, error }) {
  const [form, setForm] = useState(doctor || {});

  useEffect(() => {
    setForm(doctor || {});
  }, [doctor]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  if (!open) return null;

  return h(
    'div',
    { className: 'modal-backdrop' },
    h(
      'div',
      { className: 'modal-card wide' },
      h(
        'header',
        { className: 'modal-header' },
        h('div', null, h('h3', null, doctor?.id ? 'Chỉnh sửa bác sĩ' : 'Thêm bác sĩ'), h('p', { className: 'muted' }, 'Điền thông tin bác sĩ và lưu lại.')),
        h('button', { className: 'btn ghost', type: 'button', onclick: onClose }, 'Đóng')
      ),
      error ? h('div', { className: 'error-banner' }, error) : null,
      h(
        'form',
        {
          className: 'form-grid two-cols compact',
          onsubmit: (e) => {
            e.preventDefault();
            onSave(form);
          }
        },
        h(
          'label',
          { className: 'field short' },
          h('span', null, 'Mã bác sĩ'),
          h('input', {
            type: 'text',
            value: form.id || '',
            placeholder: 'Tự sinh nếu để trống',
            oninput: (e) => update('id', e.target.value)
          })
        ),
        h(
          'label',
          { className: 'field' },
          h('span', null, 'Họ tên'),
          h('input', {
            type: 'text',
            value: form.name || '',
            oninput: (e) => update('name', e.target.value)
          })
        ),
        h(
          'label',
          { className: 'field' },
          h('span', null, 'Học vị / chức danh'),
          h('input', {
            type: 'text',
            value: form.title || '',
            oninput: (e) => update('title', e.target.value)
          })
        ),
        h(
          'label',
          { className: 'field' },
          h('span', null, 'Khoa/phòng'),
          h('input', {
            type: 'text',
            value: form.department || '',
            oninput: (e) => update('department', e.target.value)
          })
        ),
        h(
          'label',
          { className: 'field full' },
          h('span', null, 'Ảnh chữ ký (đường dẫn)'),
          h('input', {
            type: 'text',
            value: form.signatureImagePath || '',
            oninput: (e) => update('signatureImagePath', e.target.value),
            placeholder: 'Ví dụ: assets/signatures/bs-tran.png'
          })
        ),
        h(
          'label',
          { className: 'switch full' },
          h('input', {
            type: 'checkbox',
            checked: form.active ?? true,
            onchange: (e) => update('active', e.target.checked)
          }),
          h('span', null, 'Bác sĩ đang làm việc')
        ),
        h(
          'div',
          { className: 'form-actions full' },
          h('button', { className: 'btn primary', type: 'submit', disabled: saving }, saving ? 'Đang lưu…' : 'LƯU'),
          h('button', { className: 'btn', type: 'button', onclick: onClose }, 'HỦY')
        )
      )
    )
  );
}

function DoctorsPage({ onLicenseExpired }) {
  const [doctors, setDoctors] = useState([]);
  const [defaultDoctorId, setDefaultDoctorId] = useState('');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [docs, config] = await Promise.all([api.listDoctors(), api.getConfig()]);
      setDoctors(docs);
      setDefaultDoctorId(config.defaultDoctorId || '');
      if (docs.length && !selected) {
        setSelected(docs[0]);
      }
    } catch (err) {
      if (err.status === 403 && onLicenseExpired) {
        onLicenseExpired();
      }
      setError(err.message || 'Không tải được danh sách bác sĩ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (payload) => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      if (payload.id) {
        await api.updateDoctor(payload.id, payload);
      } else {
        const saved = await api.createDoctor(payload);
        payload.id = saved?.id;
      }
      await loadData();
      setDialogOpen(false);
      setMessage('Đã lưu thông tin bác sĩ.');
    } catch (err) {
      if (err.status === 403 && onLicenseExpired) {
        onLicenseExpired();
      }
      setError(err.message || 'Không thể lưu bác sĩ');
    } finally {
      setSaving(false);
    }
  };

  const handleDefault = async (id) => {
    try {
      setDefaultDoctorId(id);
      await api.setConfig({ defaultDoctorId: id });
      setMessage('Đã cập nhật bác sĩ mặc định.');
    } catch (err) {
      setError(err.message || 'Không thể đặt mặc định');
      if (err.status === 403 && onLicenseExpired) {
        onLicenseExpired();
      }
    }
  };

  return h(
    'div',
    { className: 'split-layout doctors-layout' },
    h(DoctorsTable, {
      doctors,
      searchText,
      onSearchChange: setSearchText,
      onSelect: (doc) => setSelected(doc),
      onCreate: () => {
        setSelected(null);
        setDialogOpen(true);
      },
      selectedId: selected?.id,
      defaultDoctorId,
      onMakeDefault: handleDefault,
      loading
    }),
    h(
      'section',
      { className: 'panel detail-panel' },
      h(
        'div',
        { className: 'panel-header tight' },
        h('h3', null, 'Thông tin bác sĩ'),
        h(
          'div',
          { className: 'actions-row' },
          h('button', { className: 'btn', type: 'button', onClick: () => setDialogOpen(true) }, selected ? 'SỬA' : 'THÊM'),
          h('button', { className: 'btn primary', type: 'button', onClick: () => setDialogOpen(true) }, 'LƯU/SỬA')
        )
      ),
      message ? h('div', { className: 'success-banner' }, message) : null,
      error ? h('div', { className: 'error-banner' }, error) : null,
      selected
        ? h(
            'div',
            { className: 'form-grid two-cols compact' },
            h('div', { className: 'summary-block full' }, h('h4', null, selected.name), h('p', { className: 'muted' }, selected.title || '—')),
            h('div', { className: 'summary-tile' }, h('div', { className: 'label' }, 'Mã bác sĩ'), h('div', { className: 'value' }, selected.id)),
            h('div', { className: 'summary-tile' }, h('div', { className: 'label' }, 'Khoa/phòng'), h('div', { className: 'value' }, selected.department || '—')),
            h('div', { className: 'summary-tile' }, h('div', { className: 'label' }, 'Trạng thái'), h('div', { className: `status-pill ${selected.active ? 'pill-active' : 'pill-inactive'}` }, selected.active ? 'Đang làm việc' : 'Ngừng')),
            h('div', { className: 'summary-tile' }, h('div', { className: 'label' }, 'Mặc định'), h('div', { className: 'value' }, defaultDoctorId === selected.id ? 'Có' : 'Không')),
            selected.signatureImagePath
              ? h(
                  'div',
                  { className: 'signature-preview full' },
                  h('div', { className: 'label' }, 'Chữ ký'),
                  h('div', { className: 'signature-box' }, h('img', { src: selected.signatureImagePath, alt: 'Chữ ký bác sĩ' }))
                )
              : null,
            h(
              'div',
              { className: 'form-actions full' },
              h('button', { className: 'btn primary', type: 'button', onClick: () => handleDefault(selected.id) }, 'ĐẶT LÀ MẶC ĐỊNH'),
              h('button', { className: 'btn secondary', type: 'button', onClick: () => setDialogOpen(true) }, 'CHỈNH SỬA')
            )
          )
        : h('div', { className: 'empty-state' }, 'Chọn hoặc thêm bác sĩ để xem chi tiết.')
    ),
    h(DoctorFormDialog, {
      open: dialogOpen,
      doctor: selected,
      onClose: () => setDialogOpen(false),
      onSave: handleSave,
      saving,
      error
    })
  );
}

export function renderDoctors(_state, { navigate }) {
  const container = document.createElement('div');
  const cleanup = ReactDOM.createRoot(container);
  cleanup.render(
    h(DoctorsPage, {
      onLicenseExpired: () => navigate?.('license')
    })
  );
  return {
    node: container,
    cleanup: () => cleanup.unmount()
  };
}
