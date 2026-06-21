"""Occupations - what work is in demand, and how the mix is shifting."""

from __future__ import annotations

import numpy as np
import pandas as pd
import plotly.graph_objects as go
from plotly.subplots import make_subplots

from .. import compute as C
from ..datasource import BASE_YEAR, DataSource
from ..theme import (
    BRAND, CONTEXT, DIVERGING, MUTED, SEQUENTIAL, add_covid_band, add_reference_line,
)
from ._common import titled

_PROVISIONAL_FROM = pd.Timestamp("2025-01-01")
UP = "#2f6f77"
DOWN = "#b5523a"


def _stable_window() -> tuple[pd.Timestamp, pd.Timestamp]:
    return pd.Timestamp(f"{BASE_YEAR}-06-01"), _PROVISIONAL_FROM - pd.DateOffset(months=1)


def _short(label: str) -> str:
    return label.split("|")[0].strip() if "|" in label else label[:18]


def _real_groups(df: pd.DataFrame, col: str = "noc_label") -> pd.DataFrame:
    return df[~df[col].str.contains("Unknown", na=False)]


# --------------------------------------------------------------------------- CORE


def treemap(ds: DataSource) -> go.Figure:
    nb = ds.noc_broad
    cut = nb["month"].max() - pd.DateOffset(months=12)
    g = nb[nb["month"] > cut].groupby("noc_label", as_index=False)["postings_total"].sum()
    g["short"] = g["noc_label"].map(lambda s: s.split("|")[-1].strip())
    total = g["postings_total"].sum()
    labels = ["All occupations"] + g["short"].tolist()
    parents = [""] + ["All occupations"] * len(g)
    values = [total] + g["postings_total"].tolist()
    fig = go.Figure(go.Treemap(
        labels=labels, parents=parents, values=values, branchvalues="total",
        marker=dict(colors=[total] + g["postings_total"].tolist(), colorscale=SEQUENTIAL,
                    line=dict(width=1, color="white")),
        textinfo="label+value+percent root", maxdepth=2,
        hovertemplate="%{label}: %{value:,.0f} (%{percentRoot})<extra></extra>"))
    fig.update_layout(height=460, margin=dict(l=8, r=8, t=64, b=8))
    return titled(fig, "What work is in demand: occupation groups by volume",
                  "Area ∝ postings (last 12 months); click a tile to zoom")


def indexed_lines(ds: DataSource) -> go.Figure:
    nb = _real_groups(ds.noc_broad)
    idx = C.index_to_base(nb, "postings_total", BASE_YEAR, by="noc_label")
    latest = idx[idx["month"] == idx["month"].max()].set_index("noc_label")["index"]
    movers = latest.sort_values(ascending=False)
    highlight = set(list(movers.index[:2]) + list(movers.index[-1:]))
    fig = go.Figure()
    for lbl, sub in idx.groupby("noc_label"):
        on = lbl in highlight
        fig.add_trace(go.Scatter(
            x=sub["month"], y=sub["index"], name=_short(lbl),
            mode="lines", line=dict(color=BRAND if on else CONTEXT, width=2.6 if on else 1),
            opacity=1 if on else 0.5, showlegend=on,
            hovertemplate="%{x|%b %Y} · " + _short(lbl) + ": %{y:.0f}<extra></extra>"))
    add_reference_line(fig, 100, text=f"{BASE_YEAR}=100")
    add_covid_band(fig)
    fig.update_yaxes(title_text=f"index ({BASE_YEAR} = 100)")
    return titled(fig, "Which occupation groups grew fastest since 2019",
                  "Each group indexed to its 2019 average; fastest/slowest movers highlighted")


# --------------------------------------------------------------------------- DEEP


