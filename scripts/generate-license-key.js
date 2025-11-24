import { collectHardwareInfo, generateMachineKey } from '../src/hardware-id.js';

function log(title, value) {
  console.log(`${title}: ${value || '(không đọc được)'}`);
}

const info = collectHardwareInfo();
const key = generateMachineKey();

console.log('Thông tin phần cứng:');
log('- CPU Serial', info.cpuSerial);
log('- Ổ cứng Serial', info.diskSerial);
log('- RAM (MB)', info.ramMb);
console.log('\nMã phần mềm (dựa trên serial + RAM):');
console.log(key);
