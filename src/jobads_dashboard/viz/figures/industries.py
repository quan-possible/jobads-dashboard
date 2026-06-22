"""Industries (NAICS) - same shapes as occupations, but coverage-gated.

NAICS is incomplete, so every industry surface leads with its coverage line and
labels denominators as conditional.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
import plotly.graph_objects as go

from .. import compute as C
from ..datasource import BASE_YEAR, DataSource
from ..theme import (
    BRAND, CONTEXT, MUTED, SEQUENTIAL, add_covid_band, add_provisional_band, add_reference_line,
)
from ._common import add_time_slider, titled

_PROVISIONAL_FROM = pd.Timestamp("2025-01-01")
UP = "#2f6f77"
DOWN = "#b5523a"


def _real(df: pd.DataFrame) -> pd.DataFrame:
    return df[~df["naics_name"].str.contains("Unknown", na=False)]


def coverage_line(ds: DataSource) -> go.Figure:
    cov = ds.coverage_overall
    naics = cov[cov["field_name"] == "naics"]
    fig = go.Figure(go.Scatter(
        x=naics["month"], y=naics["coverage_pct"], mode="lines",
        line=dict(color=BRAND, width=2.5), fill="tozeroy", fillcolor="rgba(207,119,48,0.10)",
        hovertemplate="%{x|%b %Y}: %{y:.0f}% have an industry code<extra></extra>"))
    add_covid_band(fig, label=False)
    add_provisional_band(fig)
    fig.update_yaxes(title_text="% of postings with NAICS", ticksuffix="%", range=[0, 100])
    return titled(fig, "Read industries with care: NAICS coverage over time",
                  "Only this share of postings carries an industry code — every sector total below is conditional on it")


def _treemap_trace(g: pd.DataFrame, root: str = "All industries") -> go.Treemap:
    g = g.copy()
    g["short"] = g["naics_name"].map(lambda s: s.split("|")[-1].strip())
    total = g["postings_total"].sum()
    return go.Treemap(
        labels=[root] + g["short"].tolist(),
        parents=[""] + [root] * len(g),
        values=[total] + g["postings_total"].tolist(), branchvalues="total",
        marker=dict(colors=[total] + g["postings_total"].tolist(), colorscale=SEQUENTIAL,
                    line=dict(width=1, color="white")),
        textinfo="label+value+percent root", maxdepth=2,
        hovertemplate="%{label}: %{value:,.0f} (%{percentRoot})<extra></extra>")


def treemap(ds: DataSource, animate: str | None = None) -> go.Figure:
    nb = _real(ds.naics_broad)
    if animate == "by-year":
        nb = nb.copy()
        nb["year"] = nb["month"].dt.year
        years = sorted(nb["year"].unique())
        agg = {y: nb[nb["year"] == y].groupby("naics_name", as_index=False)["postings_total"].sum()
               for y in years}
        frames = [go.Frame(name=str(y), data=[_treemap_trace(agg[y])]) for y in years]
        fig = go.Figure(data=frames[-1].data, frames=frames)
        add_time_slider(fig, years)
        fig.update_layout(height=480, margin=dict(l=8, r=8, t=64, b=44))
        return titled(fig, "Demand by industry sector (where coded)",
                      "Area ∝ postings with a NAICS code in the selected year — drag or press play")
    cut = nb["month"].max() - pd.DateOffset(months=12)
    g = nb[nb["month"] > cut].groupby("naics_name", as_index=False)["postings_total"].sum()
    fig = go.Figure(_treemap_trace(g))
    fig.update_layout(height=460, margin=dict(l=8, r=8, t=64, b=8))
    return titled(fig, "Demand by industry sector (where coded)",
                  "Area ∝ postings with a NAICS code, last 12 months")


def share_over_time(ds: DataSource, top: int = 7) -> go.Figure:
    nb = _real(ds.naics_broad)
    recent = nb[nb["month"] >= nb["month"].max() - pd.DateOffset(years=1)]
    keep = list(recent.groupby("naics_name")["postings_total"].sum().sort_values(ascending=False).index[:top])
    nb = nb.copy()
    nb["band"] = np.where(nb["naics_name"].isin(keep), nb["naics_name"], "Other sectors")
    g = nb.groupby(["month", "band"], as_index=False)["postings_total"].sum()
    tot = g.groupby("month")["postings_total"].transform("sum")
    g["share"] = g["postings_total"] / tot * 100
    from ..theme import COLORWAY
    fig = go.Figure()
    for i, b in enumerate(keep + ["Other sectors"]):
        sub = g[g["band"] == b]
        fig.add_trace(go.Scatter(x=sub["month"], y=sub["share"], name=b.split("|")[-1].strip()[:30],
                                 stackgroup="one", mode="lines",
                                 line=dict(width=0.5, color=COLORWAY[i % len(COLORWAY)]),
                                 hovertemplate="%{x|%b %Y}: %{y:.1f}%<extra></extra>"))
    fig.update_yaxes(title_text="share of coded postings", ticksuffix="%", range=[0, 100])
    return titled(fig, "How the industry mix shifts (among coded postings)",
                  "Share of postings with a NAICS code, by sector")


def contribution_bars(ds: DataSource) -> go.Figure:
    base, end = pd.Timestamp(f"{BASE_YEAR}-06-01"), _PROVISIONAL_FROM - pd.DateOffset(months=1)
    nb = _real(ds.naics_broad)
    c = C.contribution_to_growth(nb, "naics_name", "postings_total", base, end)
    c["short"] = c["naics_name"].map(lambda s: s.split("|")[-1].strip()[:30])
    c = c.sort_values("contribution_pp")
    colors = np.where(c["contribution_pp"] >= 0, UP, DOWN)
    fig = go.Figure(go.Bar(x=c["contribution_pp"], y=c["short"], orientation="h",
                           marker_color=colors, hovertemplate="%{y}: %{x:+.1f} pp<extra></extra>"))
    add_reference_line(fig, 0)
    fig.update_xaxes(title_text="contribution to growth (pp)", ticksuffix=" pp")
    fig.update_layout(height=480)
    return titled(fig, f"Which sectors drove the change, {BASE_YEAR}→{end.year}",
                  "Contribution to growth among coded postings (accounting identity)")
