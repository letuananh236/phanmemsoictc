import { storage, showToast } from './storage.js';

const PREFERRED_CAMERA_KEY = 'preferredCameraId';
const CAMERA_SETTINGS_KEY = 'cameraSettings';
const DEFAULT_CAMERA_SETTINGS = { width: 1280, height: 720, frameRate: 30 };

export function createCaptureView(appState) {
  let container;
  let videoEl;
  let galleryEl;
  let selectedEl;
  let currentStream;
  let capturedImages = [];
  let selectedImages = [];
  let captureContext = { examId: '' };
  let keyHandler;

  document.addEventListener('exam:context', (event) => {
    captureContext = event.detail;
  });

  async function listCameras(selectEl) {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((d) => d.kind === 'videoinput');
    selectEl.innerHTML = '';
    videoDevices.forEach((device) => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.textContent = device.label || `Camera ${selectEl.length + 1}`;
      selectEl.appendChild(option);
    });
  }

  function getPreferredCameraId() {
    return localStorage.getItem(PREFERRED_CAMERA_KEY);
  }

  function setPreferredCameraId(deviceId) {
    localStorage.setItem(PREFERRED_CAMERA_KEY, deviceId);
  }

  function getCameraSettings() {
    try {
      const stored = JSON.parse(localStorage.getItem(CAMERA_SETTINGS_KEY) || 'null');
      return { ...DEFAULT_CAMERA_SETTINGS, ...stored };
    } catch (error) {
      console.error('Unable to read camera settings', error);
      return DEFAULT_CAMERA_SETTINGS;
    }
  }

  function saveCameraSettings(settings) {
    localStorage.setItem(CAMERA_SETTINGS_KEY, JSON.stringify(settings));
  }

  async function startCamera(deviceId) {
    const settings = getCameraSettings();

    if (currentStream) {
      currentStream.getTracks().forEach((track) => track.stop());
    }
    try {
      const videoConstraints = deviceId ? { deviceId: { exact: deviceId } } : {};
      if (settings.width) videoConstraints.width = { ideal: Number(settings.width) };
      if (settings.height) videoConstraints.height = { ideal: Number(settings.height) };
      if (settings.frameRate) videoConstraints.frameRate = { ideal: Number(settings.frameRate) };

      currentStream = await navigator.mediaDevices.getUserMedia({
        video: Object.keys(videoConstraints).length > 0 ? videoConstraints : true,
        audio: false
      });
      videoEl.srcObject = currentStream;
      await videoEl.play();
    } catch (error) {
      console.error('Unable to start camera', error);
      showToast('Không mở được camera đã chọn');
    }
  }

  function autoStartCamera(selectEl) {
    const preferredId = getPreferredCameraId();
    const options = Array.from(selectEl.options).map((option) => option.value);
    const targetId = options.includes(preferredId) ? preferredId : options[0];
    if (targetId) {
      selectEl.value = targetId;
      startCamera(targetId);
    }
  }

  function saveCameraSelection(selectEl) {
    const deviceId = selectEl.value;
    if (!deviceId) {
      showToast('Vui lòng chọn camera');
      return;
    }
    setPreferredCameraId(deviceId);
    startCamera(deviceId);
    showToast('Đã lưu camera mặc định');
  }

  function openCameraSettings(selectEl) {
    const existingModal = document.getElementById('camera-settings-modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('section');
    modal.className = 'modal';
    modal.id = 'camera-settings-modal';

    const settings = getCameraSettings();

    modal.innerHTML = `
      <div class="modal-card">
        <h3>Cài đặt thông số camera</h3>
        <form id="camera-settings-form">
          <div class="form-row inline-fields">
            <div class="field">
              <label for="camera-width">Độ rộng (px)</label>
              <input type="number" id="camera-width" name="width" min="320" value="${settings.width}" />
            </div>
            <div class="field">
              <label for="camera-height">Chiều cao (px)</label>
              <input type="number" id="camera-height" name="height" min="240" value="${settings.height}" />
            </div>
          </div>
          <div class="form-row">
            <label for="camera-framerate">Tốc độ khung hình (fps)</label>
            <input type="number" id="camera-framerate" name="frameRate" min="1" value="${settings.frameRate}" />
          </div>
          <div class="toolbar">
            <button type="submit">Lưu và áp dụng</button>
            <button type="button" class="secondary" id="camera-settings-cancel">Hủy</button>
          </div>
        </form>
      </div>
    `;

    const closeModal = () => {
      modal.remove();
    };

    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeModal();
      }
    });

    const form = modal.querySelector('#camera-settings-form');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const width = Number(form.width.value) || DEFAULT_CAMERA_SETTINGS.width;
      const height = Number(form.height.value) || DEFAULT_CAMERA_SETTINGS.height;
      const frameRate = Number(form.frameRate.value) || DEFAULT_CAMERA_SETTINGS.frameRate;

      const newSettings = { width, height, frameRate };
      saveCameraSettings(newSettings);
      closeModal();
      const deviceId = selectEl.value;
      startCamera(deviceId);
      showToast('Đã lưu cài đặt camera');
    });

    modal.querySelector('#camera-settings-cancel').addEventListener('click', closeModal);

    document.body.appendChild(modal);
  }

  function renderGallery() {
    galleryEl.innerHTML = '';
    capturedImages.forEach((image, index) => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.classList.toggle('selected', selectedImages.includes(image));
      item.innerHTML = `
        <div class="gallery-thumb">
          <img src="${image.dataUrl}" alt="Ảnh ${index + 1}" />
        </div>
      `;
      item.addEventListener('click', () => toggleSelection(image));
      galleryEl.appendChild(item);
    });
    renderSelectedPreview();
  }

  function toggleSelection(image) {
    const limit = appState.settings?.defaultImageCount || 4;
    if (selectedImages.includes(image)) {
      selectedImages = selectedImages.filter((img) => img !== image);
    } else {
      if (selectedImages.length >= limit) {
        alert(`Chỉ được chọn tối đa ${limit} ảnh`);
        return;
      }
      selectedImages.push(image);
    }
    renderGallery();
  }

  function renderSelectedPreview() {
    selectedEl.innerHTML = '';
    const limit = appState.settings?.defaultImageCount || 4;
    for (let i = 0; i < limit; i += 1) {
      const image = selectedImages[i];
      const slot = document.createElement('div');
      slot.className = 'image-slot';
      if (image) {
        slot.innerHTML = `<img src="${image.dataUrl}" alt="Ảnh đã chọn" />`;
      } else {
        slot.textContent = 'Chưa chọn';
      }
      selectedEl.appendChild(slot);
    }
  }

  function capturePhoto() {
    if (!videoEl) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoEl, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    const image = {
      name: `${captureContext.examId || 'HA'}_${capturedImages.length + 1}.png`,
      dataUrl
    };
    capturedImages.unshift(image);
    renderGallery();
  }

  async function acceptImages() {
    const examId = captureContext.examId || 'HA000000';
    const uploads = [];
    for (let i = 0; i < selectedImages.length; i += 1) {
      const image = selectedImages[i];
      const uploadResult = await storage.uploadImage(examId, i + 1, image.dataUrl);
      uploads.push({ path: uploadResult.path, dataUrl: image.dataUrl });
    }
    document.dispatchEvent(new CustomEvent('images:selected', { detail: uploads }));
    showToast('Đã gửi ảnh sang phiếu khám');
    document.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'exam' } }));
  }

  function clearImages() {
    capturedImages = [];
    selectedImages = [];
    renderGallery();
  }

  return {
    render(target) {
      container = document.createElement('section');
      container.className = 'card capture-view';
      container.innerHTML = `
        <div class="capture-layout">
          <div class="capture-controls">
            <div class="form-row">
              <label>Chọn camera</label>
              <select id="camera-select"></select>
            </div>
            <div class="form-row">
              <button type="button" id="start-camera">Lưu camera</button>
              <button type="button" class="secondary" id="open-camera-settings">Cấu hình camera</button>
            </div>
            <div class="form-row">
              <button type="button" id="capture-photo">Chụp hình</button>
            </div>
            <div class="form-row">
              <h4>Ảnh đã chọn</h4>
              <div class="image-grid selected-grid" id="selected-images"></div>
            </div>
            <div class="form-row">
              <button type="button" id="accept-images">Chấp nhận (F10)</button>
              <button type="button" class="secondary" id="clear-images">Xóa tất cả</button>
            </div>
          </div>
          <div class="capture-preview">
            <video autoplay playsinline muted class="video"></video>
          </div>
          <div class="capture-gallery">
            <h4>Gallery ảnh</h4>
            <div id="capture-gallery"></div>
          </div>
        </div>
      `;
      target.appendChild(container);

      videoEl = container.querySelector('video');
      galleryEl = container.querySelector('#capture-gallery');
      selectedEl = container.querySelector('#selected-images');

      const selectEl = container.querySelector('#camera-select');
      listCameras(selectEl).then(() => autoStartCamera(selectEl));

      container.querySelector('#start-camera').addEventListener('click', () => saveCameraSelection(selectEl));
      container
        .querySelector('#open-camera-settings')
        .addEventListener('click', () => openCameraSettings(selectEl));
      container.querySelector('#capture-photo').addEventListener('click', capturePhoto);
      container.querySelector('#accept-images').addEventListener('click', acceptImages);
      container.querySelector('#clear-images').addEventListener('click', clearImages);
      selectedImages = appState.selectedImages || [];
      renderSelectedPreview();

      if (keyHandler) {
        window.removeEventListener('keydown', keyHandler);
      }
      keyHandler = (event) => {
        if (event.key === 'F10' && container.isConnected) {
          event.preventDefault();
          acceptImages();
        }
      };
      window.addEventListener('keydown', keyHandler);
    }
  };
}
