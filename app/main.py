"""AI Recipe Agent — FastAPI application entrypoint.

Run with:
    uvicorn app.main:app --reload --port 8000
"""
from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

from app.routes import ai, feedback, pages, recipes
from app.templating import templates

BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"

app = FastAPI(
    title="AI Recipe Agent",
    description="AI-powered recipe discovery and personalization platform.",
    version="1.0.0",
)

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

app.include_router(pages.router)
app.include_router(recipes.router)
app.include_router(ai.router)
app.include_router(feedback.router)


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    if request.url.path.startswith("/api"):
        from fastapi.responses import JSONResponse

        return JSONResponse(status_code=404, content={"detail": "Not found"})
    return templates.TemplateResponse(
        "404.html", {"request": request}, status_code=404
    )
