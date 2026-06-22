"""Geography - where demand is, and what each region is known for."""

from __future__ import annotations

import numpy as np
import pandas as pd
import plotly.graph_objects as go

from .. import compute as C
from ..datasource import BASE_YEAR, PROVINCE_CENTROID, PROVINCE_NAMES, DataSource
from ..labels import NOC_SHORT, noc_short
from ..theme import BRAND, CONTEXT, DIVERGING, MUTED, SEQUENTIAL
from ._common import add_time_slider, titled


def _slider_chrome(locale: str) -> dict:
    fr = locale == "fr"
    return dict(prefix="Année : " if fr else "Year: ", play="▶ Lecture" if fr else "▶ Play")

_PROVISIONAL_FROM = pd.Timestamp("2025-01-01")


def _last12(df: pd.DataFrame, value: str = "postings_total") -> pd.DataFrame:
    cut = df["month"].max() - pd.DateOffset(months=12)
    return df[df["month"] > cut]


def _stable_window() -> tuple[pd.Timestamp, pd.Timestamp]:
    return pd.Timestamp(f"{BASE_YEAR}-06-01"), _PROVISIONAL_FROM - pd.DateOffset(months=1)


# --------------------------------------------------------------------------- CORE


def bubble_map(ds: DataSource) -> go.Figure:
    prov = _last12(ds.province).groupby(["province_scope", "province_name"], as_index=False)["postings_total"].sum()
    prov["lon"] = prov["province_scope"].map(lambda c: PROVINCE_CENTROID.get(c, (None, None))[0])
    prov["lat"] = prov["province_scope"].map(lambda c: PROVINCE_CENTROID.get(c, (None, None))[1])
    prov = prov.dropna(subset=["lon", "lat"])
    fig = go.Figure(go.Scattergeo(
        lon=prov["lon"], lat=prov["lat"], text=prov["province_name"],
        marker=dict(size=prov["postings_total"], sizemode="area",
                    sizeref=2.0 * prov["postings_total"].max() / (55 ** 2), sizemin=4,
                    color=BRAND, opacity=0.8, line=dict(width=0.6, color="white")),
        customdata=prov[["postings_total"]],
        hovertemplate="%{text}: %{customdata[0]:,.0f} postings (12 mo)<extra></extra>"))
    fig.update_geos(scope="north america", fitbounds="locations", visible=False,
                    showland=True, landcolor="#f1ece6", showcountries=True, countrycolor="#dcd3c9")
    fig.update_layout(height=460, margin=dict(l=10, r=10, t=64, b=10))
    return titled(fig, "Where the demand is: postings by province (last 12 months)",
                  "Bubble area ∝ posting count · maps are weak at exact comparison — see the ranked list")


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
                  "The list carries the precise ranking the bubble map cannot")


def share_choropleth(ds: DataSource) -> go.Figure:
    prov = _last12(ds.province).groupby("province_scope", as_index=False)["postings_total"].sum()
    prov["share"] = prov["postings_total"] / prov["postings_total"].sum() * 100
    prov["name"] = prov["province_scope"].map(PROVINCE_NAMES)
    fig = go.Figure(go.Choropleth(
        geojson=ds.geojson, locations=prov["province_scope"], z=prov["share"],
        featureidkey="properties.code", colorscale=SEQUENTIAL,
        marker_line_color="white", marker_line_width=0.6,
        colorbar=dict(title="% of national", ticksuffix="%"),
        text=prov["name"], hovertemplate="%{text}: %{z:.1f}% of national<extra></extra>"))
    fig.update_geos(fitbounds="locations", visible=False)
    fig.update_layout(height=460, margin=dict(l=10, r=10, t=64, b=10))
    return titled(fig, "Share of national demand by province",
                  "Normalised fill (share of postings) — never raw counts on a choropleth")


# --------------------------------------------------------------------------- DEEP


def lq_choropleth(ds: DataSource, noc_code: str | None = None) -> go.Figure:
    window = _last12(ds.province_occupation)
    lq = C.location_quotient(window, "province_scope", "noc_code", "postings_total")
    lq = lq[[c for c in lq.columns if c in NOC_SHORT]]
    if noc_code is None:
        # default: the group with the widest specialisation spread across provinces
        noc_code = lq.std().sort_values(ascending=False).index[0]
    col = lq[noc_code]
    df = pd.DataFrame({"code": col.index, "lq": col.values})
    df["name"] = df["code"].map(PROVINCE_NAMES)
    fig = go.Figure(go.Choropleth(
        geojson=ds.geojson, locations=df["code"], z=df["lq"], featureidkey="properties.code",
        colorscale=DIVERGING, zmid=1.0, zmin=0, zmax=2,
        marker_line_color="white", marker_line_width=0.6,
        colorbar=dict(title="LQ"), text=df["name"],
        hovertemplate="%{text}: LQ %{z:.2f}<extra></extra>"))
    fig.update_geos(fitbounds="locations", visible=False)
    fig.update_layout(height=470, margin=dict(l=10, r=10, t=70, b=10))
    return titled(fig, f"Specialisation: location quotient — {noc_short(noc_code)}",
                  "LQ = local share ÷ national share. >1 (orange) = relatively specialised; 1 = on par with Canada")


