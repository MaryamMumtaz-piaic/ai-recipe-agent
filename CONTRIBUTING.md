# Contributing

Thanks for your interest in AI Recipe Agent! This is a small, dependency-light FastAPI project — contributions are welcome.

## Setup

```bash
git clone <this-repo>
cd ai-recipe-agent
pip install -r requirements.txt
cp .env.example .env   # add your OPENAI_API_KEY to try AI features locally
uvicorn app.main:app --reload --port 8000
```

## Before opening a PR

- Keep the stack as-is: FastAPI + Jinja2 + Pydantic backend, Tailwind CDN + vanilla JS frontend, JSON files for storage. See `CLAUDE.md` for the constraints this project deliberately holds to and why.
- If you touch `app/models/recipe.py`, make sure `app/data/recipes.json` and the OpenAI prompt shape in `app/services/openai_service.py` (`RECIPE_JSON_SHAPE`) still match.
- If you add a new recipe to the dataset, validate it against the `Recipe` Pydantic model before committing (e.g. `python -c "from app.models.recipe import Recipe; import json; [Recipe(**r) for r in json.load(open('app/data/recipes.json'))]"`).
- Test the golden path manually: home → discover → search/filter → open a recipe → save it → run the AI Recipe Builder → scale servings → start cooking mode → adapt/substitute → download/print → share. See `task.md` §72 for the full checklist this project was validated against.
- Keep routes thin — business logic belongs in `app/services/` or `app/agents/`, not in `app/routes/`.

## Reporting issues

Open an issue with steps to reproduce, what you expected, and what happened instead. For AI-generation issues, include the preferences you submitted (not your API key).
