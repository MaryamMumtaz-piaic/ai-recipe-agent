"""Pydantic models for feedback and contact form submissions."""
from __future__ import annotations

from pydantic import BaseModel


class FeedbackRequest(BaseModel):
    recipe_id: str
    helpful: bool
    anon_id: str


class ContactRequest(BaseModel):
    name: str
    email: str
    subject: str
    message: str
