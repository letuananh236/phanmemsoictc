import fs from 'node:fs';
import { createBackup, listBackupHistory, restoreBackup } from '../services/backupService.js';

export const backupRoutes = [
  {
    method: 'GET',
    path: '/backup',
    handler: async () => {
      const info = await createBackup('download');
      const fileBuffer = await fs.promises.readFile(info.backupPath);
      return {
        raw: fileBuffer,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${info.fileName}"`
        }
      };
    }
  },
  {
    method: 'POST',
    path: '/backup/create',
    handler: async () => {
      const info = await createBackup();
      return { data: info, message: 'Đã tạo file backup.' };
    }
  },
  {
    method: 'GET',
    path: '/backup/history',
    handler: () => ({ data: { items: listBackupHistory(20) } })
  },
  {
    method: 'POST',
    path: '/backup/restore',
    bodyType: 'buffer',
    handler: async ({ rawBody }) => {
      await restoreBackup(rawBody);
      return { message: 'Đã khôi phục dữ liệu.' };
    }
  },
  {
    method: 'POST',
    path: '/restore',
    bodyType: 'buffer',
    handler: async ({ rawBody }) => {
      await restoreBackup(rawBody);
      return { message: 'Đã khôi phục dữ liệu.' };
    }
  },
  {
    method: 'POST',
    path: '/backup',
    bodyType: 'buffer',
    handler: async ({ rawBody }) => {
      await restoreBackup(rawBody);
      return { message: 'Đã khôi phục dữ liệu.' };
    }
  }
];
