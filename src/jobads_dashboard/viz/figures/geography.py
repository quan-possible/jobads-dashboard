"""Geography - where demand is, and how heavy it is relative to each region.

One authoritative province choropleth with a measure toggle (count / share /
per-capita / demand intensity), a ranked list, year-over-year momentum, a
city/CMA view, and a shift-share decomposition. Location quotient lives on as a
*measure* of the main map (demand vs labour-force share), not its own panel.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
import plotly.graph_objects as go

from .. import compute as C
from ..datasource import BASE_YEAR, PROVINCE_NAMES, DataSource
from ..theme import BRAND, CONTEXT, DIVERGING, PROVISIONAL_FROM, SEQUENTIAL
from ._common import add_time_slider, titled


def _slider_chrome(locale: str) -> dict:
    fr = locale == "fr"
    return dict(prefix="Année : " if fr else "Year: ", play="▶ Lecture" if fr else "▶ Play")


def _last12(df: pd.DataFrame, value: str = "postings_total") -> pd.DataFrame:
    cut = df["month"].max() - pd.DateOffset(months=12)
    return df[df["month"] > cut]


def _stable_window() -> tuple[pd.Timestamp, pd.Timestamp]:
    return pd.Timestamp(f"{BASE_YEAR}-06-01"), PROVISIONAL_FROM - pd.DateOffset(months=1)


# --------------------------------------------------------------------------- CORE


#: One authoritative map, four measures. Each entry: colorbar title, hover suffix,
#: a value formatter, the colour language, and the editorial frame.
_MEASURES = {
    "count": dict(cb="postings", scale=SEQUENTIAL, div=False, fmt=",.0f", suf="",
                  head="Where the demand is: postings by province",
                  sub="Raw posting count by year — big provinces dominate; switch to per-capita to compare intensity"),
    "share": dict(cb="% of national", scale=SEQUENTIAL, div=False, fmt=".1f", suf="%",
                  head="Share of national demand by province",
                  sub="Each province's share of all postings that year (normalised — the honest default for a choropleth)"),
    "percap": dict(cb="postings / 10k LF", scale=SEQUENTIAL, div=False, fmt=",.0f", suf="",
                   head="Demand intensity: postings per 10,000 in the labour force",
                   sub="Posting count ÷ provincial labour force (StatCan LFS 2024) — controls for province size"),
    "lq": dict(cb="demand LQ", scale=DIVERGING, div=True, fmt=".2f", suf="",
               head="Demand relative to workforce size: a province location quotient",
               sub="Posting share ÷ labour-force share · >1 (orange) = more job-ad demand than its workforce share, 1 = on par"),
}


def demand_map(ds: DataSource, measure: str = "share", animate: str | None = "by-year",
               locale: str = "en") -> go.Figure:
    """The authoritative province choropleth. ``measure`` selects what the fill
    shows; the year slider scrubs through time. The frames omit the geojson (it
    rides on the base trace) so the payload stays small."""
    spec = _MEASURES.get(measure, _MEASURES["share"])
    prov = ds.province.copy()
    prov["year"] = prov["month"].dt.year
    years = sorted(prov["year"].unique())
    lf = ds.province_labour_force.set_index("code")["labour_force"]
    lf_total = float(lf.sum())

    def _z(year: int) -> pd.DataFrame:
        g = (prov[prov["year"] == year].groupby("province_scope", as_index=False)["postings_total"].sum()
             .rename(columns={"province_scope": "code"}))
        tot = g["postings_total"].sum()
        if measure == "count":
            g["z"] = g["postings_total"]
        elif measure == "percap":
            g["z"] = g["postings_total"] / g["code"].map(lf) * 10000
        elif measure == "lq":
            g["z"] = (g["postings_total"] / tot) / (g["code"].map(lf) / lf_total)
        else:  # share
            g["z"] = g["postings_total"] / tot * 100
        g["name"] = g["code"].map(PROVINCE_NAMES)
        return g.dropna(subset=["z"])

    def _trace(g: pd.DataFrame, *, with_geo: bool) -> go.Choropleth:
        kw = dict(locations=g["code"], z=g["z"], featureidkey="properties.code",
                  colorscale=spec["scale"], marker_line_color="white", marker_line_width=0.6,
                  colorbar=dict(title=spec["cb"], ticksuffix=spec["suf"]), text=g["name"],
                  hovertemplate="%{text}: %{z:" + spec["fmt"] + "}" + spec["suf"] + "<extra></extra>")
        if spec["div"]:
            kw.update(zmid=1.0, zmin=0, zmax=2)
        if with_geo:
            kw["geojson"] = ds.geojson
        return go.Choropleth(**kw)

    if animate == "by-year":
        frames = [go.Frame(name=str(y), data=[_trace(_z(y), with_geo=False)]) for y in years]
        fig = go.Figure(data=[_trace(_z(years[-1]), with_geo=True)], frames=frames)
        fig.update_geos(fitbounds="locations", visible=False)
        add_time_slider(fig, years, **_slider_chrome(locale))
        fig.update_layout(height=480, margin=dict(l=10, r=10, t=10, b=44))
        return titled(fig, spec["head"], spec["sub"])

    g = _z(years[-1])
    fig = go.Figure(_trace(g, with_geo=True))
    fig.update_geos(fitbounds="locations", visible=False)
    fig.update_layout(height=460, margin=dict(l=10, r=10, t=64, b=10))
    return titled(fig, spec["head"], spec["sub"])


def ranked_provinces(ds: DataSource) -> go.Figure:
    prov = _last12(ds.province).groupby("province_name", as_index=False)["postings_total"].sum()
    prov = prov.sort_values("postings_total")
    colors = [BRAND if i == len(prov) - 1 else CONTEXT for i in range(len(prov))]
    fig = go.Figure(go.Bar(
        x=prov["postings_total"], y=prov["province_name"], orientation="h",
        marker_color=colors, text=prov["postings_total"].map(lambda v: f"{v:,.0f}"),
        textposition="auto", hovertemplate="%{y}: %{x:,.0f}<extra></extra>"))
    fig.update_xaxes(title_text="postings (last 12 months)")
    fig.update_layout(height=420)
    return titled(fig, "Ranked: provinces by posting volume",
                  "The list carries the precise ranking the map cannot")


def cma_demand(ds: DataSource, top: int = 18) -> go.Figure:
    """City / CMA-level demand — finer than province. The largest metropolitan
    labour markets by posting volume over the last 12 months."""
    mk = _last12(ds.market).groupby("market_label", as_index=False)["postings_total"].sum()
    mk = mk.sort_values("postings_total", ascending=False).head(top).sort_values("postings_total")
    # province prefix ("ON | Toronto (CMA)") colours the bar; keep the city name on the tick
    mk["prov"] = mk["market_label"].str.split("|").str[0].str.strip()
    mk["city"] = mk["market_label"].str.split("|").str[1].str.strip()
    palette = {p: c for p, c in zip(sorted(mk["prov"].unique()),
                                    (SEQUENTIAL[1][1], BRAND, "#345961", "#7b6b8d", "#55754e",
                                     "#a64d3f", "#6e8790", "#c39e80", "#041c2c"))}
    fig = go.Figure(go.Bar(
        x=mk["postings_total"], y=mk["city"], orientation="h",
        marker_color=[palette.get(p, CONTEXT) for p in mk["prov"]],
        customdata=mk["prov"],
        hovertemplate="%{y} (%{customdata}): %{x:,.0f} postings (12 mo)<extra></extra>"))
    fig.update_xaxes(title_text="postings (last 12 months)")
    fig.update_layout(height=520, margin=dict(l=170))
    return titled(fig, f"The biggest metropolitan labour markets (top {top} CMAs)",
                  "City-level demand from the census-metropolitan-area cut — finer than the province totals above")


# --------------------------------------------------------------------------- DEEP


def shift_share_bars(ds: DataSource) -> go.Figure:
    base, end = _stable_window()
    ss = C.shift_share(ds.province_occupation, "province_name", "noc_label",
                       "postings_total", base, end)
    ss = ss.sort_values("actual_change")
    fig = go.Figure()
    comps = [("national_share", "National trend", CONTEXT),
             ("industry_mix", "Occupation mix", "#7b6b8d"),
             ("competitive_shift", "Local (competitive)", BRAND)]
    for col, name, color in comps:
        fig.add_trace(go.Bar(y=ss["province_name"], x=ss[col], name=name, orientation="h",
                             marker_color=color,
                             hovertemplate="%{y} · " + name + ": %{x:,.0f}<extra></extra>"))
    fig.add_trace(go.Scatter(y=ss["province_name"], x=ss["actual_change"], name="Actual change",
                             mode="markers", marker=dict(symbol="diamond", size=9, color="#132330"),
                             hovertemplate="%{y} · actual: %{x:,.0f}<extra></extra>"))
    fig.update_layout(barmode="relative", height=460, margin=dict(b=96),
                      legend=dict(y=-0.26))
    fig.update_xaxes(title_text="change in postings, decomposed")
    return titled(fig, f"Why provinces grew or shrank: shift-share, {BASE_YEAR}→{end.year}",
                  "Secondary cut. Accounting identity (not causation): national trend + occupation mix + local shift = actual change")


def _yoy_by_month(prov: pd.DataFrame, month: pd.Timestamp) -> pd.DataFrame:
    cur = prov[prov["month"] == month].set_index("province_scope")["postings_total"]
    prev = prov[prov["month"] == month - pd.DateOffset(months=12)].set_index("province_scope")["postings_total"]
    yoy = ((cur / prev - 1) * 100).dropna()
    df = pd.DataFrame({"code": yoy.index, "yoy": yoy.values})
    df["name"] = df["code"].map(PROVINCE_NAMES)
    return df


def yoy_choropleth(ds: DataSource, animate: str | None = None, locale: str = "en") -> go.Figure:
    prov = ds.province

    def _trace(df: pd.DataFrame, *, with_geo: bool) -> go.Choropleth:
        # Fixed symmetric range so the colour reads consistently across frames.
        kw = dict(locations=df["code"], z=df["yoy"], featureidkey="properties.code",
                  colorscale=DIVERGING, zmid=0.0, zmin=-40, zmax=40,
                  marker_line_color="white", marker_line_width=0.6,
                  colorbar=dict(title="YoY %", ticksuffix="%"), text=df["name"],
                  hovertemplate="%{text}: %{z:+.1f}% YoY<extra></extra>")
        if with_geo:
            kw["geojson"] = ds.geojson
        return go.Choropleth(**kw)

    if animate == "by-year":
        # One frame per December (a stable annual YoY read), most recent last.
        prov2 = prov.copy()
        prov2["year"] = prov2["month"].dt.year
        decembers = [prov2[prov2["year"] == y]["month"].max() for y in sorted(prov2["year"].unique())]
        decembers = [m for m in decembers if not prov[prov["month"] == m - pd.DateOffset(months=12)].empty]
        labels = [str(m.year) for m in decembers]
        frames = [go.Frame(name=lbl, data=[_trace(_yoy_by_month(prov, m), with_geo=False)])
                  for lbl, m in zip(labels, decembers)]
        fig = go.Figure(data=[_trace(_yoy_by_month(prov, decembers[-1]), with_geo=True)], frames=frames)
        fig.update_geos(fitbounds="locations", visible=False)
        add_time_slider(fig, labels, **_slider_chrome(locale))
        fig.update_layout(height=480, margin=dict(l=10, r=10, t=10, b=44))
        return titled(fig, "Momentum: year-over-year change by province",
                      "Diverging fill pinned at 0 — orange growing, teal cooling. Drag the slider or press play to move through time.")

    df = _yoy_by_month(prov, prov["month"].max())
    fig = go.Figure(_trace(df, with_geo=True))
    fig.update_geos(fitbounds="locations", visible=False)
    fig.update_layout(height=460, margin=dict(l=10, r=10, t=64, b=10))
    return titled(fig, "Momentum: year-over-year change by province (provisional)",
                  "Diverging fill pinned at 0 — orange growing, teal cooling. Latest month is provisional")


def ai_exposure_map(ds: DataSource) -> go.Figure:
    """Provincial AI exposure: each province's demand-weighted average of broad-NOC
    task exposure (Eloundou β). Provinces whose demand leans to office/knowledge work
    score higher; those leaning to trades/resources score lower."""
    po = _last12(ds.province_occupation).copy()
    ex = ds.ai_exposure.set_index("noc_code")["exposure_beta"]
    po = po.assign(beta=po["noc_code"].map(ex)).dropna(subset=["beta"])
    prov = po.groupby("province_scope").apply(
        lambda d: np.average(d["beta"], weights=d["postings_total"]), include_groups=False)
    df = pd.DataFrame({"code": prov.index, "z": prov.values})
    df["name"] = df["code"].map(PROVINCE_NAMES)
    fig = go.Figure(go.Choropleth(
        geojson=ds.geojson, locations=df["code"], z=df["z"], featureidkey="properties.code",
        colorscale=SEQUENTIAL, marker_line_color="white", marker_line_width=0.6,
        colorbar=dict(title="mean AI exposure (β)"), text=df["name"],
        hovertemplate="%{text}: mean exposure β %{z:.3f}<extra></extra>"))
    fig.update_geos(fitbounds="locations", visible=False)
    fig.update_layout(height=460, margin=dict(l=10, r=10, t=64, b=10))
    return titled(fig, "AI exposure of provincial demand",
                  "Demand-weighted mean of broad-NOC task exposure (Eloundou β) · a potential-exposure signal, not realized automation")
