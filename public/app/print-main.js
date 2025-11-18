import { React, ReactDOM } from '../vendor/react-lite.js';
import { PrintExaminationPage } from './modules/print/view.js';

const { createElement: h } = React;

function getExamIdFromPath() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  if (parts[0] === 'print' && parts[1]) return decodeURIComponent(parts[1]);
  const url = new URL(window.location.href);
  return url.searchParams.get('id') || '';
}

window.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('print-root');
  const examId = getExamIdFromPath();
  ReactDOM.render(h(PrintExaminationPage, { examId }), root);
});
