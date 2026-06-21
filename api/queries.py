"""Analytical query layer.

All numbers the dashboard shows are computed here from the local aggregates.
Design rules encoded here:
  * Demand index: Jan 2019 = 100 for the same scope (fallback: first month).
  * Wage / sparse-field stats are withheld below a minimum sample.
  * Key points are descriptive only — no causal language (guarded by a test).
  * Skill share denominator = postings that carry ANY skill in scope, never the
    sum across skills (a posting lists several skills).
"""

from __future__ import annotations

import json
import math
from datetime import date

import pandas as pd

from . import core
from .models import (
    CategoryShare,
    CoverageItem,
    GeographyResponse,
    GeoItem,
    Kpis,
    Meta,
    OverviewResponse,
    RankItem,
    RequirementsResponse,
    Scope,
    SeriesPoint,
    SkillItem,
    SkillsResponse,
    SourceWindow,
    WageItem,
    WagesResponse,
    WageTrendPoint,
    WageTrendResponse,
    CompositionGroup,
    CompositionResponse,
    ConcentrationResponse,
    MatrixResponse,
    CoverageTrendResponse,
    GeoTrendResponse,
)

# --------------------------------------------------------------------------- #
# Small numeric helpers
# --------------------------------------------------------------------------- #


def _pct(curr: float | None, prev: float | None) -> float | None:
    if curr is None or prev is None or prev == 0:
        return None
    return round((curr - prev) / prev * 100, 1)


def _clean(value) -> float | None:
    if value is None:
        return None
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return None
    return value


def _iso(m) -> str:
    if isinstance(m, str):
        return m[:7]
    return f"{m.year:04d}-{m.month:02d}"


def _split_label(scope_label: str) -> tuple[str, str]:
    """'3 | Health occupations' -> ('3', 'Health occupations')."""
    if " | " in scope_label:
        code, label = scope_label.split(" | ", 1)
        return code.strip(), label.strip()
    return scope_label, scope_label


# --------------------------------------------------------------------------- #
# Scope resolution
# --------------------------------------------------------------------------- #


def resolve_scope(
    geo: str | None,
    occ: str | None,
    ind: str | None,
    start: str | None,
    end: str | None,
) -> Scope:
    end_m = core.month_floor(end) if end else core.latest_month()
    if end_m > core.latest_month():
        end_m = core.latest_month()
    if start:
        start_m = core.month_floor(start)
    else:
        # Default window: trailing 12 months (used for windowed context).
        y, m = end_m.year, end_m.month - 11
        while m <= 0:
            m += 12
            y -= 1
        start_m = date(y, m, 1)
    if start_m < core.earliest_month():
        start_m = core.earliest_month()
    return Scope(
        geo=geo or core.ALL_GEO,
        occ=occ or core.ALL_OCC,
        ind=ind or core.ALL_IND,
        start=_iso(start_m),
        end=_iso(end_m),
    )


def _scope_where(scope: Scope, prefix: str = "") -> tuple[str, list]:
    p = prefix
    return (
        f"{p}province_scope = ? AND {p}occupation_scope = ? AND {p}industry_scope = ?",
        [scope.geo, scope.occ, scope.ind],
    )


# --------------------------------------------------------------------------- #
# Trailing trends (drive the in-table / KPI sparklines)
# --------------------------------------------------------------------------- #

TREND_MONTHS = 24


def _months_back(d: date, n: int) -> date:
    y, m = d.year, d.month - n
    while m <= 0:
        m += 12
        y -= 1
    return date(y, m, 1)


def _entity_trends(scope: Scope, dim: str, groups: list[str], n_months: int = TREND_MONTHS) -> dict[str, list[float]]:
    """Trailing monthly postings per ranked entity (the `vary` scope-label values)."""
    if not groups:
        return {}
    as_of = core.month_floor(scope.end)
    start = _months_back(as_of, n_months - 1)
    if dim == "occupations":
        vary, fixed_a, fixed_b = "occupation_scope", "province_scope", "industry_scope"
        fixed_vals = [scope.geo, scope.ind]
    else:
        vary, fixed_a, fixed_b = "industry_scope", "province_scope", "occupation_scope"
        fixed_vals = [scope.geo, scope.occ]
    placeholders = ",".join(["?"] * len(groups))
    sql = f"""
        SELECT {vary} AS g, month, postings_total
        FROM {core.parquet('filter_cube')}
        WHERE {fixed_a} = ? AND {fixed_b} = ?
          AND {vary} IN ({placeholders})
          AND month >= ? AND month <= ?
        ORDER BY {vary}, month
    """
    params = [*fixed_vals, *groups, start, as_of]
    df = core.query_df(sql, params)
    if df.empty:
        return {}
    out: dict[str, list[float]] = {}
    for g, grp in df.groupby("g"):
        out[str(g)] = [float(v) for v in grp.sort_values("month")["postings_total"].tolist()]
    return out


