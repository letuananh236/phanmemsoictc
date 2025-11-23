(() => {
  const data = window.cameraPageData || {};
  const examId = data.examId || '';
  const initialImages = Array.isArray(data.images) ? data.images : [];

  const MAX_SELECTED = 4;
  const MAX_GALLERY = 10;

  const videoEl = document.getElementById('cameraVideo');
  const canvasEl = document.getElementById('cameraCanvas');
  const deviceSelect = document.getElementById('cameraDeviceSelect');
  const capturedGrid = document.getElementById('capturedGrid');
  const selectedThumbnails = document.getElementById('selectedThumbnails');
  const selectedImageIdsInput = document.getElementById('selectedImageIds');
  const confirmForm = document.getElementById('confirmForm');

  let mediaStream = null;
  let captured = initialImages
    .map((img) => ({
      id: img.id,
      filePath: img.file_path || img.filePath,
      examId: img.exam_id,
      selected: examId && img.exam_id && String(img.exam_id) === String(examId)
    }))
    .slice(0, MAX_GALLERY);

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

  function captureCurrentFrame() {
    return new Promise((resolve, reject) => {
      if (!mediaStream) return reject(new Error('NO_STREAM'));
      const track = mediaStream.getVideoTracks()[0];
      const settings = track?.getSettings?.() || {};
      const width = settings.width || videoEl.videoWidth || 1280;
      const height = settings.height || videoEl.videoHeight || 720;
      canvasEl.width = width;
      canvasEl.height = height;
      const ctx = canvasEl.getContext('2d');
      ctx.drawImage(videoEl, 0, 0, width, height);
      canvasEl.toBlob((blob) => {
        if (!blob) return reject(new Error('NO_BLOB'));
        resolve(blob);
      }, 'image/jpeg', 1);
    });
  }

  function getSelectedIds() {
    return captured.filter((c) => c.selected).map((c) => c.id);
  }

  function renderSelected() {
    const selectedIds = getSelectedIds();
    selectedThumbnails.innerHTML = '';
    for (let i = 0; i < MAX_SELECTED; i += 1) {
      const image = captured.find((c) => c.id === selectedIds[i]);
      const slot = document.createElement('div');
      if (image) {
        slot.className = 'camera-thumb camera-slot';
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

  function updateActionState(btn, disabled) {
    btn.disabled = disabled;
    if (disabled) {
      btn.classList.add('is-disabled');
    } else {
      btn.classList.remove('is-disabled');
    }
  }

  function renderCaptured() {
    const selectedIds = getSelectedIds();
    capturedGrid.innerHTML = '';
    const items = captured.slice(0, MAX_GALLERY);
    items.forEach((item) => {
      const slot = document.createElement('div');
      slot.className = 'thumb-item';
      if (selectedIds.includes(item.id)) slot.classList.add('is-selected');

      const imgWrap = document.createElement('div');
      imgWrap.className = 'thumb-image';
      const imgEl = document.createElement('img');
      imgEl.src = item.filePath;
      imgWrap.appendChild(imgEl);
      slot.appendChild(imgWrap);

      const actions = document.createElement('div');
      actions.className = 'thumb-actions';

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'btn-thumb-delete';
      delBtn.textContent = 'Xóa';
      updateActionState(delBtn, item.selected);
      delBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (delBtn.disabled) return;
        const confirmed = window.confirm('Xóa ảnh này?');
        if (!confirmed) return;
        try {
          const resp = await fetch(`/camera/image/${item.id}/delete`, { method: 'POST' });
          const json = await resp.json();
          if (json.success) {
            captured = captured.filter((c) => c.id !== item.id);
            renderSelected();
            renderCaptured();
          } else {
            alert('Không thể xóa ảnh.');
          }
        } catch (err) {
          console.error('delete image error', err);
          alert('Không thể xóa ảnh.');
        }
      });

      const retakeBtn = document.createElement('button');
      retakeBtn.type = 'button';
      retakeBtn.className = 'btn-thumb-retake';
      retakeBtn.textContent = 'Chụp lại';
      updateActionState(retakeBtn, item.selected);
      retakeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (retakeBtn.disabled) return;
        try {
          const blob = await captureCurrentFrame();
          const fd = new FormData();
          fd.append('image', blob, 'retake.jpg');
          const target = examId ? examId : 'session';
          const resp = await fetch(`/camera/${encodeURIComponent(target)}/image/${item.id}/retake`, {
            method: 'POST',
            body: fd
          });
          const json = await resp.json();
          if (json.success && json.image) {
            captured = captured.filter((c) => c.id !== item.id);
            captured.unshift({ id: item.id, filePath: json.image.filePath, examId: null, selected: false });
            captured = captured.slice(0, MAX_GALLERY);
            renderSelected();
            renderCaptured();
          } else {
            alert('Không thể chụp lại ảnh.');
          }
        } catch (err) {
          console.error('retake image error', err);
          alert('Không thể chụp lại ảnh.');
        }
      });

      actions.appendChild(delBtn);
      actions.appendChild(retakeBtn);
      slot.appendChild(actions);

      slot.addEventListener('click', () => {
        if (item.selected) {
          item.selected = false;
        } else {
          const count = getSelectedIds().length;
          if (count >= MAX_SELECTED) {
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

  async function captureFrame() {
    try {
      const blob = await captureCurrentFrame();
      const fd = new FormData();
      fd.append('image', blob, 'capture.jpg');
      const target = examId ? examId : 'session';
      const resp = await fetch(`/camera/${encodeURIComponent(target)}/capture`, { method: 'POST', body: fd });
      const json = await resp.json();
      if (json.success && json.image) {
        captured.unshift({ id: json.image.id, filePath: json.image.filePath, examId: json.image.examId, selected: false });
        captured = captured.slice(0, MAX_GALLERY);
        renderCaptured();
      } else {
        alert('Không thể lưu ảnh.');
      }
    } catch (err) {
      console.error('captureFrame error', err);
      alert('Không thể lưu ảnh, vui lòng thử lại.');
    }
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
    // pagination not necessary with 10 items; keep placeholder
  });
  document.getElementById('btnNextPage').addEventListener('click', () => {
    // pagination not necessary with 10 items; keep placeholder
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
