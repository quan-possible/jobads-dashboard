"""Analytical query layer.

All numbers the dashboard shows are computed here from the local aggregates.
Design rules encoded here:
  * Demand index: Jan 2019 = 100 for the same scope (fallback: first month).
  * Wage / sparse-field stats are withheld below a minimum sample.
  * Key points are descriptive only — no causal language (guarded by a test).
"""

from __future__ import annotations

import json
import math
from datetime import date

import pandas as pd

from . import core
from .models import (
    CoverageItem,
    Kpis,
    Meta,
    OverviewResponse,
    RankItem,
    Scope,
    SeriesPoint,
    SourceWindow,
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
    # Malformed start/end params degrade to the default window, not a 500.
    end_m = core.safe_month_floor(end) if end else None
    if end_m is None or end_m > core.latest_month():
        end_m = core.latest_month()
    start_m = core.safe_month_floor(start) if start else None
    if start_m is None:
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
# Rankings (occupations / industries) — drives the overview growing/cooling lists
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


# --------------------------------------------------------------------------- #
# Overview / Pulse
# --------------------------------------------------------------------------- #


def _kpis(scope: Scope, series: list[SeriesPoint]) -> tuple[Kpis, date]:
    if not series:
        return Kpis(), core.month_floor(scope.end)
    as_of = core.month_floor(series[-1].month)
    last = series[-1]
    prev = series[-2] if len(series) >= 2 else None
    # Year-over-year matches the same calendar month a year ago by date, not by
    # position: sparse scopes have month gaps where series[-13] lands on the
    # wrong month (or years off), making the "YoY" label silently wrong.
    yoy_month = _iso(date(as_of.year - 1, as_of.month, 1))
    yoy_ref = next((p for p in series if p.month == yoy_month), None)

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
