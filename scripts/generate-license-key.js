import { collectHardwareInfo, generateLicenseKey, generateMachineKey } from '../src/utils/hardware-id.js';

function log(title, value) {
  console.log(`${title}: ${value || '(không đọc được)'}`);
}

const args = process.argv.slice(2);
const manualIndex = args.indexOf('--machine');
const manualMachineKey = manualIndex !== -1 ? args[manualIndex + 1] : '';

const info = collectHardwareInfo();
const machineKey = manualMachineKey || generateMachineKey();

console.log('Thông tin phần cứng:');
log('- CPU Serial', info.cpuSerial);
log('- Ổ cứng Serial', info.diskSerial);
log('- RAM (MB)', info.ramMb);
console.log(`\nMã phần mềm (dựa trên serial + RAM${manualMachineKey ? ' hoặc mã nhập thủ công' : ''}):`);
console.log(machineKey);
console.log('\nMã bản quyền:');
console.log('- 30 ngày:', generateLicenseKey(machineKey, 'thirty_day'));
console.log('- 1 năm   :', generateLicenseKey(machineKey, 'yearly'));
console.log('- Vĩnh viễn:', generateLicenseKey(machineKey, 'lifetime'));
