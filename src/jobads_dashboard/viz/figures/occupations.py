"""Occupations - what work is in demand, and how the mix is shifting."""

from __future__ import annotations

import numpy as np
import pandas as pd
import plotly.graph_objects as go

from .. import compute as C
from ..datasource import BASE_YEAR, DataSource
from ..theme import (
    BRAND, CONTEXT, MUTED, SEQUENTIAL, add_covid_band, add_reference_line,
)
from ._common import add_time_slider, titled

_PROVISIONAL_FROM = pd.Timestamp("2025-01-01")
UP = "#2f6f77"
DOWN = "#b5523a"


def _stable_window() -> tuple[pd.Timestamp, pd.Timestamp]:
    return pd.Timestamp(f"{BASE_YEAR}-06-01"), _PROVISIONAL_FROM - pd.DateOffset(months=1)


def _real_groups(df: pd.DataFrame, col: str = "noc_name") -> pd.DataFrame:
    return df[~df[col].str.contains("Unknown", na=False)]


# --------------------------------------------------------------------------- CORE


def _treemap_trace(g: pd.DataFrame, root: str = "All occupations") -> go.Treemap:
    g = g.copy()
    g["short"] = g["noc_name"].map(lambda s: s.split("|")[-1].strip())
    total = g["postings_total"].sum()
    return go.Treemap(
        labels=[root] + g["short"].tolist(),
        parents=[""] + [root] * len(g),
        values=[total] + g["postings_total"].tolist(), branchvalues="total",
        marker=dict(colors=[total] + g["postings_total"].tolist(), colorscale=SEQUENTIAL,
                    line=dict(width=1, color="white")),
        textinfo="label+value+percent root", maxdepth=2,
        hovertemplate="%{label}: %{value:,.0f} (%{percentRoot})<extra></extra>")


def treemap(ds: DataSource, animate: str | None = None, locale: str = "en") -> go.Figure:
    nb = ds.noc_broad
    if animate == "by-year":
        nb = nb.copy()
        nb["year"] = nb["month"].dt.year
        years = sorted(nb["year"].unique())
        agg = {y: nb[nb["year"] == y].groupby("noc_name", as_index=False)["postings_total"].sum()
               for y in years}
        frames = [go.Frame(name=str(y), data=[_treemap_trace(agg[y])]) for y in years]
        fig = go.Figure(data=frames[-1].data, frames=frames)
        fr = locale == "fr"
        add_time_slider(fig, years, prefix="Année : " if fr else "Year: ",
                        play="▶ Lecture" if fr else "▶ Play")
        fig.update_layout(height=480, margin=dict(l=8, r=8, t=64, b=44))
        return titled(fig, "What work is in demand: occupation groups by volume",
                      "Area ∝ postings in the selected year — drag the slider or press play")
    cut = nb["month"].max() - pd.DateOffset(months=12)
    g = nb[nb["month"] > cut].groupby("noc_name", as_index=False)["postings_total"].sum()
    fig = go.Figure(_treemap_trace(g))
    fig.update_layout(height=460, margin=dict(l=8, r=8, t=64, b=8))
    return titled(fig, "What work is in demand: occupation groups by volume",
                  "Area ∝ postings (last 12 months); click a tile to zoom")


def indexed_lines(ds: DataSource) -> go.Figure:
    nb = _real_groups(ds.noc_broad)
    idx = C.index_to_base(nb, "postings_total", BASE_YEAR, by="noc_name")
    latest = idx[idx["month"] == idx["month"].max()].set_index("noc_name")["index"]
    movers = latest.sort_values(ascending=False)
    highlight = set(list(movers.index[:2]) + list(movers.index[-1:]))
    fig = go.Figure()
    for lbl, sub in idx.groupby("noc_name"):
        on = lbl in highlight
        fig.add_trace(go.Scatter(
            x=sub["month"], y=sub["index"], name=lbl,
            mode="lines", line=dict(color=BRAND if on else CONTEXT, width=2.6 if on else 1),
            opacity=1 if on else 0.5, showlegend=on,
            hovertemplate="%{x|%b %Y} · " + lbl + ": %{y:.0f}<extra></extra>"))
    add_reference_line(fig, 100, text=f"{BASE_YEAR}=100")
    add_covid_band(fig)
    fig.update_yaxes(title_text=f"index ({BASE_YEAR} = 100)")
    return titled(fig, "Which occupation groups grew fastest since 2019",
                  "Each group indexed to its 2019 average; fastest/slowest movers highlighted")


# --------------------------------------------------------------------------- DEEP


