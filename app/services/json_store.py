"""Tiny reusable JSON read/write/append utility.

Every module in this project that needs to read or write one of the JSON
files under app/data/ should go through this module instead of opening
files directly. Keeps file I/O logic in one place.
"""
from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path
from threading import Lock
from typing import Any

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

# One lock per process guards concurrent writes to any data file. The
# dataset is small and traffic is low, so a single global lock is fine
# and keeps things simple/correct rather than fast.
_write_lock = Lock()


def _resolve(filename: str) -> Path:
    """Resolve a data filename (e.g. 'recipes.json') to its full path."""
    path = Path(filename)
    if not path.is_absolute():
        path = DATA_DIR / filename
    return path


def load(filename: str, default: Any = None) -> Any:
    """Load and parse a JSON file from app/data/.

    Returns `default` (or [] if not provided) if the file does not exist
    or contains invalid JSON.
    """
    path = _resolve(filename)
    if not path.exists():
        return [] if default is None else default
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return [] if default is None else default


def save(filename: str, data: Any) -> None:
    """Write `data` to a JSON file atomically (write to temp file, then
    replace) to avoid corrupting the file if the process is interrupted.
    """
    path = _resolve(filename)
    path.parent.mkdir(parents=True, exist_ok=True)
    with _write_lock:
        fd, tmp_path = tempfile.mkstemp(
            dir=str(path.parent), prefix=f".{path.name}.", suffix=".tmp"
        )
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            os.replace(tmp_path, path)
        finally:
            if os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except OSError:
                    pass


def append(filename: str, item: Any) -> None:
    """Append `item` to a JSON file that stores a list. Creates the file
    with a single-item list if it doesn't already exist.
    """
    data = load(filename, default=[])
    if not isinstance(data, list):
        raise ValueError(f"{filename} does not contain a JSON list")
    data.append(item)
    save(filename, data)


def set_key(filename: str, key: str, value: Any) -> None:
    """Set `key` on a JSON file that stores an object/dict. Creates the
    file with a single-key dict if it doesn't already exist.
    """
    data = load(filename, default={})
    if not isinstance(data, dict):
        raise ValueError(f"{filename} does not contain a JSON object")
    data[key] = value
    save(filename, data)
