"""Shared dashboard metric helpers."""

from __future__ import annotations

from dataclasses import dataclass

import pandas as pd


def safe_pct(numerator: float | int, denominator: float | int) -> float | None:
    """Return a percentage in [0, 100] or None when undefined."""
    if denominator in (0, None):
        return None
    return 100.0 * float(numerator) / float(denominator)


def format_pct(value: float | None) -> str:
    if value is None or pd.isna(value):
        return "n/a"
    return f"{value:.1f}%"


def format_int(value: float | int | None) -> str:
    if value is None or pd.isna(value):
        return "n/a"
    return f"{int(round(float(value))):,}"


@dataclass(frozen=True)
class HeadlineMetrics:
    postings_total: int
    postings_latest_month: int | None
    postings_yoy_pct: float | None
    postings_ma3_yoy_pct: float | None
    wage_posting_share: float | None
    latest_refresh_month: str | None


def summarize_headlines(monthly_counts: pd.DataFrame) -> HeadlineMetrics:
    """Summarize overview headline metrics from month-level posting totals."""
    if monthly_counts.empty:
        return HeadlineMetrics(0, None, None, None, None, None)

    monthly = monthly_counts.sort_values("month").copy()
    monthly["postings_yoy_pct"] = monthly["postings_total"].pct_change(12) * 100.0
    monthly["postings_ma3"] = monthly["postings_total"].rolling(3, min_periods=1).mean()
    monthly["postings_ma3_yoy_pct"] = monthly["postings_ma3"].pct_change(12) * 100.0
    latest = monthly.iloc[-1]
    wage_share = safe_pct(latest["wage_postings"], latest["postings_total"])
    return HeadlineMetrics(
        postings_total=int(monthly["postings_total"].sum()),
        postings_latest_month=int(latest["postings_total"]),
        postings_yoy_pct=None if pd.isna(latest["postings_yoy_pct"]) else float(latest["postings_yoy_pct"]),
        postings_ma3_yoy_pct=None
        if pd.isna(latest["postings_ma3_yoy_pct"])
        else float(latest["postings_ma3_yoy_pct"]),
        wage_posting_share=wage_share,
        latest_refresh_month=str(pd.Timestamp(latest["month"]).date())[:7],
    )

