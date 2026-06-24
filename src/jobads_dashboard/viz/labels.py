"""Short, human-readable label convention for crowded categorical axes.

The raw scope strings ("3 | Health occupations", "44-45 | Retail trade") are too
long for axis ticks, legends, and in-plot labels — they collide and force ugly
rotation. The convention:

- Use a curated **short name** (``noc_short`` and the ``NAICS_SHORT`` map) wherever
  a label appears on an axis, legend, or as in-plot text. These are self-explanatory,
  so no rotation and no cryptic codes are needed.
- Orient heatmaps so the long-label dimension sits on the **y-axis** (horizontal
  text) and the short/coded dimension on x.
- Where width still forces codes (e.g. a 20-column heatmap x-axis), keep the code
  on the tick and surface the full name on **hover**.
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

# French short names, keyed by the same codes. The single source of truth for
# the bilingual category labels shown on both the curated treemaps/bars (via the
# figure chrome localizer) and the Explore builder (S07).
NOC_SHORT_FR: dict[str, str] = {
    "0": "Gestion",
    "1": "Affaires et finance",
    "2": "Sciences et génie",
    "3": "Santé",
    "4": "Éducation, droit et gouv.",
    "5": "Arts, culture et sport",
    "6": "Vente et services",
    "7": "Métiers et transport",
    "8": "Ressources et agriculture",
    "9": "Fabrication et services publics",
}

NAICS_SHORT_FR: dict[str, str] = {
    "11": "Agriculture et foresterie",
    "21": "Mines, pétrole et gaz",
    "22": "Services publics",
    "23": "Construction",
    "31-33": "Fabrication",
    "41": "Commerce de gros",
    "44-45": "Commerce de détail",
    "48-49": "Transport et entreposage",
    "51": "Information et culture",
    "52": "Finance et assurances",
    "53": "Immobilier",
    "54": "Services professionnels",
    "55": "Gestion d’entreprises",
    "56": "Admin. et soutien",
    "61": "Services d’enseignement",
    "62": "Santé et services sociaux",
    "71": "Arts et loisirs",
    "72": "Hébergement et restauration",
    "81": "Autres services",
    "91": "Administration publique",
}

_UNKNOWN = "Unknown"
_UNKNOWN_FR = "Inconnu"

# French translations for soft-skill / generic skill labels that appear in
# top_skills_trend, skill_lift, and AI-skill charts.  Proper-noun tech skills
# (Python, SQL, Excel, AutoCAD, …) are intentionally absent — they stay in EN
# in both locales.
SKILL_NAME_FR: dict[str, str] = {
    # Soft / generic skills
    "English language": "Langue anglaise",
    "French language": "Langue française",
    "Teamwork": "Travail d'équipe",
    "Flexibility": "Flexibilité",
    "Communication": "Communication",
    "Communication skills": "Compétences en communication",
    "Problem solving": "Résolution de problèmes",
    "Time management": "Gestion du temps",
    "Leadership": "Leadership",
    "Attention to detail": "Souci du détail",
    "Customer service": "Service à la clientèle",
    "Adaptability": "Adaptabilité",
    "Critical thinking": "Pensée critique",
    "Multitasking": "Multitâche",
    "Organization": "Organisation",
    "Organizational skills": "Sens de l'organisation",
    "Writing": "Rédaction",
    "Research": "Recherche",
    "Planning": "Planification",
    # AI-skill display labels
    "Machine learning": "Apprentissage automatique",
    "Artificial intelligence": "Intelligence artificielle",
    "Deep learning": "Apprentissage profond",
    "Natural language processing": "Traitement du langage naturel",
    "Computer vision": "Vision par ordinateur",
    "Data science": "Science des données",
    "Generative AI": "IA générative",
    "Large language models": "Grands modèles de langage",
}


def _code_of(value: str) -> str:
    """Accept either a code ('3'), a full scope ('3 | Health...'), or a bare label."""
    if value is None:
        return _UNKNOWN
    return value.split("|")[0].strip() if "|" in value else value.strip()


def noc_short(value: str) -> str:
    """Short occupation-group name from a code or 'code | label' string."""
    return NOC_SHORT.get(_code_of(value), _UNKNOWN)


# Case-insensitive index: the upstream taxonomy capitalises inconsistently
# ("Customer Service" vs "Customer service", "Attention to Detail" vs
# "Attention to detail"), so match on a lowercased key.
_SKILL_NAME_FR_CI: dict[str, str] = {k.lower(): v for k, v in SKILL_NAME_FR.items()}


def localize_skill(name: str, locale: str = "en") -> str:
    """Return the localized display name for a skill.

    Proper-noun tech skills (Python, SQL, Excel, …) and specialised clinical
    terms (ACLS, PALS, …) are left in EN even under FR because they have no
    standard French equivalent. Only soft / generic skill labels that appear in
    the ``SKILL_NAME_FR`` map are translated; the match is case-insensitive.
    """
    if locale != "fr" or not name:
        return name
    return _SKILL_NAME_FR_CI.get(name.lower(), name)


def short_label(dim: str, value: str, locale: str = "en") -> str:
    """Localized short name for an occupation/industry code or 'code | label'
    string. The shared lookup used by the Explore builder so its bars match the
    curated treemaps in both locales (S07)."""
    code = _code_of(value)
    if dim == "occupation":
        en, fr = NOC_SHORT, NOC_SHORT_FR
    elif dim == "industry":
        en, fr = NAICS_SHORT, NAICS_SHORT_FR
    else:
        return value
    table = fr if locale == "fr" else en
    return table.get(code) or en.get(code) or (_UNKNOWN_FR if locale == "fr" else _UNKNOWN)