def _province_trends(scope: Scope, codes: list[str], n_months: int = TREND_MONTHS) -> dict[str, list[float]]:
    """Trailing monthly postings per province for the scope's occupation/industry slice."""
    if not codes:
        return {}
    as_of = core.month_floor(scope.end)
    start = _months_back(as_of, n_months - 1)
    placeholders = ",".join(["?"] * len(codes))
    sql = f"""
        SELECT province_scope AS code, month, postings_total
        FROM {core.parquet('filter_cube')}
        WHERE occupation_scope = ? AND industry_scope = ?
          AND province_scope IN ({placeholders})
          AND month >= ? AND month <= ?
        ORDER BY province_scope, month
    """
    params = [scope.occ, scope.ind, *codes, start, as_of]
    df = core.query_df(sql, params)
    if df.empty:
        return {}
    out: dict[str, list[float]] = {}
    for code, grp in df.groupby("code"):
        out[str(code)] = [float(v) for v in grp.sort_values("month")["postings_total"].tolist()]
    return out


def _wage_trend(scope: Scope, as_of: date, n_months: int = TREND_MONTHS) -> list[float] | None:
    """Trailing monthly median wage at the scope (gated months dropped)."""
    where, params = _scope_where(scope)
    start = _months_back(as_of, n_months - 1)
    df = core.query_df(
        f"""SELECT month, wage_postings AS n, wage_median AS median
            FROM {core.parquet('wage_cube')}
            WHERE {where} AND month >= ? AND month <= ?
            ORDER BY month""",
        params + [start, as_of],
    )
    if df.empty:
        return None
    vals = [
        float(r["median"])
        for _, r in df.iterrows()
        if r["n"] is not None
        and int(r["n"]) >= core.WAGE_MIN_SAMPLE
        and r["median"] is not None
        and not pd.isna(r["median"])
    ]
    return vals if len(vals) >= 2 else None


# --------------------------------------------------------------------------- #
# Meta
# --------------------------------------------------------------------------- #

_COVERAGE_LABELS = {
    "wage_postings": "Wage",
    "noc_postings": "Occupation (NOC)",
    "naics_postings": "Industry (NAICS)",
    "remote_field_postings": "Remote-work field",
}


def get_meta() -> Meta:
    raw = json.loads(core.METADATA_JSON.read_text())
    counts = raw["headline_counts"]
    total = counts["postings_total"]
    coverage = [
        CoverageItem(
            field=field,
            label=_COVERAGE_LABELS.get(field, field),
            postings=counts[field],
            share=round(counts[field] / total, 4) if total else 0.0,
        )
        for field in ("noc_postings", "naics_postings", "wage_postings", "remote_field_postings")
        if field in counts
    ]
    return Meta(
        generated_at_utc=raw["generated_at_utc"],
        source_window=SourceWindow(
            min_date=raw["source_window"]["min_date"],
            max_date=raw["source_window"]["max_date"],
        ),
        postings_total=total,
        coverage=coverage,
        caveats=raw.get("known_caveats", []),
        latest_month=_iso(core.latest_month()),
        earliest_month=_iso(core.earliest_month()),
        index_base_month=_iso(core.INDEX_BASE_MONTH),
    )


# --------------------------------------------------------------------------- #
# Postings series (with demand index + YoY)
# --------------------------------------------------------------------------- #


def _series_frame(scope: Scope) -> pd.DataFrame:
    where, params = _scope_where(scope)
    sql = f"""
        SELECT month, postings_total
        FROM {core.parquet('filter_cube')}
        WHERE {where}
        ORDER BY month
    """
    df = core.query_df(sql, params)
    if df.empty:
        return df
    df["month"] = pd.to_datetime(df["month"])
    # Demand index: base = Jan 2019 for this scope, else first available month.
    base_row = df[df["month"] == pd.Timestamp(core.INDEX_BASE_MONTH)]
    base = base_row["postings_total"].iloc[0] if not base_row.empty else df["postings_total"].iloc[0]
    df["index"] = (df["postings_total"] / base * 100).round(1) if base else None
    df["yoy"] = (df["postings_total"] / df["postings_total"].shift(12) - 1) * 100
    df["yoy"] = df["yoy"].round(1)
    return df


def postings_series(scope: Scope, metric: str = "index") -> list[SeriesPoint]:
    df = _series_frame(scope)
    if df.empty:
        return []
    end_ts = pd.Timestamp(core.month_floor(scope.end))
    df = df[df["month"] <= end_ts]
    points = []
    for _, r in df.iterrows():
        points.append(
            SeriesPoint(
                month=_iso(r["month"].date()),
                postings=int(r["postings_total"]),
                index=_clean(r["index"]),
                yoy=_clean(r["yoy"]),
            )
        )
    return points


# --------------------------------------------------------------------------- #
# Rankings (occupations / industries)
# --------------------------------------------------------------------------- #


