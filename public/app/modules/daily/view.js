import { renderTodayExaminations } from './TodayExaminationsPage.js';

export function renderDaily(state, { navigate }) {
  const container = document.createElement('div');
  const cleanup = renderTodayExaminations(container, {
    initialDate: state.today,
    onNavigateExam: (examId) => navigate('examinations', { selectedExamId: examId }),
    onCreatePatient: () => navigate('patients'),
    onLicenseExpired: () => navigate('license')
  });
  return { node: container, cleanup };
}
