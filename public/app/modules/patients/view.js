import { React, ReactDOM } from '../../../vendor/react-lite.js';
import { api } from '../../api/client.js';

const { createElement: h, useEffect, useMemo, useState } = React;

function calculateAge(dob) {
  if (!dob) return '';
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return '';
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

function PatientsList({ patients, searchText, onSearchChange, onRefresh, selectedId, onSelect, onNew, loading }) {
  return h(
    'section',
    { className: 'panel list-panel patients-list' },
    h(
      'div',
      { className: 'panel-header' },
      h('div', null, h('h2', null, 'Bệnh nhân'), h('p', { className: 'muted' }, 'Tìm nhanh và chọn bệnh nhân để chỉnh sửa.')),
      h('button', { className: 'btn primary', type: 'button', onClick: onNew }, 'TẠO BỆNH NHÂN MỚI')
    ),
    h(
      'div',
      { className: 'field' },
      h('span', null, 'Tìm kiếm'),
      h('div', { className: 'search-row' },
        h('input', {
          type: 'search',
          placeholder: 'Nhập tên, SĐT hoặc mã BN',
          value: searchText,
          oninput: (e) => onSearchChange(e.target.value)
        }),
        h('button', { className: 'btn secondary', type: 'button', onClick: onRefresh, disabled: loading }, loading ? 'Đang tải…' : 'Tìm')
      )
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
            h('th', null, 'Mã BN'),
            h('th', null, 'Họ tên'),
            h('th', null, 'Năm sinh'),
            h('th', null, 'Giới'),
            h('th', null, 'SĐT')
          )
        ),
        h(
          'tbody',
          null,
          loading
            ? Array.from({ length: 8 }).map((_, idx) =>
                h(
                  'tr',
                  { key: idx },
                  Array.from({ length: 5 }).map((__, col) => h('td', { key: col }, h('div', { className: 'skeleton-block' })))
                )
              )
            : patients.length
              ? patients.map((p) =>
                  h(
                    'tr',
                    {
                      key: p.id,
                      className: selectedId === p.id ? 'row-selected' : '',
                      onclick: () => onSelect(p),
                      ondblclick: () => onSelect(p, { openHistory: false })
                    },
                    h('td', null, p.id),
                    h('td', null, p.name),
                    h('td', null, p.dob ? new Date(p.dob).getFullYear() : ''),
                    h('td', null, p.gender || '—'),
                    h('td', null, p.phone || '—')
                  )
                )
              : h('tr', null, h('td', { colSpan: 5, className: 'muted empty-cell' }, 'Không có bệnh nhân.'))
        )
      )
    )
  );
}

function PatientForm({ form, onChange, onSave, onNew, onHistory, saving, message, error }) {
  const age = useMemo(() => calculateAge(form.dob), [form.dob]);

  const updateField = (key, value) => {
    onChange({ ...form, [key]: value });
  };

  return h(
    'section',
    { className: 'panel detail-panel patient-detail' },
    h(
      'div',
      { className: 'panel-header tight' },
      h('h3', null, 'Thông tin chi tiết'),
      h(
        'div',
        { className: 'actions-row' },
        h('button', { className: 'btn primary', type: 'button', onClick: onSave, disabled: saving }, saving ? 'Đang lưu…' : 'LƯU'),
        h('button', { className: 'btn', type: 'button', onClick: onNew }, 'TẠO MỚI'),
        h('button', { className: 'btn ghost', type: 'button', onClick: onHistory, disabled: !form.id }, 'XEM LỊCH SỬ KHÁM')
      )
    ),
    message ? h('div', { className: 'success-banner' }, message) : null,
    error ? h('div', { className: 'error-banner' }, error) : null,
    h(
      'div',
      { className: 'form-grid two-cols compact patient-form-grid' },
      h(
        'label',
        { className: 'field short' },
        h('span', null, 'Mã BN'),
        h('input', { type: 'text', value: form.id || '', readonly: true, placeholder: 'Tự sinh sau khi lưu' })
      ),
      h(
        'label',
        { className: 'field' },
        h('span', null, 'Họ tên'),
        h('input', {
          type: 'text',
          value: form.name || '',
          oninput: (e) => updateField('name', e.target.value)
        })
      ),
      h(
        'label',
        { className: 'field' },
        h('span', null, 'Giới tính'),
        h(
          'select',
          {
            value: form.gender || '',
            onchange: (e) => updateField('gender', e.target.value)
          },
          h('option', { value: '' }, '-- Chọn --'),
          h('option', { value: 'Nam' }, 'Nam'),
          h('option', { value: 'Nữ' }, 'Nữ'),
          h('option', { value: 'Khác' }, 'Khác')
        )
      ),
      h(
        'label',
        { className: 'field' },
        h('span', null, 'Ngày sinh'),
        h('input', {
          type: 'date',
          value: form.dob || '',
          onchange: (e) => updateField('dob', e.target.value)
        }),
        h('div', { className: 'muted small' }, age ? `Tuổi: ${age}` : 'Tuổi sẽ tự tính từ ngày sinh')
      ),
      h(
        'label',
        { className: 'field' },
        h('span', null, 'SĐT'),
        h('input', {
          type: 'tel',
          value: form.phone || '',
          oninput: (e) => updateField('phone', e.target.value)
        })
      ),
      h(
        'label',
        { className: 'field full' },
        h('span', null, 'Địa chỉ'),
        h('textarea', {
          rows: 3,
          value: form.address || '',
          oninput: (e) => updateField('address', e.target.value)
        })
      )
    )
  );
}

