"""JSON API routes for AI-powered features: generation, adaptation,
substitution, recommendation. All OpenAI calls happen via the agents,
which call app.services.openai_service — routes never call OpenAI
directly and never leak raw exception text to the client.
"""
from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.agents import recipe_agent, recommendation_agent
from app.models.ai_request import AdaptRequest, RecommendRequest, RecipePreferences, SubstituteRequest
from app.services.openai_service import AIGenerationError

router = APIRouter(prefix="/api/ai")

_FAIL_DETAIL = {"detail": "We couldn't generate your recipe right now. Please try again."}


@router.post("/generate-recipe")
async def generate_recipe(preferences: RecipePreferences):
    try:
        recipe = recipe_agent.generate_recipe(preferences)
    except AIGenerationError:
        return JSONResponse(status_code=503, content=_FAIL_DETAIL)
    return recipe.model_dump()


@router.post("/adapt-recipe")
async def adapt_recipe(req: AdaptRequest):
    try:
        recipe = recipe_agent.adapt_recipe(req)
    except AIGenerationError:
        return JSONResponse(status_code=503, content=_FAIL_DETAIL)
    except ValueError:
        return JSONResponse(status_code=400, content={"detail": "Invalid adaptation request"})
    return recipe.model_dump()


@router.post("/substitute")
async def substitute(req: SubstituteRequest):
    try:
        result = recipe_agent.generate_substitution(req.recipe_slug, req.ingredient)
    except AIGenerationError:
        return JSONResponse(status_code=503, content=_FAIL_DETAIL)
    return result


@router.post("/recommend")
async def recommend(req: RecommendRequest):
    # recommendation_agent.recommend never raises for AI-availability
    # reasons — it always falls back to local ranking.
    results = recommendation_agent.recommend(req.recipe_slug, req.session_prefs)
    return [r.model_dump() for r in results]
