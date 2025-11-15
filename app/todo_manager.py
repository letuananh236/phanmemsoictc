"""Core logic for a simple to-do manager application."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Iterable, List, Optional

import json


@dataclass
class TodoItem:
    """Represents a single to-do item."""

    title: str
    description: str = ""
    done: bool = False

    def to_dict(self) -> Dict[str, object]:
        """Convert the to-do item into a dictionary."""
        return {"title": self.title, "description": self.description, "done": self.done}

    @classmethod
    def from_dict(cls, data: Dict[str, object]) -> "TodoItem":
        """Create a to-do item from a dictionary."""
        return cls(
            title=str(data.get("title", "")),
            description=str(data.get("description", "")),
            done=bool(data.get("done", False)),
        )


@dataclass
class TodoManager:
    """Manage a collection of :class:`TodoItem` objects persisted in JSON."""

    storage_path: Path
    items: List[TodoItem] = field(default_factory=list)

    def __post_init__(self) -> None:
        self.storage_path = Path(self.storage_path)
        if self.storage_path.exists():
            self.items = list(self._load_items())

    def _load_items(self) -> Iterable[TodoItem]:
        """Load to-do items from the JSON file."""
        with self.storage_path.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
        return (TodoItem.from_dict(item) for item in data)

    def save(self) -> None:
        """Persist the current to-do items to disk."""
        self.storage_path.parent.mkdir(parents=True, exist_ok=True)
        with self.storage_path.open("w", encoding="utf-8") as handle:
            json.dump([item.to_dict() for item in self.items], handle, indent=2, ensure_ascii=False)

    def add(self, title: str, description: str = "") -> TodoItem:
        """Add a new to-do item."""
        item = TodoItem(title=title, description=description)
        self.items.append(item)
        self.save()
        return item

    def list(self) -> List[TodoItem]:
        """Return all to-do items."""
        return list(self.items)

    def mark_done(self, title: str) -> Optional[TodoItem]:
        """Mark the first item with the given title as done."""
        for item in self.items:
            if item.title == title:
                item.done = True
                self.save()
                return item
        return None

    def remove(self, title: str) -> bool:
        """Remove the first item with the given title."""
        for index, item in enumerate(self.items):
            if item.title == title:
                del self.items[index]
                self.save()
                return True
        return False

