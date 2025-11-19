import { React, ReactDOM } from '../../../vendor/react-lite.js';
import { el } from '../../components/common/dom.js';
import { aboutInfo } from '../../../about.js';

const { createElement: h } = React;

function InfoRow({ label, value }) {
  if (!value) return null;
  return h('div', { className: 'info-row' }, [h('span', { className: 'label' }, label), h('p', null, value)]);
}

function NotesList({ items }) {
  if (!Array.isArray(items) || !items.length) return null;
  return h(
    'ul',
    { className: 'notes-list' },
    items.map((item, index) => h('li', { key: `note-${index}` }, item))
  );
}

function AboutPage() {
  const info = aboutInfo || window.APP_ABOUT_INFO || {};
  return h(
    'section',
    { className: 'panel about-page' },
    h('div', { className: 'panel-header' }, [h('h2', null, 'Giới thiệu phần mềm'), h('p', { className: 'muted' }, 'Thông tin phiên bản, bản quyền và liên hệ hỗ trợ.')]),
    h('div', { className: 'about-grid' }, [
      h(
        'div',
        { className: 'about-card' },
        [
          h('h3', null, info.appName || 'PHẦN MỀM SOI CỔ TỬ CUNG'),
          InfoRow({ label: 'Phiên bản', value: info.version || window.APP_VERSION || 'v1.0.0' }),
          InfoRow({ label: 'Ngày build', value: info.buildDate }),
          InfoRow({ label: 'Mô tả', value: info.description }),
          InfoRow({ label: 'Ghi chú', value: info.hospital })
        ]
      ),
      h(
        'div',
        { className: 'about-card' },
        [
          h('h3', null, 'Thông tin hỗ trợ'),
          InfoRow({ label: 'Email', value: info.support?.email }),
          InfoRow({ label: 'Điện thoại', value: info.support?.phone }),
          InfoRow({ label: 'Bản quyền', value: info.copyright }),
          NotesList({ items: info.notes })
        ]
      )
    ])
  );
}

export function renderAbout() {
  const container = el('<div class="module-view"></div>');
  const root = ReactDOM.createRoot(container);
  root.render(h(AboutPage));
  return { node: container, cleanup: () => root.unmount() };
}
