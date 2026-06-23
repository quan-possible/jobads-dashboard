"""Occupations - what work is being posted, and how the mix is shifting."""

from __future__ import annotations

import numpy as np
import pandas as pd
import plotly.graph_objects as go

from .. import compute as C
from ..datasource import BASE_YEAR, DataSource
from ..theme import (
    BRAND, CONTEXT, MUTED, SEQUENTIAL, UP, DOWN,
    add_covid_band, add_reference_line,
)
from ._common import add_time_slider, titled, treemap_trace


def _window(base_year: int, end_year: int) -> tuple[pd.Timestamp, pd.Timestamp]:
    """Comparison window — June of the base year → December of the end year (the
    established convention), now driven by user-selectable years."""
    return pd.Timestamp(f"{base_year}-06-01"), pd.Timestamp(f"{end_year}-12-01")


def _real_groups(df: pd.DataFrame, col: str = "noc_name") -> pd.DataFrame:
    return df[~df[col].str.contains("Unknown", na=False)]


def _short_label(s: str) -> str:
    """Compact label: the text after the last '|' (drop the code prefix), but
    never blank — fall back to the full string when the split yields nothing."""
    tail = s.split("|")[-1].strip()
    return tail or s.strip()


# --------------------------------------------------------------------------- CORE


def treemap(ds: DataSource, animate: str | None = None, locale: str = "en") -> go.Figure:
    nb = ds.noc_broad
    if animate == "by-year":
        nb = nb.copy()
        nb["year"] = nb["month"].dt.year
        years = sorted(nb["year"].unique())
        agg = {y: nb[nb["year"] == y].groupby("noc_name", as_index=False)["postings_total"].sum()
               for y in years}
        frames = [go.Frame(name=str(y), data=[treemap_trace(agg[y], "noc_name", "All occupations")]) for y in years]
        fig = go.Figure(data=frames[-1].data, frames=frames)
        fr = locale == "fr"
        add_time_slider(fig, years, prefix="Année : " if fr else "Year: ",
                        play="▶ Lecture" if fr else "▶ Play")
        fig.update_layout(height=480, margin=dict(l=8, r=8, t=64, b=44))
        return titled(fig, "What work is posted most: occupation groups by volume",
                      "Area ∝ postings in the selected year — drag the slider or press play")
    cut = nb["month"].max() - pd.DateOffset(months=12)
    g = nb[nb["month"] > cut].groupby("noc_name", as_index=False)["postings_total"].sum()
    fig = go.Figure(treemap_trace(g, "noc_name", "All occupations"))
    fig.update_layout(height=460, margin=dict(l=8, r=8, t=64, b=8))
    return titled(fig, "What work is posted most: occupation groups by volume",
                  "Area ∝ postings (last 12 months); click a tile to zoom")


def indexed_lines(ds: DataSource, base_year: int = BASE_YEAR) -> go.Figure:
    nb = _real_groups(ds.noc_broad)
    idx = C.index_to_base(nb, "postings_total", base_year, by="noc_name")
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
    add_reference_line(fig, 100, text=f"{base_year}=100")
    add_covid_band(fig)
    fig.update_yaxes(title_text="index (base year = 100)")
    return titled(fig, "Which occupation groups grew fastest, indexed to a base year",
                  f"Each group indexed to its {base_year} average; fastest/slowest movers highlighted")


# --------------------------------------------------------------------------- DEEP


def contribution_bars(ds: DataSource, base_year: int = BASE_YEAR,
                      end_year: int | None = None) -> go.Figure:
    end_year = end_year if end_year is not None else ds.latest_complete_year
    base, end = _window(base_year, end_year)
    nb = _real_groups(ds.noc_broad)
    c = C.contribution_to_growth(nb, "noc_name", "postings_total", base, end)
    c["short"] = c["noc_name"].map(_short_label)
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
    return titled(fig, f"What drove the change: contribution to growth, {base_year}→{end_year}",
                  "Each group's share of the total change in postings; bars sum to the headline (accounting, not causation)")


def waterfall(ds: DataSource, base_year: int = BASE_YEAR,
              end_year: int | None = None) -> go.Figure:
    end_year = end_year if end_year is not None else ds.latest_complete_year
    base, end = _window(base_year, end_year)
    nb = _real_groups(ds.noc_broad)
    c = C.contribution_to_growth(nb, "noc_name", "postings_total", base, end)
    c["short"] = c["noc_name"].map(_short_label)
    c = c.sort_values("delta", ascending=False)
    base_total = c["base"].sum()
    end_total = c["end"].sum()
    measures = ["absolute"] + ["relative"] * len(c) + ["total"]
    x = [f"{base_year} total"] + c["short"].tolist() + [f"{end_year} total"]
    y = [base_total] + c["delta"].tolist() + [end_total]
    fig = go.Figure(go.Waterfall(
        orientation="v", measure=measures, x=x, y=y,
        decreasing=dict(marker=dict(color=DOWN)), increasing=dict(marker=dict(color=UP)),
        totals=dict(marker=dict(color="#345961")), connector=dict(line=dict(color=MUTED, width=1)),
        hovertemplate="%{x}: %{y:,.0f}<extra></extra>"))
    fig.update_yaxes(title_text="postings / month", rangemode="tozero")
    fig.update_xaxes(tickangle=-35)
    fig.update_layout(height=440)
    return titled(fig, f"Reconciling the change: {base_year} to {end_year}, group by group",
                  "Visual proof the parts sum to the whole — start, each group's delta, end")


