"""Geography - where postings are, and how heavy they are relative to each region.

One authoritative province choropleth with a measure toggle (count / share /
per-capita / posting intensity), a ranked list, year-over-year momentum, a
city/CMA view, and a shift-share decomposition. Location quotient lives on as a
*measure* of the main map (postings vs labour-force share), not its own panel.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
import plotly.graph_objects as go

from .. import compute as C
from ..datasource import (
    BASE_YEAR, REGION_NAMES, DataSource,
    province_region_code, province_region_name,
)
from .._capctx import category_cap
from ..theme import BRAND, CONTEXT, DIVERGING, SEQUENTIAL
from ._common import add_time_slider, annual_means, titled


def _slider_chrome(locale: str) -> dict:
    fr = locale == "fr"
    return dict(prefix="Année : " if fr else "Year: ", play="▶ Lecture" if fr else "▶ Play")


def _last12(df: pd.DataFrame, value: str = "postings_total") -> pd.DataFrame:
    cut = df["month"].max() - pd.DateOffset(months=12)
    return df[df["month"] > cut]


def _window(base_year: int, end_year: int) -> tuple[pd.Timestamp, pd.Timestamp]:
    """Comparison endpoints for the year-over-year shift-share.

    Returns the ``{year}-12-01`` keys that select each year's *annual mean*
    (see ``annual_means``). Comparing annual averages — not a June-base vs
    December-end snapshot — keeps the comparison like-for-like and free of the
    within-year seasonal swing.
    """
    return pd.Timestamp(f"{base_year}-12-01"), pd.Timestamp(f"{end_year}-12-01")


# --------------------------------------------------------------------------- CORE


#: One authoritative map, four measures. Each entry: colorbar title, hover suffix,
#: a value formatter, the colour language, and the editorial frame.
_MEASURES = {
    "count": dict(cb="postings", scale=SEQUENTIAL, div=False, fmt=",.0f", suf="",
                  head="Where the postings are: by province",
                  sub="Raw posting count by year — big provinces dominate; switch to per-capita to compare intensity"),
    "share": dict(cb="% of national", scale=SEQUENTIAL, div=False, fmt=".1f", suf="%",
                  head="Share of national postings by province",
                  sub="Each province's share of all postings that year (normalised — the honest default for a choropleth)"),
    "percap": dict(cb="postings / 10k LF", scale=SEQUENTIAL, div=False, fmt=",.0f", suf="",
                   head="Posting intensity: postings per 10,000 in the labour force",
                   sub="Posting count ÷ provincial labour force (StatCan LFS 2024) — controls for province size"),
    "lq": dict(cb="posting LQ", scale=DIVERGING, div=True, fmt=".2f", suf="",
               head="Postings relative to workforce size: a province location quotient",
               sub="Posting share ÷ labour-force share · >1 (orange) = more job ads than its workforce share, 1 = on par"),
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
        # Fold to <=10 regions (the Atlantic provinces merge) so the choropleth
        # never carries more than ten distinct values. Sum postings and labour
        # force per region, compute the measure once, then broadcast the regional
        # value back onto each province shape so every region colours as a block.
        g["region"] = g["code"].map(province_region_code)
        g["lf"] = g["code"].map(lf)
        reg = g.groupby("region", as_index=False).agg(
            postings_total=("postings_total", "sum"), lf=("lf", "sum"))
        tot = reg["postings_total"].sum()
        if measure == "count":
            reg["z"] = reg["postings_total"]
        elif measure == "percap":
            reg["z"] = reg["postings_total"] / reg["lf"] * 10000
        elif measure == "lq":
            reg["z"] = (reg["postings_total"] / tot) / (reg["lf"] / lf_total)
        else:  # share
            reg["z"] = reg["postings_total"] / tot * 100
        reg["name"] = reg["region"].map(REGION_NAMES)
        return g.merge(reg[["region", "z", "name"]], on="region").dropna(subset=["z"])

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
    prov = _last12(ds.province).copy()
    # Fold the Atlantic provinces into one region so the list stays at <=10 bars
    # while the postings still sum to the national total.
    prov["province_name"] = prov["province_name"].map(province_region_name)
    prov = prov.groupby("province_name", as_index=False)["postings_total"].sum()
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


def cma_demand(ds: DataSource, top: int = 10, locale: str = "en") -> go.Figure:
    """City / CMA-level postings — finer than province. The largest metropolitan
    labour markets by posting volume over the last 12 months."""
    _non_metro = r"unknown market|rural area not in a cma"
    mk = _last12(ds.market)
    mk = mk[~mk["market_label"].str.contains(_non_metro, case=False, regex=True)]
    mk = mk.groupby("market_label", as_index=False)["postings_total"].sum()
    # Public view: top ``top`` markets. Team view: the 30 largest metros (the
    # full CMA/CA universe is ~160, mostly tiny agglomerations — a top-k either way).
    eff_top = category_cap(top, 30)
    mk = mk.sort_values("postings_total", ascending=False).head(eff_top).sort_values("postings_total")
    mk["prov"] = mk["market_label"].str.split("|").str[0].str.strip()
    mk["city"] = mk["market_label"].str.split("|").str[1].str.strip()
    if locale == "fr":
        mk["city"] = mk["city"].str.replace("(CMA)", "(RMR)", regex=False)
    # Disambiguate any city name shared by more than one province — the "Rural
    # area not in a CMA/CA" catch-all repeats per province — by suffixing the
    # province, so no two bars carry an identical tick label (S18).
    dup = mk["city"].duplicated(keep=False)
    mk["label"] = mk["city"].where(~dup, mk["city"] + " (" + mk["prov"] + ")")
    # One measure → one hue, with the leader highlighted (matching the province
    # ranked bars above). A province-categorical rainbow implies a grouping the
    # reader isn't being asked about (U07).
    n = len(mk)
    colors = [BRAND if i == n - 1 else CONTEXT for i in range(n)]
    fig = go.Figure(go.Bar(
        x=mk["postings_total"], y=mk["label"], orientation="h",
        marker_color=colors,
        customdata=mk["prov"],
        hovertemplate="%{y} (%{customdata}): %{x:,.0f} postings (12 mo)<extra></extra>"))
    fig.update_xaxes(title_text="postings (last 12 months)")
    fig.update_layout(height=520, margin=dict(l=170))
    shown = len(mk)
    return titled(fig, f"The biggest metropolitan labour markets (top {shown} CMAs)",
                  "City-level postings from the census-metropolitan-area cut — finer than the province totals above")


# --------------------------------------------------------------------------- DEEP


def shift_share_bars(ds: DataSource, base_year: int = BASE_YEAR,
                     end_year: int | None = None) -> go.Figure:
    end_year = end_year if end_year is not None else ds.latest_complete_year
    base, end = _window(base_year, end_year)
    # Fold the Atlantic provinces into one region (<=10 bars). Sum the member
    # provinces per occupation per month *before* averaging the year, so the
    # regional series is a true total, not a mean across provinces.
    src = ds.province_occupation.copy()
    src["province_name"] = src["province_name"].map(province_region_name)
    src = src.groupby(["province_name", "noc_label", "month"],
                      as_index=False)["postings_total"].sum()
    pa = annual_means(src, "postings_total", "province_name", "noc_label")
    ss = C.shift_share(pa, "province_name", "noc_label",
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
    return titled(fig, f"Why provinces grew or shrank: shift-share, {base_year}→{end_year}",
                  "Secondary cut. Accounting identity (not causation): national trend + occupation mix + local shift = actual change")


def _yoy_by_month(prov: pd.DataFrame, month: pd.Timestamp) -> pd.DataFrame:
    # Fold to <=10 regions: sum the member provinces' postings, take the regional
    # YoY, then broadcast it back onto each province shape (Atlantic reads as one).
    cur = prov[prov["month"] == month].copy()
    prev = prov[prov["month"] == month - pd.DateOffset(months=12)].copy()
    cur["region"] = cur["province_scope"].map(province_region_code)
    prev["region"] = prev["province_scope"].map(province_region_code)
    rc = cur.groupby("region")["postings_total"].sum()
    rp = prev.groupby("region")["postings_total"].sum()
    yoy = ((rc / rp - 1) * 100).dropna()
    codes = cur[["province_scope", "region"]].drop_duplicates().rename(columns={"province_scope": "code"})
    codes["yoy"] = codes["region"].map(yoy)
    codes["name"] = codes["region"].map(REGION_NAMES)
    return codes.dropna(subset=["yoy"])[["code", "yoy", "name"]]


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
        # For the latest year the data may not yet reach December, so label that
        # frame with the actual latest month present (e.g. "March 2026") instead
        # of implying December.
        prov2 = prov.copy()
        prov2["year"] = prov2["month"].dt.year
        decembers = [prov2[prov2["year"] == y]["month"].max() for y in sorted(prov2["year"].unique())]
        decembers = [m for m in decembers if not prov[prov["month"] == m - pd.DateOffset(months=12)].empty]
        last_m = decembers[-1]
        month_names = {
            1: "janvier", 2: "février", 3: "mars", 4: "avril", 5: "mai", 6: "juin",
            7: "juillet", 8: "août", 9: "septembre", 10: "octobre", 11: "novembre", 12: "décembre",
        }
        labels = [
            ((f"{month_names[m.month]} {m.year}" if locale == "fr" else m.strftime("%B %Y"))
             if m == last_m and m.month != 12 else str(m.year))
            for m in decembers
        ]
        frames = [go.Frame(name=lbl, data=[_trace(_yoy_by_month(prov, m), with_geo=False)])
                  for lbl, m in zip(labels, decembers)]
        fig = go.Figure(data=[_trace(_yoy_by_month(prov, decembers[-1]), with_geo=True)], frames=frames)
        fig.update_geos(fitbounds="locations", visible=False)
        slider = _slider_chrome(locale)
        if labels and not labels[-1].isdigit():
            slider["prefix"] = "Date : " if locale == "fr" else "Date: "
        add_time_slider(fig, labels, **slider)
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
    """Provincial AI exposure: each province's posting-weighted average of broad-NOC
    task exposure (Eloundou β). Provinces whose postings lean to office/knowledge work
    score higher; those leaning to trades/resources score lower."""
    po = _last12(ds.province_occupation).copy()
    ex = ds.ai_exposure.set_index("noc_code")["exposure_beta"]
    po = po.assign(beta=po["noc_code"].map(ex)).dropna(subset=["beta"])
    # Fold to <=10 regions: the posting-weighted exposure is computed over each
    # region's pooled postings, then broadcast onto its member province shapes.
    po["region"] = po["province_scope"].map(province_region_code)
    reg = po.groupby("region").apply(
        lambda d: np.average(d["beta"], weights=d["postings_total"]), include_groups=False)
    codes = po[["province_scope", "region"]].drop_duplicates().rename(columns={"province_scope": "code"})
    codes["z"] = codes["region"].map(reg)
    codes["name"] = codes["region"].map(REGION_NAMES)
    df = codes.dropna(subset=["z"])
    fig = go.Figure(go.Choropleth(
        geojson=ds.geojson, locations=df["code"], z=df["z"], featureidkey="properties.code",
        colorscale=SEQUENTIAL, marker_line_color="white", marker_line_width=0.6,
        colorbar=dict(title="mean AI exposure (β)"), text=df["name"],
        hovertemplate="%{text}: mean exposure β %{z:.3f}<extra></extra>"))
    fig.update_geos(fitbounds="locations", visible=False)
    fig.update_layout(height=460, margin=dict(l=10, r=10, t=64, b=10))
    return titled(fig, "AI exposure of provincial postings",
                  "Posting-weighted mean of broad-NOC task exposure (Eloundou β) · a potential-exposure signal, not realized automation")
