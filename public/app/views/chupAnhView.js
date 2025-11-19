import { createCaptureView } from '../../capture.js';

export function createChupAnhView(appState) {
  let viewInstance;
  return {
    id: 'chup-anh',
    title: 'Chụp ảnh',
    render(target) {
      target.innerHTML = '';
      const host = document.createElement('div');
      host.className = 'view-host';
      target.appendChild(host);
      if (!viewInstance) {
        viewInstance = createCaptureView(appState);
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
