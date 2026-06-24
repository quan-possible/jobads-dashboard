"""House Plotly theme + shared chart chrome.

One registered template and a small set of helpers encode the plan's design
language so every figure inherits beauty and honesty for free:

- one warm ACLMR brand accent, reserved for the focal series / brand;
- a restrained, distinguishable categorical colorway for everything else;
- a brand diverging scale pinned at a neutral midpoint (LQ=1, YoY=0);
- consistent gridlines, fonts, margins, ``hovermode='x unified'``;
- reusable regime shading (COVID, provisional/under-audit) and reference lines;
- a split-provisional helper for rendering the under-audit tail as a dotted line.

Import side effects are avoided: call :func:`register_templates` once at app or
script start-up. Figure factories call it defensively, so it is idempotent.
"""

from __future__ import annotations

from dataclasses import dataclass

import pandas as pd
import plotly.graph_objects as go
import plotly.io as pio

# --------------------------------------------------------------------------- #
# Palette
# --------------------------------------------------------------------------- #

#: Warm ACLMR brand accent - reserved for the single focal series and brand marks.
BRAND = "#cf7730"
BRAND_DEEP = "#a85c1f"

#: Neutral "context" ink used for de-emphasised series and gridlines.
CONTEXT = "#9aa7b0"
MUTED = "#5d6b74"

#: Semantic up/down accents for risers vs fallers (deltas, dumbbells, waterfalls).
UP = "#2f6f77"
DOWN = "#b5523a"

#: Categorical colorway for multi-series charts (brand-harmonised, distinguishable).
COLORWAY = [
    "#345961",  # teal
    "#cf7730",  # brand orange
    "#6e8790",  # slate
    "#7b6b8d",  # plum
    "#55754e",  # olive
    "#a64d3f",  # clay
    "#c39e80",  # sand
    "#041c2c",  # navy
]

#: Sequential scale for magnitude (light sand -> deep navy). Perceptually ordered.
SEQUENTIAL = [
    [0.0, "#f3ece4"],
    [0.25, "#cdb79c"],
    [0.5, "#7f9aa0"],
    [0.75, "#345961"],
    [1.0, "#08222e"],
]

#: Diverging scale pinned at a neutral midpoint - teal (below) -> cream -> orange (above).
#: Used for LQ (midpoint 1) and YoY (midpoint 0). Orange = "hot / above".
DIVERGING = [
    [0.0, "#2a6f77"],
    [0.25, "#84aeb0"],
    [0.5, "#f4efe7"],
    [0.75, "#e0a368"],
    [1.0, "#b9541d"],
]

# --------------------------------------------------------------------------- #
# Regime windows (honesty chrome) - configurable, sensible defaults
# --------------------------------------------------------------------------- #

COVID_START = pd.Timestamp("2020-03-01")
COVID_END = pd.Timestamp("2021-06-01")

#: 2025+ upstream fetch provenance is under audit (see derived metadata caveats);
#: render everything from here on as provisional.
PROVISIONAL_FROM = pd.Timestamp("2025-01-01")

#: Remote / language fields are unstable before this date.
UNSTABLE_BEFORE = pd.Timestamp("2021-01-01")

_COVID_FILL = "rgba(110,135,144,0.13)"
_PROVISIONAL_FILL = "rgba(207,119,48,0.07)"
_UNSTABLE_FILL = "rgba(123,107,141,0.08)"


@dataclass(frozen=True)
class ThemePalette:
    """Light surface colours consumed by the registered template."""

    name: str
    canvas: str
    surface: str
    text: str
    muted: str
    grid: str
    axis: str


LIGHT = ThemePalette(
    name="aclmr_light",
    canvas="#fbf8f5",
    surface="#ffffff",
    text="#132330",
    muted="#5d6b74",
    grid="#ece3da",
    axis="#c8b3a2",
)

# Match the web app's font (web/app/globals.css --font-sans). The PT Sans face
# is self-hosted by next/font under the --font-pt-sans CSS variable, so charts
# render in the same type as their cards instead of Plotly's Inter/system fallback.
_FONT = "var(--font-pt-sans), ui-sans-serif, system-ui, sans-serif"

#: Standing provenance caption for the standalone static review page (``review.py``).
DEMAND_SIGNAL_NOTE = "Vicinity Jobs online job ads · a labour-demand signal, not employment"


