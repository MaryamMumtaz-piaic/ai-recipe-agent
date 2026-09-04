# CLAUDE CODE MASTER PROMPT

# Build a Complete AI Recipe Discovery & Personalization Platform

You are a senior full-stack engineer, UI/UX designer, AI product architect, and frontend engineer.

Build a **complete, polished, production-quality recipe web application** called **AI Recipe Agent**.

This is NOT an MVP.

Do not build a simplified demo.

Build the complete product experience with a polished frontend, functional backend, AI recipe generation, recipe discovery, recipe details, personalization, filtering, search, downloads, saved recipes, and all supporting pages and states.

The application should feel like a real, premium recipe platform that could be publicly launched.

---

# 1. CORE CONCEPT

The platform helps users discover and generate personalized recipes.

The main experience is:

```text
User
 ↓
Select Region
 ↓
Select Country / Cuisine
 ↓
Choose What They Want To Cook
 ↓
Select / Search Dish
 ↓
Choose Number of Servings
 ↓
Set Budget
 ↓
Set Dietary Requirements
 ↓
Set Available Ingredients
 ↓
Set Cooking Preferences
 ↓
Set Difficulty / Time
 ↓
AI Recipe Agent
 ↓
Personalized Recipe
 ↓
Step-by-Step Cooking Instructions
 ↓
Nutrition + Ingredients + Timing
 ↓
Save / Download / Print / Share
```

The user should never feel like they are simply chatting with an AI.

The product should feel like an intelligent **recipe discovery and cooking platform**.

---

# 2. REQUIRED TECHNOLOGY

Use exactly:

## Backend

* Python
* FastAPI
* Uvicorn
* Pydantic
* OpenAI Python SDK
* Jinja2

## Frontend

* HTML
* Tailwind CSS
* Vanilla JavaScript

## AI Model

Use:

```text
OpenAI GPT-4.1-mini
```

Do not replace this with another model.

The OpenAI API key must remain server-side.

Do NOT use:

* React
* Next.js
* Vue
* Angular
* Node.js frontend
* separate frontend server
* PostgreSQL
* MongoDB
* Redis
* Docker unless absolutely required
* unnecessary microservices

FastAPI must serve the complete website.

Run with:

```bash
uvicorn app.main:app --reload --port 8000
```

Website:

```text
http://localhost:8000
```

---

# 3. IMPORTANT EXISTING STYLES FILE

There is an existing styles file in the project.

Before changing the UI:

1. Inspect the existing styles file.
2. Understand its variables, utilities, components, spacing, typography, and existing design system.
3. Reuse compatible styles where appropriate.
4. Do not blindly delete or replace useful existing styles.
5. Refactor only when necessary.
6. Keep the styling maintainable.

If the existing styles file is empty or insufficient, create a professional styling system around it.

---

# 4. DESIGN DIRECTION

There is no reference website.

You are responsible for designing the entire visual identity.

The UI must be exceptionally polished.

Use a:

* premium
* modern
* editorial
* culinary
* elegant
* warm
* clean
* light-theme

design language.

The interface should feel like a combination of:

```text
Premium food magazine
+
Modern SaaS product
+
Recipe discovery platform
+
AI personalization product
```

Do NOT create a generic AI dashboard.

Do NOT make everything look like cards inside cards.

Do NOT overuse gradients.

Do NOT use a dark theme.

Do NOT use excessive glassmorphism.

Do NOT create a template-looking interface.

The design should feel intentionally designed for a food platform.

---

# 5. COLOR SYSTEM

Use a sophisticated light palette.

Base:

* warm white
* off-white
* soft cream
* subtle neutral gray

Accent:

* sophisticated green
* muted warm orange
* subtle terracotta
* natural food-inspired accents

Use colors carefully.

Avoid neon colors.

Avoid excessive color usage.

Typography should provide hierarchy.

---

# 6. TYPOGRAPHY

Use a strong modern typography system.

Headings should feel editorial and premium.

Body text should remain highly readable.

Use:

* large expressive hero heading
* strong section headings
* comfortable body line-height
* clear labels
* excellent spacing

Do not make everything bold.

---

# 7. RESPONSIVE DESIGN

The application must be fully responsive.

