"""Skills & requirements - most-requested skills and their trend, distinctive
skills by occupation, the skill × occupation grid, education and experience mix.

Skill codes carry human labels from the bundled reference taxonomy, so every
panel reads in plain skill names rather than IDs.
"""

from __future__ import annotations

import numpy as np
import plotly.graph_objects as go

from .. import compute as C
from ..datasource import BASE_YEAR, DataSource
from ..labels import noc_short
from ..theme import BRAND, CONTEXT, SEQUENTIAL, add_covid_band, add_provisional_band, add_reference_line
from ._common import titled

from ..theme import COLORWAY


# --------------------------------------------------------------------------- CORE


def top_skills_trend(ds: DataSource, base_year: int = BASE_YEAR, top: int = 8) -> go.Figure:
    """The most-requested skills nationally and how each has trended. Indexed to each
    skill's base-year average so fast and slow movers are comparable; base is selectable."""
    nat = ds.skills_national(top=top)
    idx = C.index_to_base(nat, "postings_total", base_year, by="skill_name")
    latest = idx[idx["month"] == idx["month"].max()].set_index("skill_name")["index"]
    movers = latest.sort_values(ascending=False)
    highlight = set(list(movers.index[:2]) + list(movers.index[-1:]))
    fig = go.Figure()
    for name, sub in idx.groupby("skill_name"):
        on = name in highlight
        sub = sub.sort_values("month")
        fig.add_trace(go.Scatter(
            x=sub["month"], y=sub["index"], name=name, mode="lines",
            line=dict(color=BRAND if on else CONTEXT, width=2.6 if on else 1),
            opacity=1 if on else 0.55, showlegend=on,
            hovertemplate="%{x|%b %Y} · " + name + ": %{y:.0f}<extra></extra>"))
    add_reference_line(fig, 100, text=f"{base_year}=100")
    add_covid_band(fig)
    add_provisional_band(fig)
    fig.update_yaxes(title_text="index (base year = 100)")
    return titled(fig, "The most-requested skills, and how each has trended",
                  f"Top skills by posting volume, each indexed to its {base_year} average · fastest/slowest movers highlighted")


def ai_skill_diffusion(ds: DataSource) -> go.Figure:
    """The rise of AI skills in hiring: AI skills as a share of all skill
    mentions over time. AI skills = the reference taxonomy's 'Artificial Intelligence'
    sub-group. Mention-share, smoothed; the generative-AI surge shows from 2024."""
    d = ds.ai_skill_diffusion()
    d = d[d["all_mentions"] > 0].copy()
    d["smooth"] = C.moving_average(d["ai_share"], 3)
    fig = go.Figure()
    fig.add_trace(go.Scatter(
        x=d["month"], y=d["ai_share"], mode="lines", name="monthly",
        line=dict(color=CONTEXT, width=1), opacity=0.5,
        hovertemplate="%{x|%b %Y}: %{y:.2f}%<extra></extra>"))
    fig.add_trace(go.Scatter(
        x=d["month"], y=d["smooth"], mode="lines", name="3-month average",
        line=dict(color=BRAND, width=2.8),
        hovertemplate="%{x|%b %Y}: %{y:.2f}%<extra>3-mo avg</extra>"))
    add_covid_band(fig)
    add_provisional_band(fig)
    fig.update_yaxes(title_text="% of all skill mentions", ticksuffix="%", rangemode="tozero")
    fig.update_layout(showlegend=False)
    return titled(fig, "The rise of AI skills in postings",
                  "AI-related skills (machine learning, generative AI, LLMs, …) as a share of all skill mentions · faint = monthly, bold = 3-month average")


# --------------------------------------------------------------------------- DEEP


def skill_lift_bars(ds: DataSource, occupation_scope: str | None = None) -> go.Figure:
    if occupation_scope is None:
        # default to a clearly-specialised group: Health occupations ("3 | ...")
        scopes = ds.noc_broad["occupation_scope"].unique()
        cands = [s for s in scopes if s.startswith("3 |")]
        occupation_scope = cands[0] if cands else scopes[0]
    df = ds.skill_lift(occupation_scope).sort_values("lift")
    fig = go.Figure(go.Bar(
        x=df["lift"], y=df["skill_name"], orientation="h", marker_color=BRAND,
        hovertemplate="%{y}: lift %{x:.1f}×<extra></extra>"))
    add_reference_line(fig, 1, text="national rate")
    fig.update_xaxes(title_text="lift (occupation share ÷ national share)", ticksuffix="×")
    fig.update_yaxes(type="category", title_text="")
    fig.update_layout(height=440, margin=dict(l=180))
    return titled(fig, f"Distinctive skills for {noc_short(occupation_scope)}",
                  "Skills most over-represented vs the whole market — what sets this occupation group apart")


def skill_occupation_heatmap(ds: DataSource) -> go.Figure:
    """What each occupation group requires: the most-requested skills (rows) by broad
    occupation group (columns), each column showing how that occupation's skill
    mentions split across the top skills (column-normalised)."""
    df = ds.skill_by_occupation(top=16)
    piv = df.pivot_table(index="skill_name", columns="noc_name", values="postings_total",
                         aggfunc="sum", fill_value=0.0)
    # order rows by total demand, columns by total demand — keeps the eye on the corner
    piv = piv.loc[piv.sum(axis=1).sort_values(ascending=False).index,
                  piv.sum(axis=0).sort_values(ascending=False).index]
    norm = piv.div(piv.sum(axis=0).replace(0, np.nan), axis=1) * 100  # column share
    fig = go.Figure(go.Heatmap(
        z=norm.values, x=list(norm.columns), y=list(norm.index),
        colorscale=SEQUENTIAL, colorbar=dict(title="% of group", ticksuffix="%"), xgap=1, ygap=1,
        hovertemplate="%{y} in %{x}: %{z:.0f}% of the group's top-skill mentions<extra></extra>"))
    fig.update_xaxes(title_text="", tickangle=-30)
    fig.update_layout(height=520, margin=dict(l=190, b=120))
    return titled(fig, "What each occupation group requires: skills × occupations",
                  "Column-normalised: each occupation's mentions of the top skills (latest month)")


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
