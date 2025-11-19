import { createSettingsView } from '../../settings.js';

export function createCauHinhView(appState) {
  let viewInstance;
  return {
    id: 'cau-hinh',
    title: 'Cấu hình hệ thống',
    render(target) {
      target.innerHTML = '';
      const host = document.createElement('div');
      host.className = 'view-host';
      target.appendChild(host);
      if (!viewInstance) {
        viewInstance = createSettingsView(appState);
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
