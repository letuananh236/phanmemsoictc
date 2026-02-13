import { showToast, storage } from './storage.js';

export function createPhotoCaptureView() {
  let imageDataUrl = '';

  async function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return {
    render(target) {
      const wrapper = document.createElement('section');
      wrapper.className = 'card capture-view wide-card';
      wrapper.innerHTML = `
        <h3 style="margin-bottom:12px;">CHỤP ẢNH</h3>
        <div class="form-row">
          <label>Chọn ảnh chụp</label>
          <input type="file" id="quick-photo-input" accept="image/*" capture="environment" />
        </div>
        <div class="form-row">
          <label>Đường dẫn lưu (trong thư mục database/images)</label>
          <input id="quick-photo-path" placeholder="vd: user_uploads/anh1.png" />
        </div>
        <div class="form-row">
          <button type="button" id="quick-photo-save">Lưu ảnh</button>
        </div>
        <div class="capture-preview" style="margin-top: 14px; min-height: 360px;">
          <img id="quick-photo-preview" alt="Ảnh chụp" style="display:none; width:100%; height:100%; object-fit:contain;" />
        </div>
      `;
      target.appendChild(wrapper);

      const fileInput = wrapper.querySelector('#quick-photo-input');
      const pathInput = wrapper.querySelector('#quick-photo-path');
      const preview = wrapper.querySelector('#quick-photo-preview');
      const saveButton = wrapper.querySelector('#quick-photo-save');

      fileInput.addEventListener('change', async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        imageDataUrl = await fileToDataUrl(file);
        preview.src = imageDataUrl;
        preview.style.display = 'block';
        if (!pathInput.value) {
          pathInput.value = file.name;
        }
      });

      saveButton.addEventListener('click', async () => {
        if (!imageDataUrl) {
          showToast('Vui lòng chọn ảnh trước');
          return;
        }
        if (!pathInput.value.trim()) {
          showToast('Vui lòng nhập đường dẫn lưu');
          return;
        }
        try {
          const result = await storage.uploadImageToPath(imageDataUrl, pathInput.value.trim());
          showToast(`Đã lưu ảnh: ${result.path}`);
        } catch (error) {
          showToast(error.message || 'Không thể lưu ảnh');
        }
      });
    }
  };
}
