const cameraElement = document.getElementById('camera');
const startCameraButton = document.getElementById('start-camera');
const captureButton = document.getElementById('capture');
const clearPhotosButton = document.getElementById('clear-photos');
const gallery = document.getElementById('photo-gallery');
const canvas = document.getElementById('snapshot-canvas');
const printButton = document.getElementById('print-button');
const logoInput = document.getElementById('logo-input');
const logoImage = document.getElementById('hospital-logo');

let mediaStream = null;

function updateGalleryPlaceholder() {
  const hasPhotos = gallery.querySelectorAll('img').length > 0;
  let placeholder = gallery.querySelector('.photo-gallery__placeholder');

  if (hasPhotos) {
    placeholder?.remove();
  } else if (!placeholder) {
    placeholder = document.createElement('p');
    placeholder.className = 'photo-gallery__placeholder';
    placeholder.textContent = 'Chưa có hình ảnh nào';
    gallery.appendChild(placeholder);
  }
}

async function startCamera() {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
    cameraElement.srcObject = mediaStream;
    captureButton.disabled = false;
    startCameraButton.disabled = true;
  } catch (error) {
    alert('Không thể bật camera. Vui lòng kiểm tra quyền truy cập.');
    console.error(error);
  }
}

function capturePhoto() {
  if (!mediaStream) return;

  const [track] = mediaStream.getVideoTracks();
  const settings = track.getSettings();
  const width = settings.width || 640;
  const height = settings.height || 480;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(cameraElement, 0, 0, width, height);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const image = document.createElement('img');
    image.src = url;
    image.alt = 'Ảnh khám bệnh';
    gallery.appendChild(image);
    updateGalleryPlaceholder();
    clearPhotosButton.disabled = false;
  }, 'image/jpeg', 0.9);
}

function clearPhotos() {
  gallery.querySelectorAll('img').forEach((img) => {
    URL.revokeObjectURL(img.src);
    img.remove();
  });
  updateGalleryPlaceholder();
  clearPhotosButton.disabled = true;
}

function handlePrint() {
  window.print();
}

function handleLogoChange(event) {
  const [file] = event.target.files ?? [];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    logoImage.src = reader.result;
  };
  reader.readAsDataURL(file);
}

startCameraButton?.addEventListener('click', startCamera);
captureButton?.addEventListener('click', capturePhoto);
clearPhotosButton?.addEventListener('click', clearPhotos);
printButton?.addEventListener('click', handlePrint);
logoInput?.addEventListener('change', handleLogoChange);

document.addEventListener('visibilitychange', () => {
  if (document.hidden && mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
    cameraElement.srcObject = null;
    startCameraButton.disabled = false;
    captureButton.disabled = true;
  }
});

updateGalleryPlaceholder();
