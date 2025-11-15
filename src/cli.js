#!/usr/bin/env node
const path = require('path');
const TodoManager = require('./todoManager');

const commands = new Set(['list', 'add', 'done', 'remove']);

function parseArguments(argv) {
  let storage;
  let command = null;
  const commandArgs = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--storage' || arg === '-s') {
      const value = argv[i + 1];
      if (!value) {
        throw new Error('Thiếu đường dẫn sau tuỳ chọn --storage');
      }
      storage = value;
      i += 1;
      continue;
    }

    if (arg.startsWith('--storage=')) {
      const value = arg.split('=').slice(1).join('=');
      if (!value) {
        throw new Error('Thiếu đường dẫn sau tuỳ chọn --storage');
      }
      storage = value;
      continue;
    }

    if (!command && commands.has(arg)) {
      command = arg;
      continue;
    }

    if (!command) {
      throw new Error(`Không nhận dạng được tham số: ${arg}`);
    }

    commandArgs.push(arg);
  }

  if (!command) {
    return { storage, command: null, commandArgs };
  }

  return { storage, command, commandArgs };
}

function showHelp() {
  console.log(`Sử dụng: phanmemsoictc [--storage <path>] <lệnh> [tuỳ chọn]\n\nCác lệnh khả dụng:\n  list\tLiệt kê danh sách công việc\n  add <title> [--description <text>]\tThêm công việc mới\n  done <title>\tĐánh dấu hoàn thành\n  remove <title>\tXoá công việc`);
}

function createManager(storagePath) {
  const resolvedStorage = storagePath ? path.resolve(storagePath) : undefined;
  return new TodoManager(resolvedStorage);
}

function handleCommand(parsed) {
  if (!parsed.command) {
    showHelp();
    return;
  }

  const manager = createManager(parsed.storage);

  switch (parsed.command) {
    case 'list': {
      if (parsed.commandArgs.length > 0) {
        throw new Error('Lệnh list không nhận tham số bổ sung');
      }
      const todos = manager.listTodos();
      if (todos.length === 0) {
        console.log('Chưa có công việc nào.');
        return;
      }
      todos.forEach((todo, index) => {
        const status = todo.done ? '[x]' : '[ ]';
        const description = todo.description ? ` - ${todo.description}` : '';
        console.log(`${index + 1}. ${status} ${todo.title}${description}`);
      });
      break;
    }
    case 'add': {
      if (parsed.commandArgs.length === 0) {
        throw new Error('Cần cung cấp tiêu đề công việc cho lệnh add');
      }
      const [title, ...rest] = parsed.commandArgs;
      let description = '';
      for (let i = 0; i < rest.length; i += 1) {
        const arg = rest[i];
        if (arg === '--description' || arg === '-d') {
          const value = rest[i + 1];
          if (!value) {
            throw new Error('Thiếu mô tả sau tuỳ chọn --description');
          }
          description = value;
          i += 1;
        } else if (arg.startsWith('--description=')) {
          description = arg.split('=').slice(1).join('=');
        } else {
          throw new Error(`Không nhận dạng được tuỳ chọn: ${arg}`);
        }
      }
      const todo = manager.addTodo(title, description);
      console.log(`Đã thêm: ${todo.title}`);
      break;
    }
    case 'done': {
      if (parsed.commandArgs.length !== 1) {
        throw new Error('Lệnh done chỉ nhận một tham số là tiêu đề công việc');
      }
      const todo = manager.markDone(parsed.commandArgs[0]);
      console.log(`Đã hoàn thành: ${todo.title}`);
      break;
    }
    case 'remove': {
      if (parsed.commandArgs.length !== 1) {
        throw new Error('Lệnh remove chỉ nhận một tham số là tiêu đề công việc');
      }
      manager.removeTodo(parsed.commandArgs[0]);
      console.log(`Đã xoá: ${parsed.commandArgs[0]}`);
      break;
    }
    default:
      throw new Error(`Không hỗ trợ lệnh: ${parsed.command}`);
  }
}

(function main() {
  try {
    const parsed = parseArguments(process.argv.slice(2));
    handleCommand(parsed);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
})();
