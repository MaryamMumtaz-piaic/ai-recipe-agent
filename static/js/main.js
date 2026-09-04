/* ==========================================================================
   AI Recipe Agent — main.js
   Global chrome (navbar, mobile menu), toast system, modal helpers,
   localStorage-backed personalization store, global search, and the
   dynamic homepage sections. Loaded on every page via base.html.
   ========================================================================== */

(function () {
  "use strict";

  /* ------------------------------------------------------------------ */
  /* Small utilities                                                     */
  /* ------------------------------------------------------------------ */

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  async function fetchJSON(url, options) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      return null;
    }
  }

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function starRating(rating) {
    const r = Math.round((rating || 0) * 2) / 2;
    const full = Math.floor(r);
    const half = r - full === 0.5;
    let out = "★".repeat(full);
    if (half) out += "⯪";
    const empty = 5 - full - (half ? 1 : 0);
    out += '<span class="star-empty">' + "★".repeat(Math.max(empty, 0)) + "</span>";
    return out;
  }

  window.RecipeUtils = { escapeHtml, debounce, fetchJSON, uuid, starRating };

  /* ------------------------------------------------------------------ */
  /* Navbar: scroll shadow + mobile menu                                 */
  /* ------------------------------------------------------------------ */

  const nav = document.getElementById("site-nav");
  function onScroll() {
    if (!nav) return;
    if (window.scrollY > 4) nav.classList.add("is-scrolled");
    else nav.classList.remove("is-scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const menuToggle = document.getElementById("mobile-menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
  const iconMenu = document.getElementById("icon-menu");
  const iconClose = document.getElementById("icon-close");

  function closeMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove("is-open");
    menuToggle?.setAttribute("aria-expanded", "false");
    iconMenu?.classList.remove("hidden");
    iconClose?.classList.add("hidden");
  }
  function openMobileMenu() {
    if (!mobileMenu) return;
    mobileMenu.classList.add("is-open");
    menuToggle?.setAttribute("aria-expanded", "true");
    iconMenu?.classList.add("hidden");
    iconClose?.classList.remove("hidden");
    const firstLink = mobileMenu.querySelector("a, input, button");
    firstLink?.focus();
  }
  menuToggle?.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.contains("is-open");
    if (isOpen) closeMobileMenu();
    else openMobileMenu();
  });
  document.addEventListener("click", (e) => {
    if (!mobileMenu || !mobileMenu.classList.contains("is-open")) return;
    if (mobileMenu.contains(e.target) || menuToggle?.contains(e.target)) return;
    closeMobileMenu();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mobileMenu?.classList.contains("is-open")) {
      closeMobileMenu();
      menuToggle?.focus();
    }
    if (e.key === "Tab" && mobileMenu?.classList.contains("is-open")) {
      const focusables = mobileMenu.querySelectorAll("a, button, input");
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });
  // close mobile menu on nav (avoids stale open state after navigation via history)
  window.addEventListener("pageshow", closeMobileMenu);

  /* ------------------------------------------------------------------ */
  /* Toast system                                                        */
  /* ------------------------------------------------------------------ */

  const TOAST_ICONS = {
    success: "✓",
    error: "!",
    default: "●",
  };

  window.showToast = function showToast(message, type) {
    const container = document.getElementById("toast-container");
    if (!container) return;
    type = type || "default";

    // cap visible toasts
    while (container.children.length >= 4) {
      container.removeChild(container.firstChild);
    }

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("data-type", type);
    toast.setAttribute("role", "status");
    toast.innerHTML =
      '<span class="toast-dot" aria-hidden="true"></span><span>' + escapeHtml(message) + "</span>";
    container.appendChild(toast);

    const timer = setTimeout(() => dismiss(), 3600);
    toast.addEventListener("click", () => {
      clearTimeout(timer);
      dismiss();
    });

    function dismiss() {
      toast.classList.add("toast-leaving");
      toast.addEventListener("animationend", () => toast.remove(), { once: true });
    }
  };

  /* ------------------------------------------------------------------ */
  /* Modal helpers                                                       */
  /* ------------------------------------------------------------------ */

  let activeModal = null;
  let lastFocusedEl = null;

  window.Modal = {
    open(opts) {
      const root = document.getElementById("modal-root");
      if (!root) return;
      this.close();

      lastFocusedEl = document.activeElement;

      const backdrop = document.createElement("div");
      backdrop.className = "modal-backdrop";
      const panel = document.createElement("div");
      panel.className = "modal-panel";
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-modal", "true");
      if (opts.label) panel.setAttribute("aria-label", opts.label);

      const card = document.createElement("div");
      card.className = "modal-card " + (opts.cardClass || "");
      card.innerHTML = opts.html || "";
      panel.appendChild(card);

      root.appendChild(backdrop);
      root.appendChild(panel);

      requestAnimationFrame(() => {
        backdrop.classList.add("is-open");
        panel.classList.add("is-open");
      });

      function close() {
        backdrop.classList.remove("is-open");
        panel.classList.remove("is-open");
        setTimeout(() => {
          backdrop.remove();
          panel.remove();
        }, 220);
        document.removeEventListener("keydown", onKeydown);
        if (lastFocusedEl && lastFocusedEl.focus) lastFocusedEl.focus();
        activeModal = null;
        if (opts.onClose) opts.onClose();
      }

      function onKeydown(e) {
        if (e.key === "Escape") {
          close();
        }
        if (e.key === "Tab") {
          const focusables = card.querySelectorAll(
            'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (!focusables.length) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }

      backdrop.addEventListener("click", close);
      card.querySelectorAll("[data-modal-close]").forEach((el) => el.addEventListener("click", close));
      document.addEventListener("keydown", onKeydown);

      const firstFocusable = card.querySelector(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();

      activeModal = { close, card, panel, backdrop };
      if (opts.onOpen) opts.onOpen(card);
      return activeModal;
    },
    close() {
      if (activeModal) activeModal.close();
    },
  };

  /* ------------------------------------------------------------------ */
  /* localStorage-backed personalization store                          */
  /* ------------------------------------------------------------------ */

  const KEY_SAVED = "ai-recipe-agent:saved";
  const KEY_RECENT = "ai-recipe-agent:recent";
  const KEY_PREFS = "ai-recipe-agent:session-prefs";
  const KEY_ANON = "ai-recipe-agent:anon-id";
  const RECENT_CAP = 12;

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* storage unavailable / full — fail silently */
    }
  }

  const Store = {
    getSaved() {
      return readJSON(KEY_SAVED, []);
    },
    isSaved(id) {
      return this.getSaved().some((r) => r.id === id || r.slug === id);
    },
    addSaved(recipe) {
      const list = this.getSaved();
      if (!list.some((r) => r.id === recipe.id)) {
        list.unshift(recipe);
        writeJSON(KEY_SAVED, list);
      }
      document.dispatchEvent(new CustomEvent("saved-changed"));
    },
    removeSaved(id) {
      const list = this.getSaved().filter((r) => r.id !== id && r.slug !== id);
      writeJSON(KEY_SAVED, list);
      document.dispatchEvent(new CustomEvent("saved-changed"));
    },
    toggleSaved(recipe) {
      const nowSaved = this.isSaved(recipe.id || recipe.slug);
      if (nowSaved) {
        this.removeSaved(recipe.id || recipe.slug);
        return false;
      } else {
        this.addSaved(recipe);
        return true;
      }
    },
    getRecent() {
      return readJSON(KEY_RECENT, []);
    },
    pushRecent(recipe) {
      let list = this.getRecent().filter((r) => r.id !== recipe.id);
      list.unshift({ ...recipe, viewed_at: new Date().toISOString() });
      list = list.slice(0, RECENT_CAP);
      writeJSON(KEY_RECENT, list);
    },
    getSessionPrefs() {
      return readJSON(KEY_PREFS, { cuisine: {}, dietary: {}, budget_tier: {}, time_available: {}, category: {} });
    },
    trackPref(dimension, value) {
      if (!value) return;
      const prefs = this.getSessionPrefs();
      if (!prefs[dimension]) prefs[dimension] = {};
      const values = Array.isArray(value) ? value : [value];
      values.forEach((v) => {
        if (!v) return;
        prefs[dimension][v] = (prefs[dimension][v] || 0) + 1;
      });
      writeJSON(KEY_PREFS, prefs);
    },
    topPref(dimension) {
      const prefs = this.getSessionPrefs();
      const dim = prefs[dimension] || {};
      const entries = Object.entries(dim).sort((a, b) => b[1] - a[1]);
      return entries.length ? entries[0][0] : null;
    },
    hasEnoughSignal() {
      const prefs = this.getSessionPrefs();
      const total = Object.values(prefs).reduce((sum, dim) => sum + Object.values(dim).reduce((s, c) => s + c, 0), 0);
      return total >= 2;
    },
    getAnonId() {
      let id = localStorage.getItem(KEY_ANON);
      if (!id) {
        id = uuid();
        localStorage.setItem(KEY_ANON, id);
      }
      return id;
    },
  };

  window.RecipeStore = Store;

  /* ------------------------------------------------------------------ */
  /* Recipe card renderer — shared across index/discover/saved/etc.      */
  /* ------------------------------------------------------------------ */

  function toSummary(recipe) {
    return {
      id: recipe.id,
      slug: recipe.slug,
      title: recipe.title,
      description: recipe.description,
      cuisine: recipe.cuisine,
      region: recipe.region,
      category: recipe.category,
      emoji: recipe.emoji,
      gradient: recipe.gradient,
      total_time: recipe.total_time,
      difficulty: recipe.difficulty,
      servings: recipe.servings,
      rating: recipe.rating,
      review_count: recipe.review_count,
      tags: recipe.tags || [],
      dietary: recipe.dietary || [],
      created_at: recipe.created_at || "",
      budget: recipe.budget || null,
    };
  }

  function renderRecipeCard(recipe) {
    const saved = Store.isSaved(recipe.id);
    const budgetLabel = recipe.budget ? `${recipe.budget.currency} ${Math.round(recipe.budget.amount)}` : "";
    return `
    <div class="recipe-card group relative bg-surface border border-border rounded-2xl overflow-hidden hover:shadow-lift hover:-translate-y-1 transition-all duration-200" data-recipe-id="${escapeHtml(recipe.id)}">
      <a href="/recipe/${escapeHtml(recipe.slug)}" class="absolute inset-0 z-0" aria-label="${escapeHtml(recipe.title)}"></a>
      <div class="recipe-media grad-${escapeHtml(recipe.gradient || "terracotta")} aspect-[4/3] relative pointer-events-none">
        <span class="recipe-media-emoji text-6xl">${recipe.emoji || "🍽️"}</span>
        <span class="absolute bottom-3 left-3 z-[2] text-xs font-semibold px-2.5 py-1 rounded-full bg-white/90 text-ink pointer-events-none">${escapeHtml(recipe.difficulty || "")}</span>
        <button type="button" class="save-toggle-btn absolute top-3 right-3 z-[3] w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-sm transition-transform hover:scale-105 pointer-events-auto" data-recipe='${escapeHtml(JSON.stringify(toSummary(recipe)))}' aria-pressed="${saved}" aria-label="${saved ? "Remove from saved" : "Save recipe"}">
          <svg class="w-4.5 h-4.5 save-icon" width="18" height="18" fill="${saved ? "#C1633B" : "none"}" viewBox="0 0 24 24" stroke="${saved ? "#C1633B" : "#2B2420"}" stroke-width="1.75"><path stroke-linecap="round" stroke-linejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-4-7 4V5z"/></svg>
        </button>
      </div>
      <div class="p-4 relative z-[1] pointer-events-none">
        <div class="text-xs font-semibold text-accent uppercase tracking-wide">${escapeHtml(recipe.cuisine || "")}${recipe.category ? " · " + escapeHtml(recipe.category) : ""}</div>
        <h3 class="font-serif text-lg font-semibold mt-1 leading-snug line-clamp-2">${escapeHtml(recipe.title)}</h3>
        <p class="text-sm text-ink-muted mt-1.5 line-clamp-2">${escapeHtml(recipe.description || "")}</p>
        <div class="flex items-center justify-between mt-3.5 text-sm">
          <span class="text-ink-muted inline-flex items-center gap-1">⏱ ${escapeHtml(recipe.total_time || "")}</span>
          <span class="star-rating text-sm">${starRating(recipe.rating)} <span class="text-ink-muted font-medium ml-0.5">${(recipe.rating || 0).toFixed(1)}</span></span>
        </div>
        ${budgetLabel ? `<div class="text-xs text-ink-muted mt-1">From ${escapeHtml(budgetLabel)}</div>` : ""}
      </div>
    </div>`;
  }

  function recipeCardSkeleton() {
    return `<div class="bg-surface border border-border rounded-2xl overflow-hidden">
      <div class="skeleton aspect-[4/3]"></div>
      <div class="p-4 space-y-2">
        <div class="skeleton h-3 w-1/3 rounded"></div>
        <div class="skeleton h-5 w-4/5 rounded"></div>
        <div class="skeleton h-3 w-full rounded"></div>
        <div class="skeleton h-3 w-2/3 rounded"></div>
      </div>
    </div>`;
  }

  window.RecipeCards = { render: renderRecipeCard, skeleton: recipeCardSkeleton, toSummary };

  // event delegation for save-toggle buttons across the whole document
  document.addEventListener("click", function (e) {
    const btn = e.target.closest(".save-toggle-btn");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    let recipe;
    try {
      recipe = JSON.parse(btn.getAttribute("data-recipe"));
    } catch (err) {
      return;
    }
    const nowSaved = Store.toggleSaved(recipe);
    window.showToast(nowSaved ? "Recipe saved" : "Recipe removed", "success");
    syncSaveButtons();
  });

  function syncSaveButtons() {
    document.querySelectorAll(".save-toggle-btn").forEach((btn) => {
      let recipe;
      try {
        recipe = JSON.parse(btn.getAttribute("data-recipe"));
      } catch (err) {
        return;
      }
      const saved = Store.isSaved(recipe.id || recipe.slug);
      btn.setAttribute("aria-pressed", saved);
      btn.setAttribute("aria-label", saved ? "Remove from saved" : "Save recipe");
      const icon = btn.querySelector(".save-icon");
      if (icon) {
        icon.setAttribute("fill", saved ? "#C1633B" : "none");
        icon.setAttribute("stroke", saved ? "#C1633B" : "#2B2420");
      }
    });
  }
  document.addEventListener("saved-changed", syncSaveButtons);
  window.RecipeUtils.syncSaveButtons = syncSaveButtons;

  /* ------------------------------------------------------------------ */
  /* Global search — nav bar type-ahead                                  */
  /* ------------------------------------------------------------------ */

  function wireSearch(inputId, resultsId) {
    const input = document.getElementById(inputId);
    const results = resultsId ? document.getElementById(resultsId) : null;
    if (!input) return;

    if (results) {
      const run = debounce(async () => {
        const q = input.value.trim();
        if (q.length < 2) {
          results.classList.add("hidden");
          results.innerHTML = "";
          return;
        }
        const data = await fetchJSON("/api/search?q=" + encodeURIComponent(q));
        if (!data || !data.results || !data.results.length) {
          results.innerHTML = `<div class="p-4 text-sm text-ink-muted">No recipes found for "${escapeHtml(q)}"</div>`;
          results.classList.remove("hidden");
          return;
        }
        results.innerHTML = data.results
          .slice(0, 6)
          .map(
            (r) => `<a href="/recipe/${escapeHtml(r.slug)}" class="flex items-center gap-3 p-3 hover:bg-bg-alt transition-colors border-b border-border last:border-0">
              <span class="recipe-media grad-${escapeHtml(r.gradient)} w-10 h-10 rounded-lg shrink-0"><span class="recipe-media-emoji text-lg">${r.emoji}</span></span>
              <span class="min-w-0">
                <span class="block text-sm font-medium text-ink truncate">${escapeHtml(r.title)}</span>
                <span class="block text-xs text-ink-muted truncate">${escapeHtml(r.cuisine)} · ${escapeHtml(r.total_time)}</span>
              </span>
            </a>`
          )
          .join("");
        results.classList.remove("hidden");
      }, 300);
      input.addEventListener("input", run);
      input.addEventListener("focus", () => {
        if (input.value.trim().length >= 2) results.classList.remove("hidden");
      });
      document.addEventListener("click", (e) => {
        if (!results.contains(e.target) && e.target !== input) {
          results.classList.add("hidden");
        }
      });
    }
  }
  wireSearch("nav-search-input", "nav-search-results");
  wireSearch("mobile-search-input", null);

  /* ------------------------------------------------------------------ */
  /* Homepage dynamic sections (only run if containers exist)            */
  /* ------------------------------------------------------------------ */

  async function fillRecipeSection(containerId, url, emptyMessage) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = Array(4).fill(recipeCardSkeleton()).join("");
    const data = await fetchJSON(url);
    const results = data && data.results ? data.results : null;
    if (!results || !results.length) {
      const section = el.closest("[data-section]");
      if (section) section.classList.add("hidden");
      else el.innerHTML = `<p class="text-ink-muted text-sm col-span-full">${emptyMessage || "Nothing to show yet."}</p>`;
      return;
    }
    el.innerHTML = results.map(renderRecipeCard).join("");
  }

  async function initHomepageSections() {
    const isHome = document.body.getAttribute("data-page") === "home";
    if (!isHome) return;

    fillRecipeSection("section-trending", "/api/recipes?sort=popular&page_size=8");
    fillRecipeSection("section-featured", "/api/recipes?sort=rating&page_size=4");
    fillRecipeSection("section-seasonal", "/api/recipes?category=Soup&sort=rating&page_size=4");
    fillRecipeSection("section-quick", "/api/recipes?max_time=30&sort=quickest&page_size=4");
    fillRecipeSection("section-budget", "/api/recipes?sort=budget&budget_tier=low&page_size=4");
    fillRecipeSection("section-recent", "/api/recipes?sort=newest&page_size=4");

    // Cuisines
    const cuisinesEl = document.getElementById("section-cuisines");
    if (cuisinesEl) {
      const cuisines = await fetchJSON("/api/cuisines");
      if (cuisines && cuisines.length) {
        cuisinesEl.innerHTML = cuisines
          .slice(0, 12)
          .map(
            (c) => `<a href="/cuisine/${escapeHtml(c.slug)}" class="group flex flex-col items-center gap-2 p-4 rounded-2xl border border-border bg-surface hover:border-primary hover:shadow-card transition-all">
              <span class="text-3xl">${c.icon || "🍽️"}</span>
              <span class="text-sm font-medium text-ink group-hover:text-primary">${escapeHtml(c.name)}</span>
            </a>`
          )
          .join("");
      }
    }

    // Categories
    const categoriesEl = document.getElementById("section-categories");
    if (categoriesEl) {
      const categories = await fetchJSON("/api/categories");
      if (categories && categories.length) {
        categoriesEl.innerHTML = categories
          .map(
            (c) => `<a href="/category/${escapeHtml(c.slug)}" class="group relative overflow-hidden rounded-2xl border border-border bg-bg-alt hover:border-primary transition-all p-6 flex flex-col items-start gap-2">
              <span class="text-3xl">${c.icon || "🍽️"}</span>
              <span class="font-serif text-lg font-semibold text-ink group-hover:text-primary">${escapeHtml(c.name)}</span>
            </a>`
          )
          .join("");
      }
    }

    // Recently viewed / continue cooking
    const recentEl = document.getElementById("section-continue-cooking");
    const recentWrap = document.getElementById("section-continue-cooking-wrap");
    if (recentEl) {
      const recent = Store.getRecent();
      if (!recent.length) {
        recentWrap?.classList.add("hidden");
      } else {
        recentEl.innerHTML = recent.slice(0, 4).map(renderRecipeCard).join("");
      }
    }

    // Recommended for you
    const recEl = document.getElementById("section-recommended");
    const recWrap = document.getElementById("section-recommended-wrap");
    if (recEl) {
      if (!Store.hasEnoughSignal()) {
        recWrap?.classList.add("hidden");
      } else {
        const prefs = Store.getSessionPrefs();
        const topCuisine = Store.topPref("cuisine");
        const params = new URLSearchParams();
        if (topCuisine) params.set("cuisine", topCuisine);
        params.set("sort", "rating");
        params.set("page_size", "4");
        const data = await fetchJSON("/api/recipes?" + params.toString());
        const results = data && data.results ? data.results : [];
        if (!results.length) {
          recWrap?.classList.add("hidden");
        } else {
          recEl.innerHTML = results.map(renderRecipeCard).join("");
        }
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initHomepageSections);
  } else {
    initHomepageSections();
  }
})();
