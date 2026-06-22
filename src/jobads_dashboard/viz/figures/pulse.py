"""Pulse - the market's vital signs (Core heroes + Deep decomposition)."""

from __future__ import annotations

import math

import numpy as np
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots

from .. import compute as C
from ..datasource import BASE_YEAR, DataSource
from ..theme import (
    BRAND, CONTEXT, DIVERGING, MUTED, UP, DOWN, add_covid_band, add_provisional_band,
    add_reference_line, split_provisional,
)
from ._common import titled


# --------------------------------------------------------------------------- CORE


def demand_ribbon(ds: DataSource) -> go.Figure:
    ov = ds.overall.copy()
    ov["ma3"] = C.moving_average(ov["postings_total"], 3)
    solid, prov = split_provisional(ov, "month")
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=ov["month"], y=ov["postings_total"], name="Monthly postings",
                             mode="lines", line=dict(color=CONTEXT, width=1),
                             opacity=0.5, hovertemplate="%{x|%b %Y}: %{y:,.0f}<extra></extra>"))
    fig.add_trace(go.Scatter(x=solid["month"], y=solid["ma3"], name="3-month average",
                             mode="lines", line=dict(color=BRAND, width=3),
                             hovertemplate="%{x|%b %Y}: %{y:,.0f}<extra>3-mo avg</extra>"))
    fig.add_trace(go.Scatter(x=prov["month"], y=prov["ma3"], name="provisional",
                             mode="lines", line=dict(color=BRAND, width=3, dash="dot"),
                             showlegend=False, hovertemplate="%{x|%b %Y}: %{y:,.0f}<extra>provisional</extra>"))
    add_covid_band(fig)
    add_provisional_band(fig)
    fig.update_yaxes(title_text="postings / month", rangemode="tozero")
    fig.update_layout(showlegend=False)
    return titled(fig, "Labour demand: monthly job-ad postings, 2016–2026",
                  "Faint line = raw monthly count · bold = 3-month average · dotted tail = provisional")


def yoy_bars(ds: DataSource) -> go.Figure:
    ov = C.yoy_pct(ds.overall, "postings_total")
    ov = ov.dropna(subset=["yoy_pct"])
    colors = np.where(ov["yoy_pct"] >= 0, UP, DOWN)
    fig = go.Figure(go.Bar(x=ov["month"], y=ov["yoy_pct"], marker_color=colors,
                           hovertemplate="%{x|%b %Y}: %{y:+.1f}%<extra></extra>"))
    add_reference_line(fig, 0)
    add_covid_band(fig)
    add_provisional_band(fig)
    fig.update_yaxes(title_text="year-over-year %", ticksuffix="%")
    return titled(fig, "Growth and decline: year-over-year change in postings",
                  "Each bar compares a month with the same month a year earlier")


def seasonality_heatmap(ds: DataSource) -> go.Figure:
    ov = ds.overall.copy()
    ov["year"] = ov["month"].dt.year
    ov["mo"] = ov["month"].dt.month
    yr_mean = ov.groupby("year")["postings_total"].transform("mean")
    ov["rel"] = ov["postings_total"] / yr_mean
    piv = ov.pivot_table(index="mo", columns="year", values="rel")
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    fig = go.Figure(go.Heatmap(
        z=piv.values, x=piv.columns.astype(str), y=[months[m - 1] for m in piv.index],
        colorscale=DIVERGING, zmid=1.0, colorbar=dict(title="vs year avg", tickformat=".0%"),
        hovertemplate="%{y} %{x}: %{z:.0%} of year avg<extra></extra>"))
    fig.update_yaxes(autorange="reversed")
    return titled(fig, "When in the year is demand? Seasonal shape by month",
                  "Each cell = that month relative to its own year's average (controls for the trend)")


def composition_area(ds: DataSource, top: int = 6) -> go.Figure:
    nb = ds.noc_broad.copy()
    recent = nb[nb["month"] >= nb["month"].max() - pd.DateOffset(years=1)]
    order = recent.groupby("noc_name")["postings_total"].sum().sort_values(ascending=False)
    keep = list(order.index[:top])
    nb["band"] = np.where(nb["noc_name"].isin(keep), nb["noc_name"], "Other groups")
    g = nb.groupby(["month", "band"], as_index=False)["postings_total"].sum()
    tot = g.groupby("month")["postings_total"].transform("sum")
    g["share"] = g["postings_total"] / tot * 100
    fig = go.Figure()
    bands = keep + ["Other groups"]
    from ..theme import COLORWAY
    for i, b in enumerate(bands):
        sub = g[g["band"] == b]
        fig.add_trace(go.Scatter(
            x=sub["month"], y=sub["share"], name=b, stackgroup="one",
            mode="lines", line=dict(width=0.5, color=COLORWAY[i % len(COLORWAY)]),
            hovertemplate="%{x|%b %Y} · " + b + ": %{y:.1f}%<extra></extra>"))
    fig.update_yaxes(title_text="share of postings", ticksuffix="%", range=[0, 100])
    add_covid_band(fig, label=False)
    add_provisional_band(fig, label=False)
    return titled(fig, "How the occupational mix shifts over time",
                  "Share of monthly postings by broad occupation group (top groups + Other)")


