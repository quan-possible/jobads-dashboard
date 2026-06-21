"""Skills & requirements - lift-weighted skills, education and experience mix."""

from __future__ import annotations

import pandas as pd
import plotly.graph_objects as go

from ..datasource import DataSource
from ..labels import noc_short
from ..theme import BRAND, CONTEXT, MUTED, add_reference_line
from ._common import titled

from ..theme import COLORWAY


def skill_lift_bars(ds: DataSource, occupation_scope: str | None = None) -> go.Figure:
    if occupation_scope is None:
        # default to a clearly-specialised group: Health occupations ("3 | ...")
        scopes = ds.noc_broad["occupation_scope"].unique()
        cands = [s for s in scopes if s.startswith("3 |")]
        occupation_scope = cands[0] if cands else scopes[0]
    df = ds.skill_lift(occupation_scope).sort_values("lift")
    fig = go.Figure(go.Bar(
        x=df["lift"], y=df["skill_code"], orientation="h", marker_color=BRAND,
        hovertemplate="skill %{y}: lift %{x:.1f}×<extra></extra>"))
    add_reference_line(fig, 1, text="national rate")
    fig.update_xaxes(title_text="lift (occupation share ÷ national share)", ticksuffix="×")
    fig.update_yaxes(type="category", title_text="skill code")
    fig.update_layout(height=440)
    return titled(fig, f"Distinctive skills for {noc_short(occupation_scope)}",
                  "Skills most over-represented vs the whole market (codes are taxonomy IDs; no public label table in v1)")


def education_composition(ds: DataSource) -> go.Figure:
    e = ds.requirements("Education")
    tot = e.groupby("month")["postings_total"].transform("sum")
    e = e.assign(share=e["postings_total"] / tot * 100)
    cats = e.groupby("category")["postings_total"].sum().sort_values(ascending=False).index
    fig = go.Figure()
    for i, cat in enumerate(cats):
        sub = e[e["category"] == cat]
        fig.add_trace(go.Scatter(x=sub["month"], y=sub["share"], name=cat[:30], stackgroup="one",
                                 mode="lines", line=dict(width=0.5, color=COLORWAY[i % len(COLORWAY)]),
                                 hovertemplate="%{x|%b %Y} · " + cat[:24] + ": %{y:.1f}%<extra></extra>"))
    fig.update_yaxes(title_text="share of postings", ticksuffix="%", range=[0, 100])
    return titled(fig, "Education requirements over time",
                  "Share of postings by stated education requirement")


def experience_mix(ds: DataSource) -> go.Figure:
    x = ds.requirements("Experience details band")
    tot = x.groupby("month")["postings_total"].transform("sum")
    x = x.assign(share=x["postings_total"] / tot * 100)
    order = ["<1 year", "1-3 years", "3-5 years", "5+ years", "Not reported", "Other specified"]
    present = [c for c in order if c in x["category"].unique()]
    fig = go.Figure()
    for i, cat in enumerate(present):
        sub = x[x["category"] == cat]
        fig.add_trace(go.Scatter(x=sub["month"], y=sub["share"], name=cat, stackgroup="one",
                                 mode="lines", line=dict(width=0.5, color=COLORWAY[i % len(COLORWAY)]),
                                 hovertemplate="%{x|%b %Y} · " + cat + ": %{y:.1f}%<extra></extra>"))
    fig.update_yaxes(title_text="share of postings", ticksuffix="%", range=[0, 100])
    return titled(fig, "Experience bands over time",
                  "Share of postings by advertised years-of-experience band")
