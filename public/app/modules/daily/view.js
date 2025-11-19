import { renderTodayExaminations } from './TodayExaminationsPage.js';

export function renderDaily(state, { navigate }) {
  const container = document.createElement('div');
  const cleanup = renderTodayExaminations(container, {
    initialDate: state.today,
    onNavigateExam: (examId) => navigate('examinations', { selectedExamId: examId }),
    onCreateExam: () => navigate('examinations', { selectedExamId: null }),
    onLicenseExpired: () => navigate('license')
  });
  return { node: container, cleanup };
}