Support:

```text
Large desktop
Desktop
Laptop
Tablet
Mobile
```

Do not simply shrink the desktop version.

Create intentional mobile layouts.

Navigation must become mobile-friendly.

Recipe pages must remain easy to read while cooking on a phone.

---

# 8. GLOBAL NAVBAR

Create a polished navbar.

Desktop:

```text
Logo
Home
Discover
AI Recipe
Categories
About

Search

[Create Recipe]
```

The navbar should remain clean.

Mobile:

```text
Logo
Menu
```

Mobile menu should include all important navigation.

The navbar should have a subtle border/shadow on scroll.

---

# 9. HOME PAGE

Create a complete homepage.

Sections:

```text
Navbar
Hero
Popular Cuisines
AI Recipe Builder
Featured Recipes
Explore Categories
Trending Recipes
How It Works
Seasonal Recipes
Recipe Collections
CTA
Footer
```

---

# 10. HERO SECTION

The hero should immediately explain the product.

Example concept:

```text
Cook something
you'll actually love.

Discover recipes from around the world
or let AI create one around your ingredients,
budget, preferences, and cravings.

[Create My Recipe]

[Explore Recipes]
```

Include a visually beautiful food composition.

If no external image assets are available, use the existing project assets or create elegant image placeholders that do not look broken.

Do not depend on remote image URLs for core functionality.

---

# 11. AI RECIPE BUILDER

This is the primary product feature.

Create a highly polished guided experience.

CTA:

```text
Create Your Recipe
```

Opening the builder should feel like entering a cooking assistant.

---

# 12. STEP 1: REGION

Ask:

```text
Where are you cooking from?
```

Allow region selection.

Examples:

```text
South Asia
East Asia
Middle East
Europe
North America
South America
Africa
Southeast Asia
Central Asia
```

Show beautiful visual selection cards.

---

# 13. STEP 2: COUNTRY / CUISINE

After selecting region:

Show relevant countries/cuisines.

For South Asia:

```text
Pakistan
India
Bangladesh
Sri Lanka
Nepal
```

For East Asia:

```text
China
Japan
Korea
Taiwan
```

etc.

Allow searching.

Example:

```text
Search countries or cuisines...
```

The system must dynamically filter the available options.

---

# 14. STEP 3: WHAT DO YOU WANT TO COOK?

Ask:

```text
What would you like to cook?
```

Provide:

```text
Breakfast
Lunch
Dinner
Dessert
Snack
Soup
Salad
Main Course
Side Dish
Drinks
Bakery
Street Food
```

Also provide:

```text
Search for a dish...
```

Example:

```text
Biryani
Karahi
Nihari
Daal
Butter Chicken
Ramen
Fried Rice
Pasta
Pizza
```

The user can manually type anything.

---

# 15. STEP 4: SERVINGS

Ask:

```text
How many people are you cooking for?
```

Options:

```text
1
2
3
4
5
6
8
10+
```

Also allow custom quantity.

Example:

```text
4 people
```

All ingredient quantities must automatically scale according to servings.

---

# 16. STEP 5: BUDGET

Ask:

```text
What's your budget?
```

Allow:

```text
Low
Moderate
Flexible
Custom
```

For custom:

```text
Currency
Maximum budget
```

Support different currencies.

The generated recipe should respect the selected budget.

---

# 17. STEP 6: DIETARY REQUIREMENTS

Allow multiple selections:

```text
No restrictions
Vegetarian
Vegan
Halal
Gluten-free
Dairy-free
Nut-free
Low-sodium
High-protein
Low-carb
Keto
Diabetic-friendly
Custom
```

Do not make medical claims.

For medical/dietary restrictions, clearly state that users should verify ingredients and suitability themselves.

---

# 18. STEP 7: INGREDIENTS

Ask:

```text
What ingredients do you already have?
```

Allow:

```text
Tomatoes
Chicken
Rice
Onions
Garlic
Potatoes
Spices
```

Use removable ingredient chips.

Also provide:

```text
I don't have specific ingredients
```

---

# 19. STEP 8: COOKING PREFERENCES

Ask:

```text
How do you want to cook?
```

Options:

