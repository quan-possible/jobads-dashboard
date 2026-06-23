"""Figure bridge — serve redesign2's Plotly factories as figure JSON.

The dashboard's charts are authored once as Python ``plotly.graph_objects``
factories in :mod:`jobads_dashboard.viz` (the single source of truth). This
module exposes them to the React front-end over HTTP: a registry maps a stable
``chart_id`` to a factory call, and :func:`build` renders one to a Plotly figure
JSON string that the browser draws verbatim.

Design notes:

- The factories are **national** (the ``DataSource`` hard-filters to all-Canada /
  all-occupations / all-industries), so there are no scope parameters here — only
  ``locale`` (and chart-specific options like ``animate`` for time sliders).
- The headline lives in the editorial ``<Figure>`` frame on the web side, so we
  strip the baked-in title before serializing.
- The redesign2 look is a registered Plotly *template* set as the process
  default; a bare ``to_json()`` would not guarantee it travels, so we inline the
  template explicitly. Backgrounds are forced transparent so figures sit flush on
  the cream cards.
- Only derived parquet is read (via ``DataSource``); the upstream corpus is never
  touched at request time.
"""

from __future__ import annotations

import json
from functools import lru_cache
from typing import Callable

import plotly.graph_objects as go
import plotly.io as pio

from jobads_dashboard.viz.datasource import DataSource
from jobads_dashboard.viz.figures import (
    geography,
    industries,
    occupations,
    pay,
    pulse,
    quality,
    skills,
)
from jobads_dashboard.viz.theme import register_templates

from . import core

# Ensure the aclmr_light template exists (idempotent).
register_templates()


@lru_cache(maxsize=1)
def _ds() -> DataSource:
    """The derived bundle the API already reads — built once, reused."""
    return DataSource(core.DATA_DIR)


# chart_id -> callable(ds, *, locale, **params) -> go.Figure.
# Lambdas swallow **k so locale/params pass through harmlessly until the
# factories grow a locale seam (i18n stage) or an animate seam (slider stage).
REGISTRY: dict[str, Callable[..., go.Figure]] = {
    # --- Pulse (home) -------------------------------------------------------
    "pulse.demand_ribbon": lambda ds, **k: pulse.demand_ribbon(ds),
    "pulse.yoy_bars": lambda ds, **k: pulse.yoy_bars(ds),
    "pulse.seasonality": lambda ds, **k: pulse.seasonality_heatmap(ds),
    "pulse.composition": lambda ds, **k: pulse.composition_area(ds),
    "pulse.occupation_trends": lambda ds, **k: pulse.occupation_trends_grid(ds),
    "pulse.momentum": lambda ds, **k: pulse.momentum(ds),
    "pulse.diffusion": lambda ds, **k: pulse.diffusion_index(ds),
    # --- Geography ----------------------------------------------------------
    "geography.demand_map_share": lambda ds, **k: geography.demand_map(ds, measure="share", animate="by-year", locale=k.get("locale", "en")),
    "geography.demand_map_count": lambda ds, **k: geography.demand_map(ds, measure="count", animate="by-year", locale=k.get("locale", "en")),
    "geography.demand_map_percap": lambda ds, **k: geography.demand_map(ds, measure="percap", animate="by-year", locale=k.get("locale", "en")),
    "geography.demand_map_lq": lambda ds, **k: geography.demand_map(ds, measure="lq", animate="by-year", locale=k.get("locale", "en")),
    "geography.ranked_provinces": lambda ds, **k: geography.ranked_provinces(ds),
    "geography.cma_demand": lambda ds, **k: geography.cma_demand(ds),
    "geography.shift_share": lambda ds, **k: geography.shift_share_bars(ds, **_year_kw(k, "base_year", "end_year")),
    "geography.yoy_choropleth": lambda ds, **k: geography.yoy_choropleth(ds, animate="by-year", locale=k.get("locale", "en")),
    "geography.ai_exposure": lambda ds, **k: geography.ai_exposure_map(ds),
    # --- Occupations --------------------------------------------------------
    "occupations.treemap": lambda ds, **k: occupations.treemap(ds, animate="by-year", locale=k.get("locale", "en")),
    "occupations.indexed_lines": lambda ds, **k: occupations.indexed_lines(ds, **_year_kw(k, "base_year")),
    "occupations.contribution_bars": lambda ds, **k: occupations.contribution_bars(ds, **_year_kw(k, "base_year", "end_year")),
    "occupations.waterfall": lambda ds, **k: occupations.waterfall(ds, **_year_kw(k, "base_year", "end_year")),
    "occupations.dumbbell": lambda ds, **k: occupations.dumbbell(ds, **_year_kw(k, "base_year", "end_year")),
    "occupations.skill_churn": lambda ds, **k: occupations.skill_churn(ds, **_year_kw(k, "base_year", "end_year")),
    "occupations.ai_exposure": lambda ds, **k: occupations.ai_exposure_scatter(ds, **_year_kw(k, "base_year", "end_year")),
    "occupations.noc_naics_heatmap": lambda ds, **k: occupations.noc_naics_heatmap(ds),
    # --- Industries ---------------------------------------------------------
    "industries.coverage_line": lambda ds, **k: industries.coverage_line(ds),
    "industries.treemap": lambda ds, **k: industries.treemap(ds, animate="by-year", locale=k.get("locale", "en")),
    "industries.share_over_time": lambda ds, **k: industries.share_over_time(ds),
    "industries.contribution_bars": lambda ds, **k: industries.contribution_bars(ds, **_year_kw(k, "base_year", "end_year")),
    # --- Pay & conditions ---------------------------------------------------
    "pay.wage_band": lambda ds, **k: pay.wage_band(ds),
    "pay.wage_dumbbell": lambda ds, **k: pay.wage_dumbbell(ds),
    "pay.wage_demand_quadrant": lambda ds, **k: pay.wage_demand_quadrant(ds),
    "pay.education_wage_proxy": lambda ds, **k: pay.education_wage_proxy(ds),
    "pay.wage_by_education": lambda ds, **k: pay.wage_by_education(ds),
    "pay.conditions_mix": lambda ds, **k: pay.conditions_mix(ds),
    "pay.language_gap": lambda ds, **k: pay.language_gap(ds),
    # --- Skills & requirements ----------------------------------------------
    "skills.top_skills_trend": lambda ds, **k: skills.top_skills_trend(ds, **_year_kw(k, "base_year")),
    "skills.ai_skill_diffusion": lambda ds, **k: skills.ai_skill_diffusion(ds),
    "skills.skill_lift": lambda ds, **k: skills.skill_lift_bars(ds),
    "skills.skill_occupation_heatmap": lambda ds, **k: skills.skill_occupation_heatmap(ds),
    "skills.education": lambda ds, **k: skills.education_composition(ds),
    "skills.experience": lambda ds, **k: skills.experience_mix(ds),
    # --- Data quality -------------------------------------------------------
    "quality.coverage_lines": lambda ds, **k: quality.coverage_lines(ds),
    "quality.coverage_latest": lambda ds, **k: quality.coverage_latest_bars(ds),
}


