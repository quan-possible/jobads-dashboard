"""Explore figure builder — the self-serve "Build a chart" backend.

One function, :func:`build_explore_figure`, turns a (dim, measure, scope, window)
request into a single Plotly figure JSON string, themed exactly like the
registered charts via :func:`api.figures.apply_house_style`.

Design rules (mirrors the rest of the query layer):

- Read ONLY the precomputed cubes (``monthly_filter_cube`` / ``monthly_wage_cube``)
  through the same DuckDB layer ``api.queries`` uses — never the raw corpus.
- The cubes are *marginal* tables: each dimension carries an "All …" total
  alongside its parts. To break demand down by one dimension we pin the other
  two to a single scope value (the chosen scope, or its "All" sentinel) and let
  only the breakdown dimension vary across its real categories. Summing without
  pinning would add the All-total to its own parts on every loose dimension and
  inflate volumes (the ``cma_demand`` 8× double-count bug). We pin first.
- Three gates (axis / data / sample) each return a friendly centered-annotation
  figure instead of crashing or drawing noise.
"""

from __future__ import annotations

from datetime import date

import pandas as pd
import plotly.graph_objects as go

from jobads_dashboard.viz.labels import short_label

from . import core
from .figures import apply_house_style

# --------------------------------------------------------------------------- #
# Vocabulary
# --------------------------------------------------------------------------- #

DIMS = ("province", "occupation", "industry", "time")
MEASURES = ("postings", "share", "yoy", "two_year", "wage")

# Per breakdown dimension: which cube column it lives in, its "All" sentinel, and
# the (non-real) sentinels to exclude from the category axis.
_DIM_COLUMN = {
    "province": "province_scope",
    "occupation": "occupation_scope",
    "industry": "industry_scope",
}
_DIM_ALL = {
    "province": core.ALL_GEO,
    "occupation": core.ALL_OCC,
    "industry": core.ALL_IND,
}
# Sentinels dropped from a bar dimension's categories (the All total + Unknowns).
_DIM_DROP = {
    "province": {core.ALL_GEO},
    "occupation": {core.ALL_OCC, core.UNKNOWN_OCC},
    "industry": {core.ALL_IND, core.UNKNOWN_IND},
}

# Minimum postings before we draw anything (mirrors core.SHARE_MIN_SAMPLE).
MIN_SAMPLE = 100

_I18N: dict[str, dict[str, str]] = {
    "en": {
        "axis_gate": "Pick a different breakdown — you've already filtered to one {dim}.",
        "no_data": "No data for this combination",
        "low_sample": "Insufficient sample (n<100)",
        "postings": "postings",
        "share": "share of postings",
        "yoy": "year-over-year %",
        "two_year": "change {a}→{b}",
        "two_year_generic": "two-year change",
        "two_year_needs_breakdown": "Two-year change needs a breakdown — switch to a category.",
        "two_year_same_year": "Pick two different years to see a change.",
        "share_caveat": "share of all postings (excludes uncategorized)",
        "wage": "median advertised wage",
        "province": "province",
        "occupation": "occupation",
        "industry": "industry",
        "month": "month",
    },
    "fr": {
        "axis_gate": "Choisissez une autre répartition — vous avez déjà filtré sur une seule {dim}.",
        "no_data": "Aucune donnée pour cette combinaison",
        "low_sample": "Échantillon insuffisant (n<100)",
        "postings": "offres",
        "share": "part des offres",
        "yoy": "% d’une année à l’autre",
        "two_year": "variation {a}→{b}",
        "two_year_generic": "variation sur deux ans",
        "two_year_needs_breakdown": "La variation sur deux ans exige une répartition — choisissez une catégorie.",
        "two_year_same_year": "Choisissez deux années différentes pour voir une variation.",
        "share_caveat": "part de toutes les offres (hors non classées)",
        "wage": "salaire médian affiché",
        "province": "province",
        "occupation": "profession",
        "industry": "secteur",
        "month": "mois",
    },
}


def _t(locale: str, key: str, **fmt) -> str:
    table = _I18N.get(locale, _I18N["en"])
    text = table.get(key) or _I18N["en"].get(key, key)
    return text.format(**fmt) if fmt else text


# --------------------------------------------------------------------------- #
# Friendly empty / message figure (used by every gate)
# --------------------------------------------------------------------------- #


