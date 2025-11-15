const fs = require('fs');
const path = require('path');
const os = require('os');

class TodoManager {
  constructor(storagePath) {
    this.storagePath = storagePath || path.join(os.homedir(), '.phanmemsoictc', 'todos.json');
  }

  _ensureDirectory() {
    const dir = path.dirname(this.storagePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  _readTodos() {
    try {
      const content = fs.readFileSync(this.storagePath, 'utf-8');
      const data = JSON.parse(content);
      if (!Array.isArray(data)) {
        throw new Error('Invalid todo storage format');
      }
      return data;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  _writeTodos(todos) {
    this._ensureDirectory();
    fs.writeFileSync(this.storagePath, JSON.stringify(todos, null, 2), 'utf-8');
  }

  listTodos() {
    return this._readTodos();
  }

  addTodo(title, description = '') {
    if (!title || title.trim() === '') {
      throw new Error('Tên công việc không được để trống');
    }

    const todos = this._readTodos();
    if (todos.some((todo) => todo.title === title)) {
      throw new Error(`Công việc "${title}" đã tồn tại`);
    }

    const todo = {
      title,
      description,
      done: false,
      createdAt: new Date().toISOString()
    };

    todos.push(todo);
    this._writeTodos(todos);
    return todo;
  }

  markDone(title) {
    const todos = this._readTodos();
    const index = todos.findIndex((todo) => todo.title === title);
    if (index === -1) {
      throw new Error(`Không tìm thấy công việc "${title}"`);
    }

    todos[index].done = true;
    todos[index].completedAt = new Date().toISOString();
    this._writeTodos(todos);
    return todos[index];
  }

  removeTodo(title) {
    const todos = this._readTodos();
    const index = todos.findIndex((todo) => todo.title === title);
    if (index === -1) {
      throw new Error(`Không tìm thấy công việc "${title}"`);
    }

    const [removed] = todos.splice(index, 1);
    this._writeTodos(todos);
    return removed;
  }
}

module.exports = TodoManager;
