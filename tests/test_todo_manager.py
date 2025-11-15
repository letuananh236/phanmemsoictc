from pathlib import Path

from app.todo_manager import TodoManager


def test_add_and_list(tmp_path: Path) -> None:
    manager = TodoManager(tmp_path / "todos.json")
    manager.add("Task 1", "Description")
    items = manager.list()
    assert len(items) == 1
    assert items[0].title == "Task 1"
    assert items[0].description == "Description"
    assert not items[0].done


def test_mark_done(tmp_path: Path) -> None:
    manager = TodoManager(tmp_path / "todos.json")
    manager.add("Task 1")
    manager.mark_done("Task 1")
    assert manager.list()[0].done


def test_remove(tmp_path: Path) -> None:
    manager = TodoManager(tmp_path / "todos.json")
    manager.add("Task 1")
    assert manager.remove("Task 1")
    assert manager.list() == []
    assert not manager.remove("Task 1")