def _message_figure(text: str, *, locale: str) -> str:
    """A blank, axis-free figure whose only content is a centered note."""
    fig = go.Figure()
    fig.update_layout(
        xaxis=dict(visible=False),
        yaxis=dict(visible=False),
        annotations=[
            dict(
                text=text,
                xref="paper",
                yref="paper",
                x=0.5,
                y=0.5,
                showarrow=False,
                align="center",
                font=dict(size=15),
            )
        ],
    )
    return apply_house_style(fig, locale=locale)


# --------------------------------------------------------------------------- #
# Scope resolution
# --------------------------------------------------------------------------- #


def _resolve(geo: str | None, occ: str | None, ind: str | None) -> dict[str, str]:
    """Map the scope strings onto the three cube columns, defaulting to All."""
    return {
        "province_scope": geo or core.ALL_GEO,
        "occupation_scope": occ or core.ALL_OCC,
        "industry_scope": ind or core.ALL_IND,
    }


def _year_bounds(start_year: int | None, end_year: int | None) -> tuple[date | None, date | None]:
    lo = date(int(start_year), 1, 1) if start_year else None
    hi = date(int(end_year), 12, 31) if end_year else None
    return lo, hi


# --------------------------------------------------------------------------- #
# Cube reads (pinned marginals — never double-counted)
# --------------------------------------------------------------------------- #


def _bar_frame(
    dim: str,
    scope: dict[str, str],
    lo: date | None,
    hi: date | None,
) -> pd.DataFrame:
    """Postings for the breakdown ``dim``: the other two dims pinned to ``scope``,
    the breakdown column varying across its real categories (sentinels dropped)."""
    col = _DIM_COLUMN[dim]
    pinned = [c for c in ("province_scope", "occupation_scope", "industry_scope") if c != col]
    where = " AND ".join(f"{c} = ?" for c in pinned)
    params: list = [scope[c] for c in pinned]
    drops = _DIM_DROP[dim]
    where += " AND " + " AND ".join([f"{col} <> ?"] * len(drops))
    params += list(drops)
    if lo is not None:
        where += " AND month >= ?"
        params.append(lo)
    if hi is not None:
        where += " AND month <= ?"
        params.append(hi)
    sql = f"""
        SELECT {col} AS category, month, postings_total
        FROM {core.parquet('filter_cube')}
        WHERE {where}
        ORDER BY {col}, month
    """
    return core.query_df(sql, params)


def _scope_total(dim: str, scope: dict[str, str], lo: date | None, hi: date | None) -> float:
    """Total postings across the *whole* breakdown dimension for the pinned scope.

    Pins the breakdown column to its "All" marginal (which already includes the
    Unknown bucket and every sub-sample category), so a share computed against
    this denominator matches the curated treemaps instead of overstating against
    a survivors-only base."""
    col = _DIM_COLUMN[dim]
    pin = dict(scope)
    pin[col] = _DIM_ALL[dim]
    where = "province_scope = ? AND occupation_scope = ? AND industry_scope = ?"
    params: list = [pin["province_scope"], pin["occupation_scope"], pin["industry_scope"]]
    if lo is not None:
        where += " AND month >= ?"
        params.append(lo)
    if hi is not None:
        where += " AND month <= ?"
        params.append(hi)
    sql = f"""
        SELECT COALESCE(SUM(postings_total), 0) AS total
        FROM {core.parquet('filter_cube')}
        WHERE {where}
    """
    out = core.query_df(sql, params)
    return float(out["total"].iloc[0]) if not out.empty else 0.0


def _time_frame(scope: dict[str, str], lo: date | None, hi: date | None) -> pd.DataFrame:
    """Monthly postings for the pinned scope cell (All/All/All-style marginal)."""
    where = "province_scope = ? AND occupation_scope = ? AND industry_scope = ?"
    params: list = [scope["province_scope"], scope["occupation_scope"], scope["industry_scope"]]
    if lo is not None:
        where += " AND month >= ?"
        params.append(lo)
    if hi is not None:
        where += " AND month <= ?"
        params.append(hi)
    sql = f"""
        SELECT month, postings_total
        FROM {core.parquet('filter_cube')}
        WHERE {where}
        ORDER BY month
    """
    return core.query_df(sql, params)