# In-figure chrome the factories bake in English (axis titles, colorbar labels,
# band/reference annotations, legend names, subplot titles, month ticks). The
# editorial frame already supplies the localized headline/notes; this fills the
# remaining standing text. Exact-match only, so data values and hovertemplates
# are never touched. Taxonomy labels (NOC/NAICS/skill names) stay untranslated.
_FR_CHROME: dict[str, str] = {
    # axis titles
    "% of groups growing (YoY)": "% de groupes en croissance (a/a)",
    "% of postings with NAICS": "% des offres avec code SCIAN",
    "% of postings with a wage": "% des offres avec salaire",
    "% of postings with the field (latest month)": "% des offres avec le champ (dernier mois)",
    "% of postings with the field": "% des offres avec le champ",
    "% of postings": "% des offres",
    "HHI": "IHH",
    "YoY posting growth": "croissance des offres (a/a)",
    "advertised hourly wage": "salaire horaire affiché",
    "advertised median wage": "salaire médian affiché",
    "change in postings, decomposed": "variation des offres, décomposée",
    "contribution to growth (pp)": "contribution à la croissance (pp)",
    "contribution to total growth (pp)": "contribution à la croissance totale (pp)",
    "cumulative %": "% cumulé",
    "industry sector (NAICS code · hover for name)": "secteur d’activité (code SCIAN · survolez pour le nom)",
    "lift (occupation share ÷ national share)": "indice (part profession ÷ part nationale)",
    "market rank": "rang du marché",
    "postings (last 12 months)": "offres (12 derniers mois)",
    "postings / month": "offres / mois",
    "province (ordered by demand volume)": "province (classée par volume de demande)",
    "rank (1 = most postings)": "rang (1 = plus d’offres)",
    "robust z of remainder": "cote z robuste du résidu",
    "share of coded postings": "part des offres codées",
    "share of demand": "part de la demande",
    "share of markets": "part des marchés",
    "share of postings": "part des offres",
    "skill code": "code de compétence",
    "year-over-year %": "% d’une année à l’autre",
    "index (base year = 100)": "indice (année de base = 100)",
    "3-month avg − 12-month avg (postings)": "moy. 3 mois − moy. 12 mois (offres)",
    "change in postings": "variation des offres",
    "change in share of skill mentions (pp)": "variation de la part des mentions (pp)",
    "share of postings asking for a university degree": "part des offres exigeant un diplôme universitaire",
    "median advertised wage": "salaire médian affiché",
    "AI exposure (β)": "exposition à l’IA (β)",
    "% of all skill mentions": "% des mentions de compétences",
    # colorbar titles
    "% of national": "% national",
    "% of sector": "% du secteur",
    "% of group": "% du groupe",
    "LQ": "QL",
    "posting LQ": "QL des offres",
    "postings / 10k LF": "offres / 10k pop. active",
    "mean AI exposure (β)": "exposition moyenne à l’IA (β)",
    "YoY %": "% a/a",
    "postings": "offres",
    "vs year avg": "vs moy. annuelle",
    # band / reference annotations
    "provisional": "provisoire",
    "pre-2021 unstable": "instable avant 2021",
    "balanced": "équilibré",
    "national rate": "taux national",
    # legend names
    "3-month average": "moyenne sur 3 mois",
    "Actual change": "variation réelle",
    "Median": "médiane",
    "Monthly postings": "offres mensuelles",
    "Not seasonally adjusted": "non désaisonnalisé",
    "Seasonally adjusted (approx.)": "désaisonnalisé (approx.)",
    "Wage coverage": "couverture salariale",
    # subplot titles
    "Observed": "Observé",
    "Trend": "Tendance",
    "Seasonal": "Saisonnier",
    "Remainder": "Résidu",
    "HHI over time (markets)": "IHH au fil du temps (marchés)",
    "Top-20 cumulative share": "Part cumulée du top 20",
    # month ticks (cycle plot + seasonality)
    "Jan": "Janv", "Feb": "Févr", "Mar": "Mars", "Apr": "Avr", "May": "Mai",
    "Jun": "Juin", "Jul": "Juil", "Aug": "Août", "Sep": "Sept", "Dec": "Déc",
}

