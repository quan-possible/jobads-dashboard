"""Small shared helpers for figure factories."""

from __future__ import annotations

import pandas as pd
import plotly.graph_objects as go

from ..theme import MUTED, SEQUENTIAL, register_templates

register_templates()  # ensure templates exist when figures are built standalone


def treemap_trace(g: pd.DataFrame, name_col: str, root: str) -> go.Treemap:
    """Shared treemap trace for the occupation / industry volume treemaps."""
    g = g.copy()
    g["short"] = g[name_col].map(lambda s: s.split("|")[-1].strip())
    total = g["postings_total"].sum()
    return go.Treemap(
        labels=[root] + g["short"].tolist(),
        parents=[""] + [root] * len(g),
        values=[total] + g["postings_total"].tolist(), branchvalues="total",
        marker=dict(colors=[total] + g["postings_total"].tolist(), colorscale=SEQUENTIAL,
                    line=dict(width=1, color="white")),
        textinfo="label+value+percent root", maxdepth=2,
        hovertemplate="%{label}: %{value:,.0f} (%{percentRoot})<extra></extra>")


def titled(fig: go.Figure, headline: str, subtitle: str | None = None,
           height: int | None = None) -> go.Figure:
    """Apply the standard finding-as-headline + units-as-subtitle title block."""
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
