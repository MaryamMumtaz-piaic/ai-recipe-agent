"""Dataset access, filtering, search relevance scoring, sorting, and
serving-scale math for recipes. Routes stay thin and call into here.

Dataset recipes (app/data/recipes.json) and AI-generated recipes
(app/data/generated_recipes.json) are kept as separate stores so the
discovery/browse dataset never gets polluted by ephemeral AI output,
but lookups by slug check both.
"""
from __future__ import annotations

from typing import Any

from app.models.recipe import Ingredient, Recipe, RecipeSummary
from app.services import json_store
from app.utils.helpers import parse_minutes

RECIPES_FILE = "recipes.json"
GENERATED_FILE = "generated_recipes.json"

SORT_OPTIONS = {"popular", "rating", "newest", "quickest", "budget"}


# ---------------------------------------------------------------------------
# Raw dataset access
# ---------------------------------------------------------------------------

def get_all_dataset_recipes() -> list[dict[str, Any]]:
    """Raw dataset recipe dicts (source='dataset'), read fresh each call
    since the file is tiny and this keeps things simple/consistent."""
    data = json_store.load(RECIPES_FILE, default=[])
    return data if isinstance(data, list) else []


def get_all_generated_recipes() -> list[dict[str, Any]]:
    data = json_store.load(GENERATED_FILE, default={})
    if isinstance(data, dict):
        return list(data.values())
    return []


def get_all_recipes_combined() -> list[dict[str, Any]]:
    """Dataset + generated, dataset first. Used for lookups, not for the
    main discovery browse list (which should stay to the curated dataset
    unless explicitly asked to include AI output)."""
    return get_all_dataset_recipes() + get_all_generated_recipes()


def _as_recipe(d: dict[str, Any]) -> Recipe | None:
    try:
        return Recipe(**d)
    except Exception:
        return None


def find_recipe_by_slug(slug: str) -> Recipe | None:
    for d in get_all_dataset_recipes():
        if d.get("slug") == slug:
            return _as_recipe(d)
    for d in get_all_generated_recipes():
        if d.get("slug") == slug:
            return _as_recipe(d)
    return None


def find_recipe_by_id_or_slug(id_or_slug: str) -> Recipe | None:
    for d in get_all_recipes_combined():
        if d.get("id") == id_or_slug or d.get("slug") == id_or_slug:
            return _as_recipe(d)
    return None


def to_summary(recipe: Recipe) -> RecipeSummary:
    data = recipe.model_dump()
    return RecipeSummary(**{k: data.get(k) for k in RecipeSummary.model_fields.keys()})


# ---------------------------------------------------------------------------
# Budget tier heuristic (Recipe stores only an absolute Budget amount, so
# tier filtering uses a simple threshold classification in PKR-equivalent
# terms; non-PKR budgets are treated at face value which is an accepted
# simplification for this dataset).
# ---------------------------------------------------------------------------

def budget_tier_of(recipe_dict: dict[str, Any]) -> str:
    budget = recipe_dict.get("budget") or {}
    amount = budget.get("amount")
    if amount is None:
        return "moderate"
    if amount <= 800:
        return "low"
    if amount <= 2000:
        return "moderate"
    return "flexible"


# ---------------------------------------------------------------------------
# Filtering / sorting / pagination for GET /api/recipes
# ---------------------------------------------------------------------------

def filter_recipes(
    *,
    cuisine: str | None = None,
    region: str | None = None,
    category: str | None = None,
    difficulty: str | None = None,
    diet: str | None = None,
    max_time: int | None = None,
    budget_tier: str | None = None,
    min_rating: float | None = None,
    q: str | None = None,
    sort: str = "popular",
    page: int = 1,
    page_size: int = 12,
) -> tuple[list[RecipeSummary], int]:
    recipes = get_all_dataset_recipes()

    def matches(r: dict[str, Any]) -> bool:
        if cuisine and r.get("cuisine", "").lower() != cuisine.lower():
            return False
        if region and r.get("region", "").lower() != region.lower():
            return False
        if category and r.get("category", "").lower() != category.lower():
            return False
        if difficulty and r.get("difficulty", "").lower() != difficulty.lower():
            return False
        if diet:
            dietary = [d.lower() for d in r.get("dietary", [])]
            if diet.lower() not in dietary:
                return False
        if max_time is not None:
            minutes = parse_minutes(r.get("total_time", ""))
            if minutes is None or minutes > max_time:
                return False
        if budget_tier and budget_tier != "custom":
            if budget_tier_of(r) != budget_tier:
                return False
        if min_rating is not None and (r.get("rating") or 0) < min_rating:
            return False
        if q:
            haystack = " ".join(
                [
                    r.get("title", ""),
                    r.get("description", ""),
                    r.get("cuisine", ""),
                    r.get("category", ""),
                    " ".join(r.get("tags", [])),
                ]
            ).lower()
            if q.lower() not in haystack:
                return False
        return True

    filtered = [r for r in recipes if matches(r)]
    filtered = _sort_recipes(filtered, sort)

    total = len(filtered)
    page = max(1, page)
    page_size = max(1, min(page_size, 100))
    start = (page - 1) * page_size
    end = start + page_size
    page_items = filtered[start:end]

    summaries = [to_summary(rec) for rec in (_as_recipe(d) for d in page_items) if rec]
    return summaries, total


