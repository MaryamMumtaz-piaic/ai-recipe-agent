/* ==========================================================================
   generate.js — the full AI Recipe Builder wizard: region → cuisine → dish
   → servings → budget → dietary → ingredients → cooking method → time →
   difficulty → review, then a contextual loading state and POST to
   /api/ai/generate-recipe, redirecting to the generated recipe on success.
   ========================================================================== */
(function () {
  "use strict";
  const container = document.getElementById("wizard-container");
  if (!container) return; // not on the generate page

  const { escapeHtml, fetchJSON } = window.RecipeUtils;
  const Store = window.RecipeStore;

  const state = {
    region: "",
    cuisine: "",
    dish: "",
    meal_type: "",
    servings: 4,
    budget_tier: "moderate",
    budget_amount: null,
    budget_currency: "PKR",
    dietary: [],
    available_ingredients: [],
    no_specific_ingredients: false,
    cooking_method: "No preference",
    time_available: "No limit",
    difficulty: "Any",
  };

  let regionsData = [];
  let categoriesData = [];
  let stepIdx = 0;

  const COMMON_DISHES = ["Biryani", "Karahi", "Nihari", "Daal", "Butter Chicken", "Ramen", "Fried Rice", "Pasta", "Pizza", "Tacos", "Curry", "Kebab"];
  const COMMON_INGREDIENTS = ["Tomatoes", "Chicken", "Rice", "Onions", "Garlic", "Potatoes", "Spices", "Eggs", "Yogurt", "Beef", "Lentils", "Peppers"];

  const STEPS = [
    { id: "region", name: "Region", render: renderRegion, validate: () => !!state.region },
    { id: "cuisine", name: "Cuisine", render: renderCuisine, validate: () => !!state.cuisine },
    { id: "dish", name: "Dish", render: renderDish, validate: () => !!state.dish.trim() },
    { id: "servings", name: "Servings", render: renderServings, validate: () => state.servings > 0 },
    { id: "budget", name: "Budget", render: renderBudget, validate: () => true },
    { id: "dietary", name: "Dietary", render: renderDietary, validate: () => true },
    { id: "ingredients", name: "Ingredients", render: renderIngredients, validate: () => true },
    { id: "cooking_method", name: "Cooking Method", render: renderCookingMethod, validate: () => true },
    { id: "time", name: "Time", render: renderTime, validate: () => true },
    { id: "difficulty", name: "Difficulty", render: renderDifficulty, validate: () => true },
    { id: "review", name: "Review", render: renderReview, validate: () => true },
  ];

  function cardGrid(items, selectedValue, dataAttr, extraClass) {
    return `<div class="grid grid-cols-2 sm:grid-cols-3 gap-3 ${extraClass || ""}">${items
      .map(
        (item) => `<button type="button" class="wizard-card p-4 text-center ${item.value === selectedValue ? "is-selected" : ""}" data-${dataAttr}="${escapeHtml(item.value)}">
          ${item.icon ? `<div class="text-2xl mb-1.5">${item.icon}</div>` : ""}
          <div class="text-sm font-medium">${escapeHtml(item.label)}</div>
        </button>`
      )
      .join("")}</div>`;
  }

  /* ---------------- Step 1: Region ---------------- */
  function renderRegion() {
    return `<h2 class="font-serif text-2xl font-semibold mb-1">Where are you cooking from?</h2>
      <p class="text-ink-muted mb-6">This helps us tailor cuisine options and ingredient availability.</p>
      ${cardGrid(regionsData.map((r) => ({ value: r.name, label: r.name, icon: "🌍" })), state.region, "region")}`;
  }
  function wireRegion() {
    container.querySelectorAll("[data-region]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.region = btn.getAttribute("data-region");
        if (state.cuisine) {
          const region = regionsData.find((r) => r.name === state.region);
          if (!region || !region.cuisines.some((c) => c.name === state.cuisine)) state.cuisine = "";
        }
        renderStep();
      });
    });
  }

  /* ---------------- Step 2: Cuisine ---------------- */
  function renderCuisine() {
    const region = regionsData.find((r) => r.name === state.region);
    const cuisines = region ? region.cuisines : [];
    return `<h2 class="font-serif text-2xl font-semibold mb-1">Which cuisine?</h2>
      <p class="text-ink-muted mb-4">Countries and cuisines from ${escapeHtml(state.region || "your region")}.</p>
      <input id="cuisine-search" type="search" placeholder="Search countries or cuisines..." class="w-full mb-5 border border-border rounded-lg px-4 py-2.5 text-sm bg-surface focus:border-primary outline-none" />
      <div id="cuisine-grid">${cardGrid(cuisines.map((c) => ({ value: c.name, label: c.name })), state.cuisine, "cuisine")}</div>`;
  }
  function wireCuisine() {
    const region = regionsData.find((r) => r.name === state.region);
    const cuisines = region ? region.cuisines : [];
    function wireButtons() {
      container.querySelectorAll("[data-cuisine]").forEach((btn) => {
        btn.addEventListener("click", () => {
          state.cuisine = btn.getAttribute("data-cuisine");
          renderStep();
        });
      });
    }
    wireButtons();
    container.querySelector("#cuisine-search")?.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = cuisines.filter((c) => c.name.toLowerCase().includes(q));
      container.querySelector("#cuisine-grid").innerHTML = cardGrid(filtered.map((c) => ({ value: c.name, label: c.name })), state.cuisine, "cuisine");
      wireButtons();
    });
  }

  /* ---------------- Step 3: Dish ---------------- */
  function renderDish() {
    return `<h2 class="font-serif text-2xl font-semibold mb-1">What would you like to cook?</h2>
      <p class="text-ink-muted mb-5">Pick a meal type, then search or type any dish.</p>
      <div class="mb-5">${cardGrid(
        ["Breakfast", "Lunch", "Dinner", "Dessert", "Snack", "Soup", "Salad", "Main Course", "Side Dish", "Drinks", "Bakery", "Street Food"].map((m) => ({ value: m, label: m })),
        state.meal_type,
        "meal"
      )}</div>
      <label for="dish-input" class="text-sm font-medium">Dish</label>
      <input id="dish-input" type="text" value="${escapeHtml(state.dish)}" placeholder="Search for a dish, e.g. Chicken Karahi" class="mt-1.5 w-full border border-border rounded-lg px-4 py-3 text-base bg-surface focus:border-primary outline-none" />
      <div class="flex flex-wrap gap-2 mt-4">${COMMON_DISHES.map((d) => `<button type="button" class="chip" data-dish-suggest="${escapeHtml(d)}">${escapeHtml(d)}</button>`).join("")}</div>`;
  }
  function wireDish() {
    container.querySelectorAll("[data-meal]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.meal_type = btn.getAttribute("data-meal");
        renderStep();
      });
    });
    const input = container.querySelector("#dish-input");
    input?.addEventListener("input", () => (state.dish = input.value));
    container.querySelectorAll("[data-dish-suggest]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.dish = btn.getAttribute("data-dish-suggest");
        input.value = state.dish;
      });
    });
  }

  /* ---------------- Step 4: Servings ---------------- */
  function renderServings() {
    const options = [1, 2, 3, 4, 5, 6, 8, 10];
    return `<h2 class="font-serif text-2xl font-semibold mb-1">How many people are you cooking for?</h2>
      <p class="text-ink-muted mb-6">Ingredient quantities scale automatically.</p>
      ${cardGrid(options.map((n) => ({ value: String(n), label: n === 10 ? "10+" : String(n) })), String(state.servings), "servings")}
      <div class="mt-5">
        <label for="servings-custom-input" class="text-sm font-medium">Or enter a custom number</label>
        <input id="servings-custom-input" type="number" min="1" max="50" value="${state.servings}" class="mt-1.5 w-40 border border-border rounded-lg px-3 py-2 text-sm bg-surface focus:border-primary outline-none" />
      </div>`;
  }
  function wireServings() {
    container.querySelectorAll("[data-servings]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.servings = parseInt(btn.getAttribute("data-servings"), 10);
        renderStep();
      });
    });
    container.querySelector("#servings-custom-input")?.addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      if (val > 0) state.servings = val;
    });
  }

  /* ---------------- Step 5: Budget ---------------- */
  function renderBudget() {
    const tiers = [
      { value: "low", label: "Low", icon: "💸" },
      { value: "moderate", label: "Moderate", icon: "💰" },
      { value: "flexible", label: "Flexible", icon: "💎" },
      { value: "custom", label: "Custom", icon: "✏️" },
    ];
    return `<h2 class="font-serif text-2xl font-semibold mb-1">What's your budget?</h2>
      <p class="text-ink-muted mb-6">We'll keep the recipe realistic for your budget.</p>
      ${cardGrid(tiers, state.budget_tier, "budget")}
      <div id="budget-custom-wrap" class="mt-5 grid grid-cols-2 gap-3 ${state.budget_tier === "custom" ? "" : "hidden"}">
        <div>
          <label for="budget-currency" class="text-sm font-medium">Currency</label>
          <select id="budget-currency" class="mt-1.5 w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-surface">
            ${["PKR", "USD", "INR", "GBP", "EUR", "AED"].map((c) => `<option value="${c}" ${c === state.budget_currency ? "selected" : ""}>${c}</option>`).join("")}
          </select>
        </div>
        <div>
          <label for="budget-amount" class="text-sm font-medium">Maximum budget</label>
          <input id="budget-amount" type="number" min="0" value="${state.budget_amount || ""}" class="mt-1.5 w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-surface" />
        </div>
      </div>`;
  }
  function wireBudget() {
    container.querySelectorAll("[data-budget]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.budget_tier = btn.getAttribute("data-budget");
        renderStep();
      });
    });
    container.querySelector("#budget-currency")?.addEventListener("change", (e) => (state.budget_currency = e.target.value));
    container.querySelector("#budget-amount")?.addEventListener("input", (e) => (state.budget_amount = parseFloat(e.target.value) || null));
  }

  /* ---------------- Step 6: Dietary ---------------- */
  const DIETARY_OPTIONS = ["No restrictions", "Vegetarian", "Vegan", "Halal", "Gluten-free", "Dairy-free", "Nut-free", "Low-sodium", "High-protein", "Low-carb", "Keto", "Diabetic-friendly"];
  function renderDietary() {
    return `<h2 class="font-serif text-2xl font-semibold mb-1">Dietary requirements</h2>
      <p class="text-ink-muted mb-2">Select any that apply. You can pick more than one.</p>
      <p class="text-xs text-ink-muted mb-6">For medical or allergy-related restrictions, please verify all ingredients yourself — this is not medical advice.</p>
      <div class="flex flex-wrap gap-2.5">${DIETARY_OPTIONS.map(
        (d) => `<button type="button" class="chip ${state.dietary.includes(d) ? "is-active" : ""}" data-dietary="${escapeHtml(d)}">${escapeHtml(d)}</button>`
      ).join("")}</div>`;
  }
  function wireDietary() {
    container.querySelectorAll("[data-dietary]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const val = btn.getAttribute("data-dietary");
        if (val === "No restrictions") {
          state.dietary = state.dietary.includes(val) ? [] : ["No restrictions"];
        } else {
          state.dietary = state.dietary.filter((d) => d !== "No restrictions");
          if (state.dietary.includes(val)) state.dietary = state.dietary.filter((d) => d !== val);
          else state.dietary.push(val);
        }
        renderStep();
      });
    });
  }

  /* ---------------- Step 7: Ingredients ---------------- */
  function renderIngredients() {
    return `<h2 class="font-serif text-2xl font-semibold mb-1">What ingredients do you already have?</h2>
      <p class="text-ink-muted mb-5">Add what's on hand — AI will try to use it.</p>
      <div class="flex gap-2 mb-4">
        <input id="ingredient-input" type="text" placeholder="Type an ingredient and press Enter" class="flex-1 border border-border rounded-lg px-4 py-2.5 text-sm bg-surface focus:border-primary outline-none" ${state.no_specific_ingredients ? "disabled" : ""} />
        <button id="ingredient-add" type="button" class="chip" ${state.no_specific_ingredients ? "disabled" : ""}>Add</button>
      </div>
      <div class="flex flex-wrap gap-2 mb-4">${COMMON_INGREDIENTS.map((i) => `<button type="button" class="chip" data-ing-suggest="${escapeHtml(i)}" ${state.no_specific_ingredients ? "disabled" : ""}>${escapeHtml(i)}</button>`).join("")}</div>
      <div id="ingredient-chips" class="flex flex-wrap gap-2 min-h-[2rem] mb-5">${state.available_ingredients
        .map((i) => `<span class="chip is-active chip-removable" data-ing-remove="${escapeHtml(i)}">${escapeHtml(i)} <span aria-hidden="true">✕</span></span>`)
        .join("")}</div>
      <label class="flex items-center gap-2.5 text-sm">
        <input id="no-ingredients-checkbox" type="checkbox" class="w-4 h-4" ${state.no_specific_ingredients ? "checked" : ""} />
        I don't have specific ingredients
      </label>`;
  }
  function wireIngredients() {
    const input = container.querySelector("#ingredient-input");
    function addIngredient(val) {
      const v = (val || "").trim();
      if (v && !state.available_ingredients.includes(v)) {
        state.available_ingredients.push(v);
        renderStep();
      }
    }
    container.querySelector("#ingredient-add")?.addEventListener("click", () => addIngredient(input.value));
    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addIngredient(input.value);
      }
    });
    container.querySelectorAll("[data-ing-suggest]").forEach((btn) => {
      btn.addEventListener("click", () => addIngredient(btn.getAttribute("data-ing-suggest")));
    });
    container.querySelectorAll("[data-ing-remove]").forEach((chip) => {
      chip.addEventListener("click", () => {
        state.available_ingredients = state.available_ingredients.filter((i) => i !== chip.getAttribute("data-ing-remove"));
        renderStep();
      });
    });
    container.querySelector("#no-ingredients-checkbox")?.addEventListener("change", (e) => {
      state.no_specific_ingredients = e.target.checked;
      if (e.target.checked) state.available_ingredients = [];
      renderStep();
    });
  }

  /* ---------------- Step 8: Cooking Method ---------------- */
  function renderCookingMethod() {
    const methods = ["Stovetop", "Oven", "Air Fryer", "Instant Pot", "Slow Cooker", "Grill", "No preference"];
    return `<h2 class="font-serif text-2xl font-semibold mb-1">How do you want to cook?</h2>
      <p class="text-ink-muted mb-6">Pick the equipment you'd like to use.</p>
      ${cardGrid(methods.map((m) => ({ value: m, label: m })), state.cooking_method, "method")}`;
  }
  function wireCookingMethod() {
    container.querySelectorAll("[data-method]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.cooking_method = btn.getAttribute("data-method");
        renderStep();
      });
    });
  }

  /* ---------------- Step 9: Time ---------------- */
  function renderTime() {
    const times = ["15 minutes", "30 minutes", "45 minutes", "1 hour", "1–2 hours", "No limit"];
    return `<h2 class="font-serif text-2xl font-semibold mb-1">How much time do you have?</h2>
      <p class="text-ink-muted mb-6">The recipe will respect this constraint.</p>
      ${cardGrid(times.map((t) => ({ value: t, label: t })), state.time_available, "time")}`;
  }
  function wireTime() {
    container.querySelectorAll("[data-time]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.time_available = btn.getAttribute("data-time");
        renderStep();
      });
    });
  }

  /* ---------------- Step 10: Difficulty ---------------- */
  function renderDifficulty() {
    const levels = ["Easy", "Intermediate", "Advanced", "Any"];
    return `<h2 class="font-serif text-2xl font-semibold mb-1">Preferred difficulty</h2>
      <p class="text-ink-muted mb-6">How hands-on do you want to get?</p>
      ${cardGrid(levels.map((l) => ({ value: l, label: l })), state.difficulty, "difficulty")}`;
  }
  function wireDifficulty() {
    container.querySelectorAll("[data-difficulty]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.difficulty = btn.getAttribute("data-difficulty");
        renderStep();
      });
    });
  }

  /* ---------------- Step 11: Review ---------------- */
  function reviewRow(label, value) {
    return `<div class="flex justify-between py-3 border-b border-border last:border-0"><dt class="text-ink-muted text-sm">${label}</dt><dd class="text-sm font-semibold text-right max-w-[60%]">${value}</dd></div>`;
  }
  function renderReview() {
    const budgetLabel =
      state.budget_tier === "custom" && state.budget_amount ? `${state.budget_currency} ${state.budget_amount}` : state.budget_tier.charAt(0).toUpperCase() + state.budget_tier.slice(1);
    return `<h2 class="font-serif text-2xl font-semibold mb-1">Your Recipe Preferences</h2>
      <p class="text-ink-muted mb-6">Review everything before we generate your recipe. You can go back to change anything.</p>
      <dl class="bg-surface border border-border rounded-2xl px-5">
        ${reviewRow("Region", escapeHtml(state.region))}
        ${reviewRow("Cuisine", escapeHtml(state.cuisine))}
        ${reviewRow("Dish", escapeHtml(state.dish) + (state.meal_type ? ` (${escapeHtml(state.meal_type)})` : ""))}
        ${reviewRow("Servings", state.servings)}
        ${reviewRow("Budget", escapeHtml(budgetLabel))}
        ${reviewRow("Diet", state.dietary.length ? escapeHtml(state.dietary.join(", ")) : "No restrictions")}
        ${reviewRow("Available Ingredients", state.no_specific_ingredients ? "None specified" : state.available_ingredients.length ? escapeHtml(state.available_ingredients.join(", ")) : "None specified")}
        ${reviewRow("Cooking Method", escapeHtml(state.cooking_method))}
        ${reviewRow("Time", escapeHtml(state.time_available))}
        ${reviewRow("Difficulty", escapeHtml(state.difficulty))}
      </dl>
      <button id="btn-generate" type="button" class="mt-8 w-full bg-accent hover:bg-accent-dark text-white font-semibold px-6 py-4 rounded-full text-lg transition-colors">Generate My Recipe</button>
      <div id="generate-error" class="hidden mt-4 text-sm text-accent-dark bg-accent/10 border border-accent/20 rounded-lg p-4"></div>`;
  }
  function wireReview() {
    container.querySelector("#btn-generate")?.addEventListener("click", generateRecipe);
  }

  /* ---------------- Wizard chrome ---------------- */

  const stepLabel = document.getElementById("wizard-step-label");
  const stepName = document.getElementById("wizard-step-name");
  const progressFill = document.getElementById("wizard-progress-fill");
  const backBtn = document.getElementById("wizard-back");
  const nextBtn = document.getElementById("wizard-next");

  const WIRE_MAP = {
    region: wireRegion,
    cuisine: wireCuisine,
    dish: wireDish,
    servings: wireServings,
    budget: wireBudget,
    dietary: wireDietary,
    ingredients: wireIngredients,
    cooking_method: wireCookingMethod,
    time: wireTime,
    difficulty: wireDifficulty,
    review: wireReview,
  };

  function renderStep() {
    const step = STEPS[stepIdx];
    container.innerHTML = step.render();
    WIRE_MAP[step.id]();
    stepLabel.textContent = `Step ${stepIdx + 1} of ${STEPS.length}`;
    stepName.textContent = step.name;
    progressFill.style.width = Math.round(((stepIdx + 1) / STEPS.length) * 100) + "%";
    backBtn.disabled = stepIdx === 0;
    nextBtn.classList.toggle("hidden", step.id === "review");
    container.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  backBtn.addEventListener("click", () => {
    if (stepIdx > 0) {
      stepIdx -= 1;
      renderStep();
    }
  });
  nextBtn.addEventListener("click", () => {
    const step = STEPS[stepIdx];
    if (!step.validate()) {
      window.showToast("Please make a selection to continue.", "error");
      return;
    }
    if (stepIdx < STEPS.length - 1) {
      stepIdx += 1;
      renderStep();
    }
  });

  /* ---------------- Generation ---------------- */

  async function generateRecipe() {
    Store.trackPref("cuisine", state.cuisine);
    Store.trackPref("dietary", state.dietary);
    Store.trackPref("budget_tier", state.budget_tier);
    Store.trackPref("time_available", state.time_available);

    const overlay = document.getElementById("generation-loading");
    const loadingSteps = overlay.querySelectorAll("[data-loading-step]");
    overlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    let stepTimer;
    let idx = 0;
    function tick() {
      loadingSteps.forEach((li, i) => {
        const icon = li.querySelector(".loading-icon");
        if (i < idx) icon.textContent = "✓";
        else if (i === idx) icon.textContent = "●";
        else icon.textContent = "○";
      });
      idx = Math.min(idx + 1, loadingSteps.length - 1);
    }
    tick();
    stepTimer = setInterval(tick, 900);

    const payload = {
      region: state.region,
      cuisine: state.cuisine,
      dish: state.dish,
      meal_type: state.meal_type,
      servings: state.servings,
      budget_amount: state.budget_tier === "custom" ? state.budget_amount : null,
      budget_currency: state.budget_currency,
      budget_tier: state.budget_tier,
      dietary: state.dietary.filter((d) => d !== "No restrictions"),
      available_ingredients: state.no_specific_ingredients ? [] : state.available_ingredients,
      no_specific_ingredients: state.no_specific_ingredients,
      cooking_method: state.cooking_method,
      time_available: state.time_available,
      difficulty: state.difficulty,
    };

    try {
      const res = await fetch("/api/ai/generate-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      clearInterval(stepTimer);
      loadingSteps.forEach((li) => (li.querySelector(".loading-icon").textContent = "✓"));

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "We couldn't generate your recipe right now. Please try again.");
      }
      const recipe = await res.json();
      window.showToast("Recipe generated", "success");
      setTimeout(() => {
        window.location.href = "/recipe/" + recipe.slug;
      }, 400);
    } catch (err) {
      clearInterval(stepTimer);
      overlay.classList.add("hidden");
      document.body.style.overflow = "";
      const errorEl = document.getElementById("generate-error");
      if (errorEl) {
        errorEl.textContent = err.message || "We couldn't generate your recipe right now. Please try again.";
        errorEl.classList.remove("hidden");
      }
      window.showToast("Recipe generation failed", "error");
    }
  }

  /* ---------------- Init ---------------- */

  (async function init() {
    container.innerHTML = `<div class="space-y-3">${Array(4).fill('<div class="skeleton h-16 rounded-2xl"></div>').join("")}</div>`;
    const [regions, categories] = await Promise.all([fetchJSON("/api/regions"), fetchJSON("/api/categories")]);
    regionsData = regions || [];
    categoriesData = categories || [];
    renderStep();
  })();
})();