def _wage_bar_frame(dim: str, scope: dict[str, str], lo: date | None, hi: date | None) -> pd.DataFrame:
    col = _DIM_COLUMN[dim]
    pinned = [c for c in ("province_scope", "occupation_scope", "industry_scope") if c != col]
    where = " AND ".join(f"{c} = ?" for c in pinned)
    params: list = [scope[c] for c in pinned]
    drops = _DIM_DROP[dim]
    where += " AND " + " AND ".join([f"{col} <> ?"] * len(drops))
    params += list(drops)
    if lo is not None:
        where += " AND month >= ?"
        params.append(lo)
    if hi is not None:
        where += " AND month <= ?"
        params.append(hi)
    sql = f"""
        SELECT {col} AS category, month, wage_postings, wage_median
        FROM {core.parquet('wage_cube')}
        WHERE {where}
        ORDER BY {col}, month
    """
    return core.query_df(sql, params)


def _wage_time_frame(scope: dict[str, str], lo: date | None, hi: date | None) -> pd.DataFrame:
    where = "province_scope = ? AND occupation_scope = ? AND industry_scope = ?"
    params: list = [scope["province_scope"], scope["occupation_scope"], scope["industry_scope"]]
    if lo is not None:
        where += " AND month >= ?"
        params.append(lo)
    if hi is not None:
        where += " AND month <= ?"
        params.append(hi)
    sql = f"""
        SELECT month, wage_postings, wage_median
        FROM {core.parquet('wage_cube')}
        WHERE {where}
        ORDER BY month
    """
    return core.query_df(sql, params)


# --------------------------------------------------------------------------- #
# Pretty category labels
# --------------------------------------------------------------------------- #


def _pretty(dim: str, category: str, locale: str = "en") -> str:
    if dim == "province":
        return core.PROVINCE_NAMES.get(category, category)
    # occupation / industry: the shared short-name map (en + fr) so the Explore
    # bars match the curated treemaps in both locales (S07).
    return short_label(dim, category, locale)


# --------------------------------------------------------------------------- #
# Bar builders (province / occupation / industry on the breakdown axis)
# --------------------------------------------------------------------------- #


def _bar_postings(df: pd.DataFrame) -> pd.DataFrame:
    """Sum postings per category over the window; drop low-sample categories."""
    g = df.groupby("category", as_index=False)["postings_total"].sum()
    g = g[g["postings_total"] >= MIN_SAMPLE]
    return g.rename(columns={"postings_total": "value"}).sort_values("value")


def _bar_share(df: pd.DataFrame, total: float) -> pd.DataFrame:
    """Share of *all* postings for the scope (denominator passed in by the
    caller as the All-dimension marginal), so shown shares match the treemaps
    and sum to <100% when an Unknown bucket is excluded from the bars."""
    g = df.groupby("category", as_index=False)["postings_total"].sum()
    g = g[g["postings_total"] >= MIN_SAMPLE]
    if total <= 0:
        return g.iloc[0:0].assign(value=[])
    g["value"] = (g["postings_total"] / total * 100).round(2)
    return g[["category", "value"]].sort_values("value")


def _bar_yoy(df: pd.DataFrame) -> pd.DataFrame:
    """Per category: YoY % of the latest month vs the same month a year before.

    Needs ≥13 months of coverage; categories whose latest or year-ago month
    falls below the sample floor are dropped (no noise)."""
    rows = []
    for cat, grp in df.groupby("category"):
        grp = grp.sort_values("month")
        if grp["month"].nunique() < 13:
            continue
        latest = grp.iloc[-1]
        as_of = pd.Timestamp(latest["month"])
        year_ago_m = pd.Timestamp(date(as_of.year - 1, as_of.month, 1))
        prior = grp[grp["month"] == year_ago_m]
        if prior.empty:
            continue
        cur, prev = float(latest["postings_total"]), float(prior["postings_total"].iloc[0])
        if cur < MIN_SAMPLE or prev < MIN_SAMPLE or prev == 0:
            continue
        rows.append({"category": cat, "value": round((cur - prev) / prev * 100, 1)})
    return pd.DataFrame(rows).sort_values("value") if rows else pd.DataFrame(columns=["category", "value"])