def _sort_recipes(recipes: list[dict[str, Any]], sort: str) -> list[dict[str, Any]]:
    sort = sort if sort in SORT_OPTIONS else "popular"

    if sort == "rating":
        return sorted(recipes, key=lambda r: (r.get("rating") or 0), reverse=True)
    if sort == "newest":
        return sorted(recipes, key=lambda r: (r.get("created_at") or ""), reverse=True)
    if sort == "quickest":
        return sorted(
            recipes,
            key=lambda r: (parse_minutes(r.get("total_time", "")) if parse_minutes(r.get("total_time", "")) is not None else 10**6),
        )
    if sort == "budget":
        def budget_amount(r: dict[str, Any]) -> float:
            b = r.get("budget") or {}
            amt = b.get("amount")
            return amt if amt is not None else 10**9

        return sorted(recipes, key=budget_amount)

    # popular (default): rank by review_count then rating
    return sorted(
        recipes,
        key=lambda r: ((r.get("review_count") or 0), (r.get("rating") or 0)),
        reverse=True,
    )


# ---------------------------------------------------------------------------
# Search relevance scoring for GET /api/search
# ---------------------------------------------------------------------------

def search_recipes(q: str, limit: int = 24) -> list[RecipeSummary]:
    if not q or not q.strip():
        return []

    terms = [t for t in q.lower().split() if t]
    scored: list[tuple[float, dict[str, Any]]] = []

    for r in get_all_dataset_recipes():
        title = r.get("title", "").lower()
        description = r.get("description", "").lower()
        cuisine = r.get("cuisine", "").lower()
        category = r.get("category", "").lower()
        tags = [t.lower() for t in r.get("tags", [])]
        dietary = [d.lower() for d in r.get("dietary", [])]

        score = 0.0
        for term in terms:
            if term == title:
                score += 10
            if term in title:
                score += 5
            if any(term in tag for tag in tags):
                score += 3
            if term in cuisine:
                score += 2.5
            if term in category:
                score += 2
            if any(term in d for d in dietary):
                score += 2
            if term in description:
                score += 1

        if score > 0:
            scored.append((score, r))

    scored.sort(key=lambda pair: pair[0], reverse=True)
    top = [r for _, r in scored[:limit]]
    return [to_summary(rec) for rec in (_as_recipe(d) for d in top) if rec]


# ---------------------------------------------------------------------------
# Serving scaling (server-side utility; recipe.html can also do this
# client-side, but the math lives here once so it isn't duplicated).
# ---------------------------------------------------------------------------

def scale_ingredients(recipe: Recipe, new_servings: int) -> list[Ingredient]:
    if not recipe.servings or new_servings == recipe.servings:
        return recipe.ingredients

    ratio = new_servings / recipe.servings
    scaled: list[Ingredient] = []
    for ing in recipe.ingredients:
        if ing.quantity is None:
            scaled.append(ing.model_copy())
            continue
        new_qty = round(ing.quantity * ratio, 2)
        scaled.append(ing.model_copy(update={"quantity": new_qty}))
    return scaled


# ---------------------------------------------------------------------------
# Reference lists
# ---------------------------------------------------------------------------

def get_categories() -> list[dict[str, Any]]:
    data = json_store.load("categories.json", default=[])
    return data if isinstance(data, list) else []


def get_cuisines() -> list[dict[str, Any]]:
    data = json_store.load("cuisines.json", default=[])
    return data if isinstance(data, list) else []


def get_regions() -> list[dict[str, Any]]:
    data = json_store.load("regions.json", default=[])
    return data if isinstance(data, list) else []
