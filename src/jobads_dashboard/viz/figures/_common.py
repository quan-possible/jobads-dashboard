"""Small shared helpers for figure factories."""

from __future__ import annotations

import plotly.graph_objects as go

from ..theme import BRAND, CONTEXT, MUTED, register_templates

register_templates()  # ensure templates exist when figures are built standalone


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


def emphasise(n: int, focus: int | None = None) -> list[str]:
    """Return a colorway that greys everything except ``focus`` (brand accent)."""
    if focus is None:
        from ..theme import COLORWAY
        return [COLORWAY[i % len(COLORWAY)] for i in range(n)]
    return [BRAND if i == focus else CONTEXT for i in range(n)]


def money(v) -> str:
    return f"${v:,.0f}" if v is not None else "n/a"
