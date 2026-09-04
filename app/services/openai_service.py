"""Centralized OpenAI communication.

Every OpenAI API call in this project goes through this module — nothing
else should import the `openai` package directly. On any failure
(missing key, network error, rate limit, malformed JSON) we raise the
single `AIGenerationError`, which route handlers turn into a clean
HTTP 503 without leaking internals.
"""
from __future__ import annotations

import json
import os
from typing import Any

from dotenv import load_dotenv

load_dotenv()

_OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4.1-mini")

_client = None
_client_init_attempted = False


class AIGenerationError(Exception):
    """Raised whenever an OpenAI-backed operation cannot complete.
    Callers (routes) must catch this and return a generic, user-safe
    message — never the original exception text.
    """


def _get_client():
    """Lazily construct the OpenAI client. Returns None if no API key is
    configured so the rest of the app can keep running without one.
    """
    global _client, _client_init_attempted
    if _client_init_attempted:
        return _client
    _client_init_attempted = True

    api_key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not api_key:
        _client = None
        return None

    try:
        from openai import OpenAI

        _client = OpenAI(api_key=api_key)
    except Exception:
        _client = None
    return _client


def _chat_json(system_prompt: str, user_prompt: str, *, max_tokens: int = 2000) -> dict[str, Any]:
    """Call the Chat Completions API in JSON mode and return the parsed
    JSON object. Raises AIGenerationError on any failure.
    """
    client = _get_client()
    if client is None:
        raise AIGenerationError("OpenAI client is not configured")

    try:
        response = client.chat.completions.create(
            model=_OPENAI_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
            max_tokens=max_tokens,
        )
    except Exception as exc:  # network errors, auth errors, rate limits, etc.
        raise AIGenerationError("OpenAI request failed") from exc

    try:
        content = response.choices[0].message.content
        return json.loads(content)
    except (IndexError, AttributeError, TypeError, json.JSONDecodeError) as exc:
        raise AIGenerationError("OpenAI returned malformed JSON") from exc


RECIPE_JSON_SHAPE = """{
  "title": "string",
  "description": "string (2-3 sentences, appetizing)",
  "cuisine": "string",
  "region": "string",
  "category": "string (one of Breakfast, Lunch, Dinner, Dessert, Snack, Soup, Salad, Main Course, Side Dish, Drinks, Bakery, Street Food)",
  "servings": 4,
  "prep_time": "string e.g. '15 minutes'",
  "cook_time": "string e.g. '30 minutes'",
  "total_time": "string e.g. '45 minutes'",
  "difficulty": "Easy | Intermediate | Advanced",
  "budget": {"amount": 0, "currency": "PKR"},
  "ingredients": [
    {"item": "string", "quantity": 0, "unit": "string", "notes": "string"}
  ],
  "instructions": [
    {"step": 1, "title": "string", "instruction": "string, specific and actionable", "duration": "string e.g. '5-7 minutes'", "heat": "string e.g. 'medium heat'"}
  ],
  "tips": ["string"],
  "substitutions": [
    {"ingredient": "string", "substitute": "string", "effect": "string"}
  ],
  "nutrition": {"calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0, "fiber_g": 0, "sodium_mg": 0},
  "equipment": ["string"],
  "storage": "string",
  "serving_suggestions": ["string"],
  "tags": ["string"],
  "dietary": ["string"]
}"""

RECIPE_QUALITY_RULES = """Rules you must follow:
- Respect the requested cuisine, dish, servings, budget, dietary requirements, available ingredients, cooking method, time available, and difficulty.
- Use realistic, precise quantities and units (grams, tbsp, tsp, cup, piece, etc). Use null for quantity only for "to taste" style items.
- Instructions must be specific and actionable, in logical cooking order, with no contradictions or impossible steps. Never write vague filler like "cook until done" with no detail — always say how long, at what heat, and what to look/smell/feel for.
- Use appropriate, food-safe cooking temperatures and times; never suggest eating something raw that requires cooking.
- Mention allergens in tips or substitutions where relevant (e.g. nuts, dairy, gluten, shellfish).
- Do not make medical claims. If dietary restrictions are medical in nature, include a brief note encouraging the user to verify ingredients independently.
- Output ONLY valid JSON matching the given shape exactly, with no markdown fences, no commentary, no extra keys, no trailing commas."""


def generate_recipe(preferences: dict[str, Any]) -> dict[str, Any]:
    """Ask the model to generate a brand-new recipe from user preferences.
    Returns the parsed JSON dict (not yet validated against the Recipe
    Pydantic model — that's the recipe agent's job).
    """
    system_prompt = (
        "You are an expert professional recipe developer and chef writing for a "
        "premium recipe platform called AI Recipe Agent. You always respond with "
        "a single valid JSON object and nothing else.\n\n"
        f"Required JSON shape:\n{RECIPE_JSON_SHAPE}\n\n{RECIPE_QUALITY_RULES}"
    )
    user_prompt = (
        "Generate one complete recipe for these user preferences:\n"
        f"{json.dumps(preferences, ensure_ascii=False)}\n\n"
        "Return only the JSON object described in the system prompt."
    )
    return _chat_json(system_prompt, user_prompt)