def _rank_dim(scope: Scope, dim: str, limit: int) -> list[RankItem]:
    """Rank the broad groups of `dim` at the scope's as-of month by level + YoY."""
    as_of = core.month_floor(scope.end)
    if dim == "occupations":
        vary, fixed_a, fixed_b = "occupation_scope", "province_scope", "industry_scope"
        fixed_vals = [scope.geo, scope.ind]
        all_sentinel, unknown = core.ALL_OCC, core.UNKNOWN_OCC
    else:
        vary, fixed_a, fixed_b = "industry_scope", "province_scope", "occupation_scope"
        fixed_vals = [scope.geo, scope.occ]
        all_sentinel, unknown = core.ALL_IND, core.UNKNOWN_IND

    sql = f"""
        WITH cur AS (
            SELECT {vary} AS g, postings_total
            FROM {core.parquet('filter_cube')}
            WHERE month = ? AND {fixed_a} = ? AND {fixed_b} = ?
              AND {vary} NOT IN (?, ?)
        ),
        prior AS (
            SELECT {vary} AS g, postings_total AS prev
            FROM {core.parquet('filter_cube')}
            WHERE month = ? AND {fixed_a} = ? AND {fixed_b} = ?
        )
        SELECT cur.g, cur.postings_total AS value, prior.prev
        FROM cur LEFT JOIN prior USING (g)
    """
    year_ago = date(as_of.year - 1, as_of.month, 1)
    params = [as_of, *fixed_vals, all_sentinel, unknown, year_ago, *fixed_vals]
    df = core.query_df(sql, params)
    if df.empty:
        return []
    total = df["value"].sum()
    trends = _entity_trends(scope, dim, [str(g) for g in df["g"].tolist()])
    items = []
    for _, r in df.iterrows():
        code, label = _split_label(r["g"])
        prev = r["prev"]
        yoy = _pct(r["value"], prev) if prev and prev >= 200 else None
        items.append(
            RankItem(
                code=code,
                label=label,
                value=int(r["value"]),
                yoy=yoy,
                share=round(r["value"] / total, 4) if total else None,
                trend=trends.get(str(r["g"])),
            )
        )
    return items


def rank(scope: Scope, dim: str, limit: int = 10, order: str = "value") -> list[RankItem]:
    items = _rank_dim(scope, dim, limit)
    if order == "yoy":
        items = [i for i in items if i.yoy is not None]
        items.sort(key=lambda i: i.yoy, reverse=True)
    else:
        items.sort(key=lambda i: i.value, reverse=True)
    return items[:limit]


# --------------------------------------------------------------------------- #
# Overview / Pulse
# --------------------------------------------------------------------------- #


def _kpis(scope: Scope, series: list[SeriesPoint]) -> tuple[Kpis, date]:
    if not series:
        return Kpis(), core.month_floor(scope.end)
    as_of = core.month_floor(series[-1].month)
    last = series[-1]
    prev = series[-2] if len(series) >= 2 else None
    yoy_ref = series[-13] if len(series) >= 13 else None

    # Wage at this scope/month.
    where, params = _scope_where(scope)
    wage = core.query_df(
        f"""SELECT wage_postings AS n, wage_median AS median
            FROM {core.parquet('wage_cube')}
            WHERE {where} AND month = ?""",
        params + [as_of],
    )
    median_wage, wage_n = None, None
    if not wage.empty:
        wage_n = int(wage["n"].iloc[0])
        if wage_n >= core.WAGE_MIN_SAMPLE:
            median_wage = _clean(float(wage["median"].iloc[0]))

    kpis = Kpis(
        demand_index=last.index,
        demand_index_mom=(round(last.index - prev.index, 1) if (prev and last.index is not None and prev.index is not None) else None),
        active_postings=last.postings,
        active_mom_pct=_pct(last.postings, prev.postings) if prev else None,
        active_yoy_pct=_pct(last.postings, yoy_ref.postings) if yoy_ref else None,
        median_wage=median_wage,
        wage_n=wage_n,
        median_wage_trend=_wage_trend(scope, as_of),
        # posting_intensity / postings_new omitted — data-layer columns absent.
    )
    return kpis, as_of


def _streak(series: list[SeriesPoint]) -> tuple[int, str]:
    """Consecutive months of same-direction month-over-month change at the tail."""
    if len(series) < 2:
        return 0, "flat"
    diffs = [series[i].postings - series[i - 1].postings for i in range(1, len(series))]
    if not diffs:
        return 0, "flat"
    last_sign = 1 if diffs[-1] > 0 else (-1 if diffs[-1] < 0 else 0)
    if last_sign == 0:
        return 0, "flat"
    n = 0
    for d in reversed(diffs):
        s = 1 if d > 0 else (-1 if d < 0 else 0)
        if s == last_sign:
            n += 1
        else:
            break
    return n, "risen" if last_sign > 0 else "fallen"


