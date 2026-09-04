/* ==========================================================================
   saved.js — renders the saved-recipes grid from localStorage.
   ========================================================================== */
(function () {
  "use strict";
  const grid = document.getElementById("saved-grid");
  if (!grid) return; // not on the saved page

  const emptyState = document.getElementById("saved-empty");
  const { render: renderCard } = window.RecipeCards;

  function render() {
    const saved = window.RecipeStore.getSaved();
    if (!saved.length) {
      grid.classList.add("hidden");
      emptyState.classList.remove("hidden");
      return;
    }
    grid.classList.remove("hidden");
    emptyState.classList.add("hidden");
    grid.innerHTML = saved.map(renderCard).join("");
  }

  document.addEventListener("saved-changed", render);
  render();
})();
