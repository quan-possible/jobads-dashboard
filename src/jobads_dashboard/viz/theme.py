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

#: ACLMR brand accents. Keep chart colour roles aligned with the web design
#: tokens (navy → teal → sand → orange), rather than introducing chart-only
#: hues that compete with the surrounding cards.
NAVY_DEEP = "#041c2c"
NAVY = "#061f2f"
TEAL = "#345961"
TEAL_SOFT = "#5b7e85"
SAND = "#c39e80"
SAND_SOFT = "#e3d2c1"
BRAND = "#cf7730"
BRAND_DEEP = "#a25518"

#: Neutral "context" ink used for de-emphasised series and gridlines.
CONTEXT = "#9aa7b0"
MUTED = "#5d6b74"

#: Semantic up/down accents for risers vs fallers (deltas, dumbbells,
#: waterfalls). These are deliberately distinct from the brand orange and
#: paired with arrows/labels by the consuming UI, so colour is not the only
#: signal.
UP = "#2c765c"
DOWN = "#b54e33"

#: Categorical colorway for multi-series charts (brand-harmonised, distinguishable).
COLORWAY = [
    TEAL,        # cat-1: teal
    BRAND,       # cat-2: brand orange
    "#6f93a0",   # cat-3: soft slate
    "#9a6a3c",   # cat-4: warm brown
    "#3f7a5c",   # cat-5: growth green
    "#8a5f86",   # cat-6: plum
    "#c2a23f",   # cat-7: ochre
    "#485b66",   # cat-8: blue-grey
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
    text="#16242f",
    muted="#5d6b74",
    grid="#e6e0da",
    axis="#b9ab9d",
)

# Match the web app's self-hosted face. Plotly writes this family directly into
# SVG presentation attributes, where CSS custom properties are not resolved;
# using the literal family prevents a silent fallback to system-ui.
_FONT = "'PT Sans', ui-sans-serif, system-ui, sans-serif"

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
            # Figures sit inside the app's cream canvas / white cards. Keep the
            # graph surfaces transparent so either host surface remains visible
            # (the API bridge also enforces this when serialising figures).
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
            colorway=COLORWAY,
            hovermode="x unified",
            hoverlabel=dict(font=dict(family=_FONT, size=12), namelength=-1),
            margin=dict(l=48, r=20, t=72, b=40),
            xaxis=dict(
                showgrid=False,
                zeroline=False,
                showline=False,
                linecolor=p.axis,
                ticks="",
                tickcolor="rgba(0,0,0,0)",
                tickfont=dict(size=11.5, color=p.muted),
                automargin=True,
            ),
            yaxis=dict(
                showgrid=True,
                gridcolor=p.grid,
                gridwidth=1,
                zeroline=False,
                showline=False,
                linecolor="rgba(0,0,0,0)",
                ticks="",
                tickfont=dict(size=11.5, color=p.muted),
                automargin=True,
            ),
            legend=dict(
                orientation="h",
                yanchor="top",
                y=-0.12,
                xanchor="left",
                x=0,
                font=dict(size=11.5, color=p.muted),
                title=dict(font=dict(size=11.5, color=p.muted)),
                bgcolor="rgba(0,0,0,0)",
                borderwidth=0,
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
            # Keep labels inside the plotting area; right-edge anchors clip on
            # narrow cards and are especially brittle for translated text.
            xref="paper", x=0.02, xanchor="left",
            yref="y", y=y, yanchor="bottom",
            showarrow=False,
            font=dict(family=_FONT, size=10, color=color),
            xshift=2,
            yshift=2,
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
