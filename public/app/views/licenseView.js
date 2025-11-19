import { createLicenseView } from '../../license-ui.js';

export function createLicenseViewWrapper(appState) {
  let viewInstance;
  return {
    id: 'license',
    title: 'License',
    render(target) {
      target.innerHTML = '';
      const host = document.createElement('div');
      host.className = 'view-host';
      target.appendChild(host);
      if (!viewInstance) {
        viewInstance = createLicenseView(appState);
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