def generate_recipe_strict(preferences: dict[str, Any]) -> dict[str, Any]:
    """Retry path used after a first malformed/invalid response. Adds a
    stricter instruction emphasizing exact schema conformance.
    """
    system_prompt = (
        "You are an expert professional recipe developer. You must respond with "
        "ONLY a single valid JSON object, strictly matching the shape below, with "
        "correct types for every field (numbers as numbers, arrays as arrays). "
        "Do not include markdown code fences, comments, or any text outside the "
        "JSON object. Any deviation from the schema is unacceptable.\n\n"
        f"Required JSON shape:\n{RECIPE_JSON_SHAPE}\n\n{RECIPE_QUALITY_RULES}"
    )
    user_prompt = (
        "Generate one complete, valid recipe for these user preferences. Double "
        "check your output is valid JSON before responding:\n"
        f"{json.dumps(preferences, ensure_ascii=False)}"
    )
    return _chat_json(system_prompt, user_prompt)


def adapt_recipe(recipe: dict[str, Any], adaptation: str, new_servings: int | None = None) -> dict[str, Any]:
    """Ask the model to adapt an existing recipe (cheaper, faster, etc)
    while preserving its overall structure. Returns the full adapted
    recipe JSON in the same shape as generate_recipe.
    """
    instruction_map = {
        "make_cheaper": "Make this recipe noticeably cheaper by swapping in more affordable ingredients and reducing waste, without ruining the dish.",
        "make_faster": "Reduce the total cooking time as much as reasonably possible (simpler techniques, fewer steps, shorter cook times) while keeping the dish recognizable.",
        "make_vegetarian": "Convert this recipe into a satisfying vegetarian version, replacing meat/fish with appropriate plant-based or vegetarian alternatives.",
        "make_spicier": "Increase the spice/heat level noticeably while keeping the dish balanced.",
        "make_milder": "Reduce the spice/heat level noticeably for sensitive palates while keeping good flavor.",
        "increase_protein": "Increase the protein content of the dish (larger or additional protein sources, protein-rich add-ins) while keeping it delicious.",
        "use_what_i_have": "Adapt the recipe to minimize the number of specialty or hard-to-find ingredients, favoring common pantry staples.",
        "reduce_ingredients": "Simplify the recipe by reducing the total number of distinct ingredients as much as possible while preserving the core flavor of the dish.",
        "change_servings": f"Scale the recipe to serve exactly {new_servings} people, adjusting ingredient quantities accordingly.",
    }
    instruction = instruction_map.get(adaptation, "Adapt this recipe as requested.")

    system_prompt = (
        "You are an expert professional recipe developer adapting an existing "
        "recipe for a premium recipe platform. You always respond with a single "
        "valid JSON object matching the required shape and nothing else.\n\n"
        f"Required JSON shape:\n{RECIPE_JSON_SHAPE}\n\n{RECIPE_QUALITY_RULES}"
    )
    user_prompt = (
        f"Here is the original recipe as JSON:\n{json.dumps(recipe, ensure_ascii=False)}\n\n"
        f"Adaptation requested: {instruction}\n\n"
        "Return the FULL adapted recipe as a single JSON object in the required shape "
        "(not a diff, not just the changed fields). Keep the title similar but reflect the "
        "change (e.g. prefix or note the adaptation in the title/description)."
    )
    return _chat_json(system_prompt, user_prompt)


def generate_substitution(recipe: dict[str, Any], ingredient: str) -> dict[str, Any]:
    """Ask the model for a single ingredient substitution with an
    explanation of the effect on the dish. Returns {"substitute", "effect"}.
    """
    system_prompt = (
        "You are an expert chef advising on ingredient substitutions. You always "
        "respond with a single valid JSON object of exactly this shape and nothing "
        'else: {"substitute": "string", "effect": "string, a clear explanation of '
        'how flavor/texture/result changes"}. If the ingredient has a medical or '
        "allergen dimension, mention it briefly in the effect."
    )
    user_prompt = (
        f"Recipe: {recipe.get('title', 'Unknown recipe')} ({recipe.get('cuisine', '')})\n"
        f"Ingredient to substitute: {ingredient}\n"
        "Suggest the single best substitute and explain the effect on the dish."
    )
    return _chat_json(system_prompt, user_prompt, max_tokens=400)


def recommend_recipes(current_recipe_summary: dict[str, Any], candidates: list[dict[str, Any]], session_prefs: dict[str, Any]) -> dict[str, Any]:
    """Ask the model to rank a short local candidate list and pick the
    top few with short reasons. `candidates` must already be a small
    pre-filtered list (<=12) — never the full dataset.
    Returns {"picks": [{"slug": "...", "reason": "..."}]}.
    """
    system_prompt = (
        "You are a recipe recommendation assistant. Given a current recipe, a "
        "user's session preferences, and a short list of candidate recipes, pick "
        "the 3-4 best candidates and give a short one-sentence reason for each. "
        'Respond with ONLY valid JSON of this shape: {"picks": [{"slug": "string", '
        '"reason": "string"}]}. Only use slugs that appear in the candidate list.'
    )
    user_prompt = (
        f"Current recipe: {json.dumps(current_recipe_summary, ensure_ascii=False)}\n"
        f"Session preferences: {json.dumps(session_prefs, ensure_ascii=False)}\n"
        f"Candidates: {json.dumps(candidates, ensure_ascii=False)}\n"
        "Pick the 3-4 best matches from the candidates list only."
    )
    return _chat_json(system_prompt, user_prompt, max_tokens=600)
