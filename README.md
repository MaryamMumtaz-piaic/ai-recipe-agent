# 🍲 AI Recipe Agent

A complete, production-quality **AI-powered recipe discovery and personalization platform**. Browse a curated library of 30 recipes spanning 16 world cuisines, or use the guided AI Recipe Builder to generate a brand-new recipe tailored to your region, cuisine, servings, budget, dietary needs, ingredients on hand, cooking method, time, and difficulty.

Built with **FastAPI + Jinja2 + Tailwind CSS + Vanilla JavaScript**, powered by **OpenAI GPT-4.1-mini**. No login, no database — just a fast, elegant, fully functional recipe platform.

## Features

- **AI Recipe Builder** — an 11-step guided wizard (region → cuisine → dish → servings → budget → dietary → ingredients → cooking method → time → difficulty → review) that generates a complete, structured recipe via GPT-4.1-mini, validated against a strict schema before it's shown to you.
- **Recipe Discovery** — search, filter (cuisine, region, category, difficulty, diet, time, budget, rating), and sort (popularity, rating, newest, quickest, budget) across the full recipe library, all backed by a real JSON API.
- **Recipe Detail Pages** — ingredient checklist with live serving-size scaling, step-by-step **Cooking Mode** with a progress bar, nutrition, tips, substitutions, equipment, storage, and serving suggestions.
- **AI Adapt & Substitute** — rework any recipe ("make it cheaper", "make it vegetarian", "increase protein", change servings, etc.) or ask for an ingredient substitution with an explanation of the effect on the dish.
- **AI Recommendations** — a local-first candidate filter narrows the dataset before a small, relevant shortlist is ranked by AI (or a pure local fallback if AI is unavailable) — the full dataset is never sent to OpenAI.
- **Save, Download, Print, Share** — saved recipes and recently viewed history via `localStorage` (no login required), a print-optimized PDF-ready layout, and the Web Share API with a clipboard fallback.
- **Cuisine & Category pages**, an **About / FAQ / Contact** section, and a polished **404** page.
- Premium **editorial, light-theme** design system — warm cream/white palette, sophisticated green and terracotta accents, Fraunces + Inter typography, and CSS-gradient "photo" placeholders (no external image dependencies, so nothing ever looks broken).

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI, Uvicorn, Pydantic, Jinja2 |
| AI | OpenAI Python SDK, `gpt-4.1-mini` |
| Frontend | HTML, Tailwind CSS (Play CDN), Vanilla JavaScript |
| Data | JSON files under `app/data/` (no database) |

## Project Structure

```
app/
├── main.py                    # FastAPI app, static mount, routers, 404 handler
├── routes/                    # pages.py, recipes.py, ai.py, feedback.py
├── agents/                    # recipe_agent.py, recommendation_agent.py
├── services/                  # openai_service.py, recipe_service.py, json_store.py
├── models/                    # recipe.py, ai_request.py, feedback.py
├── data/                      # recipes.json (30 recipes), cuisines/categories/regions.json, etc.
└── utils/                     # validation.py, helpers.py
templates/                     # Jinja2 templates (base + 11 pages)
static/
├── css/styles.css             # design system + custom components + print styles
└── js/                        # main.js, discover.js, recipe.js, generate.js, saved.js
```

## Getting Started

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure your OpenAI API key

```bash
cp .env.example .env
```

Edit `.env` and set:

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4.1-mini
```

> The app runs and the full recipe library remains fully browsable without an API key — only the AI Recipe Builder, Adapt Recipe, and Substitute features require one. Without a key, those features fail gracefully with a clear, user-facing message.

### 3. Run the server

```bash
uvicorn app.main:app --reload --port 8000
```

Visit **http://localhost:8000**.

## API Overview

```
GET  /                          Home
GET  /discover                  Recipe discovery (search, filter, sort)
GET  /recipe/{slug}              Recipe detail
GET  /generate                   AI Recipe Builder
GET  /saved                      Saved recipes (localStorage)
GET  /cuisine/{slug}              Cuisine listing
GET  /category/{slug}             Category listing
GET  /about | /contact | /faq     Static pages

GET  /api/recipes                 Filter / sort / paginate the dataset
GET  /api/recipes/{id_or_slug}    Single recipe
GET  /api/search?q=               Search
GET  /api/categories | /api/cuisines | /api/regions

POST /api/ai/generate-recipe      AI Recipe Builder
POST /api/ai/adapt-recipe         Adapt an existing recipe
POST /api/ai/substitute           Ingredient substitution
POST /api/ai/recommend            Related-recipe recommendations
POST /api/feedback                Thumbs up/down on a recipe
POST /api/contact                 Contact form
```

## Notes

- All recipe and nutrition information is provided as general guidance, not medical advice — users with allergies or medical dietary restrictions should verify ingredients independently.
- Generated and adapted AI recipes are persisted to `app/data/generated_recipes.json` for the life of the running server, separately from the curated dataset in `app/data/recipes.json`.

## License

MIT — see [LICENSE](LICENSE).
