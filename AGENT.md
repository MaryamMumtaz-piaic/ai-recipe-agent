# AGENT.md

This document describes the two AI agents in AI Recipe Agent: what they do, how they're structured, and the contract each one honors with the rest of the application.

## Design principles

1. **Agents own reasoning about AI output, not raw API calls.** All actual OpenAI API calls live in `app/services/openai_service.py`. Agents (`app/agents/`) sit above that service: they validate input, decide what to ask the model for, validate what comes back, and decide what to persist.
2. **Structured output only.** Every agent call to OpenAI requests JSON matching an explicit schema (via Chat Completions JSON mode) — never free-form text that has to be parsed loosely. The target shape is embedded directly in the system prompt (`RECIPE_JSON_SHAPE` in `openai_service.py`).
3. **Fail safely, fail generically.** Any OpenAI failure (missing key, network error, rate limit, malformed JSON) raises the single `AIGenerationError`. Routes convert that into HTTP 503 with the fixed message `"We couldn't generate your recipe right now. Please try again."` — never a stack trace, never the raw API error.
4. **Local-first, AI-second, wherever the dataset is involved.** Agents narrow the recipe dataset down with plain Python filtering before ever including it in a prompt. The full ~30-recipe dataset is never sent to OpenAI in one call.

## Recipe Agent (`app/agents/recipe_agent.py`)

Pipeline:

```
User Request (RecipePreferences)
  → normalize_preferences()            [app/utils/validation.py — trims/clamps/defaults]
  → openai_service.generate_recipe()   [Chat Completions, JSON mode, gpt-4.1-mini]
  → _coerce_defaults()                 [fills gaps, normalizes types/step numbers]
  → Recipe(**payload)                  [Pydantic validation]
  → on ValidationError/AIGenerationError: retry ONCE via generate_recipe_strict()
    (a stricter prompt emphasizing exact schema conformance)
  → on second failure: raise AIGenerationError → route returns 503
  → on success: assign id/slug/source="ai_generated"/created_at,
    persist to app/data/generated_recipes.json via json_store, return Recipe
```

The same agent handles **adaptation** (`adapt_recipe()`): it loads the original recipe (dataset or previously generated), asks `openai_service.adapt_recipe()` for a full adapted recipe in the same schema (not a diff), merges/validates it the same way, and persists it as a new recipe with `source="ai_adapted"` — the original is never mutated.

It also handles **substitution** (`generate_substitution()`): a small, cheap request (title + cuisine + ingredient list, not the full recipe) that returns `{"substitute", "effect"}`.

### Adding a new adaptation type

1. Add the value to `ADAPTATION_TYPES` in `app/models/ai_request.py`.
2. Add its instruction text to `instruction_map` in `openai_service.adapt_recipe()`.
3. If it needs extra input (like `change_servings` needs `new_servings`), extend `AdaptRequest` and `validate_adapt_request()` in `app/utils/validation.py`.

## Recommendation Agent (`app/agents/recommendation_agent.py`)

Pipeline:

```
current recipe + session_prefs (dict of {cuisine, dietary, ...} → counts, from localStorage)
  → _candidate_pool()      [pure local scoring: cuisine/category/tag/dietary overlap
                             + rating, over the full dataset — never sent to OpenAI as-is]
  → top 12 candidates       [only these, plus a brief of each, go to the model]
  → openai_service.recommend_recipes()  [asks the model to pick 3-4 with a one-line reason each]
  → map picks back to full RecipeSummary objects, using only slugs the model was given
  → on any AI failure/empty result: _local_fallback()  [rank the same candidate pool by
                                                          rating/review_count instead]
```

This agent's public function, `recommend()`, is designed to **never raise** for AI-availability reasons — the `/api/ai/recommend` route can call it unconditionally and always get a (possibly empty, possibly locally-ranked) list back.

## Extending these agents

- If you add a new AI-backed capability, add the raw OpenAI call to `openai_service.py` first (with its own system prompt + JSON shape), then add the orchestration (validation, retries, persistence, fallback) in the appropriate agent — don't call `openai_service` directly from a route.
- Keep prompts and their target Pydantic models in sync: if `Recipe` gains/renames a field, update `RECIPE_JSON_SHAPE` in `openai_service.py` in the same change.
- Any new agent function that can fail should raise `AIGenerationError` on failure and let the calling route decide the HTTP response — don't invent a second error type unless the route needs to distinguish failure modes (see `adapt_recipe`'s route, which also distinguishes a `ValueError` for bad input as HTTP 400).