```text
Stovetop
Oven
Air Fryer
Instant Pot
Slow Cooker
Grill
No preference
```

---

# 20. STEP 9: TIME

Ask:

```text
How much time do you have?
```

Options:

```text
15 minutes
30 minutes
45 minutes
1 hour
1–2 hours
No limit
```

The recipe must respect this constraint.

---

# 21. STEP 10: DIFFICULTY

Options:

```text
Easy
Intermediate
Advanced
Any
```

---

# 22. FINAL REVIEW SCREEN

Before generating, show:

```text
Your Recipe Preferences

Cuisine:
Pakistani

Dish:
Chicken Karahi

Servings:
4

Budget:
PKR 2,500

Diet:
Halal

Available Ingredients:
Chicken
Tomatoes
Onions
Garlic

Cooking Method:
Stovetop

Time:
45 minutes

Difficulty:
Intermediate
```

Button:

```text
Generate My Recipe
```

Allow editing any preference before generation.

---

# 23. AI RECIPE AGENT

Create:

```text
app/agents/recipe_agent.py
```

The agent should receive all user preferences.

Use GPT-4.1-mini.

The agent must generate a structured recipe.

Do not ask the AI for free-form text only.

Use structured JSON.

Required output:

```json
{
  "title": "",
  "description": "",
  "cuisine": "",
  "category": "",
  "servings": 4,
  "prep_time": "",
  "cook_time": "",
  "total_time": "",
  "difficulty": "",
  "budget": {
    "amount": 0,
    "currency": ""
  },
  "ingredients": [],
  "instructions": [],
  "tips": [],
  "substitutions": [],
  "nutrition": {},
  "equipment": [],
  "storage": "",
  "serving_suggestions": []
}
```

---

# 24. RECIPE GENERATION RULES

The AI must:

* respect cuisine
* respect dish type
* respect servings
* respect budget
* respect dietary requirements
* use available ingredients when possible
* respect cooking equipment
* respect available time
* respect difficulty
* provide realistic quantities
* provide logical cooking order
* avoid contradictory instructions
* avoid impossible ingredient combinations
* avoid unnecessary ingredients
* provide clear measurements
* provide step-by-step instructions

---

# 25. STEP-BY-STEP INSTRUCTIONS

This is extremely important.

Do not generate vague instructions like:

```text
Cook everything until done.
```

Each step should be actionable.

Example:

```text
1. Heat 2 tbsp oil in a heavy-bottomed pan over medium heat.

2. Add sliced onions and cook for 5–7 minutes until lightly golden.

3. Add minced garlic and ginger. Cook for 30 seconds.

4. Add the chicken and increase heat to medium-high.

5. Cook for 6–8 minutes, stirring occasionally...
```

Each step can contain:

```text
step number
title
instruction
duration
temperature/heat when relevant
```

---

# 26. RECIPE RESULT PAGE

Create a beautiful recipe page.

Layout:

```text
Recipe Image / Hero
Recipe Title
Description

Cuisine
Category
Difficulty
Prep Time
Cook Time
Total Time
Servings

[Save]
[Download]
[Print]
[Share]

Ingredients
Instructions
Nutrition
Tips
Substitutions
Equipment
Storage
Serving Suggestions
```

---

# 27. RECIPE HERO

The recipe page should have a strong visual hero.

Example:

```text
Pakistani Cuisine

Chicken Karahi

A rich and aromatic tomato-based chicken dish...

45 min
Intermediate
4 servings

[Save Recipe]
[Download PDF]
```

---

# 28. INGREDIENTS SECTION

Use a beautiful checklist interface.

Example:

```text
☐ 750g chicken
☐ 500g tomatoes
☐ 2 medium onions
☐ 1 tbsp ginger
☐ 1 tbsp garlic
☐ 2 tsp chili powder
☐ 1 tsp cumin
```

Users should be able to check ingredients as they prepare them.

Add:

```text
Scale Recipe
```

Allow:

```text
2 servings
4 servings
6 servings
8 servings
Custom
```

Ingredient quantities should update dynamically.

---

# 29. COOKING MODE

Add a dedicated:

```text
Start Cooking
```

mode.

When activated:

Show one instruction at a time.

Example:

```text
STEP 3 OF 12

Add the garlic and ginger.

Cook for 30 seconds until fragrant.

[Previous]
[Done / Next]
```

Include:

```text
Progress: 25%
```

This mode should be extremely mobile-friendly.

---

# 30. RECIPE DOWNLOAD

Implement real recipe download.

Provide:

```text
Download Recipe
```

Generate a clean downloadable recipe file.

At minimum support:

```text
PDF
```

The PDF should contain:

* recipe title
* description
* servings
* timings
* ingredients
* instructions
* tips
* nutrition
* substitutions

Do not generate a broken or plain text-looking PDF.

---

# 31. PRINT RECIPE

Implement a print-friendly stylesheet.

When user clicks:

```text
Print Recipe
```

hide:

* navbar
* unnecessary buttons
* navigation
* interactive UI

Print only the recipe content.

---

# 32. SHARE

Add:

```text
Share Recipe
```

Use the Web Share API when available.

Fallback:

```text
Copy Link
```

Show toast:

```text
Recipe link copied.
```

---

# 33. DISCOVERY PAGE

Create:

```text
/discover
```

This should be one of the major pages.

It should feel like a real recipe discovery platform.

Sections:

```text
Discover
Trending
Popular
New
Quick Meals
Budget Friendly
Healthy
Desserts
Breakfast
Dinner
Pakistani
Indian
Chinese
Italian
Middle Eastern
```

---

# 34. DISCOVERY GRID

Display a large recipe collection.

Each recipe card:

```text
Image
Cuisine
Category
Recipe Name
Short Description
Time
Difficulty
Rating
Save
```

Example:

```text
Chicken Biryani

Pakistani
45 min
Intermediate

★★★★★ 4.9
```

Use realistic dummy recipe data.

---

# 35. RECIPE DATASET

Create at least:

```text
20+ recipes
```

Use realistic fictional/local recipe records.

Do not rely entirely on AI generation at runtime.

The dataset should cover:

```text
Pakistani
Indian
Chinese
Japanese
Korean
Thai
Italian
Mexican
Turkish
Middle Eastern
American
Mediterranean
British
French
African
Southeast Asian
```

Categories:

```text
Breakfast
Lunch
Dinner
Dessert
Snack
Soup
Salad
Main Course
Side Dish
Drinks
Bakery
Street Food
```

Each recipe should contain:

```json
{
  "id": "",
  "title": "",
  "slug": "",
  "description": "",
  "cuisine": "",
  "region": "",
  "category": "",
  "image": "",
  "prep_time": "",
  "cook_time": "",
  "total_time": "",
  "difficulty": "",
  "servings": 4,
  "rating": 4.8,
  "review_count": 124,
  "ingredients": [],
  "instructions": [],
  "tags": []
}
```

---

# 36. RECIPE DETAIL FROM DISCOVERY

Clicking any recipe must open:

```text
/recipe/{slug}
```

This page must be fully functional.

Show the complete recipe.

Users should not need the AI generator to read normal recipes.

---

# 37. SEARCH

Implement global recipe search.

Search:

```text
Chicken
Biryani
Quick dinner
Vegetarian
Pakistani
Dessert
30 minute meals
```

Search should work against the local dataset.

Show:

```text
Search Results
```

with:

* relevance
* cuisine
* category
* time
* difficulty

---

# 38. FILTERS

Discovery filters:

```text
Cuisine
Region
Category
Difficulty
Cooking Time
Diet
Budget
Rating
```

Filters should work client-side or through FastAPI APIs.

Do not create fake filter buttons.

They must actually filter recipes.

---

# 39. SORTING

Allow:

```text
Most Popular
Highest Rated
Newest
Quickest
Budget Friendly
```

---

# 40. CATEGORY PAGES

Create category views for:

```text
/cuisine/pakistani
/cuisine/indian
/cuisine/chinese
/cuisine/italian
/cuisine/middle-eastern
```

and:

```text
/category/breakfast
/category/dinner
/category/dessert
/category/quick-meals
/category/budget-friendly
```

These can reuse the same recipe listing component.

---

# 41. SAVED RECIPES

Since there is no authentication, use:

```text
localStorage
```

for saved recipes.

Users can:

```text
Save
Unsave
View Saved Recipes
```

Create:

```text
/saved
```

Display:

```text
Your Saved Recipes
```

with empty state if none exist.

---

# 42. RECENTLY VIEWED

Use localStorage.

Track recently viewed recipes.

Show on homepage:

```text
Continue Cooking
```

Example:

```text
Recently Viewed
Chicken Karahi
Beef Nihari
Vegetable Fried Rice
```

---

# 43. AI PERSONALIZATION

The platform should remember current session preferences.

If a user repeatedly chooses:

```text
Pakistani
Halal
Budget-friendly
Quick meals
```

the UI can recommend:

```text
Recommended For You
```

Do not claim long-term personalization unless actual persistent storage exists.

---

# 44. RECIPE RECOMMENDATION AGENT

Create:

```text
app/agents/recommendation_agent.py
```

It should use:

* current recipe
* selected cuisine
* categories
* user session preferences
* recipe metadata

to recommend related recipes.

Example:

```text
Because you liked Chicken Karahi:

Try:
Chicken Handi
Mutton Karahi
Chicken Achari
```

Use AI where useful, but local filtering should handle simple cases efficiently.

---

# 45. AI SUBSTITUTION FEATURE

On generated or supported recipes:

```text
Ingredient Substitutions
```

User selects an ingredient.

Example:

```text
No yogurt?
```

AI provides:

```text
Possible substitute:
Coconut yogurt

Effect:
Slightly different flavor and texture.
```

The AI must explain meaningful differences.

---

# 46. AI RECIPE ADAPTATION

Add:

```text
Adapt Recipe
```

Options:

```text
Make it cheaper
Make it faster
Make it vegetarian
Make it spicier
Make it milder
Increase protein
Use what I have
Reduce ingredients
Change serving size
```

The AI should generate an adapted version while preserving the recipe structure.

---

# 47. RECIPE FEEDBACK

Add:

```text
Was this recipe helpful?

👍 Yes
👎 No
```

Store aggregate feedback locally.

For the no-login system, associate feedback with an anonymous local identifier.

---

# 48. HOME PAGE DISCOVERY SECTIONS

The homepage should dynamically show:

### Trending Recipes

Based on dummy popularity data.

### Quick Meals

Recipes under 30 minutes.

### Budget Friendly

Recipes with low estimated cost.

### Explore Cuisines

Visual cuisine cards.

### Popular This Week

Recipe ranking.

### Recently Added

Newest dataset entries.

### Recommended

Based on current session preferences.

---

# 49. ABOUT PAGE

Create:

```text
/about
```

Explain:

```text
What the platform does
How AI recipe generation works
How recipe discovery works
Why personalization matters
```

Keep it professional.

---

# 50. CONTACT PAGE

Create:

```text
/contact
```

Include:

```text
Name
Email
Subject
Message
```

For this project, store submissions locally.

Do not pretend they are emailed.

Show:

```text
Message received.
```

---

# 51. FAQ PAGE

Create:

```text
/faq
```

Questions:

```text
How does AI recipe generation work?
Can I change servings?
Can I use ingredients I already have?
Can I save recipes?
Can I download recipes?
How are recipes personalized?
```

---

# 52. FOOTER

Create a complete footer:

```text
AI Recipe Agent

Discover.
Cook.
Personalize.

Explore
Discover
Categories
Cuisines
Saved Recipes

AI Tools
Recipe Builder
Adapt Recipe
Ingredient Substitutions

Company
About
FAQ
Contact

© 2026 AI Recipe Agent
```

---

# 53. API DESIGN

Implement clean FastAPI routes.

Example:

```text
GET  /
GET  /discover
GET  /saved
GET  /recipe/{slug}
GET  /about
GET  /contact
GET  /faq

GET  /api/recipes
GET  /api/recipes/{id}
GET  /api/search
GET  /api/categories
GET  /api/cuisines

POST /api/ai/generate-recipe
POST /api/ai/adapt-recipe
POST /api/ai/substitute
POST /api/ai/recommend
POST /api/feedback

POST /api/contact
```

Use proper Pydantic models.

---

# 54. AI SERVICE

Create:

```text
app/services/openai_service.py
```

Centralize OpenAI communication.

