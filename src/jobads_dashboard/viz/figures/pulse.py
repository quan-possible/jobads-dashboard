"""Pulse - the market's vital signs (Core heroes + Deep decomposition)."""

from __future__ import annotations

import numpy as np
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots

from .. import compute as C
from ..datasource import BASE_YEAR, DataSource
from ..theme import (
    BRAND, CONTEXT, DIVERGING, MUTED, add_covid_band, add_provisional_band,
    add_reference_line, split_provisional,
)
from ._common import titled

UP = "#2f6f77"
DOWN = "#b5523a"


# --------------------------------------------------------------------------- CORE


def kpi_row(ds: DataSource) -> go.Figure:
    ov = ds.overall.copy()
    ov["ma3"] = C.moving_average(ov["postings_total"], 3)
    latest = ov.iloc[-1]
    yoy = ov["postings_total"].pct_change(12).iloc[-1] * 100
    last12 = ov["postings_total"].iloc[-12:].sum()
    prev12 = ov["postings_total"].iloc[-24:-12].sum()
    last12_yoy = (last12 / prev12 - 1) * 100 if prev12 else np.nan
    wage_cov = latest["wage_postings"] / latest["postings_total"] * 100
    spark = ov.iloc[-24:]

    fig = make_subplots(
        rows=2, cols=4, row_heights=[0.62, 0.38], vertical_spacing=0.04,
        specs=[[{"type": "indicator"}] * 4, [{"type": "xy"}] * 4],
    )
    cards = [
        ("Postings, latest month", latest["postings_total"], yoy, "%", spark["postings_total"]),
        ("Trailing 12-month total", last12, last12_yoy, "%", ov["postings_total"].rolling(12).sum().iloc[-24:]),
        ("Year-over-year growth", yoy, None, "%", ov["postings_total"].pct_change(12).iloc[-24:] * 100),
        ("Wage-coverage, latest", wage_cov, None, "%", ov["wage_postings"].iloc[-24:] / ov["postings_total"].iloc[-24:] * 100),
    ]
    for i, (label, value, delta, _suf, series) in enumerate(cards, start=1):
        num = dict(font=dict(size=30, color="#132330"))
        if i == 3:
            num["suffix"] = "%"
            num["valueformat"] = ".1f"
        elif i == 4:
            num["suffix"] = "%"
            num["valueformat"] = ".0f"
        else:
            num["valueformat"] = ",.0f"
        ind = dict(mode="number", value=float(value), number=num,
                   title=dict(text=label, font=dict(size=12, color=MUTED)))
        if delta is not None and not np.isnan(delta):
            ind["mode"] = "number+delta"
            ind["delta"] = dict(reference=float(value) / (1 + delta / 100),
                                relative=True, valueformat=".1%",
                                increasing=dict(color=UP), decreasing=dict(color=DOWN))
        fig.add_trace(go.Indicator(**ind), row=1, col=i)
        fig.add_trace(go.Scatter(x=spark["month"], y=series.values, mode="lines",
                                 line=dict(color=BRAND, width=2), hoverinfo="skip"),
                      row=2, col=i)
    fig.update_xaxes(visible=False, row=2)
    fig.update_yaxes(visible=False, row=2)
    fig.update_layout(showlegend=False, height=230, margin=dict(l=20, r=20, t=24, b=10))
    return fig


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
    return titled(fig, "How the occupational mix shifts over time",
                  "Share of monthly postings by broad occupation group (top groups + Other)")


# --------------------------------------------------------------------------- DEEP


def stl_panel(ds: DataSource) -> go.Figure:
    s = ds.overall.set_index("month")["postings_total"]
    dec = C.classical_decompose(s, period=12)
    fig = make_subplots(rows=4, cols=1, shared_xaxes=True, vertical_spacing=0.045,
                        subplot_titles=("Observed", "Trend", "Seasonal", "Remainder"))
    panels = [("observed", CONTEXT), ("trend", BRAND), ("seasonal", "#345961"), ("resid", "#7b6b8d")]
    for r, (col, color) in enumerate(panels, start=1):
        fig.add_trace(go.Scatter(x=dec.index, y=dec[col], mode="lines",
                                 line=dict(color=color, width=2), showlegend=False), row=r, col=1)
        if col == "resid":
            fig.add_hline(y=0, line=dict(color=MUTED, width=1, dash="dot"), row=r, col=1)
    for r in range(1, 5):
        add_covid_band(fig, label=(r == 1), row=r, col=1)
    fig.update_layout(height=560)
    for ann in fig.layout.annotations:
        ann.font.size = 12
    return titled(fig, "Decomposition: trend, season, and shock pulled apart",
                  "Classical additive decomposition (dependency-free stand-in for STL); COVID lands in the remainder")


