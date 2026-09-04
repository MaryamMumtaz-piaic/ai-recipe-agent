/* ==========================================================================
   recipe.js — recipe detail page: serving scaler, ingredient checklist,
   cooking mode, save/download/print/share, adapt-recipe + substitution
   modals, feedback, and "You Might Also Like" recommendations.
   ========================================================================== */
(function () {
  "use strict";
  const dataEl = document.getElementById("recipe-data");
  if (!dataEl) return; // not on a recipe page

  const recipe = JSON.parse(dataEl.textContent);
  const { escapeHtml, fetchJSON } = window.RecipeUtils;
  const Store = window.RecipeStore;

  // Track recently viewed + session preference signal.
  Store.pushRecent(window.RecipeCards.toSummary(recipe));
  Store.trackPref("cuisine", recipe.cuisine);
  Store.trackPref("category", recipe.category);
  if (recipe.dietary && recipe.dietary.length) Store.trackPref("dietary", recipe.dietary);

  /* ---------------------------------------------------------------- */
  /* Ingredients: render + serving scaler                              */
  /* ---------------------------------------------------------------- */

  const ingredientsList = document.getElementById("ingredients-list");
  const servingsSelect = document.getElementById("servings-select");
  const servingsCustom = document.getElementById("servings-custom");
  const servingsDisplay = document.getElementById("servings-display");

  function formatQty(qty) {
    if (qty === null || qty === undefined) return "";
    const rounded = Math.round(qty * 100) / 100;
    return Number.isInteger(rounded) ? String(rounded) : String(rounded);
  }

  function renderIngredients(servings) {
    const ratio = recipe.servings ? servings / recipe.servings : 1;
    const html = recipe.ingredients
      .map((ing, idx) => {
        const scaledQty = ing.quantity !== null && ing.quantity !== undefined ? ing.quantity * ratio : null;
        const qtyLabel = scaledQty !== null ? `${formatQty(scaledQty)} ${ing.unit || ""}`.trim() : ing.notes || "to taste";
        return `<label class="ingredient-row">
          <input type="checkbox" id="ing-${idx}" />
          <span class="ingredient-text text-sm"><strong>${escapeHtml(qtyLabel)}</strong> ${escapeHtml(ing.item)}${ing.notes && scaledQty !== null ? ` <span class="text-ink-muted">(${escapeHtml(ing.notes)})</span>` : ""}</span>
        </label>`;
      })
      .join("");
    ingredientsList.innerHTML = html;
    if (servingsDisplay) servingsDisplay.textContent = servings;
  }

  renderIngredients(recipe.servings);

  servingsSelect?.addEventListener("change", () => {
    if (servingsSelect.value === "custom") {
      servingsCustom.classList.remove("hidden");
      servingsCustom.value = recipe.servings;
      servingsCustom.focus();
      return;
    }
    servingsCustom.classList.add("hidden");
    renderIngredients(parseInt(servingsSelect.value, 10));
  });
  servingsCustom?.addEventListener("input", () => {
    const val = parseInt(servingsCustom.value, 10);
    if (val > 0) renderIngredients(val);
  });

  /* ---------------------------------------------------------------- */
  /* Save button                                                        */
  /* ---------------------------------------------------------------- */

  const btnSave = document.getElementById("btn-save");
  const btnSaveLabel = document.getElementById("btn-save-label");
  const btnSaveIcon = document.getElementById("btn-save-icon");

  function syncSaveButton() {
    const saved = Store.isSaved(recipe.id);
    btnSaveLabel.textContent = saved ? "Saved" : "Save Recipe";
    btnSaveIcon.setAttribute("fill", saved ? "currentColor" : "none");
    btnSave.setAttribute("aria-pressed", saved);
  }
  syncSaveButton();
  btnSave?.addEventListener("click", () => {
    const nowSaved = Store.toggleSaved(window.RecipeCards.toSummary(recipe));
    window.showToast(nowSaved ? "Recipe saved" : "Recipe removed", "success");
    syncSaveButton();
  });

  /* ---------------------------------------------------------------- */
  /* Download / Print                                                   */
  /* ---------------------------------------------------------------- */

  document.getElementById("btn-download")?.addEventListener("click", () => {
    window.showToast("Preparing your printable recipe…");
    setTimeout(() => window.print(), 200);
  });
  window.addEventListener("afterprint", () => {
    window.showToast("Recipe downloaded", "success");
  });

  /* ---------------------------------------------------------------- */
  /* Share                                                              */
  /* ---------------------------------------------------------------- */

  document.getElementById("btn-share")?.addEventListener("click", async () => {
    const shareData = { title: recipe.title, text: recipe.description, url: window.location.href };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        /* user cancelled — no-op */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      window.showToast("Recipe link copied.", "success");
    } catch (err) {
      window.showToast("Couldn't copy link — copy it from the address bar.", "error");
    }
  });

  /* ---------------------------------------------------------------- */
  /* Cooking mode                                                       */
  /* ---------------------------------------------------------------- */

  const overlay = document.getElementById("cooking-mode-overlay");
  const steps = recipe.instructions || [];
  let stepIdx = 0;

  function renderCookingStep() {
    const step = steps[stepIdx];
    document.getElementById("cooking-step-count").textContent = `STEP ${stepIdx + 1} OF ${steps.length}`;
    document.getElementById("cooking-step-title").textContent = step.title;
    document.getElementById("cooking-step-instruction").textContent = step.instruction;
    const metaParts = [];
    if (step.duration) metaParts.push("⏱ " + step.duration);
    if (step.heat) metaParts.push("🔥 " + step.heat);
    document.getElementById("cooking-step-meta").textContent = metaParts.join("   ");
    const pct = Math.round(((stepIdx + 1) / steps.length) * 100);
    document.getElementById("cooking-progress-fill").style.width = pct + "%";
    document.getElementById("cooking-progress-label").textContent = `Progress: ${pct}%`;
    document.getElementById("btn-cooking-prev").disabled = stepIdx === 0;
    document.getElementById("btn-cooking-next").textContent = stepIdx === steps.length - 1 ? "Finish" : "Done / Next";
  }

  document.getElementById("btn-start-cooking")?.addEventListener("click", () => {
    if (!steps.length) return;
    stepIdx = 0;
    renderCookingStep();
    overlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  });
  function exitCookingMode() {
    overlay.classList.add("hidden");
    document.body.style.overflow = "";
  }
  document.getElementById("btn-exit-cooking")?.addEventListener("click", exitCookingMode);
  document.getElementById("btn-cooking-prev")?.addEventListener("click", () => {
    if (stepIdx > 0) {
      stepIdx -= 1;
      renderCookingStep();
    }
  });
  document.getElementById("btn-cooking-next")?.addEventListener("click", () => {
    if (stepIdx < steps.length - 1) {
      stepIdx += 1;
      renderCookingStep();
    } else {
      window.showToast("Nice work — recipe complete!", "success");
      exitCookingMode();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (overlay.classList.contains("hidden")) return;
    if (e.key === "Escape") exitCookingMode();
  });

  /* ---------------------------------------------------------------- */
  /* Feedback                                                           */
  /* ---------------------------------------------------------------- */

  async function sendFeedback(helpful) {
    await fetchJSON("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipe_id: recipe.id, helpful, anon_id: Store.getAnonId() }),
    });
    window.showToast("Feedback submitted", "success");
  }
  document.getElementById("btn-feedback-yes")?.addEventListener("click", () => sendFeedback(true));
  document.getElementById("btn-feedback-no")?.addEventListener("click", () => sendFeedback(false));

  /* ---------------------------------------------------------------- */
  /* Adapt Recipe modal                                                 */
  /* ---------------------------------------------------------------- */

  const ADAPTATIONS = [
    ["make_cheaper", "Make it cheaper"],
    ["make_faster", "Make it faster"],
    ["make_vegetarian", "Make it vegetarian"],
    ["make_spicier", "Make it spicier"],
    ["make_milder", "Make it milder"],
    ["increase_protein", "Increase protein"],
    ["use_what_i_have", "Use what I have"],
    ["reduce_ingredients", "Reduce ingredients"],
    ["change_servings", "Change serving size"],
  ];

  document.getElementById("btn-adapt")?.addEventListener("click", () => {
    const optionsHtml = ADAPTATIONS.map(
      ([val, label]) => `<button type="button" class="wizard-card text-left p-3.5 text-sm font-medium" data-adapt="${val}">${label}</button>`
    ).join("");
    window.Modal.open({
      label: "Adapt Recipe",
      html: `
        <div class="p-6">
          <div class="flex items-center justify-between mb-1">
            <h3 class="font-serif text-xl font-semibold">Adapt Recipe</h3>
            <button type="button" class="w-9 h-9 rounded-full hover:bg-bg-alt flex items-center justify-center" data-modal-close aria-label="Close">✕</button>
          </div>
          <p class="text-sm text-ink-muted mb-5">Choose how you'd like AI to rework this recipe.</p>
          <div id="adapt-options" class="grid grid-cols-2 gap-2.5">${optionsHtml}</div>
          <div id="adapt-servings-wrap" class="hidden mt-4">
            <label for="adapt-new-servings" class="text-sm font-medium">New serving size</label>
            <input id="adapt-new-servings" type="number" min="1" max="50" value="${recipe.servings}" class="mt-1.5 w-full border border-border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div id="adapt-result" class="mt-5"></div>
        </div>`,
      onOpen(card) {
        card.querySelectorAll("[data-adapt]").forEach((btn) => {
          btn.addEventListener("click", async () => {
            card.querySelectorAll("[data-adapt]").forEach((b) => b.classList.remove("is-selected"));
            btn.classList.add("is-selected");
            const adaptation = btn.getAttribute("data-adapt");
            const servingsWrap = card.querySelector("#adapt-servings-wrap");
            if (adaptation === "change_servings") {
              servingsWrap.classList.remove("hidden");
              return;
            }
            servingsWrap.classList.add("hidden");
            await runAdaptation(card, adaptation, null);
          });
        });
        card.querySelector("#adapt-new-servings")?.addEventListener("keydown", async (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            await runAdaptation(card, "change_servings", parseInt(e.target.value, 10));
          }
        });
      },
    });
  });

  async function runAdaptation(card, adaptation, newServings) {
    const resultEl = card.querySelector("#adapt-result");
    resultEl.innerHTML = `<div class="flex items-center gap-3 text-sm text-ink-muted py-4"><span class="skeleton w-5 h-5 rounded-full"></span> Adapting your recipe…</div>`;

    const body = { recipe_slug: recipe.slug, adaptation };
    if (newServings) body.new_servings = newServings;

    const res = await fetch("/api/ai/adapt-recipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      resultEl.innerHTML = `<p class="text-sm text-accent-dark bg-accent/10 border border-accent/20 rounded-lg p-3">${escapeHtml(err.detail || "We couldn't adapt your recipe right now. Please try again.")}</p>`;
      return;
    }
    const adapted = await res.json();
    resultEl.innerHTML = `<div class="bg-primary/5 border border-primary/20 rounded-xl p-4">
      <p class="text-sm font-semibold">Your adapted recipe is ready:</p>
      <p class="font-serif text-lg font-semibold mt-1">${escapeHtml(adapted.title)}</p>
      <a href="/recipe/${escapeHtml(adapted.slug)}" class="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-primary hover:text-primary-dark">View adapted recipe →</a>
    </div>`;
    window.showToast("Recipe adapted", "success");
  }

  /* ---------------------------------------------------------------- */
  /* Ingredient substitution modal                                      */
  /* ---------------------------------------------------------------- */

  document.getElementById("btn-ask-substitution")?.addEventListener("click", () => {
    const optionsHtml = recipe.ingredients
      .map((ing) => `<option value="${escapeHtml(ing.item)}">${escapeHtml(ing.item)}</option>`)
      .join("");
    window.Modal.open({
      label: "Ingredient Substitution",
      html: `
        <div class="p-6">
          <div class="flex items-center justify-between mb-1">
            <h3 class="font-serif text-xl font-semibold">Ingredient Substitution</h3>
            <button type="button" class="w-9 h-9 rounded-full hover:bg-bg-alt flex items-center justify-center" data-modal-close aria-label="Close">✕</button>
          </div>
          <p class="text-sm text-ink-muted mb-5">Don't have an ingredient? Ask AI for the best substitute.</p>
          <label for="sub-ingredient-select" class="text-sm font-medium">Ingredient</label>
          <select id="sub-ingredient-select" class="mt-1.5 w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-surface">${optionsHtml}</select>
          <button id="sub-submit" type="button" class="mt-4 w-full bg-primary hover:bg-primary-dark text-white font-semibold px-5 py-2.5 rounded-full transition-colors">Get Substitute</button>
          <div id="sub-result" class="mt-5"></div>
        </div>`,
      onOpen(card) {
        card.querySelector("#sub-submit").addEventListener("click", async () => {
          const ingredient = card.querySelector("#sub-ingredient-select").value;
          const resultEl = card.querySelector("#sub-result");
          resultEl.innerHTML = `<div class="flex items-center gap-3 text-sm text-ink-muted py-4"><span class="skeleton w-5 h-5 rounded-full"></span> Finding a substitute…</div>`;
          const res = await fetch("/api/ai/substitute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipe_slug: recipe.slug, ingredient }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            resultEl.innerHTML = `<p class="text-sm text-accent-dark bg-accent/10 border border-accent/20 rounded-lg p-3">${escapeHtml(err.detail || "We couldn't find a substitution right now. Please try again.")}</p>`;
            return;
          }
          const data = await res.json();
          resultEl.innerHTML = `<div class="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <p class="text-sm font-semibold">No ${escapeHtml(ingredient)}? Try ${escapeHtml(data.substitute)}</p>
            <p class="text-sm text-ink-muted mt-2 leading-relaxed">${escapeHtml(data.effect)}</p>
          </div>`;
        });
      },
    });
  });

  /* ---------------------------------------------------------------- */
  /* Recommendations                                                    */
  /* ---------------------------------------------------------------- */

  (async function loadRecommendations() {
    const wrap = document.getElementById("recommended-wrap");
    const list = document.getElementById("recommended-list");
    if (!wrap || !list) return;
    const res = await fetch("/api/ai/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipe_slug: recipe.slug, session_prefs: Store.getSessionPrefs() }),
    });
    if (!res.ok) return;
    const results = await res.json();
    if (!results || !results.length) return;
    list.innerHTML = results
      .map(
        (r) => `<a href="/recipe/${escapeHtml(r.slug)}" class="flex items-center gap-3 p-3 bg-surface border border-border rounded-xl hover:border-primary transition-colors">
          <span class="recipe-media grad-${escapeHtml(r.gradient)} w-14 h-14 rounded-lg shrink-0"><span class="recipe-media-emoji text-2xl">${r.emoji}</span></span>
          <span class="min-w-0">
            <span class="block text-sm font-semibold truncate">${escapeHtml(r.title)}</span>
            <span class="block text-xs text-ink-muted mt-0.5">${escapeHtml(r.cuisine)} · ${escapeHtml(r.total_time)}</span>
          </span>
        </a>`
      )
      .join("");
    wrap.classList.remove("hidden");
  })();
})();
