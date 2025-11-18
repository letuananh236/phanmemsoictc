import { storage } from './storage.js';

function isToday(dateString) {
  const today = new Date();
  const date = new Date(dateString);
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export function createDailyListsView() {
  return {
    render(target) {
      const wrapper = document.createElement('section');
      wrapper.className = 'card daily-view';
      wrapper.innerHTML = `
        <h3>Danh sách trong ngày</h3>
        <div class="grid-2">
          <div>
            <h4>Bệnh nhân</h4>
            <ul id="daily-patients"></ul>
          </div>
          <div>
            <h4>Phiếu khám</h4>
            <ul id="daily-exams"></ul>
          </div>
        </div>
      `;
      target.appendChild(wrapper);

      const patientList = wrapper.querySelector('#daily-patients');
      const examList = wrapper.querySelector('#daily-exams');

      storage.listPatients().then((patients) => {
        patientList.innerHTML = patients
          .filter((patient) => isToday(patient.createdAt))
          .map((patient) => `<li>${patient.id} - ${patient.name}</li>`)
          .join('') || '<li>Chưa có</li>';
      });

      storage.listExams().then((exams) => {
        examList.innerHTML = exams
          .filter((exam) => isToday(exam.createdAt || exam.date))
          .map((exam) => `<li>${exam.id} - ${exam.result}</li>`)
          .join('') || '<li>Chưa có</li>';
      });
    }
  };
}
