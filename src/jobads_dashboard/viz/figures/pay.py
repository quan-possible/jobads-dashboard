"""Pay & conditions - advertised wages and posting attributes.

Wages exist only as p25 / median / p75, so the charts are strictly limited to
those three quantiles: a band, a dumbbell, a quadrant. No violin, ridgeline, or
whiskers - those would invent a distribution we do not have.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots

from .. import compute as C
from ..datasource import BASE_YEAR, DataSource
from ..theme import (
    BRAND, CONTEXT, MUTED, add_covid_band, add_provisional_band, add_reference_line,
    add_unstable_band,
)
from ._common import titled

_STABLE_END = pd.Timestamp("2024-12-01")
UP = "#2f6f77"
DOWN = "#b5523a"


# --------------------------------------------------------------------------- CORE


def wage_band(ds: DataSource) -> go.Figure:
    w = ds.wage_overall.merge(ds.overall[["month", "postings_total"]], on="month", how="left",
                              suffixes=("", "_all"))
    w["coverage"] = w["wage_postings"] / w["postings_total"] * 100
    fig = make_subplots(specs=[[{"secondary_y": True}]])
    fig.add_trace(go.Scatter(x=w["month"], y=w["wage_p75"], mode="lines", name="P75",
                             line=dict(width=0), showlegend=False, hoverinfo="skip"),
                  secondary_y=False)
    fig.add_trace(go.Scatter(x=w["month"], y=w["wage_p25"], mode="lines", name="P25–P75",
                             line=dict(width=0), fill="tonexty",
                             fillcolor="rgba(52,89,97,0.16)",
                             hovertemplate="%{x|%b %Y} · P25: %{y:$,.0f}<extra></extra>"),
                  secondary_y=False)
    fig.add_trace(go.Scatter(x=w["month"], y=w["wage_median"], mode="lines", name="Median",
                             line=dict(color=BRAND, width=2.8),
                             hovertemplate="%{x|%b %Y} · median: %{y:$,.0f}<extra></extra>"),
                  secondary_y=False)
    fig.add_trace(go.Scatter(x=w["month"], y=w["coverage"], mode="lines", name="Wage coverage",
                             line=dict(color=MUTED, width=1.2, dash="dot"),
                             hovertemplate="%{x|%b %Y} · coverage: %{y:.0f}%<extra></extra>"),
                  secondary_y=True)
    add_covid_band(fig, label=False)
    add_provisional_band(fig)
    fig.update_yaxes(title_text="advertised hourly wage", tickprefix="$", secondary_y=False)
    fig.update_yaxes(title_text="% of postings with a wage", ticksuffix="%", range=[0, 100],
                     secondary_y=True, showgrid=False)
    return titled(fig, "Advertised hourly wage: median and P25–P75 band",
                  "Wages are advertised, not paid · dotted line = share of postings carrying a wage (right axis)")


# --------------------------------------------------------------------------- DEEP


def wage_dumbbell(ds: DataSource) -> go.Figure:
    w = ds.wage_by_province
    m = w[w["month"] == _STABLE_END].dropna(subset=["wage_median"])
    m = m[m["wage_postings"] >= 200].sort_values("wage_median")
    fig = go.Figure()
    for _, r in m.iterrows():
        fig.add_trace(go.Scatter(x=[r["wage_p25"], r["wage_p75"]], y=[r["province_name"]] * 2,
                                 mode="lines", line=dict(color=CONTEXT, width=4),
                                 showlegend=False, hoverinfo="skip"))
    fig.add_trace(go.Scatter(x=m["wage_median"], y=m["province_name"], mode="markers",
                             name="Median", marker=dict(color=BRAND, size=11),
                             hovertemplate="%{y}: median %{x:$,.0f}<extra></extra>"))
    fig.update_xaxes(title_text="advertised hourly wage", tickprefix="$")
    fig.update_layout(height=440, margin=dict(b=92), legend=dict(y=-0.24))
    return titled(fig, f"Advertised wage spread by province ({_STABLE_END:%b %Y})",
                  "Bar = P25→P75 range, dot = median · provinces with ≥200 wage-bearing postings")


def wage_demand_quadrant(ds: DataSource) -> go.Figure:
    w = ds.wage_by_noc
    wm = w[w["month"] == _STABLE_END].dropna(subset=["wage_median"]).set_index("noc_name")
    nb = ds.noc_broad
    cur = nb[nb["month"] == _STABLE_END].set_index("noc_name")["postings_total"]
    ago = nb[nb["month"] == _STABLE_END - pd.DateOffset(months=12)].set_index("noc_name")["postings_total"]
    yoy = (cur / ago - 1) * 100
    df = pd.DataFrame({"wage": wm["wage_median"], "vol": cur, "yoy": yoy}).dropna()
    df = df[~df.index.str.contains("Unknown")]
    df["short"] = list(df.index)
    xmid = df["wage"].median()
    # Label only the notable points (corners / big movers); the mid-pack reveals on hover.
    wlo, whi = df["wage"].quantile(0.25), df["wage"].quantile(0.75)
    vbig = df["vol"].quantile(0.7)
    notable = (df["yoy"].abs() > 4) | (df["wage"] > whi) | (df["wage"] < wlo) | (df["vol"] > vbig)
    labels = [s if n else "" for s, n in zip(df["short"], notable)]
    # split labels above/below the marker by sign to reduce collisions in the mid-pack
    textpos = ["bottom center" if y < 0 else "top center" for y in df["yoy"]]
    fig = go.Figure(go.Scatter(
        x=df["wage"], y=df["yoy"], mode="markers+text", text=labels,
        textposition=textpos, textfont=dict(size=9, color=MUTED),
        marker=dict(size=np.sqrt(df["vol"]) / np.sqrt(df["vol"]).max() * 46 + 8,
                    color=df["yoy"], colorscale="RdYlGn", cmid=0, line=dict(width=1, color="white"),
                    showscale=False),
        customdata=df["short"],
        hovertemplate="%{customdata}<br>median %{x:$,.0f} · YoY %{y:.1f}%<extra></extra>"))
    add_reference_line(fig, 0)
    fig.add_vline(x=xmid, line=dict(color=MUTED, width=1, dash="dash"))
    fig.update_xaxes(title_text="advertised median wage", tickprefix="$")
    fig.update_yaxes(title_text="YoY demand growth", ticksuffix="%")
    fig.update_layout(height=460)
    return titled(fig, "Pay vs momentum: the wage × demand quadrant",
                  "Bubble area ∝ volume · upper-right = well-paid and growing (correlation, not causation)")


_DEGREE_CATEGORIES = (
    "Undergraduate Degree (Bachelors)",
    "Graduate Degree - Masters",
    "Post-Graduate Degree - Doctorate",
)


def education_wage_proxy(ds: DataSource) -> go.Figure:
    """Do credential-heavy occupations pay more? A descriptive cross-section: the
    share of an occupation group's postings that ask for a university degree vs its
    median advertised wage. Postings-only proxy for the conditioned wage premium."""
    ed = ds.requirements_by_occupation("Education")
    ed = ed[ed["category"] != "Unknown"]
    recent = ed[ed["month"] > ed["month"].max() - pd.DateOffset(months=12)]
    by_noc = recent.groupby("noc_name").apply(
        lambda d: pd.Series({
            "degree_share": d.loc[d["category"].isin(_DEGREE_CATEGORIES), "postings_total"].sum()
            / d["postings_total"].sum() * 100 if d["postings_total"].sum() else np.nan,
            "vol": d["postings_total"].sum(),
        }), include_groups=False)
    w = ds.wage_by_noc
    wm = w[w["month"] == _STABLE_END].dropna(subset=["wage_median"]).set_index("noc_name")["wage_median"]
    df = by_noc.join(wm.rename("wage")).dropna()
    df = df[~df.index.str.contains("Unknown")]
    fig = go.Figure(go.Scatter(
        x=df["degree_share"], y=df["wage"], mode="markers+text", text=list(df.index),
        textposition="top center", textfont=dict(size=9, color=MUTED),
        marker=dict(size=np.sqrt(df["vol"]) / np.sqrt(df["vol"]).max() * 44 + 8,
                    color=BRAND, opacity=0.85, line=dict(width=1, color="white")),
        hovertemplate="%{text}<br>%{x:.0f}% ask a degree · median %{y:$,.0f}<extra></extra>"))
    fig.update_xaxes(title_text="share of postings asking for a university degree", ticksuffix="%")
    fig.update_yaxes(title_text="median advertised wage", tickprefix="$")
    fig.update_layout(height=460)
    return titled(fig, "Do credential-heavy occupations pay more?",
                  "Each broad occupation group: degree-requirement share vs median advertised wage · bubble ∝ volume (correlation, not causation)")


def conditions_mix(ds: DataSource) -> go.Figure:
    c = ds.conditions("Employment type")
    tot = c.groupby("month")["postings_total"].transform("sum")
    c = c.assign(share=c["postings_total"] / tot * 100)
    from ..theme import COLORWAY
    order = ["full-time", "part-time", "full-time or part-time", "Unknown"]
    fig = go.Figure()
    for i, cat in enumerate([x for x in order if x in c["category"].unique()]):
        sub = c[c["category"] == cat]
        fig.add_trace(go.Scatter(x=sub["month"], y=sub["share"], name=cat, stackgroup="one",
                                 mode="lines", line=dict(width=0.5, color=COLORWAY[i % len(COLORWAY)]),
                                 hovertemplate="%{x|%b %Y} · " + cat + ": %{y:.1f}%<extra></extra>"))
    fig.update_yaxes(title_text="share of postings", ticksuffix="%", range=[0, 100])
    return titled(fig, "Employment-type mix over time",
                  "Share of postings by advertised employment type")


def language_gap(ds: DataSource) -> go.Figure:
    fig = go.Figure()
    for dim, name, color in [("English requirement", "English mandatory", BRAND),
                             ("French requirement", "French mandatory", "#345961")]:
        d = ds.language(dim)
        tot = d.groupby("month")["postings_total"].transform("sum")
        d = d.assign(share=d["postings_total"] / tot * 100)
        man = d[d["category"] == "mandatory"]
        fig.add_trace(go.Scatter(x=man["month"], y=man["share"], name=name, mode="lines",
                                 line=dict(color=color, width=2.4),
                                 hovertemplate="%{x|%b %Y} · " + name + ": %{y:.1f}%<extra></extra>"))
    add_unstable_band(fig)
    fig.update_yaxes(title_text="% of postings", ticksuffix="%")
    return titled(fig, "Language requirements: English vs French (mandatory)",
                  "Share of postings flagging a mandatory language · unstable before 2021 (shaded)")