def _key_points(scope: Scope, kpis: Kpis, growing: list[RankItem], cooling: list[RankItem], series: list[SeriesPoint]) -> list[str]:
    """Descriptive only. No causal verbs (guarded by test_no_causal_language)."""
    pts: list[str] = []
    base = _iso(core.INDEX_BASE_MONTH)
    if kpis.demand_index is not None:
        delta = kpis.demand_index - 100
        direction = "above" if delta >= 0 else "below"
        pts.append(f"Posting demand is {abs(round(delta))}% {direction} its January 2019 baseline.")
    streak_n, streak_dir = _streak(series)
    if streak_n >= 2:
        pts.append(f"Postings have {streak_dir} for {streak_n} consecutive months.")
    if kpis.active_yoy_pct is not None:
        d = "higher" if kpis.active_yoy_pct >= 0 else "lower"
        pts.append(f"Active postings are {abs(kpis.active_yoy_pct)}% {d} than a year ago.")
    lead = next((i for i in growing if i.yoy is not None), None)
    if lead:
        pts.append(f"{lead.label} shows the strongest year-over-year change at {lead.yoy:+.0f}%.")
    cool = next((i for i in reversed(cooling) if i.yoy is not None), None)
    if cool and (not lead or cool.code != lead.code):
        pts.append(f"{cool.label} sits at the bottom of the range at {cool.yoy:+.0f}% year over year.")
    return pts


def overview(scope: Scope) -> OverviewResponse:
    series = postings_series(scope)
    kpis, as_of = _kpis(scope, series)
    ranked = _rank_dim(scope, "occupations", 10)
    by_yoy = [i for i in ranked if i.yoy is not None]
    by_yoy.sort(key=lambda i: i.yoy, reverse=True)
    growing = by_yoy[:5]
    cooling = list(reversed(by_yoy[-5:])) if len(by_yoy) >= 5 else list(reversed(by_yoy))
    key_points = _key_points(scope, kpis, growing, cooling, series)
    return OverviewResponse(
        scope=scope,
        as_of=_iso(as_of),
        kpis=kpis,
        series=series,
        key_points=key_points,
        top_growing=growing,
        top_cooling=cooling,
    )


# --------------------------------------------------------------------------- #
# Geography
# --------------------------------------------------------------------------- #


def geography(scope: Scope, measure: str = "per10k") -> GeographyResponse:
    as_of = core.month_floor(scope.end)
    year_ago = date(as_of.year - 1, as_of.month, 1)
    # Province-level postings for the scope's occupation/industry slice.
    sql = f"""
        WITH cur AS (
            SELECT province_scope AS code, postings_total AS value
            FROM {core.parquet('filter_cube')}
            WHERE month = ? AND occupation_scope = ? AND industry_scope = ?
              AND province_scope <> ?
        ),
        prior AS (
            SELECT province_scope AS code, postings_total AS prev
            FROM {core.parquet('filter_cube')}
            WHERE month = ? AND occupation_scope = ? AND industry_scope = ?
              AND province_scope <> ?
        )
        SELECT cur.code, cur.value, prior.prev
        FROM cur LEFT JOIN prior USING (code)
    """
    params = [as_of, scope.occ, scope.ind, core.ALL_GEO, year_ago, scope.occ, scope.ind, core.ALL_GEO]
    df = core.query_df(sql, params)
    lf = pd.read_csv(core.PROVINCE_LF_CSV) if core.PROVINCE_LF_CSV.exists() else pd.DataFrame()
    items: list[GeoItem] = []
    if df.empty:
        return GeographyResponse(scope=scope, as_of=_iso(as_of), measure=measure, items=items)
    total_post = df["value"].sum()
    total_lf = lf["labour_force"].sum() if not lf.empty else None
    lf_map = dict(zip(lf["code"], lf["labour_force"])) if not lf.empty else {}
    trends = _province_trends(scope, [str(c) for c in df["code"].tolist()])
    for _, r in df.iterrows():
        code = r["code"]
        count = int(r["value"])
        labour = lf_map.get(code)
        per10k = round(count / labour * 10000, 2) if labour else None
        lq = None
        if labour and total_lf and total_post:
            post_share = count / total_post
            lf_share = labour / total_lf
            lq = round(post_share / lf_share, 2) if lf_share else None
        if measure == "count":
            value = float(count)
        elif measure == "lq":
            value = lq
        else:
            value = per10k
        items.append(
            GeoItem(
                code=code,
                label=core.PROVINCE_NAMES.get(code, code),
                value=value,
                count=count,
                yoy=_pct(count, r["prev"]) if r["prev"] and r["prev"] >= 100 else None,
                per10k=per10k,
                lq=lq,
                trend=trends.get(str(code)),
            )
        )
    items.sort(key=lambda i: (i.value if i.value is not None else -1), reverse=True)
    return GeographyResponse(scope=scope, as_of=_iso(as_of), measure=measure, items=items)


# --------------------------------------------------------------------------- #
# Wages
# --------------------------------------------------------------------------- #


