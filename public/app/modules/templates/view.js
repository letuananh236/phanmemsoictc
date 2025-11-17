import { React, ReactDOM } from '../../../vendor/react-lite.js';
import { api } from '../../api/client.js';

const { createElement: h, useEffect, useMemo, useState } = React;

function TemplatesList({ templates, searchText, onSearchChange, onSelect, onAdd, selectedId, loading }) {
  const filtered = useMemo(() => {
    if (!searchText) return templates;
    const term = searchText.toLowerCase();
    return templates.filter((t) => (t.name || '').toLowerCase().includes(term));
  }, [templates, searchText]);

  return h(
    'section',
    { className: 'panel list-panel templates-list' },
    h(
      'div',
      { className: 'panel-header' },
      h('div', null, h('h2', null, 'KẾT QUẢ MẶC ĐỊNH'), h('p', { className: 'muted' }, 'Chọn nhanh mẫu để đổ vào phiếu khám.')),
      h('button', { className: 'btn primary', type: 'button', onclick: onAdd }, 'THÊM MẪU MỚI')
    ),
    h(
      'div',
      { className: 'field' },
      h('span', null, 'Tìm theo tên mẫu'),
      h('input', {
        type: 'search',
        placeholder: 'Nhập tên mẫu...',
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
          h('tr', null, h('th', null, 'Tên mẫu'), h('th', null, 'Trạng thái'))
        ),
        h(
          'tbody',
          null,
          loading
            ? Array.from({ length: 6 }).map((_, idx) =>
                h(
                  'tr',
                  { key: idx },
                  [h('td', { key: 'name' }, h('div', { className: 'skeleton-block' })), h('td', { key: 'status' }, h('div', { className: 'skeleton-block' }))]
                )
              )
            : filtered.length
            ? filtered.map((t) =>
                h(
                  'tr',
                  {
                    key: t.id,
                    className: selectedId === t.id ? 'row-selected' : '',
                    onclick: () => onSelect(t)
                  },
                  h('td', null, t.name),
                  h('td', null, h('span', { className: `status-pill ${t.active ? 'pill-active' : 'pill-inactive'}` }, t.active ? 'Đang dùng' : 'Ẩn'))
                )
              )
            : h('tr', null, h('td', { colSpan: 2, className: 'muted empty-cell' }, 'Chưa có mẫu nào.'))
        )
      )
    )
  );
}

function TemplateForm({ form, onChangeField, onSave, onNew, onDelete, saving, deleting, message, error }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave();
  };

  return h(
    'section',
    { className: 'panel detail-panel' },
    h(
      'div',
      { className: 'panel-header' },
      h('div', null, h('h3', null, form?.id ? 'Chỉnh sửa mẫu' : 'Thêm mẫu mới'), h('p', { className: 'muted' }, 'Nhập nội dung chẩn đoán và hướng xử trí.')),
      h(
        'div',
        { className: 'actions-row' },
        h('button', { className: 'btn', type: 'button', onclick: onNew }, 'THÊM MẪU MỚI'),
        h('button', { className: 'btn danger', type: 'button', onclick: onDelete, disabled: !form?.id || deleting }, deleting ? 'Đang xóa...' : 'XÓA'),
        h(
          'button',
          { className: 'btn primary', type: 'button', onclick: onSave, disabled: saving },
          saving ? 'Đang lưu...' : 'LƯU'
        )
      )
    ),
    error ? h('div', { className: 'error-banner' }, error) : null,
    message ? h('div', { className: 'success-banner' }, message) : null,
    h(
      'form',
      { className: 'form-grid two-cols tall', onsubmit: handleSubmit },
      h(
        'label',
        { className: 'field' },
        h('span', null, 'Tên mẫu'),
        h('input', {
          type: 'text',
          value: form?.name || '',
          oninput: (e) => onChangeField('name', e.target.value),
          required: true,
          placeholder: 'Ví dụ: Bình thường'
        })
      ),
      h(
        'label',
        { className: 'field' },
        h('span', null, 'Đang sử dụng'),
        h('div', { className: 'checkbox-row' }, h('input', {
          type: 'checkbox',
          checked: !!form?.active,
          onchange: (e) => onChangeField('active', e.target.checked)
        }), h('span', null, 'Hiển thị mẫu này trong danh sách chọn nhanh'))
      ),
      h(
        'label',
        { className: 'field wide' },
        h('span', null, 'Nội dung chẩn đoán'),
        h('textarea', {
          rows: 4,
          value: form?.diagnosisText || '',
          oninput: (e) => onChangeField('diagnosisText', e.target.value),
          placeholder: 'Mô tả chẩn đoán chi tiết'
        })
      ),
      h(
        'label',
        { className: 'field wide' },
        h('span', null, 'Nội dung đề nghị / hướng xử trí'),
        h('textarea', {
          rows: 4,
          value: form?.recommendationText || '',
          oninput: (e) => onChangeField('recommendationText', e.target.value),
          placeholder: 'Hướng xử trí gợi ý'
        })
      )
    )
  );
}

