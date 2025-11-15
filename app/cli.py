"""Command line interface for the to-do manager."""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Iterable

from .todo_manager import TodoManager, TodoItem


DEFAULT_STORAGE = Path.home() / ".phanmemsoictc" / "todos.json"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Simple to-do list manager")
    parser.add_argument(
        "--storage",
        type=Path,
        default=DEFAULT_STORAGE,
        help="Path to the JSON file used for persistence (default: %(default)s)",
    )

    subparsers = parser.add_subparsers(dest="command", required=True)

    add_parser = subparsers.add_parser("add", help="Add a new to-do item")
    add_parser.add_argument("title", help="Title for the to-do item")
    add_parser.add_argument("--description", default="", help="Description of the to-do item")

    list_parser = subparsers.add_parser("list", help="List all to-do items")
    list_parser.add_argument("--show-done", action="store_true", help="Include tasks marked as done")

    done_parser = subparsers.add_parser("done", help="Mark an item as done")
    done_parser.add_argument("title", help="Title of the to-do item to mark as done")

    remove_parser = subparsers.add_parser("remove", help="Remove an item")
    remove_parser.add_argument("title", help="Title of the to-do item to remove")

    return parser


def format_items(items: Iterable[TodoItem], *, show_done: bool = True) -> str:
    lines = []
    for item in items:
        status = "✔" if item.done else "✘"
        if not show_done and item.done:
            continue
        description = f" — {item.description}" if item.description else ""
        lines.append(f"{status} {item.title}{description}")
    return "\n".join(lines) if lines else "No items found."


def main(args: list[str] | None = None) -> int:
    parser = build_parser()
    namespace = parser.parse_args(args)

    manager = TodoManager(namespace.storage)

    if namespace.command == "add":
        manager.add(namespace.title, namespace.description)
        print(f"Added: {namespace.title}")
        return 0

    if namespace.command == "list":
        print(format_items(manager.list(), show_done=namespace.show_done))
        return 0

    if namespace.command == "done":
        item = manager.mark_done(namespace.title)
        if item:
            print(f"Marked as done: {item.title}")
            return 0
        print("Item not found.")
        return 1

    if namespace.command == "remove":
        if manager.remove(namespace.title):
            print(f"Removed: {namespace.title}")
            return 0
        print("Item not found.")
        return 1

    parser.error("Unknown command")
    return 2


if __name__ == "__main__":  # pragma: no cover
    raise SystemExit(main())
