/* ==========================================================================
   discover.js — filter/search/sort/paginate the recipe grid against the
   live /api/recipes and /api/search JSON API. Also powers /cuisine/{slug}
   and /category/{slug} pages, which reuse the same grid markup with a
   pre-locked filter.
   ========================================================================== */
(function () {
  "use strict";
  const { fetchJSON, escapeHtml, debounce } = window.RecipeUtils;
  const { render: renderCard, skeleton } = window.RecipeCards;

  const grid = document.getElementById("results-grid");
  if (!grid) return; // not on a listing page

  const searchInput = document.getElementById("discover-search");
  const fCuisine = document.getElementById("f-cuisine");
  const fCategory = document.getElementById("f-category");
  const fDifficulty = document.getElementById("f-difficulty");
  const fMaxTime = document.getElementById("f-max-time");
  const fDiet = document.getElementById("f-diet");
  const fBudget = document.getElementById("f-budget");
  const fRating = document.getElementById("f-rating");
  const fSort = document.getElementById("f-sort");
  const resultsCount = document.getElementById("results-count");
  const emptyState = document.getElementById("empty-state");
  const loadMoreWrap = document.getElementById("load-more-wrap");
  const loadMoreBtn = document.getElementById("load-more");
  const chipsWrap = document.getElementById("active-filter-chips");

  const LOCKED_CUISINE = document.body.getAttribute("data-locked-cuisine") || "";
  const LOCKED_CATEGORY = document.body.getAttribute("data-locked-category") || "";

  const PAGE_SIZE = 12;
  let page = 1;
  let currentResults = [];

  function paramsFromState() {
    const params = new URLSearchParams();
    const q = (searchInput && searchInput.value.trim()) || "";
    if (q) params.set("q", q);
    const cuisine = LOCKED_CUISINE || (fCuisine && fCuisine.value) || "";
    if (cuisine) params.set("cuisine", cuisine);
    const category = LOCKED_CATEGORY || (fCategory && fCategory.value) || "";
    if (category) params.set("category", category);
    if (fDifficulty && fDifficulty.value) params.set("difficulty", fDifficulty.value);
    if (fMaxTime && fMaxTime.value) params.set("max_time", fMaxTime.value);
    if (fDiet && fDiet.value) params.set("diet", fDiet.value);
    if (fBudget && fBudget.value) params.set("budget_tier", fBudget.value);
    if (fRating && fRating.value) params.set("min_rating", fRating.value);
    params.set("sort", (fSort && fSort.value) || "popular");
    return params;
  }

  function syncUrl(params) {
    const url = new URL(window.location.href);
    url.search = params.toString();
    window.history.replaceState({}, "", url);
  }

  function renderChips(params) {
    if (!chipsWrap) return;
    const labels = {
      q: (v) => `"${v}"`,
      cuisine: (v) => v,
      category: (v) => v,
      difficulty: (v) => v,
      max_time: (v) => `Under ${v} min`,
      diet: (v) => v,
      budget_tier: (v) => v.charAt(0).toUpperCase() + v.slice(1) + " budget",
      min_rating: (v) => `${v}★ and up`,
    };
    const removable = ["q", "cuisine", "category", "difficulty", "max_time", "diet", "budget_tier", "min_rating"];
    let html = "";
    removable.forEach((key) => {
      if (LOCKED_CUISINE && key === "cuisine") return;
      if (LOCKED_CATEGORY && key === "category") return;
      const val = params.get(key);
      if (val) {
        html += `<button type="button" class="chip chip-removable" data-clear="${key}">${escapeHtml(labels[key](val))} <span aria-hidden="true">✕</span></button>`;
      }
    });
    chipsWrap.innerHTML = html;
    chipsWrap.querySelectorAll("[data-clear]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-clear");
        const map = { q: searchInput, cuisine: fCuisine, category: fCategory, difficulty: fDifficulty, max_time: fMaxTime, diet: fDiet, budget_tier: fBudget, min_rating: fRating };
        const el = map[key];
        if (el) el.value = "";
        runSearch(true);
      });
    });
  }

  async function runSearch(reset) {
    if (reset) {
      page = 1;
      currentResults = [];
      grid.innerHTML = Array(9).fill(skeleton()).join("");
      emptyState.classList.add("hidden");
    }
    const params = paramsFromState();
    syncUrl(params);
    renderChips(params);
    params.set("page", String(page));
    params.set("page_size", String(PAGE_SIZE));

    const data = await fetchJSON("/api/recipes?" + params.toString());
    const results = (data && data.results) || [];
    const total = (data && data.total) || 0;

    if (reset) {
      currentResults = results;
      grid.innerHTML = results.map(renderCard).join("");
    } else {
      currentResults = currentResults.concat(results);
      grid.insertAdjacentHTML("beforeend", results.map(renderCard).join(""));
    }

    resultsCount.textContent = total === 0 ? "No recipes found" : `${total} recipe${total === 1 ? "" : "s"} found`;
    emptyState.classList.toggle("hidden", currentResults.length !== 0);
    grid.classList.toggle("hidden", currentResults.length === 0);
    loadMoreWrap.classList.toggle("hidden", currentResults.length >= total || results.length === 0);
  }

  loadMoreBtn?.addEventListener("click", () => {
    page += 1;
    runSearch(false);
  });

  const debouncedSearch = debounce(() => runSearch(true), 350);
  searchInput?.addEventListener("input", debouncedSearch);
  [fCuisine, fCategory, fDifficulty, fMaxTime, fDiet, fBudget, fRating, fSort].forEach((el) => {
    el?.addEventListener("change", () => runSearch(true));
  });

  function clearAllFilters() {
    if (searchInput) searchInput.value = "";
    [fCuisine, fCategory, fDifficulty, fMaxTime, fDiet, fBudget, fRating].forEach((el) => {
      if (el) el.value = "";
    });
    if (fSort) fSort.value = "popular";
    runSearch(true);
  }
  document.getElementById("filters-clear")?.addEventListener("click", clearAllFilters);
  document.getElementById("empty-clear")?.addEventListener("click", clearAllFilters);

  // Mobile filters toggle
  const filtersToggle = document.getElementById("filters-toggle");
  const filtersPanel = document.getElementById("filters-panel");
  filtersToggle?.addEventListener("click", () => {
    const isHidden = filtersPanel.classList.contains("hidden");
    filtersPanel.classList.toggle("hidden");
    filtersToggle.setAttribute("aria-expanded", String(isHidden));
    filtersToggle.textContent = isHidden ? "Hide filters" : "Show filters";
  });

  async function populateSelectOptions() {
    if (fCuisine && !LOCKED_CUISINE) {
      const cuisines = await fetchJSON("/api/cuisines");
      if (cuisines) {
        cuisines.forEach((c) => {
          const opt = document.createElement("option");
          opt.value = c.name;
          opt.textContent = c.name;
          fCuisine.appendChild(opt);
        });
      }
    }
    if (fCategory && !LOCKED_CATEGORY) {
      const categories = await fetchJSON("/api/categories");
      if (categories) {
        categories.forEach((c) => {
          const opt = document.createElement("option");
          opt.value = c.name;
          opt.textContent = c.name;
          fCategory.appendChild(opt);
        });
      }
    }
  }

  function hydrateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (searchInput && params.get("q")) searchInput.value = params.get("q");
    if (fCuisine && params.get("cuisine")) fCuisine.value = params.get("cuisine");
    if (fCategory && params.get("category")) fCategory.value = params.get("category");
    if (fDifficulty && params.get("difficulty")) fDifficulty.value = params.get("difficulty");
    if (fMaxTime && params.get("max_time")) fMaxTime.value = params.get("max_time");
    if (fDiet && params.get("diet")) fDiet.value = params.get("diet");
    if (fBudget && params.get("budget_tier")) fBudget.value = params.get("budget_tier");
    if (fRating && params.get("min_rating")) fRating.value = params.get("min_rating");
    if (fSort && params.get("sort")) fSort.value = params.get("sort");
  }

  (async function init() {
    await populateSelectOptions();
    hydrateFromUrl();
    runSearch(true);
  })();
})();
