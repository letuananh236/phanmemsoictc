import { createExamFormView } from '../../exam-form.js';

export function createKhamBenhView(appState) {
  let viewInstance;
  return {
    id: 'kham-benh',
    title: 'Khám bệnh',
    render(target) {
      target.innerHTML = '';
      const host = document.createElement('div');
      host.className = 'view-host';
      target.appendChild(host);
      if (!viewInstance) {
        viewInstance = createExamFormView(appState);
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