def wages(scope: Scope, dim: str = "occupation") -> WagesResponse:
    as_of = core.month_floor(scope.end)
    if dim == "province":
        table, vary, all_sentinel, unknown = "wage_by_province", "province_scope", core.ALL_GEO, None
    elif dim == "occupation":
        table, vary, all_sentinel, unknown = "wage_by_noc", "occupation_scope", core.ALL_OCC, core.UNKNOWN_OCC
    else:  # overall single bar at the exact scope
        where, params = _scope_where(scope)
        df = core.query_df(
            f"""SELECT wage_postings AS n, wage_p25 AS p25, wage_median AS median, wage_p75 AS p75
                FROM {core.parquet('wage_cube')} WHERE {where} AND month = ?""",
            params + [as_of],
        )
        items = []
        if not df.empty:
            n = int(df["n"].iloc[0])
            gated = n < core.WAGE_MIN_SAMPLE
            items.append(
                WageItem(
                    code="scope", label="Selected scope",
                    p25=None if gated else _clean(float(df["p25"].iloc[0])),
                    median=None if gated else _clean(float(df["median"].iloc[0])),
                    p75=None if gated else _clean(float(df["p75"].iloc[0])),
                    n=n, gated=gated,
                )
            )
        return WagesResponse(scope=scope, as_of=_iso(as_of), dim=dim, min_sample=core.WAGE_MIN_SAMPLE, items=items)

    where_extra = "" if unknown is None else f" AND {vary} <> '{unknown}'"
    df = core.query_df(
        f"""SELECT {vary} AS g, wage_postings AS n, wage_p25 AS p25, wage_median AS median, wage_p75 AS p75
            FROM {core.parquet(table)}
            WHERE month = ? AND {vary} <> ?{where_extra}
            ORDER BY wage_median DESC""",
        [as_of, all_sentinel],
    )
    items = []
    for _, r in df.iterrows():
        code, label = _split_label(r["g"])
        n = int(r["n"])
        gated = n < core.WAGE_MIN_SAMPLE
        items.append(
            WageItem(
                code=code, label=label,
                p25=None if gated else _clean(float(r["p25"])),
                median=None if gated else _clean(float(r["median"])),
                p75=None if gated else _clean(float(r["p75"])),
                n=n, gated=gated,
            )
        )
    return WagesResponse(scope=scope, as_of=_iso(as_of), dim=dim, min_sample=core.WAGE_MIN_SAMPLE, items=items)


def wage_trend(scope: Scope) -> WageTrendResponse:
    """Monthly advertised-wage band (p25 / median / p75) for the scope, full
    history. Months below the minimum sample are dropped (honesty over
    continuity) — the band only shows where the estimate is supportable."""
    as_of = core.month_floor(scope.end)
    where, params = _scope_where(scope)
    df = core.query_df(
        f"""SELECT month, wage_postings AS n, wage_p25 AS p25, wage_median AS median, wage_p75 AS p75
            FROM {core.parquet('wage_cube')}
            WHERE {where} AND month <= ?
            ORDER BY month""",
        params + [as_of],
    )
    points: list[WageTrendPoint] = []
    for _, r in df.iterrows():
        if r["n"] is None or pd.isna(r["n"]) or int(r["n"]) < core.WAGE_MIN_SAMPLE:
            continue
        p25, median, p75 = _clean(r["p25"]), _clean(r["median"]), _clean(r["p75"])
        if p25 is None or median is None or p75 is None:
            continue
        points.append(
            WageTrendPoint(month=_iso(r["month"]), p25=p25, median=median, p75=p75, n=int(r["n"]))
        )
    return WageTrendResponse(scope=scope, as_of=_iso(as_of), min_sample=core.WAGE_MIN_SAMPLE, points=points)


# --------------------------------------------------------------------------- #
# Composition / concentration / matrix / coverage / language (researcher views)
# --------------------------------------------------------------------------- #


def _dim_cfg(scope: Scope, dim: str):
    """(vary, fixed_a, fixed_b, fixed_vals, all_sentinel, unknown) for a rank-style dim."""
    if dim == "occupations":
        return ("occupation_scope", "province_scope", "industry_scope", [scope.geo, scope.ind], core.ALL_OCC, core.UNKNOWN_OCC)
    return ("industry_scope", "province_scope", "occupation_scope", [scope.geo, scope.occ], core.ALL_IND, core.UNKNOWN_IND)


