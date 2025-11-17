export function openPrintPreview({ exam }) {
  const examId = exam?.id || exam?.ExamID;
  if (!examId) return;
  window.open(`/print/${encodeURIComponent(examId)}`, '_blank');
}