function ResultTemplatesPage({ onLicenseExpired }) {
  const [templates, setTemplates] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState({ name: '', diagnosisText: '', recommendationText: '', active: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleError = (err) => {
    if (err?.status === 403) {
      onLicenseExpired?.(err.body?.license);
      return;
    }
    setError(err?.message || 'Không thể tải dữ liệu.');
  };

  const loadTemplates = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.listResultTemplates();
      setTemplates(data);
      if (data.length) {
        setSelectedId(data[0].id);
        setForm({
          id: data[0].id,
          name: data[0].name || '',
          diagnosisText: data[0].diagnosisText || '',
          recommendationText: data[0].recommendationText || '',
          active: !!data[0].active
        });
      } else {
        setSelectedId(null);
        setForm({ name: '', diagnosisText: '', recommendationText: '', active: true });
      }
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const selectTemplate = (tpl) => {
    setSelectedId(tpl.id);
    setForm({
      id: tpl.id,
      name: tpl.name || '',
      diagnosisText: tpl.diagnosisText || '',
      recommendationText: tpl.recommendationText || '',
      active: !!tpl.active
    });
    setMessage('');
    setError('');
  };

  const startNew = () => {
    setSelectedId(null);
    setForm({ name: '', diagnosisText: '', recommendationText: '', active: true });
    setMessage('');
    setError('');
  };

  const changeField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!form.name?.trim()) {
      setError('Vui lòng nhập tên mẫu.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        diagnosisText: form.diagnosisText || '',
        recommendationText: form.recommendationText || '',
        active: !!form.active
      };
      const saved = selectedId
        ? await api.updateResultTemplate(selectedId, payload)
        : await api.createResultTemplate(payload);
      setTemplates((prev) => {
        const existing = prev.filter((t) => t.id !== saved.id);
        return [{ ...saved }, ...existing];
      });
      setSelectedId(saved.id);
      setForm({
        id: saved.id,
        name: saved.name || '',
        diagnosisText: saved.diagnosisText || '',
        recommendationText: saved.recommendationText || '',
        active: !!saved.active
      });
      setMessage('Đã lưu mẫu.');
    } catch (err) {
      handleError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!form?.id) return;
    const confirm = window.confirm('Bạn chắc chắn muốn xóa mẫu này?');
    if (!confirm) return;
    setDeleting(true);
    setError('');
    try {
      await api.deleteResultTemplate(form.id);
      setTemplates((prev) => prev.filter((t) => t.id !== form.id));
      setSelectedId(null);
      setForm({ name: '', diagnosisText: '', recommendationText: '', active: true });
      setMessage('Đã xóa mẫu.');
    } catch (err) {
      handleError(err);
    } finally {
      setDeleting(false);
    }
  };

  return h(
    'div',
    { className: 'split-layout templates-layout' },
    h(TemplatesList, {
      templates,
      searchText,
      onSearchChange: setSearchText,
      onSelect: selectTemplate,
      onAdd: startNew,
      selectedId,
      loading
    }),
    h(TemplateForm, {
      form,
      onChangeField: changeField,
      onSave: handleSave,
      onNew: startNew,
      onDelete: handleDelete,
      saving,
      deleting,
      message,
      error
    })
  );
}

export function renderTemplates(state, { navigate }) {
  const container = document.createElement('div');
  const root = ReactDOM.createRoot(container);
  root.render(h(ResultTemplatesPage, { onLicenseExpired: () => navigate('license') }));
  return {
    node: container,
    cleanup: () => root.unmount()
  };
}