def _bar_two_year(df: pd.DataFrame, lo_year: int, hi_year: int) -> pd.DataFrame:
    """Per category: % change in annual postings between two calendar years."""
    d = df.copy()
    d["year"] = pd.to_datetime(d["month"]).dt.year
    base = d[d["year"] == lo_year].groupby("category")["postings_total"].sum()
    end = d[d["year"] == hi_year].groupby("category")["postings_total"].sum()
    out = pd.DataFrame({"base": base, "end": end}).fillna(0.0)
    out = out[(out["base"] >= MIN_SAMPLE) & (out["end"] >= MIN_SAMPLE)]
    if out.empty:
        return pd.DataFrame(columns=["category", "value"])
    out["value"] = ((out["end"] - out["base"]) / out["base"] * 100).round(1)
    out = out.reset_index()  # the groupby index is already named "category"
    return out[["category", "value"]].sort_values("value")


def _bar_wage(df: pd.DataFrame) -> pd.DataFrame:
    """Per category: median advertised wage at the latest month that clears the
    wage sample floor."""
    rows = []
    for cat, grp in df.groupby("category"):
        grp = grp.sort_values("month")
        ok = grp[(grp["wage_postings"] >= core.WAGE_MIN_SAMPLE) & grp["wage_median"].notna()]
        if ok.empty:
            continue
        rows.append({"category": cat, "value": round(float(ok.iloc[-1]["wage_median"]), 2)})
    return pd.DataFrame(rows).sort_values("value") if rows else pd.DataFrame(columns=["category", "value"])


# --------------------------------------------------------------------------- #
# Public entry point
# --------------------------------------------------------------------------- #


def build_explore_figure(
    dim: str,
    measure: str,
    *,
    geo: str | None = None,
    occ: str | None = None,
    ind: str | None = None,
    start_year: int | None = None,
    end_year: int | None = None,
    locale: str = "en",
) -> str:
    """Build one Explore chart and return its Plotly JSON string.

    ``dim`` is the breakdown axis; ``measure`` the value drawn. Bars for
    province/occupation/industry, a line for time. Never raises on a bad
    combination — returns a friendly message figure (the three gates)."""
    if dim not in DIMS:
        return _message_figure(_t(locale, "no_data"), locale=locale)
    if measure not in MEASURES:
        return _message_figure(_t(locale, "no_data"), locale=locale)

    scope = _resolve(geo, occ, ind)

    # --- Gate 1: axis gate -------------------------------------------------- #
    # Breaking down by a dimension that is already pinned to a single non-All
    # value is incoherent (you've filtered to exactly one of them).
    if dim in _DIM_COLUMN and scope[_DIM_COLUMN[dim]] != _DIM_ALL[dim]:
        return _message_figure(_t(locale, "axis_gate", dim=_t(locale, dim)), locale=locale)

    lo, hi = _year_bounds(start_year, end_year)

    if dim == "time":
        return _build_time(measure, scope, lo, hi, start_year, end_year, locale)
    return _build_bar(dim, measure, scope, lo, hi, start_year, end_year, locale)


def _build_bar(
    dim: str,
    measure: str,
    scope: dict[str, str],
    lo: date | None,
    hi: date | None,
    start_year: int | None,
    end_year: int | None,
    locale: str,
) -> str:
    if measure == "wage":
        raw = _wage_bar_frame(dim, scope, lo, hi)
    else:
        raw = _bar_frame(dim, scope, lo, hi)

    # --- Gate 2: data gate -------------------------------------------------- #
    if raw.empty:
        return _message_figure(_t(locale, "no_data"), locale=locale)

    # --- Gate 3: sample gate (applied inside each per-category aggregator) --- #
    if measure == "postings":
        agg = _bar_postings(raw)
    elif measure == "share":
        agg = _bar_share(raw, _scope_total(dim, scope, lo, hi))
    elif measure == "yoy":
        agg = _bar_yoy(raw)
    elif measure == "wage":
        agg = _bar_wage(raw)
    else:  # two_year
        ly = int(start_year) if start_year else int(pd.to_datetime(raw["month"]).dt.year.min())
        hy = int(end_year) if end_year else int(pd.to_datetime(raw["month"]).dt.year.max())
        if ly == hy:
            # A two-year change between one year and itself is 0% everywhere.
            return _message_figure(_t(locale, "two_year_same_year"), locale=locale)
        agg = _bar_two_year(raw, ly, hy)

    if agg.empty:
        # Every category fell below the sample floor (or no rows survived).
        return _message_figure(_t(locale, "low_sample"), locale=locale)

    labels = [_pretty(dim, c, locale) for c in agg["category"]]
    # The breakdown share is against the All-dimension total (Unknown included in
    # the denominator), so disclose that the bars exclude the uncategorized bucket.
    title = _t(locale, "share_caveat") if measure == "share" else _measure_axis(measure, locale, start_year, end_year)
    fig = go.Figure(
        go.Bar(
            x=agg["value"],
            y=labels,
            orientation="h",
            marker_color="#cf7730",  # theme.BRAND
            hovertemplate="%{y}<br>%{x}<extra></extra>",
        )
    )
    fig.update_layout(xaxis_title=title, yaxis_title=None, margin=dict(l=8))
    return apply_house_style(fig, locale=locale)


