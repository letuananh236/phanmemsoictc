import { createExamSearchView } from '../../search-exam.js';

export function createTimPhieuKhamView() {
  let viewInstance;
  return {
    id: 'tim-phieu-kham',
    title: 'Tìm phiếu khám',
    render(target) {
      target.innerHTML = '';
      const host = document.createElement('div');
      host.className = 'view-host';
      target.appendChild(host);
      if (!viewInstance) {
        viewInstance = createExamSearchView();
      }
      viewInstance.render(host);
    },
    destroy() {
      if (viewInstance?.destroy) {
        viewInstance.destroy();
      }
    }
  };
}