def _template(p: ThemePalette) -> go.layout.Template:
    return go.layout.Template(
        layout=dict(
            font=dict(family=_FONT, size=13, color=p.text),
            title=dict(
                font=dict(family=_FONT, size=19, color=p.text),
                x=0.0,
                xanchor="left",
                xref="paper",
                pad=dict(l=4, b=8),
            ),
            paper_bgcolor=p.surface,
            plot_bgcolor=p.surface,
            colorway=COLORWAY,
            hovermode="x unified",
            hoverlabel=dict(font=dict(family=_FONT, size=12), namelength=-1),
            margin=dict(l=64, r=28, t=92, b=48),
            xaxis=dict(
                showgrid=False,
                zeroline=False,
                linecolor=p.axis,
                ticks="outside",
                tickcolor=p.axis,
                tickfont=dict(size=11.5, color=p.muted),
                automargin=True,
            ),
            yaxis=dict(
                showgrid=True,
                gridcolor=p.grid,
                gridwidth=1,
                zeroline=False,
                linecolor="rgba(0,0,0,0)",
                ticks="",
                tickfont=dict(size=11.5, color=p.muted),
                automargin=True,
            ),
            legend=dict(
                orientation="h",
                yanchor="top",
                y=-0.16,
                xanchor="left",
                x=0,
                font=dict(size=11.5, color=p.muted),
                title=dict(font=dict(size=11.5, color=p.muted)),
            ),
            colorscale=dict(sequential=SEQUENTIAL, diverging=DIVERGING),
        )
    )


_REGISTERED = False


def register_templates(default: str = "aclmr_light") -> None:
    """Register the ``aclmr_light`` template and set the default. Idempotent."""
    global _REGISTERED
    if not _REGISTERED:
        pio.templates["aclmr_light"] = _template(LIGHT)
        _REGISTERED = True
    pio.templates.default = default


# --------------------------------------------------------------------------- #
# Chrome helpers
# --------------------------------------------------------------------------- #


def _ann(text: str | None, position: str, color: str) -> dict:
    """Annotation kwargs for add_vrect — empty when there is no label (avoids 'new text')."""
    if not text:
        return {}
    return dict(annotation_text=text, annotation_position=position,
                annotation=dict(font=dict(size=10, color=color)))


def add_covid_band(fig: go.Figure, *, label: bool = True, **kw) -> go.Figure:
    """Shade the COVID disruption window on a time-axis figure."""
    fig.add_vrect(
        x0=COVID_START, x1=COVID_END, fillcolor=_COVID_FILL, line_width=0, layer="below",
        **_ann("COVID" if label else None, "top left", MUTED), **kw,
    )
    return fig


def add_provisional_band(fig: go.Figure, *, frm: pd.Timestamp = PROVISIONAL_FROM,
                         x1=None, label: bool = True, **kw) -> go.Figure:
    """Shade the provisional / under-audit tail.

    ``x1`` defaults to the largest x value across the figure's time traces, or a
    year past ``frm`` when none can be inferred.
    """
    if x1 is None:
        maxes = [max(t.x) for t in fig.data if getattr(t, "x", None) is not None and len(t.x)]
        x1 = max(maxes) if maxes else frm + pd.DateOffset(years=1)
    fig.add_vrect(
        x0=frm, x1=x1, fillcolor=_PROVISIONAL_FILL, line_width=0, layer="below",
        **_ann("provisional" if label else None, "top right", BRAND_DEEP), **kw,
    )
    return fig


def add_unstable_band(fig: go.Figure, *, label: str = "pre-2021 unstable", **kw) -> go.Figure:
    """Shade the pre-2021 zone where a field is historically unstable."""
    fig.add_vrect(
        x0=UNSTABLE_BEFORE.replace(year=2016), x1=UNSTABLE_BEFORE,
        fillcolor=_UNSTABLE_FILL, line_width=0, layer="below",
        **_ann(label, "top left", MUTED), **kw,
    )
    return fig


def add_reference_line(fig: go.Figure, y: float, *, text: str | None = None,
                       color: str = MUTED, dash: str = "dash") -> go.Figure:
    """Horizontal reference line (0 for growth, 100 for index, 1 for LQ, 50 for diffusion)."""
    fig.add_hline(
        y=y, line=dict(color=color, width=1, dash=dash),
    )
    if text:
        fig.add_annotation(
            text=text,
            xref="paper", x=0.99, xanchor="right",
            yref="y", y=y, yanchor="bottom",
            showarrow=False,
            font=dict(size=10, color=color),
        )
    return fig


def split_provisional(
    df: pd.DataFrame, x: str, frm: pd.Timestamp = PROVISIONAL_FROM
) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Split a time-indexed frame into (solid, provisional) for two-trace rendering.

    The solid trace is strictly *before* PROVISIONAL_FROM, plus exactly one bridge
    point at the boundary so the line connects visually. The provisional trace
    starts at PROVISIONAL_FROM (dotted/styled). Together the two traces share only
    the single boundary point, so the dotted styling begins exactly at frm with no
    solid overlap into the provisional zone.
    """
    solid = df[df[x] < frm]
    prov = df[df[x] >= frm]
    if len(solid) and len(prov):
        # Append the boundary point to solid so the line reaches frm before going dotted.
        bridge = prov.iloc[[0]]
        solid = pd.concat([solid, bridge]).drop_duplicates(subset=[x])
    return solid, prov