def composition(scope: Scope, dim: str, top_n: int = 6) -> CompositionResponse:
    """Monthly mix (share of coded postings) by broad group — top N + 'Other'."""
    as_of = core.month_floor(scope.end)
    vary, fixed_a, fixed_b, fixed_vals, all_sentinel, unknown = _dim_cfg(scope, dim)
    df = core.query_df(
        f"""SELECT {vary} AS g, month, postings_total AS n
            FROM {core.parquet('filter_cube')}
            WHERE {fixed_a} = ? AND {fixed_b} = ?
              AND {vary} NOT IN (?, ?) AND month <= ?
            ORDER BY month""",
        [*fixed_vals, all_sentinel, unknown, as_of],
    )
    if df.empty:
        return CompositionResponse(scope=scope, as_of=_iso(as_of), dim=dim, months=[], groups=[])
    df["month"] = pd.to_datetime(df["month"])
    months = sorted(df["month"].unique())
    month_iso = [_iso(pd.Timestamp(m).date()) for m in months]
    totals = df.groupby("g")["n"].sum().sort_values(ascending=False)
    top_codes = list(totals.index[:top_n])
    month_total = df.groupby("month")["n"].sum()

    groups: list[CompositionGroup] = []
    for g in top_codes:
        code, label = _split_label(str(g))
        sub = df[df["g"] == g].set_index("month")["n"]
        values = [float(sub.get(m, 0) / month_total[m]) if month_total[m] else 0.0 for m in months]
        groups.append(CompositionGroup(code=code, label=label, values=values))
    other_codes = list(totals.index[top_n:])
    if other_codes:
        sub = df[df["g"].isin(other_codes)].groupby("month")["n"].sum()
        values = [float(sub.get(m, 0) / month_total[m]) if month_total[m] else 0.0 for m in months]
        groups.append(CompositionGroup(code="__other__", label="Other", values=values))
    return CompositionResponse(scope=scope, as_of=_iso(as_of), dim=dim, months=month_iso, groups=groups)


def concentration(scope: Scope, dim: str) -> ConcentrationResponse:
    """Concentration of demand across broad groups at the as-of month: HHI + top-5 share."""
    as_of = core.month_floor(scope.end)
    vary, fixed_a, fixed_b, fixed_vals, all_sentinel, unknown = _dim_cfg(scope, dim)
    df = core.query_df(
        f"""SELECT {vary} AS g, postings_total AS n
            FROM {core.parquet('filter_cube')}
            WHERE month = ? AND {fixed_a} = ? AND {fixed_b} = ?
              AND {vary} NOT IN (?, ?)""",
        [as_of, *fixed_vals, all_sentinel, unknown],
    )
    if df.empty or df["n"].sum() == 0:
        return ConcentrationResponse(scope=scope, as_of=_iso(as_of), dim=dim, hhi=0.0, top5_share=0.0, n_groups=0)
    shares = (df["n"] / df["n"].sum()).sort_values(ascending=False)
    hhi = float((shares**2).sum() * 10000)
    top5 = float(shares.iloc[:5].sum())
    return ConcentrationResponse(
        scope=scope, as_of=_iso(as_of), dim=dim, hhi=round(hhi, 1), top5_share=round(top5, 4), n_groups=int(len(shares))
    )


def occ_province_matrix(scope: Scope, measure: str = "lq") -> MatrixResponse:
    """Occupation × province demand at the as-of month. measure='lq' (location quotient,
    >1 = over-represented vs the national mix) or 'count' (raw postings)."""
    as_of = core.month_floor(scope.end)
    df = core.query_df(
        f"""SELECT occupation_scope AS occ, province_scope AS prov, postings_total AS n
            FROM {core.parquet('filter_cube')}
            WHERE month = ? AND industry_scope = ?
              AND occupation_scope NOT IN (?, ?) AND province_scope <> ?""",
        [as_of, scope.ind, core.ALL_OCC, core.UNKNOWN_OCC, core.ALL_GEO],
    )
    if df.empty:
        return MatrixResponse(scope=scope, as_of=_iso(as_of), measure=measure, rows=[], cols=[], z=[], counts=[])
    occ_tot = df.groupby("occ")["n"].sum().sort_values(ascending=False)
    prov_tot = df.groupby("prov")["n"].sum().sort_values(ascending=False)
    grand = float(df["n"].sum())
    occ_codes = list(occ_tot.index)
    prov_codes = list(prov_tot.index)
    pivot = df.pivot_table(index="occ", columns="prov", values="n", aggfunc="sum", fill_value=0)

    z: list[list[float | None]] = []
    counts: list[list[int | None]] = []
    for o in occ_codes:
        zr: list[float | None] = []
        cr: list[int | None] = []
        for p in prov_codes:
            c = float(pivot.loc[o, p]) if (o in pivot.index and p in pivot.columns) else 0.0
            cr.append(int(c))
            if measure == "count":
                zr.append(int(c))
            else:  # location quotient = (c / prov_total) / (occ_total / grand)
                denom = (prov_tot[p] / grand) * occ_tot[o]
                zr.append(round(float(c / denom), 3) if denom else None)
        z.append(zr)
        counts.append(cr)
    rows = [_split_label(str(o))[1] for o in occ_codes]
    cols = [core.PROVINCE_NAMES.get(str(p), str(p)) for p in prov_codes]
    return MatrixResponse(scope=scope, as_of=_iso(as_of), measure=measure, rows=rows, cols=cols, z=z, counts=counts)


_COVERAGE_FIELDS = {
    "naics": "naics_postings",
    "noc": "noc_postings",
    "wage": "wage_postings",
    "skills": "skills_postings",
    "remote": "remote_field_postings",
}


