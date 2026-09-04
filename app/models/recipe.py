"""Pydantic models for recipes and their sub-structures."""
from __future__ import annotations

from pydantic import BaseModel, Field


class Ingredient(BaseModel):
    item: str
    quantity: float | None = None  # None for "to taste" etc
    unit: str = ""  # "g", "tbsp", "tsp", "cup", "piece", ""
    notes: str = ""


class InstructionStep(BaseModel):
    step: int
    title: str
    instruction: str
    duration: str = ""  # "5-7 minutes"
    heat: str = ""  # "medium heat" etc, optional


class Substitution(BaseModel):
    ingredient: str
    substitute: str
    effect: str


class Nutrition(BaseModel):
    calories: int | None = None
    protein_g: float | None = None
    carbs_g: float | None = None
    fat_g: float | None = None
    fiber_g: float | None = None
    sodium_mg: float | None = None


class Budget(BaseModel):
    amount: float
    currency: str = "PKR"


class Recipe(BaseModel):
    id: str
    title: str
    slug: str
    description: str
    cuisine: str
    region: str
    category: str
    emoji: str
    gradient: str
    prep_time: str
    cook_time: str
    total_time: str
    difficulty: str  # Easy | Intermediate | Advanced
    servings: int
    rating: float = 4.7
    review_count: int = 0
    budget: Budget | None = None
    ingredients: list[Ingredient]
    instructions: list[InstructionStep]
    tips: list[str] = Field(default_factory=list)
    substitutions: list[Substitution] = Field(default_factory=list)
    nutrition: Nutrition = Field(default_factory=Nutrition)
    equipment: list[str] = Field(default_factory=list)
    storage: str = ""
    serving_suggestions: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    dietary: list[str] = Field(default_factory=list)
    source: str = "dataset"  # "dataset" | "ai_generated" | "ai_adapted"
    created_at: str = ""  # ISO timestamp, for "Recently Added" sort


class RecipeSummary(BaseModel):
    """Trimmed Recipe for list views."""

    id: str
    title: str
    slug: str
    description: str
    cuisine: str
    region: str
    category: str
    emoji: str
    gradient: str
    total_time: str
    difficulty: str
    servings: int
    rating: float
    review_count: int
    tags: list[str] = Field(default_factory=list)
    dietary: list[str] = Field(default_factory=list)
    created_at: str = ""
    budget: Budget | None = None
