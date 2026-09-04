"""Shared Jinja2Templates instance.

Kept in its own module (rather than instantiated in main.py) so route
modules can import `templates` directly without risking a circular
import with app.main.
"""
from __future__ import annotations

from pathlib import Path

from fastapi.templating import Jinja2Templates

TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates"

templates = Jinja2Templates(directory=str(TEMPLATES_DIR))