def coverage_trend(scope: Scope, field: str = "naics") -> CoverageTrendResponse:
    """Share of postings with a usable value for `field`, by month (a data-honesty companion)."""
    as_of = core.month_floor(scope.end)
    col = _COVERAGE_FIELDS.get(field, "naics_postings")
    where, params = _scope_where(scope)
    df = core.query_df(
        f"""SELECT month, {col} AS k, postings_total AS n
            FROM {core.parquet('filter_cube')}
            WHERE {where} AND month <= ? ORDER BY month""",
        params + [as_of],
    )
    months: list[str] = []
    share: list[float] = []
    for _, r in df.iterrows():
        if r["n"] and int(r["n"]) > 0:
            months.append(_iso(r["month"]))
            share.append(round(float(r["k"]) / float(r["n"]), 4))
    return CoverageTrendResponse(scope=scope, field=field, months=months, share=share)


def geography_trend(scope: Scope, measure: str = "count") -> GeoTrendResponse:
    """Per-province posting counts by month, for the scope's occupation/industry slice
    (drives the time-scrubbed choropleth)."""
    as_of = core.month_floor(scope.end)
    df = core.query_df(
        f"""SELECT province_scope AS code, month, postings_total AS n
            FROM {core.parquet('filter_cube')}
            WHERE occupation_scope = ? AND industry_scope = ?
              AND province_scope <> ? AND month <= ?
            ORDER BY month""",
        [scope.occ, scope.ind, core.ALL_GEO, as_of],
    )
    if df.empty:
        return GeoTrendResponse(scope=scope, measure=measure, months=[], codes=[], labels=[], values=[])
    df["month"] = pd.to_datetime(df["month"])
    months = sorted(df["month"].unique())
    month_iso = [_iso(pd.Timestamp(m).date()) for m in months]
    codes = list(df.groupby("code")["n"].sum().sort_values(ascending=False).index)
    pivot = df.pivot_table(index="month", columns="code", values="n", aggfunc="sum", fill_value=0)
    values: list[list[float | None]] = []
    for m in months:
        row = pivot.loc[m] if m in pivot.index else None
        values.append([int(row[c]) if (row is not None and c in row) else None for c in codes])
    labels = [core.PROVINCE_NAMES.get(str(c), str(c)) for c in codes]
    return GeoTrendResponse(
        scope=scope, measure=measure, months=month_iso, codes=[str(c) for c in codes], labels=labels, values=values
    )


# --------------------------------------------------------------------------- #
# Skills
# --------------------------------------------------------------------------- #


def _skill_labels() -> pd.DataFrame:
    df = pd.read_csv(core.SKILLS_CSV, dtype={"code": str})
    return df[["code", "leaf_label", "group_label"]].rename(
        columns={"code": "skill_code", "leaf_label": "label", "group_label": "group"}
    )


def _skills_where(scope: Scope) -> tuple[str, list]:
    parts = ["month = ?"]
    p: list = []
    if scope.geo != core.ALL_GEO:
        parts.append("province_scope = ?")
        p.append(scope.geo)
    if scope.occ != core.ALL_OCC:
        parts.append("occupation_scope = ?")
        p.append(scope.occ)
    if scope.ind != core.ALL_IND:
        parts.append("industry_scope = ?")
        p.append(scope.ind)
    return " AND ".join(parts), p


def _skills_denominator(scope: Scope, as_of: date) -> int:
    where, params = _scope_where(scope)
    df = core.query_df(
        f"SELECT skills_postings AS n FROM {core.parquet('filter_cube')} WHERE {where} AND month = ?",
        params + [as_of],
    )
    return int(df["n"].iloc[0]) if not df.empty else 0


def skills(scope: Scope, mode: str = "top", limit: int = 15) -> SkillsResponse:
    as_of = core.month_floor(scope.end)
    where, p = _skills_where(scope)
    df = core.query_df(
        f"""SELECT skill_code, SUM(postings_total) AS count
            FROM {core.parquet('skills')}
            WHERE {where}
            GROUP BY skill_code""",
        [as_of, *p],
    )
    n = _skills_denominator(scope, as_of)
    if df.empty or n == 0:
        return SkillsResponse(scope=scope, as_of=_iso(as_of), mode=mode, n=n, items=[])
    df["skill_code"] = df["skill_code"].astype(str)
    labels = _skill_labels()
    df = df.merge(labels, on="skill_code", how="left")
    df["label"] = df["label"].fillna(df["skill_code"])
    df["share"] = df["count"] / n

    if mode == "distinctive":
        nat_scope = Scope(geo=core.ALL_GEO, occ=core.ALL_OCC, ind=core.ALL_IND, start=scope.start, end=scope.end)
        nwhere, np_ = _skills_where(nat_scope)
        ndf = core.query_df(
            f"""SELECT skill_code, SUM(postings_total) AS count
                FROM {core.parquet('skills')} WHERE {nwhere} GROUP BY skill_code""",
            [as_of, *np_],
        )
        nn = _skills_denominator(nat_scope, as_of)
        ndf["skill_code"] = ndf["skill_code"].astype(str)
        ndf["nat_share"] = ndf["count"] / nn if nn else 0
        df = df.merge(ndf[["skill_code", "nat_share"]], on="skill_code", how="left")
        df["lift"] = df.apply(
            lambda r: round(r["share"] / r["nat_share"], 2) if r.get("nat_share") else None, axis=1
        )
        df = df[df["count"] >= max(25, int(0.01 * n))]
        df = df.sort_values("lift", ascending=False, na_position="last")
    else:
        df = df.sort_values("count", ascending=False)

    items = [
        SkillItem(
            code=str(r["skill_code"]),
            label=r["label"],
            group=(r["group"] if isinstance(r.get("group"), str) else None),
            share=round(float(r["share"]), 4),
            count=int(r["count"]),
            lift=(float(r["lift"]) if mode == "distinctive" and r.get("lift") is not None and not pd.isna(r.get("lift")) else None),
        )
        for _, r in df.head(limit).iterrows()
    ]
    return SkillsResponse(scope=scope, as_of=_iso(as_of), mode=mode, n=n, items=items)


