(() => {
  const data = window.cameraPageData || {};
  const examId = data.examId || '';
  const images = Array.isArray(data.images) ? data.images : [];

  const videoEl = document.getElementById('cameraVideo');
  const canvasEl = document.getElementById('cameraCanvas');
  const deviceSelect = document.getElementById('cameraDeviceSelect');
  const capturedGrid = document.getElementById('capturedGrid');
  const selectedThumbnails = document.getElementById('selectedThumbnails');
  const selectedImageIdsInput = document.getElementById('selectedImageIds');
  const confirmForm = document.getElementById('confirmForm');

  let mediaStream = null;
  let captured = images.map((img) => ({
    id: img.id,
    filePath: img.file_path || img.filePath,
    examId: img.exam_id,
    selected: examId && img.exam_id && String(img.exam_id) === String(examId)
  }));
  let page = 0;
  const pageSize = 18;

  function getSelectedIds() {
    return captured.filter((c) => c.selected).map((c) => c.id);
  }

  function renderSelected() {
    const selectedIds = getSelectedIds();
    selectedThumbnails.innerHTML = '';
    for (let i = 0; i < 4; i += 1) {
      const image = captured.find((c) => c.id === selectedIds[i]);
      const slot = document.createElement('div');
      if (image) {
        slot.className = 'camera-thumb';
        const imgEl = document.createElement('img');
        imgEl.src = image.filePath;
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'thumb-remove';
        removeBtn.textContent = '×';
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          image.selected = false;
          renderSelected();
          renderCaptured();
        });
        slot.appendChild(imgEl);
        slot.appendChild(removeBtn);
      } else {
        slot.className = 'camera-slot camera-slot-empty';
        slot.textContent = 'Trống';
      }
      selectedThumbnails.appendChild(slot);
    }
    selectedImageIdsInput.value = selectedIds.join(',');
  }

  function renderCaptured() {
    const selectedIds = getSelectedIds();
    capturedGrid.innerHTML = '';
    const start = page * pageSize;
    const items = captured.slice(start, start + pageSize);
    items.forEach((item) => {
      const slot = document.createElement('div');
      slot.className = 'thumb';
      if (selectedIds.includes(item.id)) slot.classList.add('selected');
      const imgEl = document.createElement('img');
      imgEl.src = item.filePath;
      slot.appendChild(imgEl);
      slot.addEventListener('click', () => {
        if (item.selected) {
          item.selected = false;
        } else {
          const count = getSelectedIds().length;
          if (count >= 4) {
            alert('Chỉ chọn tối đa 4 ảnh.');
            return;
          }
          item.selected = true;
        }
        renderSelected();
        renderCaptured();
      });
      capturedGrid.appendChild(slot);
    });
  }

  async function listDevices() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      deviceSelect.innerHTML = '';
      videoInputs.forEach((d, idx) => {
        const opt = document.createElement('option');
        opt.value = d.deviceId;
        opt.textContent = d.label || `Camera ${idx + 1}`;
        deviceSelect.appendChild(opt);
      });
    } catch (err) {
      console.error('Không thể liệt kê camera', err);
    }
  }

  async function startStream(deviceId) {
    try {
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
      }
      mediaStream = await navigator.mediaDevices.getUserMedia({ video: deviceId ? { deviceId: { exact: deviceId } } : true });
      videoEl.srcObject = mediaStream;
    } catch (err) {
      console.error('Không thể mở camera', err);
      alert('Không mở được camera. Vui lòng kiểm tra thiết bị hoặc quyền truy cập.');
    }
  }

  function captureFrame() {
    if (!mediaStream) return;
    const track = mediaStream.getVideoTracks()[0];
    const settings = track?.getSettings?.() || {};
    const width = settings.width || videoEl.videoWidth || 1280;
    const height = settings.height || videoEl.videoHeight || 720;
    canvasEl.width = width;
    canvasEl.height = height;
    const ctx = canvasEl.getContext('2d');
    ctx.drawImage(videoEl, 0, 0, width, height);
    canvasEl.toBlob(async (blob) => {
      if (!blob) return;
      try {
        const fd = new FormData();
        fd.append('image', blob, 'capture.jpg');
        const target = examId ? examId : 'session';
        const resp = await fetch(`/camera/${encodeURIComponent(target)}/capture`, { method: 'POST', body: fd });
        const json = await resp.json();
        if (json.success && json.image) {
          captured.unshift({ id: json.image.id, filePath: json.image.filePath, examId: json.image.examId, selected: false });
          renderCaptured();
        } else {
          alert('Không thể lưu ảnh.');
        }
      } catch (err) {
        console.error('captureFrame error', err);
        alert('Không thể lưu ảnh, vui lòng thử lại.');
      }
    }, 'image/jpeg', 1);
  }

  function handleAcceptImages() {
    if (!examId) {
      alert('Vui lòng lưu phiếu khám trước khi gắn ảnh.');
      return;
    }
    const selectedIds = getSelectedIds();
    if (!selectedIds.length) {
      alert('Chưa chọn ảnh.');
      return;
    }
    selectedImageIdsInput.value = selectedIds.join(',');
    confirmForm.submit();
  }

  function clearAll() {
    captured = [];
    renderSelected();
    renderCaptured();
  }

  function init() {
    listDevices().then(() => startStream(deviceSelect.value));
    renderSelected();
    renderCaptured();
  }

  document.getElementById('btnCapture').addEventListener('click', captureFrame);
  document.getElementById('btnAcceptImages').addEventListener('click', handleAcceptImages);
  document.getElementById('btnClearImages').addEventListener('click', clearAll);
  document.getElementById('btnPrevPage').addEventListener('click', () => {
    if (page > 0) {
      page -= 1;
      renderCaptured();
    }
  });
  document.getElementById('btnNextPage').addEventListener('click', () => {
    if ((page + 1) * pageSize < captured.length) {
      page += 1;
      renderCaptured();
    }
  });
  deviceSelect.addEventListener('change', (e) => startStream(e.target.value));

  window.addEventListener('keydown', (e) => {
    if (e.key === 'F4') {
      e.preventDefault();
      captureFrame();
    }
    if (e.key === 'F10') {
      e.preventDefault();
      handleAcceptImages();
    }
    if (e.key === 'Escape') {
      window.history.back();
    }
  });

  init();
})();
