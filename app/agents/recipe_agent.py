"""Recipe generation & adaptation agent.

Sits above app/services/openai_service.py:
    User Request -> Recipe Agent -> Preference Validation -> Recipe
    Planning -> OpenAI GPT-4.1-mini -> Structured Recipe -> Validation
    -> Recipe Renderer

Responsibilities:
- Validate/normalize RecipePreferences.
- Build the prompt payload and call openai_service.
- Validate the returned structure against the Recipe Pydantic model,
  retrying once with a stricter instruction if the model returns
  malformed/invalid JSON.
- Assign a fresh id/slug, set source + created_at.
- Persist the result into generated_recipes.json via json_store so
  /recipe/{slug} can find it later in the same running server.
"""
from __future__ import annotations

from typing import Any

from pydantic import ValidationError

from app.models.ai_request import AdaptRequest, RecipePreferences
from app.models.recipe import Budget, Recipe
from app.services import json_store, openai_service, recipe_service
from app.services.openai_service import AIGenerationError
from app.utils.helpers import new_id, now_iso, pick_gradient, unique_slug
from app.utils.validation import normalize_preferences, validate_adapt_request

GENERATED_FILE = "generated_recipes.json"

_VALID_CATEGORIES = {
    "Breakfast", "Lunch", "Dinner", "Dessert", "Snack", "Soup", "Salad",
    "Main Course", "Side Dish", "Drinks", "Bakery", "Street Food",
}
_VALID_DIFFICULTIES = {"Easy", "Intermediate", "Advanced"}


def _existing_slugs() -> set[str]:
    slugs = {r.get("slug", "") for r in recipe_service.get_all_dataset_recipes()}
    generated = json_store.load(GENERATED_FILE, default={})
    if isinstance(generated, dict):
        slugs |= {r.get("slug", "") for r in generated.values()}
    return slugs


def _coerce_defaults(payload: dict[str, Any], preferences: RecipePreferences) -> dict[str, Any]:
    """Fill in reasonable defaults / coerce loose types before handing the
    payload to the strict Recipe model, so minor model slop (missing
    optional fields, string numbers) doesn't cause a needless retry.
    """
    payload = dict(payload)

    payload.setdefault("cuisine", preferences.cuisine)
    payload.setdefault("region", preferences.region)
    payload.setdefault("servings", preferences.servings)

    category = str(payload.get("category") or preferences.meal_type or "Main Course").strip()
    if category not in _VALID_CATEGORIES:
        category = "Main Course"
    payload["category"] = category

    difficulty = str(payload.get("difficulty") or "Intermediate").strip().title()
    if difficulty not in _VALID_DIFFICULTIES:
        difficulty = "Intermediate"
    payload["difficulty"] = difficulty

    try:
        payload["servings"] = int(payload.get("servings") or preferences.servings)
    except (TypeError, ValueError):
        payload["servings"] = preferences.servings

    budget = payload.get("budget")
    if isinstance(budget, dict):
        try:
            payload["budget"] = {
                "amount": float(budget.get("amount") or preferences.budget_amount or 0),
                "currency": budget.get("currency") or preferences.budget_currency,
            }
        except (TypeError, ValueError):
            payload["budget"] = None
    elif preferences.budget_amount:
        payload["budget"] = {
            "amount": preferences.budget_amount,
            "currency": preferences.budget_currency,
        }
    else:
        payload["budget"] = None

    # Normalize instruction steps to have sequential step numbers.
    instructions = payload.get("instructions") or []
    for i, step in enumerate(instructions, start=1):
        if isinstance(step, dict):
            step.setdefault("step", i)
            step["step"] = i
    payload["instructions"] = instructions

    payload.setdefault("tips", [])
    payload.setdefault("substitutions", [])
    payload.setdefault("nutrition", {})
    payload.setdefault("equipment", [])
    payload.setdefault("storage", "")
    payload.setdefault("serving_suggestions", [])
    payload.setdefault("tags", [])
    payload.setdefault("dietary", preferences.dietary)
    payload.setdefault("description", "")

    title = str(payload.get("title") or preferences.dish or "AI Generated Recipe").strip()
    payload["title"] = title

    payload["emoji"] = payload.get("emoji") or "🍽️"
    payload["gradient"] = payload.get("gradient") or pick_gradient(title)

    for key in ("prep_time", "cook_time", "total_time"):
        payload[key] = str(payload.get(key) or "")

    return payload