# --------------------------------------------------------------------------- #
# Requirements (remote / employment type / education / experience / language)
# --------------------------------------------------------------------------- #

_EMPLOYMENT_MAP = {
    "ft": "Full-time", "full-time": "Full-time", "Full-time": "Full-time",
    "pt": "Part-time", "part-time": "Part-time", "Part-time": "Part-time",
    "ft/pt": "Full or part-time", "full-time or part-time": "Full or part-time",
    "Unknown": "Unknown",
}

_LANGUAGE_MAP = {
    "en": "English", "fr": "French", "en/fr": "English or French",
    "English": "English", "French": "French", "Unknown": "Unknown",
}


def _long_shares(table: str, dimension: str, scope: Scope, as_of: date, label_map: dict | None = None) -> tuple[list[CategoryShare], int]:
    where, params = _scope_where(scope)
    df = core.query_df(
        f"""SELECT category, SUM(postings_total) AS count
            FROM {core.parquet(table)}
            WHERE {where} AND month = ? AND dimension = ?
            GROUP BY category""",
        params + [as_of, dimension],
    )
    if df.empty:
        # Fall back to national if the exact scope has no rows.
        nat = Scope(geo=core.ALL_GEO, occ=core.ALL_OCC, ind=core.ALL_IND, start=scope.start, end=scope.end)
        nwhere, nparams = _scope_where(nat)
        df = core.query_df(
            f"""SELECT category, SUM(postings_total) AS count
                FROM {core.parquet(table)}
                WHERE {nwhere} AND month = ? AND dimension = ?
                GROUP BY category""",
            nparams + [as_of, dimension],
        )
    if df.empty:
        return [], 0
    # Normalize categories via map (collapsing aliases).
    if label_map:
        df["label"] = df["category"].map(lambda c: label_map.get(c, c))
        df = df.groupby("label", as_index=False).agg(count=("count", "sum"), category=("category", "first"))
    else:
        df["label"] = df["category"]
    total = df["count"].sum()
    df = df.sort_values("count", ascending=False)
    out = [
        CategoryShare(category=str(r["category"]), label=str(r["label"]), count=int(r["count"]), share=round(r["count"] / total, 4) if total else 0.0)
        for _, r in df.iterrows()
    ]
    return out, int(total)


def requirements(scope: Scope) -> RequirementsResponse:
    as_of = core.month_floor(scope.end)
    employment, n_emp = _long_shares("conditions", "Employment type", scope, as_of, _EMPLOYMENT_MAP)
    education, _ = _long_shares("requirements", "Education", scope, as_of)
    experience, _ = _long_shares("requirements", "Experience category", scope, as_of)
    language, _ = _long_shares("language", "Primary posting language", scope, as_of, _LANGUAGE_MAP)

    # Remote: share of postings flagged remote/hybrid among those with a remote field.
    where, params = _scope_where(scope)
    rem = core.query_df(
        f"""SELECT remote_field_postings AS field, remote_or_hybrid_postings AS remote
            FROM {core.parquet('filter_cube')} WHERE {where} AND month = ?""",
        params + [as_of],
    )
    remote: list[CategoryShare] = []
    if not rem.empty and int(rem["field"].iloc[0]) > 0:
        field_n = int(rem["field"].iloc[0])
        remote_n = int(rem["remote"].iloc[0])
        remote = [
            CategoryShare(category="remote_or_hybrid", label="Remote or hybrid", count=remote_n, share=round(remote_n / field_n, 4)),
            CategoryShare(category="onsite", label="On-site", count=field_n - remote_n, share=round((field_n - remote_n) / field_n, 4)),
        ]

    return RequirementsResponse(
        scope=scope, as_of=_iso(as_of), n=n_emp,
        remote=remote, employment_type=employment, education=education,
        experience=experience, language=language,
    )
