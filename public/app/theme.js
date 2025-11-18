export function applyTheme(config = {}) {
  const root = document.documentElement;
  if (!root) return;
  const size = config.uiFontSize || 'medium';
  const fontSizes = { small: '14px', medium: '15px', large: '16px' };
  root.style.setProperty('--app-font-size', fontSizes[size] || fontSizes.medium);
  const highContrast = !!config.uiHighContrastMode;
  document.body.classList.toggle('high-contrast', highContrast);
}