Functions should include:

```python
generate_recipe()
adapt_recipe()
generate_substitution()
recommend_recipes()
```

The recipe agent should sit above the OpenAI service.

Do not scatter OpenAI calls throughout route files.

---

# 55. AGENT ARCHITECTURE

Use clear separation:

```text
User Request
     ↓
Recipe Agent
     ↓
Preference Validation
     ↓
Recipe Planning
     ↓
OpenAI GPT-4.1-mini
     ↓
Structured Recipe
     ↓
Validation
     ↓
Recipe Renderer
```

For recommendation:

```text
User/Recipe
     ↓
Recommendation Agent
     ↓
Local Candidate Filtering
     ↓
AI Ranking
     ↓
Recommended Recipes
```

Do not send the entire 300+ recipe dataset to OpenAI.

First filter locally.

Then send only relevant candidates.

---

# 56. OPENAI ERROR HANDLING

If OpenAI fails:

Show:

```text
We couldn't generate your recipe right now.

Please try again.
```

Do not expose:

* API errors
* stack traces
* internal prompts
* API keys

Provide graceful fallback where possible.

---

# 57. ENVIRONMENT

Create:

```text
.env.example
```

with:

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini
```

Do not hardcode API keys.

---

# 58. PERFORMANCE

Optimize the application.

Important:

* avoid unnecessary AI requests
* filter locally first
* cache where sensible
* lazy-load images
* minimize JavaScript
* keep API responses clean
* avoid blocking the UI
* use asynchronous FastAPI operations where appropriate

---

# 59. SEO

Since this is a public recipe website, implement proper SEO.

Each recipe page should have:

* unique title
* meta description
* canonical URL
* Open Graph metadata
* descriptive headings

Where practical, add structured recipe metadata / Recipe schema for recipe pages.

---

# 60. ACCESSIBILITY

Implement:

* semantic HTML
* labels
* keyboard navigation
* focus states
* accessible buttons
* proper contrast
* alt text
* accessible modals
* accessible dropdowns

---

# 61. LOADING STATES

Every AI operation needs a polished loading state.

Example:

```text
Creating Your Recipe

✓ Reading your preferences
✓ Understanding your cuisine
● Planning ingredients
○ Building cooking steps
○ Checking constraints
○ Finalizing recipe
```

Do not use a generic spinner everywhere.

Use contextual progress.

---

# 62. MODALS

Create polished reusable modals for:

* recipe generation
* ingredient substitution
* adapt recipe
* share
* delete saved recipe
* feedback

Clicking outside should close where appropriate.

Escape should close modals.

---

# 63. TOAST SYSTEM

Create a reusable toast notification system.

Examples:

```text
Recipe saved
Recipe removed
Recipe copied
Recipe downloaded
Preferences updated
Recipe generated
Recipe adapted
Feedback submitted
```

---

# 64. EMPTY STATES

Create proper empty states.

Example:

```text
No saved recipes yet.

Discover something delicious and save it here.

[Explore Recipes]
```

Never show an empty blank page.

---

# 65. 404 PAGE

Create a polished:

```text
404
```

page.

Example:

```text
Looks like this recipe got lost in the kitchen.

[Back to Home]
[Explore Recipes]
```

---

# 66. DATA STORAGE

Use JSON files for application data where persistent storage is needed.

Example:

```text
app/data/
├── recipes.json
├── cuisines.json
├── categories.json
├── feedback.json
└── contacts.json
```

Create reusable JSON storage utilities.

Do not duplicate read/write logic.

---

# 67. PROJECT STRUCTURE

Use:

```text
ai-recipe-agent/
│
├── app/
│   ├── main.py
│
│   ├── routes/
│   │   ├── pages.py
│   │   ├── recipes.py
│   │   ├── ai.py
│   │   └── feedback.py
│
│   ├── agents/
│   │   ├── recipe_agent.py
│   │   └── recommendation_agent.py
│
│   ├── services/
│   │   ├── openai_service.py
│   │   ├── recipe_service.py
│   │   └── json_store.py
│
│   ├── models/
│   │   ├── recipe.py
│   │   ├── ai_request.py
│   │   └── feedback.py
│
│   ├── data/
│   │   ├── recipes.json
│   │   ├── cuisines.json
│   │   ├── categories.json
│   │   ├── feedback.json
│   │   └── contacts.json
│
│   └── utils/
│       ├── validation.py
│       └── helpers.py
│
├── templates/
│   ├── base.html
│   ├── index.html
│   ├── discover.html
│   ├── recipe.html
│   ├── generate.html
│   ├── saved.html
│   ├── cuisine.html
│   ├── category.html
│   ├── about.html
│   ├── contact.html
│   ├── faq.html
│   └── 404.html
│
├── static/
│   ├── css/
│   │   └── styles.css
│   │
│   ├── js/
│   │   ├── main.js
│   │   ├── discover.js
│   │   ├── recipe.js
│   │   ├── generate.js
│   │   └── saved.js
│   │
│   └── images/
│
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