def _fr(s: str) -> str:
    return _FR_CHROME.get(s, s)


# Literal phrases that appear *inside* hovertemplate / texttemplate strings (not
# as the whole value), so exact-match can't reach them. Substring-replaced
# longest-first, and only within hover keys, so Plotly format directives
# (%{...|...}) elsewhere are never touched (S21). Keep these unambiguous literals.
_FR_HOVER: dict[str, str] = {
    "of sector postings": "des offres du secteur",
    "3-month average": "moyenne sur 3 mois",
    "of year avg": "de la moyenne annuelle",
    "3-mo avg": "moy. 3 mois",
    "of sector": "du secteur",
    "coverage": "couverture",
    "median": "médiane",
    "provisional": "provisoire",
    "postings": "offres",
}


def _fr_hover(s: str) -> str:
    for en in sorted(_FR_HOVER, key=len, reverse=True):
        if en in s:
            s = s.replace(en, _FR_HOVER[en])
    return s


def _localize_chrome(node) -> None:
    """Recursively translate known English chrome strings in a figure JSON dict.

    Whole-string chrome (axis titles, legends, …) is exact-matched; hover
    templates are additionally substring-translated for their literal phrases."""
    if isinstance(node, dict):
        for k, v in node.items():
            if isinstance(v, str):
                node[k] = _fr_hover(_fr(v)) if k in ("hovertemplate", "texttemplate") else _fr(v)
            else:
                _localize_chrome(v)
    elif isinstance(node, list):
        for i, v in enumerate(node):
            if isinstance(v, str):
                node[i] = _fr(v)
            else:
                _localize_chrome(v)


def apply_house_style(fig: go.Figure, *, locale: str = "en") -> str:
    """Strip the editorial title, inline the redesign2 look, reclaim the title
    margin, and serialise to a (locale-aware) Plotly JSON string.

    Shared by the registry bridge (:func:`build`) and the Explore endpoint so a
    dynamically-built figure travels and themes exactly like a registered one.
    """
    # The editorial <Figure> frame owns the localized headline.
    fig.update_layout(title=None)
    # Inline the redesign2 look so it travels to a browser that has no
    # 'aclmr_light' template registered, and float the figure on the card.
    fig.update_layout(
        template=pio.templates["aclmr_light"],
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
    )
    # The template reserves ~92px on top for a main title we've now stripped.
    # Reclaim it when the factory didn't set its own margin: tighter for a single
    # panel, a little more for multi-panel figures whose subplot titles live up top.
    layout = fig.to_plotly_json().get("layout", {})
    is_multipanel = any(k.startswith("xaxis") and k != "xaxis" for k in layout)
    if fig.layout.margin.t is None:
        fig.update_layout(margin_t=64 if is_multipanel else 56)

    # Plotly's own encoder handles numpy arrays / pandas Timestamps.
    payload = fig.to_json()
    if locale == "fr":
        data = json.loads(payload)
        _localize_chrome(data)
        return json.dumps(data, ensure_ascii=False)
    return payload


def _year_kw(k: dict, *names: str) -> dict:
    """Pull the year params a factory accepts out of the registry kwargs, dropping
    any left unset so the factory's own default (e.g. ``latest_complete_year``) wins."""
    return {n: int(k[n]) for n in names if k.get(n) is not None}


def build(chart_id: str, *, locale: str = "en", **params) -> str:
    """Render a registered factory to a Plotly figure JSON string.

    Raises ``KeyError`` for an unknown ``chart_id`` (the router maps that to 404).
    """
    fig = REGISTRY[chart_id](_ds(), locale=locale, **params)
    return apply_house_style(fig, locale=locale)