def contribution_bars(ds: DataSource) -> go.Figure:
    base, end = _stable_window()
    nb = _real_groups(ds.noc_broad)
    c = C.contribution_to_growth(nb, "noc_label", "postings_total", base, end)
    c["short"] = c["noc_label"].map(lambda s: s.split("|")[-1].strip())
    c = c.sort_values("contribution_pp")
    colors = np.where(c["contribution_pp"] >= 0, UP, DOWN)
    net = c["contribution_pp"].sum()
    fig = go.Figure(go.Bar(
        x=c["contribution_pp"], y=c["short"], orientation="h", marker_color=colors,
        hovertemplate="%{y}: %{x:+.1f} pp<extra></extra>"))
    add_reference_line(fig, 0)
    fig.add_annotation(xref="paper", yref="paper", x=0.98, y=0.04, showarrow=False,
                       text=f"net {net:+.1f} pp", font=dict(size=12, color=MUTED))
    fig.update_xaxes(title_text="contribution to total growth (pp)", ticksuffix=" pp")
    fig.update_layout(height=420)
    return titled(fig, f"What drove the change: contribution to growth, {BASE_YEAR}→{end.year}",
                  "Each group's share of the total change in postings; bars sum to the headline (accounting, not causation)")


def waterfall(ds: DataSource) -> go.Figure:
    base, end = _stable_window()
    nb = _real_groups(ds.noc_broad)
    c = C.contribution_to_growth(nb, "noc_label", "postings_total", base, end)
    c["short"] = c["noc_label"].map(lambda s: s.split("|")[-1].strip())
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
    b = nb[nb["month"] == base].set_index("noc_label")["postings_total"]
    e = nb[nb["month"] == end].set_index("noc_label")["postings_total"]
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


def bump_chart(ds: DataSource) -> go.Figure:
    nb = _real_groups(ds.noc_broad).copy()
    nb["year"] = nb["month"].dt.year
    ann = nb.groupby(["year", "noc_label"], as_index=False)["postings_total"].sum()
    ann = ann[ann["year"].between(2017, 2025)]
    ann["rank"] = ann.groupby("year")["postings_total"].rank(ascending=False, method="first")
    fig = go.Figure()
    last = ann[ann["year"] == ann["year"].max()].set_index("noc_label")["rank"]
    top = set(last.sort_values().index[:5])
    for lbl, sub in ann.groupby("noc_label"):
        on = lbl in top
        sub = sub.sort_values("year")
        fig.add_trace(go.Scatter(
            x=sub["year"], y=sub["rank"], mode="lines+markers", name=_short(lbl),
            line=dict(color=BRAND if on else CONTEXT, width=2.5 if on else 1.2),
            marker=dict(size=7 if on else 4), opacity=1 if on else 0.5, showlegend=on,
            hovertemplate="%{x} · " + _short(lbl) + ": rank %{y:.0f}<extra></extra>"))
    fig.update_yaxes(title_text="rank (1 = most postings)", autorange="reversed",
                     dtick=1)
    fig.update_layout(height=420)
    return titled(fig, "Rank journey: occupation groups by demand, 2017–2025",
                  "Lines that cross = groups that overtook one another; top-5 highlighted")


def noc_naics_heatmap(ds: DataSource) -> go.Figure:
    df = ds.noc_by_naics
    cut = df["month"].max() - pd.DateOffset(months=12)
    g = df[df["month"] > cut]
    g = g[~g["noc_label"].str.contains("Unknown") & ~g["naics_label"].str.contains("Unknown")]
    piv = g.pivot_table(index="noc_label", columns="naics_code", values="postings_total",
                        aggfunc="sum", fill_value=0.0)
    norm = piv.div(piv.sum(axis=0).replace(0, np.nan), axis=1) * 100  # column share
    ycols = [s[:30] for s in norm.index]
    fig = go.Figure(go.Heatmap(
        z=norm.values, x=list(norm.columns), y=ycols, colorscale=SEQUENTIAL,
        colorbar=dict(title="% of sector", ticksuffix="%"), xgap=1, ygap=1,
        hovertemplate="%{y} in NAICS %{x}: %{z:.0f}% of sector demand<extra></extra>"))
    fig.update_xaxes(title_text="industry sector (NAICS code)", type="category")
    fig.update_layout(height=460, margin=dict(l=190))
    return titled(fig, "Which sectors demand which occupations",
                  "Column-normalised: each industry's postings split across occupation groups (last 12 months)")


