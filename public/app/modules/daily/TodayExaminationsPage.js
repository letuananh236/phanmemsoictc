import { React, ReactDOM } from '../../../vendor/react-lite.js';
import { api } from '../../api/client.js';
import { setState } from '../../state.js';

const { createElement: h, useEffect, useState } = React;

const STATUS_COLORS = {
  'Chưa soi': 'badge-soft',
  'Đang soi': 'badge-info',
  'Đã soi': 'badge-success',
  'Đã in': 'badge-muted'
};

function yearOfBirth(dob) {
  if (!dob) return '';
  const date = new Date(dob);
  return Number.isNaN(date.getTime()) ? '' : String(date.getFullYear());
}

function FilterBar({ date, doctorId, searchText, doctors, onChange, onRefresh, loading }) {
  return h(
    'div',
    { className: 'daily-filter-bar' },
    h(
      'label',
      { className: 'field' },
      h('span', null, 'Ngày'),
      h('input', {
        type: 'date',
        value: date,
        onchange: (e) => onChange({ date: e.target.value })
      })
    ),
    h(
      'label',
      { className: 'field' },
      h('span', null, 'Bác sĩ'),
      h(
        'select',
        {
          value: doctorId,
          onchange: (e) => onChange({ doctorId: e.target.value })
        },
        h('option', { value: '' }, '-- Tất cả --'),
        doctors.map((doc) => h('option', { key: doc.DoctorID || doc.id, value: doc.DoctorID || doc.id }, doc.FullName || doc.name))
      )
    ),
    h(
      'label',
      { className: 'field' },
      h('span', null, 'Tìm kiếm'),
      h('input', {
        type: 'search',
        placeholder: 'Tên BN / SĐT / Mã BN',
        value: searchText,
        oninput: (e) => onChange({ searchText: e.target.value })
      })
    ),
    h(
      'button',
      { className: 'btn primary filter-button', type: 'button', onClick: onRefresh, disabled: loading },
      loading ? 'Đang tải…' : 'Lọc'
    )
  );
}

function TableRow({ exam, selected, onSelect, onOpen }) {
  return h(
    'tr',
    {
      className: selected ? 'row-selected' : '',
      onclick: () => onSelect(exam),
      ondblclick: () => onOpen(exam),
      tabIndex: 0,
      onkeydown: (e) => {
        if (e.key === 'Enter') onOpen(exam);
      }
    },
    h('td', null, exam.time || ''),
    h('td', null, exam.id || ''),
    h('td', null, exam.patientId || ''),
    h('td', null, exam.patientName || ''),
    h('td', null, yearOfBirth(exam.patientDob)),
    h('td', null, exam.doctorName || '—'),
    h('td', null, h('span', { className: `status-pill ${STATUS_COLORS[exam.status] || 'badge-soft'}` }, exam.status || 'Chưa soi'))
  );
}

function ExaminationTable({ exams, selectedId, onSelect, onOpen, loading }) {
  if (loading) {
    return h(
      'div',
      { className: 'table-wrapper skeleton-table' },
      h(
        'table',
        { className: 'data-table' },
        h(
          'tbody',
          null,
          Array.from({ length: 6 }).map((_, idx) =>
            h(
              'tr',
              { key: idx },
              Array.from({ length: 6 }).map((__, col) => h('td', { key: col }, h('div', { className: 'skeleton-block' })))
            )
          )
        )
      )
    );
  }

  if (!exams.length) {
    return h('div', { className: 'empty-state' }, 'Không có phiếu khám nào trong ngày.');
  }

  return h(
    'div',
    { className: 'table-wrapper' },
    h(
      'table',
      { className: 'data-table roomy' },
      h(
        'thead',
        null,
        h(
          'tr',
          null,
          h('th', null, 'Giờ'),
          h('th', null, 'Mã phiếu'),
          h('th', null, 'Mã BN'),
          h('th', null, 'Tên BN'),
          h('th', null, 'Năm sinh'),
          h('th', null, 'Bác sĩ'),
          h('th', null, 'Trạng thái')
        )
      ),
      h(
        'tbody',
        null,
        exams.map((exam) =>
          h(TableRow, {
            key: exam.id,
            exam,
            selected: selectedId === exam.id,
            onSelect,
            onOpen
          })
        )
      )
    )
  );
}

