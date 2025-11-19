import { bootstrapSpa } from './app/main.js';

// Khởi động SPA sau khi token đã được thiết lập bởi login.js
if (typeof window !== 'undefined') {
  bootstrapSpa();
}