def anomaly_flags(ds: DataSource) -> go.Figure:
    s = ds.overall.set_index("month")["postings_total"]
    dec = C.classical_decompose(s, period=12)
    z = C.robust_z(dec["resid"].dropna())
    flagged = z.abs() > 3
    colors = np.where(flagged, BRAND, CONTEXT)
    fig = go.Figure(go.Bar(x=z.index, y=z.values, marker_color=colors,
                           hovertemplate="%{x|%b %Y}: z=%{y:.1f}<extra></extra>"))
    for yy in (3, -3):
        fig.add_hline(y=yy, line=dict(color=DOWN, width=1, dash="dash"))
    add_reference_line(fig, 0)
    fig.update_yaxes(title_text="robust z of remainder")
    return titled(fig, "Surprises vs the seasonal expectation",
                  "Robust z-score on the decomposition remainder; |z|>3 (orange) flags an anomaly")


def sa_vs_nsa(ds: DataSource) -> go.Figure:
    s = ds.overall.set_index("month")["postings_total"]
    dec = C.classical_decompose(s, period=12)
    sa = dec["observed"] - dec["seasonal"]
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=dec.index, y=dec["observed"], name="Not seasonally adjusted",
                             mode="lines", line=dict(color=CONTEXT, width=1.5)))
    fig.add_trace(go.Scatter(x=dec.index, y=sa, name="Seasonally adjusted (approx.)",
                             mode="lines", line=dict(color=BRAND, width=2.5)))
    add_covid_band(fig)
    fig.update_yaxes(title_text="postings / month", rangemode="tozero")
    return titled(fig, "Seasonally adjusted vs raw demand",
                  "SA ≈ observed − seasonal (decomposition-based, approximate — not an official X-13 series)")


def diffusion_index(ds: DataSource) -> go.Figure:
    wide = ds.noc_broad.pivot_table(index="month", columns="noc_label", values="postings_total")
    di = C.diffusion_index(wide).dropna()
    fig = go.Figure()
    fig.add_trace(go.Scatter(x=di.index, y=di.values, mode="lines",
                             line=dict(color=BRAND, width=2.5),
                             hovertemplate="%{x|%b %Y}: %{y:.0f}<extra></extra>"))
    fig.add_hrect(y0=50, y1=100, fillcolor="rgba(47,111,119,0.06)", line_width=0, layer="below")
    add_reference_line(fig, 50, text="balanced")
    add_covid_band(fig)
    fig.update_yaxes(title_text="% of groups growing (YoY)", range=[0, 100])
    return titled(fig, "Is growth broad or narrow? Diffusion across occupation groups",
                  "Share of broad occupation groups with positive year-over-year demand; 50 = evenly split")


def cycle_plot(ds: DataSource) -> go.Figure:
    ov = ds.overall.copy()
    ov["mo"] = ov["month"].dt.month
    ov["year"] = ov["month"].dt.year
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    fig = make_subplots(rows=1, cols=12, shared_yaxes=True, horizontal_spacing=0.004,
                        subplot_titles=months)
    for m in range(1, 13):
        sub = ov[ov["mo"] == m].sort_values("year")
        fig.add_trace(go.Scatter(x=sub["year"], y=sub["postings_total"], mode="lines",
                                 line=dict(color=CONTEXT, width=1.3), showlegend=False,
                                 hovertemplate="%{x}: %{y:,.0f}<extra></extra>"), row=1, col=m)
        fig.add_hline(y=sub["postings_total"].mean(), line=dict(color=BRAND, width=1.2),
                      row=1, col=m)
    fig.update_xaxes(showticklabels=False)
    fig.update_yaxes(rangemode="tozero")
    fig.update_layout(height=320)
    for ann in fig.layout.annotations:
        ann.font.size = 10
    return titled(fig, "Cycle plot: each month's trend across the years",
                  "Within each panel the line runs 2016→2026; orange line = that month's mean")
