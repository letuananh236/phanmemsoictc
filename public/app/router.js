const ROUTE_MAP = new Map([
  ['/', 'kham-benh'],
  ['/kham-benh', 'kham-benh'],
  ['/chup-anh', 'chup-anh'],
  ['/tim-phieu-kham', 'tim-phieu-kham'],
  ['/cau-hinh', 'cau-hinh'],
  ['/license', 'license'],
  ['/backup-restore', 'backup-restore'],
  ['/gioi-thieu', 'gioi-thieu']
]);

function normalizePath(pathname = '/') {
  if (!pathname) return '/';
  const trimmed = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
  return trimmed || '/';
}

export function resolveRoute(pathname = '/') {
  const normalized = normalizePath(pathname);
  return ROUTE_MAP.get(normalized) || 'kham-benh';
}

export function pathForView(viewId) {
  for (const [path, id] of ROUTE_MAP.entries()) {
    if (id === viewId) return path;
  }
  return '/kham-benh';
}

export function navigate(path) {
  const normalized = normalizePath(path);
  if (window.location.pathname !== normalized) {
    window.history.pushState({}, '', normalized);
  }
  window.dispatchEvent(new Event('spa:navigate'));
}