function TodayExaminationsPage({ initialDate, onNavigateExam, onCreatePatient, onLicenseExpired }) {
  const [date, setDate] = useState(initialDate || new Date().toISOString().slice(0, 10));
  const [doctorId, setDoctorId] = useState('');
  const [searchText, setSearchText] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [exams, setExams] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchDoctors = async () => {
    try {
      const res = await api.listActiveDoctors();
      setDoctors(res.doctors || res || []);
    } catch (err) {
      if (err.status === 403) {
        setError('License đã hết hạn. Vui lòng kích hoạt để tiếp tục.');
        onLicenseExpired?.(err.body?.license);
      }
      console.error('Không thể tải danh sách bác sĩ', err);
    }
  };

  const fetchExams = async (opts = {}) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.listExaminations({ date, doctorId, ...opts });
      const next = Array.isArray(res?.exams) ? res.exams : Array.isArray(res) ? res : [];
      setExams(next);
      setSelected((prev) => {
        const nextSelected = prev && next.some((exam) => exam.id === prev) ? prev : null;
        if (!nextSelected && prev) setState({ selectedExamId: null });
        return nextSelected;
      });
    } catch (err) {
      if (err.status === 403) {
        setError('License đã hết hạn. Vui lòng kích hoạt để tiếp tục.');
        onLicenseExpired?.(err.body?.license);
      } else {
        setError('Không thể tải danh sách khám trong ngày.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    fetchExams({});
  }, [date, doctorId]);

  const handleSelect = (exam) => {
    setSelected(exam.id);
    setState({ selectedExamId: exam.id });
  };

  const handleOpen = (exam) => {
    setState({ selectedExamId: exam.id });
    onNavigateExam?.(exam.id);
  };

  const normalizedExams = Array.isArray(exams) ? exams : [];
  const filteredExams = normalizedExams.filter((exam) => {
    if (!searchText) return true;
    const needle = searchText.toLowerCase().trim();
    return (
      exam.patientName?.toLowerCase().includes(needle) ||
      exam.patientId?.toLowerCase().includes(needle) ||
      exam.id?.toLowerCase().includes(needle) ||
      exam.patientPhone?.toLowerCase().includes(needle)
    );
  });

  return h(
    'div',
    { className: 'panel daily-page' },
    h(
      'div',
      { className: 'panel-header' },
      h('div', null, h('h2', null, 'Khám bệnh'), h('p', { className: 'muted' }, 'Lọc nhanh và vào khám ngay cho các phiếu khám trong ngày.'))
    ),
    h(FilterBar, {
      date,
      doctorId,
      searchText,
      doctors,
      loading,
      onRefresh: () => fetchExams({ manual: true }),
      onChange: (partial) => {
        if (partial.date !== undefined) setDate(partial.date);
        if (partial.doctorId !== undefined) setDoctorId(partial.doctorId);
        if (partial.searchText !== undefined) setSearchText(partial.searchText);
      }
    }),
    error ? h('div', { className: 'error-banner' }, error) : null,
    h(ExaminationTable, {
      exams: filteredExams,
      selectedId: selected,
      onSelect: handleSelect,
      onOpen: handleOpen,
      loading
    }),
    h(
      'div',
      { className: 'actions-row spaced daily-actions' },
      h('div', { className: 'muted' }, 'Double click dòng để mở phiếu.'),
      h(
        'div',
        { className: 'actions-row' },
        h(
          'button',
          { className: 'btn secondary', type: 'button', onClick: () => onCreatePatient?.() },
          'TẠO BỆNH NHÂN MỚI'
        ),
        h(
          'button',
          {
            className: 'btn primary',
            type: 'button',
            disabled: !selected,
            onClick: () => {
              if (!selected) {
                setError('Vui lòng chọn 1 phiếu khám để vào khám.');
                return;
              }
              onNavigateExam?.(selected);
            }
          },
          'VÀO KHÁM'
        )
      )
    )
  );
}

export function renderTodayExaminations(container, props) {
  const root = ReactDOM.createRoot(container);
  root.render(h(TodayExaminationsPage, props));
  return () => root.unmount();
}
