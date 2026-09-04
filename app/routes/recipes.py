"""JSON API routes for browsing, searching, and filtering recipes."""
from __future__ import annotations

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from app.services import recipe_service

router = APIRouter(prefix="/api")


@router.get("/recipes")
async def list_recipes(
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
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
):
    results, total = recipe_service.filter_recipes(
        cuisine=cuisine,
        region=region,
        category=category,
        difficulty=difficulty,
        diet=diet,
        max_time=max_time,
        budget_tier=budget_tier,
        min_rating=min_rating,
        q=q,
        sort=sort,
        page=page,
        page_size=page_size,
    )
    return {
        "results": [r.model_dump() for r in results],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/search")
async def search(q: str = ""):
    results = recipe_service.search_recipes(q)
    return {"results": [r.model_dump() for r in results]}


@router.get("/categories")
async def categories():
    return recipe_service.get_categories()


@router.get("/cuisines")
async def cuisines():
    return recipe_service.get_cuisines()


@router.get("/regions")
async def regions():
    return recipe_service.get_regions()


@router.get("/recipes/{id_or_slug}")
async def get_recipe(id_or_slug: str):
    recipe = recipe_service.find_recipe_by_id_or_slug(id_or_slug)
    if recipe is None:
        return JSONResponse(status_code=404, content={"detail": "Recipe not found"})
    return recipe.model_dump()
