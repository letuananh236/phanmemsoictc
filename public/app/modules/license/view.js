import { React, ReactDOM } from '../../../vendor/react-lite.js';
import { api } from '../../api/client.js';
import { setState } from '../../state.js';
import { el } from '../../components/common/dom.js';

const { createElement: h, useEffect, useState } = React;

function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('vi-VN');
}

function LicenseBanner({ daysLeft }) {
  if (typeof daysLeft !== 'number' || daysLeft >= 15) return null;
  return h(
    'div',
    { className: 'license-alert' },
    daysLeft <= 0 ? 'License đã hết hạn. Vui lòng kích hoạt để tiếp tục sử dụng.' : `License còn ${daysLeft} ngày. Hãy kích hoạt sớm để tránh gián đoạn.`
  );
}

function LicenseCard({ license }) {
  const typeLabel = (license?.licenseType || license?.LicenseType || 'trial').toUpperCase();
  const status = license?.status || (license?.daysLeft > 0 ? 'valid' : 'expired');
  return h(
    'div',
    { className: 'license-card' },
    h('div', { className: 'license-card__header' }, [
      h('div', { className: 'license-type' }, typeLabel),
      h('div', { className: `license-chip ${license?.daysLeft <= 15 ? 'chip-warning' : ''}` }, `Còn ${license?.daysLeft ?? 0} ngày`)
    ]),
    h('div', { className: 'license-meta' }, [
      h('div', null, [h('span', { className: 'label' }, 'Ngày kích hoạt'), h('p', null, formatDate(license?.ActivatedAt || license?.activatedAt))]),
      h('div', null, [h('span', { className: 'label' }, 'Ngày hết hạn'), h('p', null, formatDate(license?.ExpireAt || license?.expireAt))]),
      h('div', null, [h('span', { className: 'label' }, 'Trạng thái'), h('p', null, status === 'valid' ? 'Hợp lệ' : 'Hết hạn')])
    ])
  );
}

function MachineInfo({ machineId, onCopy }) {
  return h(
    'div',
    { className: 'machine-card' },
    h('div', { className: 'machine-card__row' }, [h('span', { className: 'label' }, 'Mã máy'), h('code', null, machineId || '—')]),
    h('button', { className: 'btn secondary', type: 'button', onClick: onCopy, disabled: !machineId }, 'Copy mã máy')
  );
}

function ActivationForm({ activationKey, onChange, onSubmit, loading }) {
  return h(
    'form',
    {
      className: 'activation-card',
      onsubmit: (e) => {
        e.preventDefault();
        onSubmit();
      }
    },
    h('div', { className: 'field' }, [
      h('span', null, 'Mã kích hoạt'),
      h('input', {
        type: 'text',
        required: true,
        value: activationKey,
        oninput: (e) => onChange(e.target.value),
        placeholder: 'Nhập mã kích hoạt'
      })
    ]),
    h(
      'button',
      { className: 'btn primary large', type: 'submit', disabled: loading },
      loading ? 'Đang kích hoạt…' : 'KÍCH HOẠT'
    )
  );
}

function LicensePage() {
  const [license, setLicense] = useState(null);
  const [activationKey, setActivationKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const data = await api.getLicense();
      const info = data?.license || data;
      setLicense(info);
      setState({ license: { status: info?.status, daysLeft: info?.daysLeft ?? 0, type: info?.licenseType || info?.LicenseType || 'trial' } });
    } catch (err) {
      console.error(err);
      setError('Không thể tải thông tin license.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleActivate() {
    if (!activationKey.trim()) return;
    setMessage('');
    setError('');
    setLoading(true);
    try {
      const data = await api.activateLicense({ licenseKey: activationKey.trim() });
      const info = data?.license || data;
      setActivationKey('');
      setLicense(info);
      setMessage('Kích hoạt thành công.');
      setState({ license: { status: info?.status, daysLeft: info?.daysLeft ?? 0, type: info?.licenseType || info?.LicenseType || 'trial' } });
    } catch (err) {
      console.error(err);
      setError('Kích hoạt không thành công. Vui lòng kiểm tra mã.');
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!license?.MachineID) return;
    navigator.clipboard
      ?.writeText(license.MachineID)
      .then(() => setMessage('Đã copy mã máy.'))
      .catch(() => setMessage('Không thể copy, vui lòng copy thủ công.'));
  }

  const daysLeft = license?.daysLeft ?? 0;
  return h(
    'section',
    { className: 'license-page' },
    h(LicenseBanner, { daysLeft }),
    h('div', { className: 'license-grid' }, [
      h('div', { className: 'license-column' }, [
        h('h2', null, 'Tình trạng bản quyền'),
        loading && h('div', { className: 'skeleton' }, 'Đang tải...'),
        !loading && h(LicenseCard, { license }),
        error && h('div', { className: 'error-banner' }, error),
        message && h('div', { className: 'success-banner' }, message)
      ]),
      h('div', { className: 'license-column' }, [
        h('h2', null, 'Thông tin máy & kích hoạt'),
        h(MachineInfo, { machineId: license?.MachineID, onCopy: handleCopy }),
        h(ActivationForm, { activationKey, onChange: setActivationKey, onSubmit: handleActivate, loading })
      ])
    ])
  );
}

export function renderLicense() {
  const container = el('<div class="panel"></div>');
  const root = ReactDOM.createRoot(container);
  root.render(h(LicensePage));
  return { node: container, cleanup: () => root.unmount() };
}