def contribution_bars(ds: DataSource) -> go.Figure:
    base, end = _stable_window()
    nb = _real_groups(ds.noc_broad)
    c = C.contribution_to_growth(nb, "noc_name", "postings_total", base, end)
    c["short"] = c["noc_name"].map(lambda s: s.split("|")[-1].strip())
    c = c.sort_values("contribution_pp")
    colors = np.where(c["contribution_pp"] >= 0, UP, DOWN)
    net = c["contribution_pp"].sum()
    fig = go.Figure(go.Bar(
        x=c["contribution_pp"], y=c["short"], orientation="h", marker_color=colors,
        hovertemplate="%{y}: %{x:+.1f} pp<extra></extra>"))
    add_reference_line(fig, 0)
    fig.add_annotation(xref="paper", yref="paper", x=0.98, y=0.96, showarrow=False,
                       text=f"net {net:+.1f} pp", font=dict(size=12, color=MUTED))
    fig.update_xaxes(title_text="contribution to total growth (pp)", ticksuffix=" pp")
    fig.update_layout(height=420)
    return titled(fig, f"What drove the change: contribution to growth, {BASE_YEAR}→{end.year}",
                  "Each group's share of the total change in postings; bars sum to the headline (accounting, not causation)")


def waterfall(ds: DataSource) -> go.Figure:
    base, end = _stable_window()
    nb = _real_groups(ds.noc_broad)
    c = C.contribution_to_growth(nb, "noc_name", "postings_total", base, end)
    c["short"] = c["noc_name"].map(lambda s: s.split("|")[-1].strip())
    c = c.sort_values("delta", ascending=False)
    base_total = c["base"].sum()
    end_total = c["end"].sum()
    measures = ["absolute"] + ["relative"] * len(c) + ["total"]
    x = [f"{BASE_YEAR} total"] + c["short"].tolist() + [f"{end.year} total"]
    y = [base_total] + c["delta"].tolist() + [end_total]
    fig = go.Figure(go.Waterfall(
        orientation="v", measure=measures, x=x, y=y,
        decreasing=dict(marker=dict(color=DOWN)), increasing=dict(marker=dict(color=UP)),
        totals=dict(marker=dict(color="#345961")), connector=dict(line=dict(color=MUTED, width=1)),
        hovertemplate="%{x}: %{y:,.0f}<extra></extra>"))
    fig.update_yaxes(title_text="postings / month", rangemode="tozero")
    fig.update_xaxes(tickangle=-35)
    fig.update_layout(height=440)
    return titled(fig, f"Reconciling the change: {BASE_YEAR} to {end.year}, group by group",
                  "Visual proof the parts sum to the whole — start, each group's delta, end")


def dumbbell(ds: DataSource) -> go.Figure:
    base, end = _stable_window()
    nb = _real_groups(ds.noc_broad)
    b = nb[nb["month"] == base].set_index("noc_name")["postings_total"]
    e = nb[nb["month"] == end].set_index("noc_name")["postings_total"]
    df = pd.DataFrame({"base": b, "end": e}).dropna()
    df["short"] = [s.split("|")[-1].strip() for s in df.index]
    df = df.sort_values("end")
    fig = go.Figure()
    for _, r in df.iterrows():
        color = UP if r["end"] >= r["base"] else DOWN
        fig.add_trace(go.Scatter(x=[r["base"], r["end"]], y=[r["short"], r["short"]],
                                 mode="lines", line=dict(color=color, width=2.5),
                                 showlegend=False, hoverinfo="skip"))
    fig.add_trace(go.Scatter(x=df["base"], y=df["short"], mode="markers", name=str(BASE_YEAR),
                             marker=dict(color=CONTEXT, size=9)))
    fig.add_trace(go.Scatter(x=df["end"], y=df["short"], mode="markers", name=str(end.year),
                             marker=dict(color=BRAND, size=9)))
    fig.update_xaxes(title_text="postings / month")
    fig.update_layout(height=440, margin=dict(b=92), legend=dict(y=-0.24))
    return titled(fig, f"Shift in demand by occupation group, {BASE_YEAR} → {end.year}",
                  "Each line connects the two periods; colour shows direction")