def lq_heatmap(ds: DataSource, animate: str | None = None, locale: str = "en") -> go.Figure:
    full = ds.province_occupation
    # Fix the province (x) and occupation (y) order once, from the recent window,
    # so every frame shares the same grid and the cells stay comparable over time.
    window = _last12(full)
    base = C.location_quotient(window, "province_scope", "noc_code", "postings_total")
    base = base[[c for c in base.columns if c in NOC_SHORT]]
    order = window.groupby("province_scope")["postings_total"].sum().sort_values(ascending=False)
    prov_order = [p for p in order.index if p in base.index]
    noc_order = list(base.columns)
    y = [noc_short(c) for c in noc_order]

    def _z(df: pd.DataFrame):
        lq = C.location_quotient(df, "province_scope", "noc_code", "postings_total")
        return lq.reindex(index=prov_order, columns=noc_order).T.values  # rows=occ, cols=prov

    def _heat(z):
        return go.Heatmap(z=z, x=prov_order, y=y, colorscale=DIVERGING, zmid=1.0, zmin=0, zmax=2,
                          colorbar=dict(title="LQ"), xgap=1, ygap=1,
                          hovertemplate="%{y} in %{x}: LQ %{z:.2f}<extra></extra>")

    if animate == "by-year":
        f = full.copy()
        f["year"] = f["month"].dt.year
        years = sorted(f["year"].unique())
        frames = [go.Frame(name=str(yr), data=[_heat(_z(f[f["year"] == yr]))]) for yr in years]
        fig = go.Figure(data=[_heat(_z(f[f["year"] == years[-1]]))], frames=frames)
        fig.update_xaxes(title_text="province (ordered by demand volume)", type="category")
        add_time_slider(fig, years, **_slider_chrome(locale))
        fig.update_layout(height=460, margin=dict(l=170, b=44))
        return titled(fig, "What each province is known for: LQ wall (occupation × province)",
                      "Specialisation vs Canada by year — orange over-represented, teal under (>1 = specialised). Drag or press play.")

    fig = go.Figure(_heat(_z(window)))
    fig.update_xaxes(title_text="province (ordered by demand volume)", type="category")
    fig.update_layout(height=440, margin=dict(l=170))
    return titled(fig, "What each province is known for: LQ wall (occupation × province)",
                  "Specialisation vs Canada — orange = over-represented, teal = under-represented (>1 = specialised)")


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
                  "Accounting identity (not causation): national trend + occupation mix + local shift = actual change")


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


# Hand-assigned tile grid (row, col) approximating Canada's layout.
_TILE = {
    "YT": (0, 0), "NT": (0, 1), "NU": (0, 2),
    "BC": (1, 0), "AB": (1, 1), "SK": (1, 2), "MB": (1, 3), "ON": (1, 4), "QC": (1, 5), "NL": (1, 7),
    "NB": (2, 5), "PE": (2, 6), "NS": (2, 7),
}


def province_tile_grid(ds: DataSource) -> go.Figure:
    prov = _last12(ds.province).groupby("province_scope", as_index=False)["postings_total"].sum()
    vals = prov.set_index("province_scope")["postings_total"]
    nrows, ncols = 3, 8
    z = np.full((nrows, ncols), np.nan)
    text = np.full((nrows, ncols), "", dtype=object)
    for code, (r, c) in _TILE.items():
        if code in vals.index:
            z[r, c] = vals[code]
            text[r, c] = f"<b>{code}</b><br>{vals[code]:,.0f}"
    fig = go.Figure(go.Heatmap(
        z=z, colorscale=SEQUENTIAL, xgap=4, ygap=4, showscale=True,
        colorbar=dict(title="postings"), hoverinfo="skip"))
    fig.update_traces(text=text, texttemplate="%{text}",
                      textfont=dict(size=11, color="#132330"))
    fig.update_yaxes(autorange="reversed", showticklabels=False, showgrid=False)
    fig.update_xaxes(showticklabels=False, showgrid=False)
    fig.update_layout(height=300)
    return titled(fig, "Every province equally legible: tile grid",
                  "Equal-area cells (last 12 months) — the North reads as clearly as Ontario")