def _finalize_recipe(payload: dict[str, Any], *, source: str) -> Recipe:
    """Assign id/slug/source/created_at/rating and validate against the
    Recipe model. Raises pydantic.ValidationError if still invalid.
    """
    title = str(payload.get("title") or "Recipe")
    slug = unique_slug(title, _existing_slugs())
    payload["id"] = new_id("ai")
    payload["slug"] = slug
    payload["source"] = source
    payload["created_at"] = now_iso()
    payload.setdefault("rating", 4.7)
    payload.setdefault("review_count", 0)

    return Recipe(**payload)


def _persist(recipe: Recipe) -> None:
    json_store.set_key(GENERATED_FILE, recipe.id, recipe.model_dump())


def generate_recipe(preferences: RecipePreferences) -> Recipe:
    """Full pipeline: normalize preferences -> call OpenAI -> validate
    -> retry once on failure -> persist -> return the Recipe.
    Raises AIGenerationError if generation ultimately fails.
    """
    prefs = normalize_preferences(preferences)
    prefs_dict = prefs.model_dump()

    try:
        raw = openai_service.generate_recipe(prefs_dict)
        payload = _coerce_defaults(raw, prefs)
        recipe = _finalize_recipe(payload, source="ai_generated")
    except (AIGenerationError, ValidationError, TypeError, ValueError):
        # Retry once with a stricter instruction.
        try:
            raw = openai_service.generate_recipe_strict(prefs_dict)
            payload = _coerce_defaults(raw, prefs)
            recipe = _finalize_recipe(payload, source="ai_generated")
        except (AIGenerationError, ValidationError, TypeError, ValueError) as exc:
            raise AIGenerationError("Recipe generation failed after retry") from exc

    _persist(recipe)
    return recipe


def adapt_recipe(req: AdaptRequest) -> Recipe:
    """Adapt an existing recipe (dataset or generated) into a new Recipe
    with source='ai_adapted' and a fresh id/slug.
    """
    req = validate_adapt_request(req)

    original = recipe_service.find_recipe_by_slug(req.recipe_slug)
    if original is None:
        raise AIGenerationError("Original recipe not found")

    original_dict = original.model_dump()

    def _run(call) -> Recipe:
        raw = call()
        payload = dict(original_dict)
        payload.update({k: v for k, v in raw.items() if v not in (None, [], "")})
        # Preserve arrays raw might have legitimately emptied intentionally
        for arr_key in ("ingredients", "instructions"):
            if arr_key in raw and isinstance(raw[arr_key], list):
                payload[arr_key] = raw[arr_key]
        dummy_prefs = RecipePreferences(
            region=original.region,
            cuisine=original.cuisine,
            dish=original.title,
            servings=req.new_servings or original.servings,
        )
        coerced = _coerce_defaults(payload, dummy_prefs)
        return _finalize_recipe(coerced, source="ai_adapted")

    try:
        recipe = _run(lambda: openai_service.adapt_recipe(original_dict, req.adaptation, req.new_servings))
    except (AIGenerationError, ValidationError, TypeError, ValueError):
        try:
            recipe = _run(lambda: openai_service.adapt_recipe(original_dict, req.adaptation, req.new_servings))
        except (AIGenerationError, ValidationError, TypeError, ValueError) as exc:
            raise AIGenerationError("Recipe adaptation failed") from exc

    _persist(recipe)
    return recipe


def generate_substitution(recipe_slug: str, ingredient: str) -> dict[str, str]:
    recipe = recipe_service.find_recipe_by_slug(recipe_slug)
    if recipe is None:
        raise AIGenerationError("Recipe not found")

    recipe_summary = {
        "title": recipe.title,
        "cuisine": recipe.cuisine,
        "ingredients": [i.item for i in recipe.ingredients],
    }
    try:
        result = openai_service.generate_substitution(recipe_summary, ingredient)
    except AIGenerationError:
        raise

    substitute = str(result.get("substitute") or "").strip()
    effect = str(result.get("effect") or "").strip()
    if not substitute or not effect:
        raise AIGenerationError("Substitution response incomplete")

    return {"substitute": substitute, "effect": effect}
