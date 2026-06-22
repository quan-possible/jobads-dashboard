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

# Ensure the aclmr_light / aclmr_dark templates exist (idempotent).
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
    "pulse.stl": lambda ds, **k: pulse.stl_panel(ds),
    "pulse.anomaly": lambda ds, **k: pulse.anomaly_flags(ds),
    "pulse.sa_vs_nsa": lambda ds, **k: pulse.sa_vs_nsa(ds),
    "pulse.diffusion": lambda ds, **k: pulse.diffusion_index(ds),
    "pulse.cycle": lambda ds, **k: pulse.cycle_plot(ds),
    # --- Geography ----------------------------------------------------------
    "geography.share_choropleth": lambda ds, **k: geography.share_choropleth(ds),
    "geography.ranked_provinces": lambda ds, **k: geography.ranked_provinces(ds),
    "geography.lq_choropleth": lambda ds, **k: geography.lq_choropleth(ds),
    "geography.lq_heatmap": lambda ds, **k: geography.lq_heatmap(ds),
    "geography.shift_share": lambda ds, **k: geography.shift_share_bars(ds),
    "geography.yoy_choropleth": lambda ds, **k: geography.yoy_choropleth(ds),
    "geography.province_tiles": lambda ds, **k: geography.province_tile_grid(ds),
    # --- Occupations --------------------------------------------------------
    "occupations.treemap": lambda ds, **k: occupations.treemap(ds),
    "occupations.indexed_lines": lambda ds, **k: occupations.indexed_lines(ds),
    "occupations.contribution_bars": lambda ds, **k: occupations.contribution_bars(ds),
    "occupations.waterfall": lambda ds, **k: occupations.waterfall(ds),
    "occupations.dumbbell": lambda ds, **k: occupations.dumbbell(ds),
    "occupations.bump": lambda ds, **k: occupations.bump_chart(ds),
    "occupations.concentration": lambda ds, **k: occupations.concentration_trio(ds),
    "occupations.noc_naics_heatmap": lambda ds, **k: occupations.noc_naics_heatmap(ds),
    # --- Industries ---------------------------------------------------------
    "industries.coverage_line": lambda ds, **k: industries.coverage_line(ds),
    "industries.treemap": lambda ds, **k: industries.treemap(ds),
    "industries.share_over_time": lambda ds, **k: industries.share_over_time(ds),
    "industries.contribution_bars": lambda ds, **k: industries.contribution_bars(ds),
    # --- Pay & conditions ---------------------------------------------------
    "pay.wage_band": lambda ds, **k: pay.wage_band(ds),
    "pay.wage_dumbbell": lambda ds, **k: pay.wage_dumbbell(ds),
    "pay.wage_demand_quadrant": lambda ds, **k: pay.wage_demand_quadrant(ds),
    "pay.conditions_mix": lambda ds, **k: pay.conditions_mix(ds),
    "pay.language_gap": lambda ds, **k: pay.language_gap(ds),
    # --- Skills & requirements ----------------------------------------------
    "skills.skill_lift": lambda ds, **k: skills.skill_lift_bars(ds),
    "skills.education": lambda ds, **k: skills.education_composition(ds),
    "skills.experience": lambda ds, **k: skills.experience_mix(ds),
    # --- Data quality -------------------------------------------------------
    "quality.coverage_lines": lambda ds, **k: quality.coverage_lines(ds),
    "quality.coverage_latest": lambda ds, **k: quality.coverage_latest_bars(ds),
}


def build(chart_id: str, *, locale: str = "en", **params) -> str:
    """Render a registered factory to a Plotly figure JSON string.

    Raises ``KeyError`` for an unknown ``chart_id`` (the router maps that to 404).
    """
    fig = REGISTRY[chart_id](_ds(), locale=locale, **params)

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
    # Reclaim it for single-panel figures that didn't set their own margin —
    # but leave multi-panel figures alone (their subplot titles live up there).
    layout = fig.to_plotly_json().get("layout", {})
    is_multipanel = any(k.startswith("xaxis") and k != "xaxis" for k in layout)
    if fig.layout.margin.t is None and not is_multipanel:
        fig.update_layout(margin_t=56)
    # Plotly's own encoder handles numpy arrays / pandas Timestamps.
    return fig.to_json()
