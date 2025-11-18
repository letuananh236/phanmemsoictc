import { React, ReactDOM } from '../../../vendor/react-lite.js';
import { api } from '../../api/client.js';
import { setState } from '../../state.js';

const { createElement: h, useEffect, useRef, useState } = React;

function Thumb({ image, index, onRemove, onSelect, active }) {
  return h(
    'div',
    { className: `thumb ${active ? 'active' : ''}` },
    h('div', { className: 'thumb-order' }, index + 1),
    h('img', { src: image.url || image.dataUrl, alt: `Ảnh ${index + 1}` }),
    onRemove
      ? h(
          'button',
          {
            type: 'button',
            className: 'thumb-remove',
            onclick: () => onRemove(index)
          },
          '×'
        )
      : null,
    onSelect
      ? h(
          'button',
          {
            type: 'button',
            className: 'thumb-select',
            onclick: () => onSelect(index)
          },
          'Chọn'
        )
      : null
  );
}

function CameraPage({ visitId, onClose, onLicenseExpired }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [deviceId, setDeviceId] = useState(localStorage.getItem('preferredCameraId') || '');
  const [captured, setCaptured] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [zoomSelected, setZoomSelected] = useState(false);
  const [gallery, setGallery] = useState([]);
  const [page, setPage] = useState(0);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const perPage = 8;
  const pagedGallery = gallery.slice(page * perPage, page * perPage + perPage);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const list = await api.listVisitImages(visitId);
        if (mounted) setGallery(list || []);
      } catch (err) {
        console.error(err);
        setMessage(err?.message || 'Không tải được ảnh hiện có');
      }
    }
    async function detectDevices() {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      try {
        const list = await navigator.mediaDevices.enumerateDevices();
        const cams = list.filter((d) => d.kind === 'videoinput');
        if (mounted) {
          setDevices(cams);
          if (!deviceId && cams[0]) setDeviceId(cams[0].deviceId);
        }
      } catch (err) {
        console.error(err);
      }
    }
    load();
    detectDevices();
    return () => {
      mounted = false;
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, [visitId]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'F4') {
        e.preventDefault();
        handleCapture();
      }
      if (e.key === 'F10') {
        e.preventDefault();
        handleAccept();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage('Trình duyệt không hỗ trợ camera.');
      return;
    }
    try {
      setBusy(true);
      const constraints = deviceId ? { video: { deviceId: { exact: deviceId } } } : { video: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      localStorage.setItem('preferredCameraId', deviceId || '');
      setMessage('Camera đã sẵn sàng.');
    } catch (err) {
      if (err?.status === 403 && onLicenseExpired) onLicenseExpired();
      setMessage('Không thể mở camera, kiểm tra quyền truy cập.');
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  async function handleCapture() {
    if (!visitId) {
      setMessage('Chưa có phiếu khám để lưu ảnh.');
      return;
    }
    if (captured.length + gallery.length >= 4) {
      setMessage('Đã đủ 4 ảnh cho phiếu khám này.');
      return;
    }
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setMessage('Camera chưa sẵn sàng.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCaptured((prev) => prev.concat({ dataUrl }));
    setSelectedIndex((prev) => (prev === null ? 0 : prev));
    setMessage('Đã chụp ảnh.');
  }

  function handleRemove(index) {
    setCaptured((prev) => prev.filter((_, i) => i !== index));
    setSelectedIndex((prev) => (prev && prev >= index ? Math.max(prev - 1, 0) : prev));
  }

  function handleClear() {
    setCaptured([]);
    setSelectedIndex(0);
  }

  async function handleAccept() {
    if (!captured.length) return;
    try {
      setBusy(true);
      for (const img of captured) {
        await api.uploadVisitImage({ visitId, dataUrl: img.dataUrl });
      }
      setState({ imageRefreshToken: Date.now() });
      onClose?.();
    } catch (err) {
      console.error(err);
      setMessage(err?.message || 'Tải ảnh lên thất bại');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [deviceId]);

  const selectedImage = captured[selectedIndex] || null;

  return h(
    'div',
    { className: 'camera-page' },
    h(
      'div',
      { className: 'camera-panel controls' },
      h('h2', null, 'LẤY HÌNH ẢNH'),
      h('label', { className: 'field' }, 'Chọn capture',
        h(
          'select',
          {
            value: deviceId,
            onchange: (e) => setDeviceId(e.target.value)
          },
          devices.length
            ? devices.map((d) => h('option', { value: d.deviceId }, d.label || 'Camera'))
            : [h('option', { value: '' }, 'Không tìm thấy camera')]
        )
      ),
      h('button', { className: 'btn secondary wide', type: 'button', onClick: startCamera, disabled: busy }, 'Mở camera'),
      h('button', { className: 'btn primary wide', type: 'button', onClick: handleCapture, disabled: busy }, 'Chụp hình (F4)'),
      h(
        'label',
        { className: 'checkbox-row' },
        h('input', {
          type: 'checkbox',
          checked: zoomSelected,
          onchange: (e) => setZoomSelected(e.target.checked)
        }),
        'Phóng to hình ảnh lựa chọn'
      ),
      h('div', { className: 'selected-grid' },
        captured.map((img, idx) =>
          h(Thumb, {
            image: img,
            index: idx,
            onRemove: handleRemove,
            onSelect: () => setSelectedIndex(idx),
            active: idx === selectedIndex
          })
        )
      ),
      h('div', { className: 'action-stack' },
        h('button', { className: 'btn primary wide', type: 'button', onClick: handleAccept, disabled: busy || !captured.length }, 'Chấp nhận (F10)'),
        h('button', { className: 'btn danger wide', type: 'button', onClick: handleClear, disabled: busy || !captured.length }, 'Xóa toàn bộ ảnh'),
        h('button', { className: 'btn secondary wide', type: 'button', onClick: () => { stopCamera(); onClose?.(); } }, 'Đóng (Esc)')
      )
    ),
    h(
      'div',
      { className: 'camera-panel preview' },
      zoomSelected && selectedImage
        ? h('img', { src: selectedImage.dataUrl, alt: 'Xem lớn', className: 'preview-large' })
        : h('video', {
            ref: videoRef,
            className: 'video-preview large',
            playsInline: true,
            muted: true,
            autoPlay: true,
            style: 'background:#fff;'
          }),
      message && h('div', { className: 'inline-hint' }, message)
    ),
    h(
      'div',
      { className: 'camera-panel gallery' },
        h('div', { className: 'panel-header spaced' },
          h('div', null, 'Ảnh đã lưu'),
          h('div', { className: 'pager' },
            h('button', { type: 'button', className: 'btn ghost', onclick: () => setPage((p) => Math.max(p - 1, 0)) }, '<<'),
            h('span', null, `Trang ${page + 1}`),
            h(
              'button',
              {
                type: 'button',
                className: 'btn ghost',
                onclick: () => setPage((p) => ((p + 1) * perPage < gallery.length ? p + 1 : p))
              },
              '>>'
            )
          )
        ),
      h(
        'div',
        { className: 'thumb-grid remote' },
        pagedGallery.length
          ? pagedGallery.map((img, idx) =>
              h(Thumb, {
                image: img,
                index: idx + page * perPage,
                onRemove: null,
                active: false,
                onSelect: null
              })
            )
          : h('div', { className: 'muted' }, 'Chưa có ảnh nào được lưu')
      )
    )
  );
}

export function renderCamera(state, { navigate }) {
  const container = document.createElement('div');
  const root = ReactDOM.createRoot(container);
  const visitId = state.selectedExamId;
  const onClose = () => navigate('examinations', { selectedExamId: visitId, imageRefreshToken: Date.now() });
  root.render(h(CameraPage, { visitId, onClose, onLicenseExpired: () => navigate('license') }));
  return { node: container, cleanup: () => root.unmount() };
}
