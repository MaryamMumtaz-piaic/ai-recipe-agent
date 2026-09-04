"""Small stateless helper functions shared across the backend."""
from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone

# Static disclaimer the frontend may surface near dietary/allergen info.
# Optional polish per task.md section 70 — not part of the Recipe model.
DIETARY_DISCLAIMER = (
    "This information is provided for general guidance only and is not "
    "medical advice. If you have allergies or a medical dietary "
    "restriction, please verify all ingredients and substitutions "
    "independently before cooking."
)

GRADIENT_KEYS = ["terracotta", "sage", "saffron", "berry", "olive", "clay"]

_slug_re = re.compile(r"[^a-z0-9]+")


def slugify(text: str) -> str:
    """Convert arbitrary text into a URL-safe slug."""
    text = text.strip().lower()
    text = _slug_re.sub("-", text)
    return text.strip("-") or "recipe"


def unique_slug(base_text: str, existing_slugs: set[str]) -> str:
    """Produce a slug derived from base_text that isn't already taken."""
    base = slugify(base_text)
    slug = base
    n = 2
    while slug in existing_slugs:
        slug = f"{base}-{n}"
        n += 1
    return slug


def new_id(prefix: str = "rec") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace(
        "+00:00", "Z"
    )


def parse_minutes(time_str: str) -> int | None:
    """Best-effort extraction of a minute count from strings like
    '25 minutes', '1 hr 15 min', '45 min', '1-2 hours'. Returns None if
    no number can be parsed. When a range is given, the upper bound is
    used (conservative for max_time filtering).
    """
    if not time_str:
        return None
    s = time_str.lower()
    total = 0
    found = False

    hr_match = re.findall(r"(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h\b)", s)
    if hr_match:
        total += float(hr_match[-1]) * 60
        found = True

    min_match = re.findall(r"(\d+(?:\.\d+)?)\s*(?:minutes?|mins?|m\b)", s)
    if min_match:
        total += float(min_match[-1])
        found = True

    if not found:
        # Fall back to any bare numbers, e.g. "45", take the largest
        nums = re.findall(r"\d+(?:\.\d+)?", s)
        if nums:
            total = max(float(n) for n in nums)
            found = True

    return int(total) if found else None


def pick_gradient(seed: str) -> str:
    """Deterministically pick a gradient key from a seed string (e.g. a
    recipe title) so AI-generated recipes get a stable, varied gradient
    without needing the model to choose one reliably.
    """
    idx = sum(ord(c) for c in seed) % len(GRADIENT_KEYS)
    return GRADIENT_KEYS[idx]