def concentration_trio(ds: DataSource) -> go.Figure:
    mk = ds.market
    # HHI over markets by month
    hhi_series = mk.groupby("month").apply(
        lambda d: C.hhi(d["postings_total"].values), include_groups=False)
    cut = mk["month"].max() - pd.DateOffset(months=12)
    latest_vals = mk[mk["month"] > cut].groupby("market_label")["postings_total"].sum().values
    pop, cum, gini = C.lorenz_curve(latest_vals)
    topk = C.topk_cumulative_share(latest_vals, k=20)

    fig = make_subplots(rows=1, cols=3, horizontal_spacing=0.085,
                        subplot_titles=("HHI over time (markets)",
                                        f"Lorenz curve (Gini {gini:.2f})",
                                        "Top-20 cumulative share"))
    fig.add_trace(go.Scatter(x=hhi_series.index, y=hhi_series.values, mode="lines",
                             line=dict(color=BRAND, width=2), showlegend=False,
                             hovertemplate="%{x|%b %Y}: HHI %{y:.3f}<extra></extra>"), row=1, col=1)
    fig.add_trace(go.Scatter(x=pop, y=cum, mode="lines", line=dict(color=BRAND, width=2.5),
                             showlegend=False, fill="tozeroy", fillcolor="rgba(207,119,48,0.12)",
                             hovertemplate="%{x:.0%} of markets → %{y:.0%} of demand<extra></extra>"),
                  row=1, col=2)
    fig.add_trace(go.Scatter(x=[0, 1], y=[0, 1], mode="lines",
                             line=dict(color=MUTED, width=1, dash="dash"), showlegend=False,
                             hoverinfo="skip"), row=1, col=2)
    fig.add_trace(go.Scatter(x=topk["rank"], y=topk["cum_share_pct"], mode="lines+markers",
                             line=dict(color=BRAND, width=2), marker=dict(size=4), showlegend=False,
                             hovertemplate="top %{x}: %{y:.0f}%<extra></extra>"), row=1, col=3)
    fig.update_yaxes(title_text="HHI", row=1, col=1)
    fig.update_xaxes(title_text="share of markets", tickformat=".0%", row=1, col=2)
    fig.update_yaxes(title_text="share of demand", tickformat=".0%", row=1, col=2)
    fig.update_xaxes(title_text="market rank", row=1, col=3)
    fig.update_yaxes(title_text="cumulative %", ticksuffix="%", row=1, col=3)
    fig.update_layout(height=360)
    for ann in fig.layout.annotations:
        ann.font.size = 12
    return titled(fig, "Is demand concentrating? Three views of market concentration",
                  "HHI trend · Lorenz inequality · top-20 markets' cumulative share")


def horizon_wall(ds: DataSource) -> go.Figure:
    nb = _real_groups(ds.noc_broad)
    idx = C.index_to_base(nb, "postings_total", BASE_YEAR, by="noc_label")
    groups = list(idx.groupby("noc_label"))
    n = len(groups)
    fig = make_subplots(rows=n, cols=1, shared_xaxes=True, vertical_spacing=0.012)
    band = 20.0  # index points per colour band; deviation from 100
    pos_shades = ["rgba(47,111,119,0.45)", "rgba(47,111,119,0.85)"]
    neg_shades = ["rgba(181,82,58,0.45)", "rgba(181,82,58,0.85)"]
    for r, (lbl, sub) in enumerate(groups, start=1):
        sub = sub.sort_values("month")
        dev = sub["index"] - 100
        for bi in range(2):
            lo = bi * band
            pos = np.clip(dev - lo, 0, band)
            fig.add_trace(go.Scatter(x=sub["month"], y=pos, mode="lines", line=dict(width=0),
                                     fill="tozeroy", fillcolor=pos_shades[bi], showlegend=False,
                                     hoverinfo="skip"), row=r, col=1)
            neg = np.clip(-dev - lo, 0, band)
            fig.add_trace(go.Scatter(x=sub["month"], y=neg, mode="lines", line=dict(width=0),
                                     fill="tozeroy", fillcolor=neg_shades[bi], showlegend=False,
                                     hoverinfo="skip"), row=r, col=1)
        fig.add_annotation(xref="paper", x=0, xanchor="right", y=band / 2, yref=f"y{r}" if r > 1 else "y",
                           text=_short(lbl), showarrow=False, font=dict(size=9, color=MUTED), xshift=-6)
        fig.update_yaxes(range=[0, band], showticklabels=False, showgrid=False, row=r, col=1)
    fig.update_layout(height=max(360, 42 * n), margin=dict(l=120, r=20, t=64, b=30))
    return titled(fig, "Horizon wall: every occupation group's trajectory in one screen",
                  "Each strip = deviation from its 2019 level, folded into colour bands (teal above, orange below)")
