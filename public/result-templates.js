import { storage, showToast } from './storage.js';

export function createResultTemplatesView() {
  let templates = [];

  function renderList(listEl) {
    listEl.innerHTML = '';
    templates.forEach((template) => {
      const item = document.createElement('li');
      item.innerHTML = `
        <strong>${template.name}</strong>
        <p>${template.content}</p>
      `;
      listEl.appendChild(item);
    });
  }

  return {
    render(target) {
      const wrapper = document.createElement('section');
      wrapper.className = 'card templates-view';
      wrapper.innerHTML = `
        <h3>Mẫu kết quả</h3>
        <form id="template-form">
          <div class="form-row">
            <label>Tên mẫu</label>
            <input name="name" required />
          </div>
          <div class="form-row">
            <label>Nội dung</label>
            <textarea name="content" required></textarea>
          </div>
          <button type="submit">Thêm mẫu</button>
        </form>
        <ul id="template-list"></ul>
      `;
      target.appendChild(wrapper);

      const form = wrapper.querySelector('#template-form');
      const listEl = wrapper.querySelector('#template-list');

      storage.listTemplates().then((data) => {
        templates = data;
        renderList(listEl);
      });

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const payload = Object.fromEntries(formData.entries());
        payload.id = `T${String(Date.now()).slice(-4)}`;
        await storage.saveTemplate(payload);
        templates.push(payload);
        renderList(listEl);
        form.reset();
        showToast('Đã lưu mẫu');
      });
    }
  };
}
