import { storage, showToast } from './storage.js';

const PREFERRED_CAMERA_KEY = 'preferredCameraId';

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

  async function startCamera(deviceId) {
    if (currentStream) {
      currentStream.getTracks().forEach((track) => track.stop());
    }
    try {
      currentStream = await navigator.mediaDevices.getUserMedia({
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
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

  function renderGallery() {
    galleryEl.innerHTML = '';
    capturedImages.forEach((image, index) => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.innerHTML = `
        <input type="checkbox" ${selectedImages.includes(image) ? 'checked' : ''} />
        <img src="${image.dataUrl}" alt="Ảnh ${index + 1}" />
        <span>${image.name}</span>
      `;
      const checkbox = item.querySelector('input');
      checkbox.addEventListener('change', () => toggleSelection(image));
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
