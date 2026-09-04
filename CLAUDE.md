# CLAUDE.md

Guidance for Claude Code (or any AI coding agent) working in this repository.

## Project

**AI Recipe Agent** — a complete AI-powered recipe discovery and personalization platform. FastAPI serves the entire application (server-rendered Jinja2 pages + a JSON API); there is no separate frontend build, no database, and no login system. See `README.md` for the product overview and `task.md` for the original full product specification this project was built against.

## Commands

```bash
pip install -r requirements.txt        # install dependencies
uvicorn app.main:app --reload --port 8000   # run the dev server
```

There is no test suite or linter configured yet. If you add one, wire it up here and keep this section current.

## Hard constraints — do not violate

- **Stack is fixed**: Python + FastAPI + Uvicorn + Pydantic + OpenAI SDK + Jinja2 on the backend; HTML + Tailwind CSS (Play CDN, no Node build step) + Vanilla JS on the frontend. Do not introduce React/Vue/Next, a Node frontend server, Postgres/Mongo/Redis, or Docker.
- **AI model is fixed**: `gpt-4.1-mini`, read from the `OPENAI_MODEL` env var (default `gpt-4.1-mini` in `app/services/openai_service.py`). The OpenAI API key must stay server-side — never expose it to the frontend, never log it, never include it in an error response.
- **No external/remote images**: every recipe uses an `emoji` + `gradient` field pair, rendered by the `.recipe-media` / `.grad-*` CSS classes in `static/css/styles.css`. Do not add `<img src="https://...">` for recipe photos — it violates the "never a broken image" requirement this design deliberately avoids.
- **All OpenAI calls go through `app/services/openai_service.py`** — nothing else should import the `openai` package. On failure it raises `AIGenerationError`; routes must catch that and return the generic `"We couldn't generate your recipe right now. Please try again."` message (HTTP 503) — never leak raw exception text, stack traces, or API errors to the client.
- **Recommendation agent must filter locally before calling OpenAI** (`app/agents/recommendation_agent.py`) — never send the full recipe dataset to the model, and never let recommendations hard-fail the endpoint (always fall back to local ranking).

## Architecture

```
Request → app/routes/{pages,recipes,ai,feedback}.py (thin)
            → app/services/recipe_service.py   (dataset filter/sort/search/scaling)
            → app/services/json_store.py        (all JSON file I/O — never read/write app/data/*.json directly elsewhere)
            → app/agents/recipe_agent.py         (validates prefs → calls openai_service → validates Recipe model → persists)
            → app/agents/recommendation_agent.py (local candidate filter → AI rank → local fallback)
            → app/services/openai_service.py     (the only place that talks to OpenAI)
```

- `app/models/` holds every Pydantic model (`Recipe`, `RecipeSummary`, `RecipePreferences`, `AdaptRequest`, etc.) — request/response shapes should change here first, then propagate outward.
- `app/data/recipes.json` is the curated, hand-authored dataset (30 recipes across 16 cuisines) — treat it as read-mostly content, not a cache. `app/data/generated_recipes.json` holds AI-generated/adapted recipes created at runtime and is expected to grow while the server runs; it's fine for it to be gitignored-empty (`{}`) in the repo.
- Frontend conventions live in `static/js/main.js`: `window.RecipeStore` (localStorage: saved/recent/session-prefs/anon-id), `window.RecipeCards.render()` (the one recipe-card template used everywhere), `window.showToast()`, `window.Modal.open()/close()`. Reuse these rather than re-implementing card markup or toast/modal logic in a page-specific script.
- The design system (CSS custom properties, gradient palette, print stylesheet) lives in `static/css/styles.css` and is extended into Tailwind's config inline in `templates/base.html`. Read both before changing visual styling — this is a deliberately non-generic, non-dark, non-glassmorphism editorial design; keep new UI consistent with it rather than introducing a new visual language.

## Conventions

- Keep OpenAI prompt/schema definitions in `openai_service.py` (see `RECIPE_JSON_SHAPE` / `RECIPE_QUALITY_RULES`) — if you change the `Recipe` model, update the prompt shape to match so generated JSON still validates.
- New recipe dataset entries must satisfy `app/models/recipe.py`'s `Recipe` model — validate with a throwaway script (`Recipe(**your_dict)`) before adding to `recipes.json`, the way `app/data/recipes.json` was originally generated and validated.
- New API routes should stay thin (see existing routes) — put logic in `services/` or `agents/`, not in the route handler.
- Every AI-triggering UI action needs a real, contextual loading state (see `generate.html`'s "Creating Your Recipe" checklist) — never a bare spinner — and a graceful, on-brand error state.
