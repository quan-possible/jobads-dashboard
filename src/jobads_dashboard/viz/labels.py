"""Short, human-readable label convention for crowded categorical axes.

The raw scope strings ("3 | Health occupations", "44-45 | Retail trade") are too
long for axis ticks, legends, and in-plot labels — they collide and force ugly
rotation. The convention:

- Use a curated **short name** (``noc_short`` / ``naics_short``) wherever a label
  appears on an axis, legend, or as in-plot text. These are self-explanatory, so
  no rotation and no cryptic codes are needed.
- Orient heatmaps so the long-label dimension sits on the **y-axis** (horizontal
  text) and the short/coded dimension on x.
- Where width still forces codes (e.g. a 20-column heatmap x-axis), keep the code
  on the tick and surface the full name on **hover**.
- ``truncate`` is the last-resort fallback for any other long string, paired with
  a hover that shows the full text.
"""

from __future__ import annotations

# Broad NOC group → short name (keyed by the 1-digit code).
NOC_SHORT: dict[str, str] = {
    "0": "Management",
    "1": "Business & finance",
    "2": "Sciences & engineering",
    "3": "Health",
    "4": "Education, law & gov",
    "5": "Arts, culture & sport",
    "6": "Sales & service",
    "7": "Trades & transport",
    "8": "Resources & agriculture",
    "9": "Manufacturing & utilities",
}

# NAICS sector → short name (keyed by the 2-digit / range code).
NAICS_SHORT: dict[str, str] = {
    "11": "Agriculture & forestry",
    "21": "Mining, oil & gas",
    "22": "Utilities",
    "23": "Construction",
    "31-33": "Manufacturing",
    "41": "Wholesale trade",
    "44-45": "Retail trade",
    "48-49": "Transport & warehousing",
    "51": "Information & culture",
    "52": "Finance & insurance",
    "53": "Real estate",
    "54": "Professional services",
    "55": "Management of companies",
    "56": "Admin & support",
    "61": "Educational services",
    "62": "Health care & social",
    "71": "Arts & recreation",
    "72": "Accommodation & food",
    "81": "Other services",
    "91": "Public administration",
}

_UNKNOWN = "Unknown"


def _code_of(value: str) -> str:
    """Accept either a code ('3'), a full scope ('3 | Health...'), or a bare label."""
    if value is None:
        return _UNKNOWN
    return value.split("|")[0].strip() if "|" in value else value.strip()


def noc_short(value: str) -> str:
    """Short occupation-group name from a code or 'code | label' string."""
    return NOC_SHORT.get(_code_of(value), _UNKNOWN)


def naics_short(value: str) -> str:
    """Short industry-sector name from a code or 'code | label' string."""
    return NAICS_SHORT.get(_code_of(value), _UNKNOWN)


def full_label(value: str) -> str:
    """The human-readable part of a 'code | label' string (for hover)."""
    if value is None:
        return _UNKNOWN
    return value.split("|", 1)[1].strip() if "|" in value else value.strip()


def truncate(s: str, n: int = 24) -> str:
    """Ellipsis-truncate a long string (last-resort fallback; pair with hover)."""
    s = str(s)
    return s if len(s) <= n else s[: n - 1].rstrip() + "…"
