import { showToast, storage } from './storage.js';

export function createPhotoCaptureView(appState) {
  let stream = null;

  async function listCameras(selectEl) {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((device) => device.kind === 'videoinput');
    selectEl.innerHTML = '';
    videoDevices.forEach((device, index) => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.textContent = device.label || `Camera ${index + 1}`;
      selectEl.appendChild(option);
    });
  }

  function stopCamera(videoEl) {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
    if (videoEl) {
      videoEl.srcObject = null;
    }
  }

  async function startCamera(videoEl, cameraDeviceSelect, cameraResolutionSelect) {
    stopCamera(videoEl);
    const [width, height] = String(cameraResolutionSelect.value || '1280x720').split('x').map(Number);
    const selectedDevice = cameraDeviceSelect.value;

    const videoConstraints = {
      width: Number.isFinite(width) ? width : 1280,
      height: Number.isFinite(height) ? height : 720
    };

    if (selectedDevice) {
      videoConstraints.deviceId = { exact: selectedDevice };
    } else {
      videoConstraints.facingMode = 'environment';
    }

    stream = await navigator.mediaDevices.getUserMedia({
      video: videoConstraints,
      audio: false
    });
    videoEl.srcObject = stream;
  }

  return {
    render(target) {
      const wrapper = document.createElement('section');
      wrapper.className = 'card capture-view wide-card';
      wrapper.innerHTML = `
        <h3 style="margin-bottom:12px;">CHỤP HÌNH</h3>

        <div class="grid-3">
          <div class="form-row">
            <label>Thiết bị camera</label>
            <select id="photo-camera-device"></select>
          </div>
          <div class="form-row">
            <label>Độ phân giải</label>
            <select id="photo-camera-resolution">
              <option value="640x480">640 x 480</option>
              <option value="1280x720" selected>1280 x 720</option>
              <option value="1920x1080">1920 x 1080</option>
            </select>
          </div>
          <div class="form-row" style="align-self:end;">
            <button type="button" class="secondary" id="photo-camera-apply">Áp dụng camera</button>
          </div>
        </div>

        <div class="form-row">
          <label>Đường dẫn lưu (trong thư mục database/images)</label>
          <input id="photo-target-path" placeholder="vd: user_uploads/anh_chup.png" />
        </div>

        <div class="capture-preview photo-capture-preview" style="margin-top: 14px; min-height: 216px;">
          <video id="photo-live-video" autoplay playsinline muted style="width:100%; height:100%; object-fit:contain;"></video>
          <canvas id="photo-canvas" class="hidden"></canvas>
        </div>

        <div class="toolbar">
          <button type="button" id="photo-capture-save">Chụp & Lưu ảnh</button>
          <button type="button" id="photo-camera-stop" class="secondary">Dừng camera</button>
        </div>
      `;
      target.appendChild(wrapper);

      const cameraDeviceSelect = wrapper.querySelector('#photo-camera-device');
      const cameraResolutionSelect = wrapper.querySelector('#photo-camera-resolution');
      const applyCameraBtn = wrapper.querySelector('#photo-camera-apply');
      const targetPathInput = wrapper.querySelector('#photo-target-path');
      const videoEl = wrapper.querySelector('#photo-live-video');
      const canvasEl = wrapper.querySelector('#photo-canvas');
      const saveButton = wrapper.querySelector('#photo-capture-save');
      const stopButton = wrapper.querySelector('#photo-camera-stop');

      const preloadPath = async () => {
        if (appState?.settings?.captureSavePath) {
          targetPathInput.value = appState.settings.captureSavePath;
          return;
        }
        try {
          const settings = await storage.getSettings();
          appState.settings = settings;
          if (settings.captureSavePath) {
            targetPathInput.value = settings.captureSavePath;
          }
        } catch {
          // ignore
        }
      };

      const applySelectedCamera = async () => {
        await startCamera(videoEl, cameraDeviceSelect, cameraResolutionSelect);
      };

      listCameras(cameraDeviceSelect)
        .then(applySelectedCamera)
        .catch(() => showToast('Không thể khởi động camera'));
      preloadPath();

      applyCameraBtn.addEventListener('click', async () => {
        try {
          await applySelectedCamera();
          showToast('Đã áp dụng cấu hình camera');
        } catch {
          showToast('Không thể áp dụng camera');
        }
      });

      stopButton.addEventListener('click', () => {
        stopCamera(videoEl);
      });

      saveButton.addEventListener('click', async () => {
        if (!videoEl.videoWidth || !videoEl.videoHeight) {
          showToast('Camera chưa sẵn sàng');
          return;
        }
        const targetPath = targetPathInput.value.trim();
        if (!targetPath) {
          showToast('Vui lòng nhập đường dẫn lưu ảnh');
          return;
        }

        canvasEl.width = videoEl.videoWidth;
        canvasEl.height = videoEl.videoHeight;
        const context = canvasEl.getContext('2d');
        context.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
        const dataUrl = canvasEl.toDataURL('image/png', 0.92);

        try {
          const result = await storage.uploadImageToPath(dataUrl, targetPath);
          showToast(`Đã lưu ảnh: ${result.path}`);
        } catch (error) {
          showToast(error.message || 'Không thể lưu ảnh');
        }
      });
    },
    destroy() {
      stopCamera();
    }
  };
}
