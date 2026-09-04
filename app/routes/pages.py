"""Server-rendered page routes (Jinja2 templates)."""
from __future__ import annotations

from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse

from app.services import recipe_service
from app.templating import templates

router = APIRouter()


@router.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@router.get("/discover", response_class=HTMLResponse)
async def discover(request: Request):
    return templates.TemplateResponse("discover.html", {"request": request})


@router.get("/saved", response_class=HTMLResponse)
async def saved(request: Request):
    return templates.TemplateResponse("saved.html", {"request": request})


@router.get("/generate", response_class=HTMLResponse)
async def generate(request: Request):
    return templates.TemplateResponse("generate.html", {"request": request})


@router.get("/recipe/{slug}", response_class=HTMLResponse)
async def recipe_detail(request: Request, slug: str):
    recipe = recipe_service.find_recipe_by_slug(slug)
    if recipe is None:
        return templates.TemplateResponse(
            "404.html", {"request": request}, status_code=404
        )
    return templates.TemplateResponse(
        "recipe.html", {"request": request, "recipe": recipe.model_dump()}
    )


@router.get("/cuisine/{cuisine_slug}", response_class=HTMLResponse)
async def cuisine_page(request: Request, cuisine_slug: str):
    return templates.TemplateResponse(
        "cuisine.html", {"request": request, "cuisine_slug": cuisine_slug}
    )


@router.get("/category/{category_slug}", response_class=HTMLResponse)
async def category_page(request: Request, category_slug: str):
    return templates.TemplateResponse(
        "category.html", {"request": request, "category_slug": category_slug}
    )


@router.get("/about", response_class=HTMLResponse)
async def about(request: Request):
    return templates.TemplateResponse("about.html", {"request": request})


@router.get("/contact", response_class=HTMLResponse)
async def contact(request: Request):
    return templates.TemplateResponse("contact.html", {"request": request})


@router.get("/faq", response_class=HTMLResponse)
async def faq(request: Request):
    return templates.TemplateResponse("faq.html", {"request": request})
