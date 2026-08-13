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
    BRAND, CONTEXT, MUTED, UP, DOWN,
    add_covid_band, add_provisional_band, add_reference_line,
)
from ._common import add_time_slider, annual_means, cap_other, titled, treemap_trace

_OTHER_SECTORS = "Other sectors"


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
    fig.update_yaxes(title_text="postings with an industry code (%)", ticksuffix="%", range=[0, 100])
    return titled(fig, "Industry-code coverage",
                  "Share of postings with an industry code")


def treemap(ds: DataSource, animate: str | None = None, locale: str = "en") -> go.Figure:
    nb = _real(ds.naics_broad)
    if animate == "by-year":
        nb = nb.copy()
        nb["year"] = nb["month"].dt.year
        years = sorted(nb["year"].unique())
        # Cap each year's tiles at ten: keep the nine biggest sectors, fold the
        # rest into one "Other sectors" tile (the parts still sum to the whole).
        agg = {y: cap_other(nb[nb["year"] == y].groupby("naics_name", as_index=False)["postings_total"].sum(),
                            "postings_total", "naics_name", other_label=_OTHER_SECTORS)
               for y in years}
        frames = [go.Frame(name=str(y), data=[treemap_trace(agg[y], "naics_name", "All industries")]) for y in years]
        fig = go.Figure(data=frames[-1].data, frames=frames)
        fr = locale == "fr"
        add_time_slider(fig, years, prefix="Année : " if fr else "Year: ",
                        play="▶ Lecture" if fr else "▶ Play")
        fig.update_layout(height=480, margin=dict(l=8, r=8, t=64, b=44))
        return titled(fig, "Postings by industry",
                      "Postings with an industry code in the selected year")
    cut = nb["month"].max() - pd.DateOffset(months=12)
    g = nb[nb["month"] > cut].groupby("naics_name", as_index=False)["postings_total"].sum()
    g = cap_other(g, "postings_total", "naics_name", other_label=_OTHER_SECTORS)
    fig = go.Figure(treemap_trace(g, "naics_name", "All industries"))
    fig.update_layout(height=460, margin=dict(l=8, r=8, t=64, b=8))
    return titled(fig, "Postings by industry",
                  "Postings with an industry code in the last 12 months")


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
    return titled(fig, "Posting share by industry",
                  "Among postings with an industry code")


def contribution_bars(ds: DataSource, base_year: int = BASE_YEAR,
                      end_year: int | None = None) -> go.Figure:
    end_year = end_year if end_year is not None else ds.latest_complete_year
    # Compare annual means (see annual_means): averaging each year's months
    # removes the within-year seasonal swing that a June-base vs December-end
    # snapshot would misattribute to sector trend. Keyed at {year}-12-01.
    base, end = pd.Timestamp(f"{base_year}-12-01"), pd.Timestamp(f"{end_year}-12-01")
    nb = annual_means(_real(ds.naics_broad), "postings_total", "naics_name")
    c = C.contribution_to_growth(nb, "naics_name", "postings_total", base, end)
    c["short"] = c["naics_name"].map(lambda s: s.split("|")[-1].strip()[:30])
    # Keep the ten largest contributors (by magnitude); fold the rest into one
    # "Other sectors" bar whose contribution sums the tail, so the bars still add
    # to the headline change.
    c = cap_other(c, "contribution_pp", "short", other_label=_OTHER_SECTORS, rank_abs=True)
    c = c.sort_values("contribution_pp")
    colors = np.where(c["contribution_pp"] >= 0, UP, DOWN)
    fig = go.Figure(go.Bar(x=c["contribution_pp"], y=c["short"], orientation="h",
                           marker_color=colors, hovertemplate="%{y}: %{x:+.1f} percentage points<extra></extra>"))
    add_reference_line(fig, 0)
    fig.update_xaxes(title_text="contribution to posting change (percentage points)")
    fig.update_layout(height=480)
    return titled(fig, f"Contributions to posting change, {base_year}–{end_year}",
                  "Among postings with an industry code")