def noc_naics_heatmap(ds: DataSource) -> go.Figure:
    df = ds.noc_by_naics
    cut = df["month"].max() - pd.DateOffset(months=12)
    g = df[df["month"] > cut]
    g = g[~g["noc_name"].str.contains("Unknown") & ~g["naics_name"].str.contains("Unknown")]
    piv = g.pivot_table(index="noc_name", columns="naics_code", values="postings_total",
                        aggfunc="sum", fill_value=0.0)
    norm = piv.div(piv.sum(axis=0).replace(0, np.nan), axis=1) * 100  # column share
    # full sector name on hover (the x tick stays a compact NAICS code)
    code2name = dict(zip(g["naics_code"], g["naics_name"]))
    sector_names = [code2name.get(c, c) for c in norm.columns]
    customdata = np.tile(sector_names, (len(norm.index), 1))
    fig = go.Figure(go.Heatmap(
        z=norm.values, x=list(norm.columns), y=list(norm.index), customdata=customdata,
        colorscale=SEQUENTIAL, colorbar=dict(title="% of sector", ticksuffix="%"), xgap=1, ygap=1,
        hovertemplate="%{y} in %{customdata} (NAICS %{x}): %{z:.0f}% of sector demand<extra></extra>"))
    fig.update_xaxes(title_text="industry sector (NAICS code · hover for name)", type="category")
    fig.update_layout(height=460, margin=dict(l=190))
    return titled(fig, "Which sectors demand which occupations",
                  "Column-normalised: each industry's postings split across occupation groups (last 12 months)")


def skill_churn(ds: DataSource) -> go.Figure:
    """Which skills are entering vs leaving demand: the biggest national risers and
    fallers in posting volume since 2019. Descriptive 'what's changing in the skill
    mix', now readable because skill codes carry their reference labels."""
    df = ds.skill_churn(base_year=BASE_YEAR, end_year=2024, top=11)
    df = df.copy()
    df["growth_pct"] = df["growth_pct"].clip(upper=300)  # cap runaway small-base risers for readability
    colors = np.where(df["direction"].values == "rising", UP, DOWN)
    fig = go.Figure(go.Bar(
        x=df["growth_pct"], y=df["skill_name"], orientation="h", marker_color=colors,
        customdata=df["end"],
        hovertemplate="%{y}: %{x:+.0f}% vs 2019 · %{customdata:,.0f} postings (2024)<extra></extra>"))
    add_reference_line(fig, 0)
    fig.update_xaxes(title_text="change in demand vs 2019", ticksuffix="%")
    fig.update_layout(height=460, margin=dict(l=180))
    return titled(fig, "Which skills are entering vs leaving demand, 2019 → 2024",
                  "Top risers (teal) and fallers (orange) by change in posting volume · skills with ≥150 postings in 2019")


def ai_exposure_scatter(ds: DataSource) -> go.Figure:
    """AI exposure vs demand change, by broad occupation group. The deepest cut:
    where is hiring demand moving relative to each group's task-based exposure to
    generative AI? Quadrants are descriptive, not predictive."""
    ex = ds.ai_exposure.set_index("noc_code")["exposure_beta"]
    nb = _real_groups(ds.noc_broad).copy()
    nb["year"] = nb["month"].dt.year
    b = nb[nb["year"] == BASE_YEAR].groupby("noc_code")["postings_total"].mean()
    e = nb[nb["year"] == 2024].groupby("noc_code")["postings_total"].mean()
    chg = (e / b - 1) * 100
    cut = nb["month"].max() - pd.DateOffset(months=12)
    vol = nb[nb["month"] > cut].groupby("noc_code")["postings_total"].sum()
    name = nb.groupby("noc_code")["noc_name"].first()
    df = pd.DataFrame({"beta": ex, "chg": chg, "vol": vol, "name": name}).dropna()
    colors = np.where(df["chg"] >= 0, UP, DOWN)
    fig = go.Figure(go.Scatter(
        x=df["beta"], y=df["chg"], mode="markers+text", text=df["name"],
        textposition="top center", textfont=dict(size=9, color=MUTED),
        marker=dict(size=np.sqrt(df["vol"]) / np.sqrt(df["vol"]).max() * 46 + 10,
                    color=colors, opacity=0.85, line=dict(width=1, color="white")),
        customdata=df["vol"],
        hovertemplate="%{text}<br>exposure β %{x:.2f} · demand %{y:+.0f}% vs 2019"
                      "<br>%{customdata:,.0f} postings (12 mo)<extra></extra>"))
    add_reference_line(fig, 0)
    fig.add_vline(x=float(df["beta"].median()), line=dict(color=MUTED, width=1, dash="dash"))
    fig.update_xaxes(title_text="AI exposure (β)")
    fig.update_yaxes(title_text="change in demand vs 2019", ticksuffix="%")
    fig.update_layout(height=480, margin=dict(t=40))
    return titled(fig, "AI exposure vs demand: where hiring is moving",
                  "Eloundou et al. β (US task-based, mapped to NOC) vs demand change · bubble ∝ volume · right of the line = higher-exposure groups")