Adapt this structure if the existing project already has a better structure, but maintain clean separation of responsibilities.

---

# 68. IMPORTANT: DO NOT BUILD A FAKE UI

Every major interaction must work.

These must actually work:

```text
Search
Filtering
Sorting
Recipe details
Recipe generation
AI adaptation
Ingredient substitution
Serving scaling
Save/unsave
Recently viewed
Download
Print
Share
Feedback
Contact form
Navigation
```

Do not create buttons that only visually respond.

---

# 69. RECIPE GENERATION UX

The generation experience should feel premium.

Use a multi-step visual progress interface.

Example:

```text
1  Preferences
2  Ingredients
3  AI Planning
4  Recipe
```

On generation:

```text
Your recipe is being prepared...
```

Then redirect to the generated recipe page.

Generated recipes should have a unique local ID and be available for the current session.

---

# 70. RECIPE SAFETY

Food recommendations can have safety implications.

The AI should avoid unsafe cooking instructions.

For example:

* use appropriate cooking temperatures where relevant
* avoid recommending raw consumption of ingredients that require cooking
* mention allergen considerations when relevant
* do not claim medical treatment benefits
* encourage users with serious allergies or medical dietary restrictions to verify ingredients independently

Do not make unnecessary medical claims.

---

# 71. QUALITY BAR

The final application must NOT look like:

```text
student project
basic CRUD application
generic Tailwind template
AI chatbot
admin dashboard
prototype
```

It should look like:

```text
A polished commercial recipe platform
with an intelligent AI cooking assistant.
```

Pay special attention to:

* spacing
* typography
* image proportions
* card hierarchy
* responsive behavior
* empty states
* loading states
* hover states
* buttons
* forms
* navigation
* recipe readability
* mobile cooking experience

---

# 72. FINAL TESTING

Before considering the project complete, test the complete journey:

```text
Home
 ↓
Discover
 ↓
Search
 ↓
Filter
 ↓
Open Recipe
 ↓
Save Recipe
 ↓
Generate Recipe
 ↓
Select Pakistani
 ↓
Select Chicken Karahi
 ↓
4 servings
 ↓
Budget
 ↓
Dietary requirements
 ↓
Ingredients
 ↓
Cooking method
 ↓
Time
 ↓
Generate
 ↓
AI Recipe
 ↓
Scale servings
 ↓
Start Cooking
 ↓
Adapt Recipe
 ↓
Ingredient Substitution
 ↓
Download PDF
 ↓
Print
 ↓
Share
 ↓
Save
```

Test on desktop and mobile.

Fix all broken states.

---

# 73. FINAL REQUIREMENT

Do not stop after creating the initial pages.

Continue implementing until the complete application works end-to-end.

Inspect the existing project before modifying it.

Reuse the existing styles file where appropriate.

Do not ask me to design the UI for you.

You are responsible for making all UI/UX decisions.

Do not wait for a reference website.

Create the visual system yourself.

Use GPT-4.1-mini for the AI functionality.

Use FastAPI to serve the entire application.

Use HTML + Tailwind CSS + Vanilla JavaScript for the frontend.

Use Python for the backend.

No login or signup.

No unnecessary infrastructure.

The final product should be a **complete AI-powered recipe discovery and personalization platform**, not an MVP and not a mockup.

Build it to a level where the interface should require **little to no manual UI redesign after implementation**.
