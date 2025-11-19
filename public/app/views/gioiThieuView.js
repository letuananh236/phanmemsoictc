import { aboutInfo } from '../../about.js';

export function createGioiThieuView() {
  const info = typeof window !== 'undefined' && window.APP_ABOUT_INFO ? window.APP_ABOUT_INFO : aboutInfo;
  return {
    id: 'gioi-thieu',
    title: 'Giới thiệu phần mềm',
    render(target) {
      target.innerHTML = '';
      const wrapper = document.createElement('section');
      wrapper.className = 'card about-view';
      wrapper.innerHTML = `
        <h3>${info.appName}</h3>
        <p><strong>Phiên bản:</strong> ${info.version}</p>
        <p><strong>Mô tả:</strong> ${info.description}</p>
        <p><strong>Liên hệ:</strong> ${info.support?.email || ''} • ${info.support?.phone || ''}</p>
        <p>${info.copyright}</p>
        <ul>${(info.notes || []).map((note) => `<li>${note}</li>`).join('')}</ul>
      `;
      target.appendChild(wrapper);
    }
  };
}
