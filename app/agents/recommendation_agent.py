"""Recipe recommendation agent.

    User/Recipe -> Recommendation Agent -> Local Candidate Filtering
    -> AI Ranking -> Recommended Recipes

Always filters candidates locally first (by cuisine/category/tags/dietary
overlap) down to a small list (<=12) before ever calling OpenAI, and
falls back to a pure-local ranking (tag/cuisine overlap + rating) if
OpenAI is unavailable or fails. Recommendations must never hard-fail the
endpoint — callers can treat this as always-succeeds (may return fewer
than desired results, but never raises for AI-availability reasons).
"""
from __future__ import annotations

from typing import Any

from app.models.recipe import Recipe, RecipeSummary
from app.services import openai_service, recipe_service
from app.services.openai_service import AIGenerationError

MAX_CANDIDATES = 12
MAX_RESULTS = 4


def _candidate_pool(current: Recipe, session_prefs: dict[str, Any]) -> list[dict[str, Any]]:
    """Filter the dataset down to a small, relevant candidate list based
    on cuisine/category/tags/dietary overlap with the current recipe and
    any session preferences. Never returns the current recipe itself.
    """
    all_recipes = recipe_service.get_all_dataset_recipes()
    current_tags = set(t.lower() for t in current.tags)
    current_dietary = set(d.lower() for d in current.dietary)

    pref_cuisines = set()
    pref_dietary = set()
    if isinstance(session_prefs, dict):
        pc = session_prefs.get("cuisine") or session_prefs.get("cuisines") or []
        if isinstance(pc, str):
            pc = [pc]
        pref_cuisines = {c.lower() for c in pc if isinstance(c, str)}

        pd = session_prefs.get("dietary") or []
        if isinstance(pd, str):
            pd = [pd]
        pref_dietary = {d.lower() for d in pd if isinstance(d, str)}

    scored: list[tuple[float, dict[str, Any]]] = []
    for r in all_recipes:
        if r.get("slug") == current.slug:
            continue

        score = 0.0
        if r.get("cuisine", "").lower() == current.cuisine.lower():
            score += 4
        if r.get("category", "").lower() == current.category.lower():
            score += 2
        if r.get("cuisine", "").lower() in pref_cuisines:
            score += 3

        tags = set(t.lower() for t in r.get("tags", []))
        score += len(tags & current_tags) * 1.5

        dietary = set(d.lower() for d in r.get("dietary", []))
        score += len(dietary & current_dietary) * 1.0
        score += len(dietary & pref_dietary) * 1.5

        score += (r.get("rating") or 0) * 0.2

        if score > 0:
            scored.append((score, r))

    scored.sort(key=lambda pair: pair[0], reverse=True)
    return [r for _, r in scored[:MAX_CANDIDATES]]


def _local_fallback(candidates: list[dict[str, Any]], limit: int = MAX_RESULTS) -> list[RecipeSummary]:
    """Pure local ranking used when OpenAI is unavailable or fails: the
    candidate pool is already scored/sorted by overlap, so just take the
    top N and tie-break further by rating/review_count.
    """
    ranked = sorted(
        candidates,
        key=lambda r: ((r.get("rating") or 0), (r.get("review_count") or 0)),
        reverse=True,
    )
    summaries = []
    for d in ranked[:limit]:
        try:
            summaries.append(recipe_service.to_summary(Recipe(**d)))
        except Exception:
            continue
    return summaries


def recommend(recipe_slug: str, session_prefs: dict[str, Any]) -> list[RecipeSummary]:
    current = recipe_service.find_recipe_by_slug(recipe_slug)
    if current is None:
        return []

    candidates = _candidate_pool(current, session_prefs)
    if not candidates:
        return []

    current_summary = {
        "title": current.title,
        "cuisine": current.cuisine,
        "category": current.category,
        "tags": current.tags,
    }
    candidate_briefs = [
        {
            "slug": c.get("slug"),
            "title": c.get("title"),
            "cuisine": c.get("cuisine"),
            "category": c.get("category"),
            "tags": c.get("tags", []),
            "rating": c.get("rating"),
        }
        for c in candidates
    ]

    try:
        result = openai_service.recommend_recipes(current_summary, candidate_briefs, session_prefs or {})
        picks = result.get("picks") or []
        by_slug = {c.get("slug"): c for c in candidates}
        summaries: list[RecipeSummary] = []
        for pick in picks:
            slug = pick.get("slug") if isinstance(pick, dict) else None
            d = by_slug.get(slug)
            if d:
                try:
                    summaries.append(recipe_service.to_summary(Recipe(**d)))
                except Exception:
                    continue
        if summaries:
            return summaries[:MAX_RESULTS]
        # AI returned no usable picks — fall through to local ranking.
        return _local_fallback(candidates)
    except AIGenerationError:
        return _local_fallback(candidates)
    except Exception:
        return _local_fallback(candidates)