def dumbbell(ds: DataSource, base_year: int = BASE_YEAR,
             end_year: int | None = None) -> go.Figure:
    end_year = end_year if end_year is not None else ds.latest_complete_year
    base, end = _window(base_year, end_year)
    nb = _real_groups(ds.noc_broad)
    b = nb[nb["month"] == base].set_index("noc_name")["postings_total"]
    e = nb[nb["month"] == end].set_index("noc_name")["postings_total"]
    df = pd.DataFrame({"base": b, "end": e}).dropna()
    df["short"] = [_short_label(s) for s in df.index]
    df = df.sort_values("end")
    fig = go.Figure()
    for _, r in df.iterrows():
        color = UP if r["end"] >= r["base"] else DOWN
        fig.add_trace(go.Scatter(x=[r["base"], r["end"]], y=[r["short"], r["short"]],
                                 mode="lines", line=dict(color=color, width=2.5),
                                 showlegend=False, hoverinfo="skip"))
    fig.add_trace(go.Scatter(x=df["base"], y=df["short"], mode="markers", name=str(base_year),
                             marker=dict(color=CONTEXT, size=9)))
    fig.add_trace(go.Scatter(x=df["end"], y=df["short"], mode="markers", name=str(end_year),
                             marker=dict(color=BRAND, size=9)))
    fig.update_xaxes(title_text="postings / month")
    fig.update_layout(height=440, margin=dict(b=92), legend=dict(y=-0.24))
    return titled(fig, f"Shift in postings by occupation group, {base_year} → {end_year}",
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
        hovertemplate="%{y} in %{customdata} (NAICS %{x}): %{z:.0f}% of sector postings<extra></extra>"))
    fig.update_xaxes(title_text="industry sector (NAICS code · hover for name)", type="category")
    fig.update_layout(height=460, margin=dict(l=190))
    return titled(fig, "Which occupations each sector posts",
                  "Column-normalised: each industry's postings split across occupation groups (last 12 months)")


def skill_churn(ds: DataSource, base_year: int = BASE_YEAR,
                end_year: int | None = None) -> go.Figure:
    """Which skills are entering vs leaving: the biggest national gainers and losers
    in *share of skill mentions* between two years. Share-based so a genuinely new
    skill surfaces without a small-base blow-up. Descriptive 'what's changing in the
    skill mix'; both years are selectable."""
    df = ds.skill_churn(base_year=base_year, end_year=end_year, top=11)
    end_year = int(end_year) if end_year is not None else ds.latest_complete_year
    colors = np.where(df["direction"].values == "rising", UP, DOWN)
    fig = go.Figure(go.Bar(
        x=df["share_delta_pp"], y=df["skill_name"], orientation="h", marker_color=colors,
        customdata=np.stack([df["base_share"], df["end_share"], df["end"]], axis=-1),
        hovertemplate="%{y}: %{x:+.2f} pp · "
                      + f"{base_year} " + "%{customdata[0]:.2f}%"
                      + f" → {end_year} " + "%{customdata[1]:.2f}%"
                      + " · %{customdata[2]:,.0f} postings<extra></extra>"))
    add_reference_line(fig, 0)
    fig.update_xaxes(title_text="change in share of skill mentions (pp)", ticksuffix=" pp")
    fig.update_layout(height=460, margin=dict(l=180))
    return titled(fig, f"Which skills are entering vs leaving, {base_year} → {end_year}",
                  "Biggest gainers (teal) and losers (orange) by change in share of skill mentions · skills with ≥150 mentions in either year")


def ai_exposure_scatter(ds: DataSource, base_year: int = BASE_YEAR,
                        end_year: int | None = None) -> go.Figure:
    """AI exposure vs posting change, by broad occupation group. The deepest cut:
    where is hiring moving relative to each group's task-based exposure to generative
    AI? Quadrants are descriptive, not predictive. Both years are selectable."""
    end_year = int(end_year) if end_year is not None else ds.latest_complete_year
    ex = ds.ai_exposure.set_index("noc_code")["exposure_beta"]
    nb = _real_groups(ds.noc_broad).copy()
    nb["year"] = nb["month"].dt.year
    b = nb[nb["year"] == base_year].groupby("noc_code")["postings_total"].mean()
    e = nb[nb["year"] == end_year].groupby("noc_code")["postings_total"].mean()
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
        hovertemplate="%{text}<br>exposure β %{x:.2f} · postings %{y:+.0f}% vs "
                      + str(base_year) + "<br>%{customdata:,.0f} postings (12 mo)<extra></extra>"))
    add_reference_line(fig, 0)
    fig.add_vline(x=float(df["beta"].median()), line=dict(color=MUTED, width=1, dash="dash"))
    fig.update_xaxes(title_text="AI exposure (β)")
    fig.update_yaxes(title_text="change in postings", ticksuffix="%")
    fig.update_layout(height=480, margin=dict(t=40))
    return titled(fig, "AI exposure vs postings: where hiring is moving",
                  "Eloundou et al. β (US task-based, mapped to NOC) vs posting change · bubble ∝ volume · right of the line = higher-exposure groups")
