import { el } from '../../components/common/dom.js';
import { api } from '../../api/client.js';

function escapeHtml(value = '') {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderSrs() {
  const node = el(`
    <section class="panel srs-card">
      <div class="panel-header">
        <div>
          <h2>Software Requirements Specification (SRS)</h2>
          <p class="muted">Tài liệu yêu cầu phần mềm soi cổ tử cung offline, bao gồm kiến trúc, luồng nghiệp vụ và mô hình dữ liệu.</p>
        </div>
        <div class="actions-row">
          <a class="btn ghost" href="/api/srs?format=raw" target="_blank" rel="noreferrer">Tải file SRS</a>
          <button class="btn" type="button" data-action="reload">Tải lại</button>
        </div>
      </div>
      <div class="srs-body" aria-live="polite"></div>
    </section>
  `);

  const body = node.querySelector('.srs-body');

  const renderContent = (content, updatedAt, source) => {
    body.innerHTML = '';
    const wrapper = el(`
      <div class="srs-meta">
        <div class="muted">Nguồn: ${source || 'SRS_UML_Offline_CTC.md'}</div>
        <div class="muted">Cập nhật: ${updatedAt ? new Date(updatedAt).toLocaleString('vi-VN') : 'Không rõ'}</div>
      </div>
    `);
    const pre = el(`<pre class="srs-pre"></pre>`);
    pre.innerHTML = escapeHtml(content || 'Chưa có nội dung SRS.');
    body.appendChild(wrapper);
    body.appendChild(pre);
  };

  const renderError = (message) => {
    body.innerHTML = `<div class="error-banner">${message}</div>`;
  };

  const load = async () => {
    body.innerHTML = '<div class="muted">Đang tải tài liệu SRS...</div>';
    try {
      const data = await api.getSrs();
      renderContent(data?.content, data?.updatedAt, data?.source);
    } catch (err) {
      renderError('Không thể tải tài liệu SRS. Vui lòng thử lại.');
      console.error('[srs] load failed', err);
    }
  };

  node.querySelector('[data-action="reload"]').addEventListener('click', load);
  load();

  return node;
}
