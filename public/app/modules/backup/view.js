import { React, ReactDOM } from '../../../vendor/react-lite.js';
import { api } from '../../api/client.js';
import { el } from '../../components/common/dom.js';

const { createElement: h, useEffect, useState } = React;

function formatDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
}

function BackupHistoryTable({ items, loading }) {
  return h(
    'div',
    { className: 'backup-history' },
    h('div', { className: 'section-title' }, 'Lịch sử backup gần đây'),
    h(
      'div',
      { className: 'table-wrapper' },
      h(
        'table',
        { className: 'data-table' },
        h('thead', null, h('tr', null, [h('th', null, 'Ngày giờ'), h('th', null, 'Đường dẫn'), h('th', null, 'Ghi chú')])),
        h(
          'tbody',
          null,
          loading
            ? h('tr', null, h('td', { colspan: 3 }, 'Đang tải...'))
            : items.length === 0
              ? h('tr', null, h('td', { colspan: 3 }, 'Chưa có bản backup nào'))
              : items.map((item) =>
                  h('tr', { key: item.id || item.path }, [
                    h('td', null, formatDateTime(item.time)),
                    h('td', null, item.path || '—'),
                    h('td', null, item.note || '—')
                  ])
                )
        )
      )
    )
  );
}

function BackupRestorePage({ onNavigateLicense }) {
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadHistory() {
    setLoadingHistory(true);
    setError('');
    try {
      const data = await api.getBackupHistory();
      setHistory(data?.items || data || []);
    } catch (err) {
      if (err?.status === 403) {
        onNavigateLicense?.();
      }
      setError('Không thể tải lịch sử backup.');
    } finally {
      setLoadingHistory(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  async function handleCreate() {
    setCreating(true);
    setError('');
    setMessage('');
    try {
      const info = await api.createBackup();
      setMessage(`Đã tạo file backup: ${info?.backupPath || 'thành công'}.`);
      await loadHistory();
    } catch (err) {
      if (err?.status === 403) {
        onNavigateLicense?.();
      }
      setError('Không thể tạo file backup.');
    } finally {
      setCreating(false);
    }
  }

  async function handleRestore() {
    if (!selectedFile) {
      setError('Vui lòng chọn file backup (.zip) trước khi phục hồi.');
      return;
    }
    const confirmed = window.confirm(
      'Bạn chắc chắn muốn phục hồi dữ liệu từ backup này? Tất cả dữ liệu hiện tại sẽ bị ghi đè.'
    );
    if (!confirmed) return;
    setRestoring(true);
    setError('');
    setMessage('');
    try {
      await api.restoreBackup(selectedFile);
      setMessage('Phục hồi thành công. Vui lòng khởi động lại ứng dụng nếu cần.');
      setSelectedFile(null);
      const input = document.getElementById('restore-file');
      if (input) input.value = '';
      await loadHistory();
    } catch (err) {
      if (err?.status === 403) {
        onNavigateLicense?.();
      }
      setError('Không thể phục hồi dữ liệu. Vui lòng kiểm tra file backup.');
    } finally {
      setRestoring(false);
    }
  }

  return h(
    'div',
    { className: 'backup-page' },
    error && h('div', { className: 'error-banner' }, error),
    message && h('div', { className: 'success-banner' }, message),
    h(
      'div',
      { className: 'backup-grid' },
      h(
        'section',
        { className: 'panel backup-card' },
        h('h2', { className: 'panel-title' }, 'SAO LƯU DỮ LIỆU'),
        h('p', { className: 'muted' }, 'Backup sẽ tạo file .zip chứa cơ sở dữ liệu và toàn bộ ảnh.'),
        h(
          'button',
          {
            className: 'btn primary large',
            type: 'button',
            onclick: handleCreate,
            disabled: creating
          },
          creating ? 'Đang tạo backup...' : 'TẠO FILE BACKUP'
        ),
        h(BackupHistoryTable, { items: history, loading: loadingHistory })
      ),
      h(
        'section',
        { className: 'panel backup-card restore-card' },
        h('h2', { className: 'panel-title' }, 'PHỤC HỒI DỮ LIỆU'),
        h('p', { className: 'warning-text' }, 'Cảnh báo: thao tác này sẽ ghi đè toàn bộ dữ liệu hiện tại.'),
        h('label', { className: 'file-picker' }, [
          h('span', null, selectedFile ? selectedFile.name : 'Chọn file backup (.zip)'),
          h('input', {
            id: 'restore-file',
            type: 'file',
            accept: '.zip',
            onchange: (e) => {
              setSelectedFile(e.target.files?.[0] || null);
            }
          })
        ]),
        h(
          'button',
          {
            className: 'btn secondary large',
            type: 'button',
            onclick: handleRestore,
            disabled: restoring
          },
          restoring ? 'Đang phục hồi...' : 'CHỌN FILE BACKUP ĐỂ PHỤC HỒI'
        )
      )
    )
  );
}

export function renderBackup(state, { navigate }) {
  const container = el('<div></div>');
  const root = ReactDOM.createRoot(container);
  root.render(h(BackupRestorePage, { onNavigateLicense: () => navigate('license') }));
  return { node: container, cleanup: () => root.unmount() };
}
