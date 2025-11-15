const fs = require('fs');
const os = require('os');
const path = require('path');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const TodoManager = require('../src/todoManager');

function withTempManager(callback) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'phanmemsoictc-'));
  const storagePath = path.join(tempDir, 'todos.json');
  try {
    const manager = new TodoManager(storagePath);
    callback(manager, storagePath);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

test('thêm và liệt kê công việc', () => {
  withTempManager((manager) => {
    manager.addTodo('Học Node.js', 'Đọc tài liệu chính thức');
    const todos = manager.listTodos();

    assert.equal(todos.length, 1);
    assert.equal(todos[0].title, 'Học Node.js');
    assert.equal(todos[0].description, 'Đọc tài liệu chính thức');
    assert.equal(todos[0].done, false);
  });
});

test('không cho phép tiêu đề trùng lặp', () => {
  withTempManager((manager) => {
    manager.addTodo('Lặp lại');
    assert.throws(() => manager.addTodo('Lặp lại'), /đã tồn tại/);
  });
});

test('đánh dấu hoàn thành công việc', () => {
  withTempManager((manager) => {
    manager.addTodo('Hoàn thành bài tập');
    const todo = manager.markDone('Hoàn thành bài tập');

    assert.equal(todo.done, true);
    const stored = manager.listTodos()[0];
    assert.equal(stored.done, true);
    assert.ok(stored.completedAt);
  });
});

test('xoá công việc', () => {
  withTempManager((manager) => {
    manager.addTodo('Xoá công việc');
    manager.removeTodo('Xoá công việc');
    const todos = manager.listTodos();
    assert.equal(todos.length, 0);
  });
});
