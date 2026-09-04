"""Feedback and contact-form routes. Both simply persist submissions to
local JSON files via json_store — there is no login system, so feedback
is associated with an anonymous client-generated id."""
from __future__ import annotations

from app.models.feedback import ContactRequest, FeedbackRequest
from app.services import json_store
from app.utils.helpers import now_iso
from fastapi import APIRouter

router = APIRouter(prefix="/api")

FEEDBACK_FILE = "feedback.json"
CONTACTS_FILE = "contacts.json"


@router.post("/feedback")
async def submit_feedback(req: FeedbackRequest):
    json_store.append(
        FEEDBACK_FILE,
        {
            "recipe_id": req.recipe_id,
            "helpful": req.helpful,
            "anon_id": req.anon_id,
            "created_at": now_iso(),
        },
    )
    return {"status": "ok"}


@router.post("/contact")
async def submit_contact(req: ContactRequest):
    json_store.append(
        CONTACTS_FILE,
        {
            "name": req.name,
            "email": req.email,
            "subject": req.subject,
            "message": req.message,
            "created_at": now_iso(),
        },
    )
    return {"status": "received"}