def _build_time(
    measure: str,
    scope: dict[str, str],
    lo: date | None,
    hi: date | None,
    start_year: int | None,
    end_year: int | None,
    locale: str,
) -> str:
    # "Two-year change" is a single delta between two years — there is no honest
    # way to draw it as a line over time, so steer the user to a category instead
    # of plotting a raw postings level under a "change a→b" axis.
    if measure == "two_year":
        return _message_figure(_t(locale, "two_year_needs_breakdown"), locale=locale)

    if measure == "wage":
        df = _wage_time_frame(scope, lo, hi)
    else:
        df = _time_frame(scope, lo, hi)

    # --- Gate 2: data gate -------------------------------------------------- #
    if df.empty:
        return _message_figure(_t(locale, "no_data"), locale=locale)

    df = df.sort_values("month").reset_index(drop=True)

    if measure == "wage":
        df = df[(df["wage_postings"] >= core.WAGE_MIN_SAMPLE) & df["wage_median"].notna()]
        if df.empty:
            return _message_figure(_t(locale, "low_sample"), locale=locale)
        x, y = df["month"], df["wage_median"].round(2)
    else:
        # --- Gate 3: sample gate (whole-window total) ----------------------- #
        if float(df["postings_total"].sum()) < MIN_SAMPLE:
            return _message_figure(_t(locale, "low_sample"), locale=locale)
        if measure == "postings":
            x, y = df["month"], df["postings_total"]
        elif measure == "share":
            total = float(df["postings_total"].sum())
            x = df["month"]
            y = (df["postings_total"] / total * 100).round(2)
        else:  # yoy
            if df["month"].nunique() < 13:
                return _message_figure(_t(locale, "low_sample"), locale=locale)
            # Reindex to a contiguous monthly index first: the cube is a sparse
            # marginal table (no zero-fill), so a row-positional shift(12) would
            # mis-pair across any skipped month. shift(12) on the dense index is
            # a true 12-calendar-month lag; gaps become NaN and drop out.
            s = df.set_index("month")["postings_total"].sort_index()
            s.index = pd.to_datetime(s.index)
            s = s.reindex(pd.date_range(s.index.min(), s.index.max(), freq="MS"))
            yoy = (s / s.shift(12) - 1) * 100
            yoy = yoy.dropna().round(1)
            if yoy.empty:
                return _message_figure(_t(locale, "low_sample"), locale=locale)
            x, y = yoy.index, yoy.values

    title = _measure_axis(measure, locale, start_year, end_year)
    fig = go.Figure(
        go.Scatter(
            x=list(x),
            y=list(y),
            mode="lines",
            line=dict(color="#cf7730", width=2),  # theme.BRAND
            hovertemplate="%{x|%Y-%m}<br>%{y}<extra></extra>",
        )
    )
    fig.update_layout(xaxis_title=_t(locale, "month"), yaxis_title=title)
    return apply_house_style(fig, locale=locale)


def _measure_axis(measure: str, locale: str, start_year: int | None, end_year: int | None) -> str:
    if measure == "two_year":
        # Only interpolate the years when both are present; otherwise fall back to
        # a generic label so an unfilled "change {a}→{b}" can never reach the chart.
        if start_year and end_year:
            return _t(locale, "two_year", a=start_year, b=end_year)
        return _t(locale, "two_year_generic")
    return _t(locale, measure)
