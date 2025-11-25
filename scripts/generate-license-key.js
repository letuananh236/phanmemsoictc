import { collectHardwareInfo, generateLicenseKey, generateMachineKey } from '../src/hardware-id.js';

function log(title, value) {
  console.log(`${title}: ${value || '(không đọc được)'}`);
}

const info = collectHardwareInfo();
const key = generateMachineKey();
const licenseKey = generateLicenseKey(key);

console.log('Thông tin phần cứng:');
log('- CPU Serial', info.cpuSerial);
log('- Ổ cứng Serial', info.diskSerial);
log('- RAM (MB)', info.ramMb);
console.log('\nMã phần mềm (dựa trên serial + RAM):');
console.log(key);
console.log('\nMã bản quyền (dựa trên mã máy):');
console.log(licenseKey);