# --------------------------------------------------------------------------- DEEP


def diffusion_index(ds: DataSource) -> go.Figure:
    wide = ds.noc_broad.pivot_table(index="month", columns="noc_label", values="postings_total")
    di = C.diffusion_index(wide).dropna()
    di = C.moving_average(di, 3)  # smooth the jagged month-to-month step rendering
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=di.index, y=di.values, mode="lines",
                             line=dict(color=BRAND, width=2.5, shape="spline", smoothing=0.5),
                             hovertemplate="%{x|%b %Y}: %{y:.0f}<extra></extra>"))
    fig.add_hrect(y0=50, y1=100, fillcolor="rgba(47,111,119,0.06)", line_width=0, layer="below")
    add_reference_line(fig, 50, text="balanced")
    add_covid_band(fig)
    fig.update_yaxes(title_text="% of groups growing (YoY)", range=[0, 100])
    return titled(fig, "Is growth broad or narrow? Diffusion across occupation groups",
                  "Share of broad occupation groups with positive year-over-year demand; 50 = evenly split (3-month smoothed)")


def occupation_trends_grid(ds: DataSource) -> go.Figure:
    """A sparkline grid: one mini demand-trend per broad occupation group. A rich,
    descriptive overview — see every group's whole-decade trajectory at a glance."""
    nb = ds.noc_broad[~ds.noc_broad["noc_name"].str.contains("Unknown", na=False)]
    groups = (nb.groupby("noc_name")["postings_total"].sum()
              .sort_values(ascending=False).index.tolist())
    cols = 5
    rows = math.ceil(len(groups) / cols)
    fig = make_subplots(rows=rows, cols=cols, subplot_titles=groups,
                        vertical_spacing=0.16, horizontal_spacing=0.03)
    for i, g in enumerate(groups):
        r, c = divmod(i, cols)
        s = nb[nb["noc_name"] == g].sort_values("month")
        peak = s["postings_total"].max()
        fig.add_trace(go.Scatter(
            x=s["month"], y=s["postings_total"], mode="lines",
            line=dict(color=BRAND, width=1.5), fill="tozeroy",
            fillcolor="rgba(207,119,48,0.10)", showlegend=False,
            hovertemplate="%{x|%b %Y}: %{y:,.0f}<extra>" + g + "</extra>"),
            row=r + 1, col=c + 1)
        fig.update_xaxes(visible=False, row=r + 1, col=c + 1)
        fig.update_yaxes(visible=False, rangemode="tozero", range=[0, peak * 1.1],
                         row=r + 1, col=c + 1)
    fig.update_layout(height=110 * rows + 40, margin=dict(l=12, r=12, t=44, b=12))
    for ann in fig.layout.annotations:
        ann.font.size = 11
        ann.font.color = "#132330"
    return titled(fig, "Every occupation group's demand trajectory at a glance",
                  "Monthly postings 2016–2026, one panel per broad NOC group (each panel scaled to its own peak)")


def momentum(ds: DataSource) -> go.Figure:
    """Is demand accelerating or cooling? The gap between the fast (3-month) and slow
    (12-month) moving averages — positive = speeding up, negative = slowing."""
    o = ds.overall.copy()
    s = o.set_index("month")["postings_total"]
    fast = C.moving_average(s, 3)
    slow = C.moving_average(s, 12)
    mom = (fast - slow).dropna()
    colors = np.where(mom.values >= 0, UP, DOWN)
    fig = go.Figure(go.Bar(
        x=mom.index, y=mom.values, marker_color=colors,
        hovertemplate="%{x|%b %Y}: %{y:+,.0f}<extra></extra>"))
    add_reference_line(fig, 0)
    add_covid_band(fig)
    add_provisional_band(fig)
    fig.update_yaxes(title_text="3-month avg − 12-month avg (postings)")
    return titled(fig, "Momentum: is demand speeding up or cooling?",
                  "Gap between the 3-month and 12-month averages · orange = accelerating, teal = cooling")
