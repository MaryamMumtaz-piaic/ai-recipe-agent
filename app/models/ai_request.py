"""Pydantic request/response models for AI-powered endpoints."""
from __future__ import annotations

from pydantic import BaseModel, Field


class RecipePreferences(BaseModel):
    """Body for POST /api/ai/generate-recipe."""

    region: str
    cuisine: str
    dish: str  # freeform or picked
    meal_type: str = ""  # Breakfast/Lunch/... optional
    servings: int = 4
    budget_amount: float | None = None
    budget_currency: str = "PKR"
    budget_tier: str = "moderate"  # low|moderate|flexible|custom
    dietary: list[str] = Field(default_factory=list)
    available_ingredients: list[str] = Field(default_factory=list)
    no_specific_ingredients: bool = False
    cooking_method: str = "No preference"
    time_available: str = "No limit"
    difficulty: str = "Any"


ADAPTATION_TYPES = {
    "make_cheaper",
    "make_faster",
    "make_vegetarian",
    "make_spicier",
    "make_milder",
    "increase_protein",
    "use_what_i_have",
    "reduce_ingredients",
    "change_servings",
}


class AdaptRequest(BaseModel):
    recipe_slug: str
    adaptation: str
    new_servings: int | None = None  # required when adaptation == "change_servings"


class SubstituteRequest(BaseModel):
    recipe_slug: str
    ingredient: str


class SubstituteResponse(BaseModel):
    substitute: str
    effect: str


class RecommendRequest(BaseModel):
    recipe_slug: str
    session_prefs: dict = Field(default_factory=dict)
