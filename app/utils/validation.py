"""Validation / normalization helpers shared by routes and agents.

Keeps request-shape sanity checks out of the route handlers and out of
the agents, so both stay focused on their own job.
"""
from __future__ import annotations

from app.models.ai_request import ADAPTATION_TYPES, AdaptRequest, RecipePreferences

VALID_DIFFICULTIES = {"Easy", "Intermediate", "Advanced", "Any"}
VALID_BUDGET_TIERS = {"low", "moderate", "flexible", "custom"}


def normalize_preferences(prefs: RecipePreferences) -> RecipePreferences:
    """Trim strings, clamp numeric ranges, and fill in sane defaults so
    the AI prompt is built from consistent, well-formed data.
    """
    data = prefs.model_dump()

    data["region"] = (data.get("region") or "").strip() or "Unspecified"
    data["cuisine"] = (data.get("cuisine") or "").strip() or "International"
    data["dish"] = (data.get("dish") or "").strip() or "Chef's choice"
    data["meal_type"] = (data.get("meal_type") or "").strip()

    try:
        servings = int(data.get("servings") or 4)
    except (TypeError, ValueError):
        servings = 4
    data["servings"] = max(1, min(servings, 24))

    tier = (data.get("budget_tier") or "moderate").strip().lower()
    data["budget_tier"] = tier if tier in VALID_BUDGET_TIERS else "moderate"

    if data.get("budget_amount") is not None:
        try:
            amt = float(data["budget_amount"])
            data["budget_amount"] = amt if amt > 0 else None
        except (TypeError, ValueError):
            data["budget_amount"] = None

    data["budget_currency"] = (data.get("budget_currency") or "PKR").strip() or "PKR"

    data["dietary"] = [d.strip() for d in (data.get("dietary") or []) if d and d.strip()]
    data["available_ingredients"] = [
        i.strip() for i in (data.get("available_ingredients") or []) if i and i.strip()
    ]
    data["no_specific_ingredients"] = bool(data.get("no_specific_ingredients"))

    data["cooking_method"] = (data.get("cooking_method") or "No preference").strip() or "No preference"
    data["time_available"] = (data.get("time_available") or "No limit").strip() or "No limit"

    difficulty = (data.get("difficulty") or "Any").strip()
    data["difficulty"] = difficulty if difficulty in VALID_DIFFICULTIES else "Any"

    return RecipePreferences(**data)


def validate_adapt_request(req: AdaptRequest) -> AdaptRequest:
    if req.adaptation not in ADAPTATION_TYPES:
        raise ValueError(f"Unknown adaptation type: {req.adaptation}")
    if req.adaptation == "change_servings":
        if not req.new_servings or req.new_servings < 1:
            raise ValueError("new_servings is required and must be >= 1 for change_servings")
    return req
