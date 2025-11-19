import fs from 'node:fs';
import path from 'node:path';
import { paths } from '../utils/paths.js';

function readIfExists(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    const stat = fs.statSync(filePath);
    return { content: data, updatedAt: stat.mtime.toISOString(), source: path.basename(filePath) };
  } catch (err) {
    if (err?.code !== 'ENOENT') {
      console.warn('[srs] không thể đọc file', filePath, err?.message);
    }
    return null;
  }
}

export function getSrsDocument() {
  const primary = readIfExists(paths.srsFile);
  if (primary) return primary;

  const readmeDoc = readIfExists(paths.readmeFile);
  if (readmeDoc) return readmeDoc;

  const fallback = readIfExists(paths.promptSrsFile);
  if (fallback) return fallback;

  const now = new Date().toISOString();
  return {
    content: 'Chưa có tài liệu SRS. Vui lòng tham khảo README.md hoặc bổ sung file tài liệu mới tại thư mục gốc.',
    updatedAt: now,
    source: 'not-found'
  };
}
