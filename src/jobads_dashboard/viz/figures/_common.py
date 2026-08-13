"""Small shared helpers for figure factories."""

from __future__ import annotations

import pandas as pd
import plotly.graph_objects as go

from .._capctx import UNCAPPED
from ..theme import MUTED, SEQUENTIAL, register_templates

register_templates()  # ensure templates exist when figures are built standalone

#: Every visual asset shows at most this many distinct categories/items in the
#: public view, so no chart, bar list, treemap, or heatmap axis overwhelms the
#: reader — and to honour the Vicinity Jobs API terms of service. An authenticated
#: team viewer is served the full detail (the cap helpers no-op when
#: :data:`jobads_dashboard.viz._capctx.UNCAPPED` is set).
MAX_CATEGORIES = 10

# The Plotly template supplies the same defaults for standalone figures.  Keep
# the small explicit values here too because factories often override one
# margin edge for long labels; filling only missing edges preserves those
# deliberate label allowances while keeping ordinary charts compact.
_COMPACT_MARGINS = {"l": 48, "r": 20, "b": 40}


def cap_other(df: pd.DataFrame, value_col: str, label_col: str, *,
              n: int = MAX_CATEGORIES, other_label: str = "Other",
              rank_abs: bool = False) -> pd.DataFrame:
    """Collapse a categorical frame to at most ``n`` rows.

    Keeps the ``n-1`` largest categories (by ``value_col``, or by its absolute
    value when ``rank_abs``) and folds the rest into a single residual row whose
    ``value_col`` is the *sum* of the dropped categories — so the column total is
    preserved. This groups the long tail rather than silently dropping it; frames
    already within the cap are returned untouched. Callers re-sort as needed.

    No-ops (returns every row) for the authenticated team view (``UNCAPPED``).
    """
    if UNCAPPED.get() or len(df) <= n:
        return df.copy()
    key = df[value_col].abs() if rank_abs else df[value_col]
    order = key.sort_values(ascending=False).index
    kept = df.loc[order[: n - 1]].copy()
    other_val = df.loc[order[n - 1:], value_col].sum()
    other = pd.DataFrame([{label_col: other_label, value_col: other_val}])
    return pd.concat([kept, other], ignore_index=True)


def cap_columns(piv: pd.DataFrame, *, n: int = MAX_CATEGORIES,
                other_label: str = "Other") -> pd.DataFrame:
    """Cap a pivot table's columns to at most ``n`` by total, folding the rest
    into one summed ``other_label`` column (used by the column-normalised
    heatmaps). Totals per row are preserved; renormalise after.

    No-ops (returns every column) for the authenticated team view (``UNCAPPED``)."""
    if UNCAPPED.get() or piv.shape[1] <= n:
        return piv
    order = piv.sum(axis=0).sort_values(ascending=False).index
    keep = list(order[: n - 1])
    out = piv[keep].copy()
    out[other_label] = piv.drop(columns=keep).sum(axis=1)
    return out


def annual_means(df: pd.DataFrame, value: str, *group_cols: str,
                 x: str = "month") -> pd.DataFrame:
    """Collapse a monthly frame to one row per year per group, holding the year's
    *mean* of ``value`` and keyed at a representative ``{year}-12-01`` timestamp.

    Year-to-year decompositions (contribution, waterfall, dumbbell, shift-share)
    compare a base year to an end year. Snapshotting a single month at each end
    mixes the within-year seasonal swing (a June peak vs a December trough) into
    the "change" and misattributes it to trend/mix/competitive components. Taking
    each year's mean over its observed months removes that seasonality, so the
    comparison is like-for-like. The ``-12-01`` key lets callers keep selecting
    base/end with a December timestamp (``_window``)."""
    out = df.copy()
    out["_year"] = out[x].dt.year
    agg = out.groupby(["_year", *group_cols], as_index=False)[value].mean()
    agg[x] = pd.to_datetime(agg["_year"].astype(str) + "-12-01")
    return agg.drop(columns="_year")


def treemap_trace(g: pd.DataFrame, name_col: str, root: str) -> go.Treemap:
    """Shared treemap trace for the occupation / industry volume treemaps.

    Tiles show labels only so the hierarchy stays legible. Value and percent
    remain available on hover.
    """
    g = g.copy()
    g["short"] = g[name_col].map(lambda s: s.split("|")[-1].strip() or s.strip())
    total = g["postings_total"].sum()
    # Keep the tiles quiet: labels only. Exact values and shares remain on hover.
    tile_text = g["short"].tolist()
    return go.Treemap(
        labels=[root] + g["short"].tolist(),
        parents=[""] + [root] * len(g),
        values=[total] + g["postings_total"].tolist(), branchvalues="total",
        marker=dict(colors=[total] + g["postings_total"].tolist(), colorscale=SEQUENTIAL,
                    line=dict(width=1, color="white")),
        text=[""] + tile_text,
        textinfo="text", maxdepth=2,
        hovertemplate="%{label}: %{value:,.0f} (%{percentRoot})<extra></extra>")


def titled(fig: go.Figure, headline: str, subtitle: str | None = None,
           height: int | None = None) -> go.Figure:
    """Apply the standard finding-as-headline + units-as-subtitle title block."""
    margin = fig.layout.margin
    missing = {
        edge: value for edge, value in _COMPACT_MARGINS.items()
        if getattr(margin, edge) is None
    }
    if missing:
        fig.update_layout(margin=missing)
    title = dict(text=headline)
    if subtitle:
        title["subtitle"] = dict(text=subtitle, font=dict(size=12, color=MUTED))
    fig.update_layout(title=title)
    if height:
        fig.update_layout(height=height)
    return fig


def add_time_slider(fig: go.Figure, periods, *, prefix: str = "Year: ",
                    play: str = "▶ Play") -> go.Figure:
    """Attach a native Plotly slider + play button that scrubs through ``periods``.

    ``fig`` must already carry one ``go.Frame`` per period (named ``str(period)``)
    with the latest period as the visible data. The slider drives the frames
    entirely client-side — no React state — so any snapshot figure becomes
    drag-through-time for free. Mirrors the mechanism proven by ChoroplethTime.
    """
    labels = [str(p) for p in periods]
    fig.update_layout(
        sliders=[dict(
            active=len(labels) - 1, x=0, y=0, len=0.86, pad=dict(t=8, b=4),
            currentvalue=dict(prefix=prefix, font=dict(size=11, color=MUTED)),
            font=dict(size=10, color=MUTED),
            steps=[dict(label=l, method="animate", args=[[l], dict(
                mode="immediate", frame=dict(duration=0, redraw=True),
                transition=dict(duration=0))]) for l in labels],
        )],
        updatemenus=[dict(
            type="buttons", showactive=False, x=0.98, y=0, xanchor="right",
            pad=dict(t=8), buttons=[dict(label=play, method="animate", args=[None, dict(
                fromcurrent=True, frame=dict(duration=650, redraw=True),
                transition=dict(duration=0))])],
        )],
    )
    return fig