function PatientHistoryDialog({ open, onClose, items, loading }) {
  if (!open) return null;
  return h(
    'div',
    { className: 'dialog-backdrop' },
    h(
      'div',
      { className: 'dialog' },
      h(
        'div',
        { className: 'dialog-header' },
        h('h3', null, 'Lịch sử khám'),
        h('button', { className: 'btn ghost', type: 'button', onClick: onClose }, 'Đóng')
      ),
      loading
        ? h('div', { className: 'skeleton-table' }, 'Đang tải…')
        : items?.length
          ? h(
              'table',
              { className: 'data-table roomy history-table' },
              h(
                'thead',
                null,
                h('tr', null, h('th', null, 'Ngày giờ'), h('th', null, 'Bác sĩ'), h('th', null, 'Trạng thái'))
              ),
              h(
                'tbody',
                null,
                items.map((item) =>
                  h(
                    'tr',
                    { key: item.id },
                    h('td', null, item.ExamDateTime || item.date || ''),
                    h('td', null, item.doctorName || '—'),
                    h('td', null, item.status || item.Status || 'Chưa soi')
                  )
                )
              )
            )
          : h('div', { className: 'empty-state' }, 'Chưa có phiếu khám nào.')
    )
  );
}

function PatientsPage({ onLicenseExpired, onNavigateExam }) {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ id: '', name: '', gender: '', dob: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadPatients = async (manual = false) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.listPatients({ search });
      const list = res.patients || res || [];
      setPatients(list);
      if (!manual && list.length && !form.id) {
        handleSelect(list[0]);
      }
    } catch (err) {
      if (err.status === 403) {
        setError('License đã hết hạn. Vui lòng kích hoạt để tiếp tục.');
        onLicenseExpired?.(err.body?.license);
      } else {
        setError('Không thể tải danh sách bệnh nhân.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => loadPatients(), 250);
    return () => clearTimeout(t);
  }, [search]);

  const handleSelect = (patient) => {
    setSelected(patient.id);
    setForm({
      id: patient.id,
      name: patient.name || '',
      gender: patient.gender || '',
      dob: patient.dob || '',
      phone: patient.phone || '',
      address: patient.address || ''
    });
    setMessage('');
    setError('');
  };

  const handleNew = () => {
    setSelected(null);
    setForm({ id: '', name: '', gender: '', dob: '', phone: '', address: '' });
    setMessage('');
    setError('');
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const payload = {
        name: form.name,
        gender: form.gender,
        dob: form.dob,
        phone: form.phone,
        address: form.address,
        createVisit: !form.id,
        visitDate: new Date().toISOString().slice(0, 10)
      };
      const savedResponse = form.id ? await api.updatePatient(form.id, payload) : await api.createPatient(payload);
      const saved = savedResponse.patient || savedResponse;
      setForm({
        id: saved.id,
        name: saved.name || '',
        gender: saved.gender || '',
        dob: saved.dob || '',
        phone: saved.phone || '',
        address: saved.address || ''
      });
      setSelected(saved.id);
      setMessage('Đã lưu bệnh nhân');
      await loadPatients(true);

      const newVisit = savedResponse.visit;
      if (newVisit?.ma_phieu && onNavigateExam) {
        onNavigateExam(newVisit.ma_phieu);
      }
    } catch (err) {
      if (err.status === 403) {
        setError('License đã hết hạn. Vui lòng kích hoạt để tiếp tục.');
        onLicenseExpired?.(err.body?.license);
      } else {
        setError(err.message || 'Không thể lưu bệnh nhân.');
      }
    } finally {
      setSaving(false);
    }
  };

  const openHistory = async () => {
    if (!form.id) return;
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const res = await api.listExaminations({ patientId: form.id });
      const list = res.exams || res || [];
      setHistoryItems(list.map((item) => ({ ...item, ExamDateTime: item.date || item.ExamDateTime }))); 
    } catch (err) {
      if (err.status === 403) {
        setError('License đã hết hạn. Vui lòng kích hoạt để tiếp tục.');
        onLicenseExpired?.(err.body?.license);
      } else {
        setHistoryItems([]);
      }
    } finally {
      setHistoryLoading(false);
    }
  };

  return h(
    'div',
    { className: 'split-layout patients-layout' },
    h(PatientsList, {
      patients,
      searchText: search,
      onSearchChange: setSearch,
      onRefresh: () => loadPatients(true),
      selectedId: selected,
      onSelect: handleSelect,
      onNew: handleNew,
      loading
    }),
    h(PatientForm, {
      form,
      onChange: setForm,
      onSave: handleSave,
      onNew: handleNew,
      onHistory: openHistory,
      saving,
      message,
      error
    }),
    h(PatientHistoryDialog, {
      open: historyOpen,
      onClose: () => setHistoryOpen(false),
      items: historyItems,
      loading: historyLoading
    })
  );
}

export function renderPatients(state, { navigate }) {
  const container = document.createElement('div');
  const root = ReactDOM.createRoot(container);
  root.render(
    h(PatientsPage, {
      onLicenseExpired: () => navigate('license'),
      onNavigateExam: (examId) => navigate('examinations', { selectedExamId: examId })
    })
  );
  return {
    node: container,
    cleanup: () => root.unmount()
  };
}
