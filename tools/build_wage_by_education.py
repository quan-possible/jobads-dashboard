#!/usr/bin/env python3
"""Build the wage-by-education reference asset (the conditioned wage premium).

Dashboard-side reference-data tooling. The published monthly wage cube is not cut
by education, so the conditioned premium cannot be read from the standard
aggregates. It CAN be derived from the posting-level lookup, which carries each
posting's hourly wage *and* its stated education requirement together.

Caveats baked into the asset's ``source`` string and surfaced in the UI:
- ``posting_lookup`` is a single-month (latest) sample, so this is a *cross-section*,
  not a 2016->2026 time series. A monthly series would need the upstream pipeline to
  add an education dimension to the wage cube (a real owner dependency).
- Wages are advertised, not paid; only postings carrying both a wage and an explicit
  education requirement are used. "Correlation, not causation."

Output: ``data/derived/wage_by_education.parquet`` (one row per education category):
``education, education_order, n, wage_p25, wage_median, wage_p75, month, source``.

The output is a tiny percentiles-only aggregate (no posting-level rows), so it is
safe to commit, like the other derived cubes.

Usage:
    python tools/build_wage_by_education.py
"""

from __future__ import annotations

import os
from pathlib import Path

import pandas as pd

REPO_ROOT = Path(__file__).resolve().parents[1]
OUT_PATH = REPO_ROOT / "data" / "derived" / "wage_by_education.parquet"

# Low -> high; "Unknown" is excluded from the ladder.
EDU_ORDER = [
    "No Education Required",
    "High School Completion",
    "College Diploma or Certification",
    "Undergraduate Degree (Bachelors)",
    "Graduate Degree - Masters",
    "Post-Graduate Degree - Doctorate",
]

WAGE_MIN, WAGE_MAX = 5.0, 500.0  # drop implausible hourly wages
MIN_SAMPLE = 50                  # suppress a category with too few wage-bearing postings


def _posting_lookup() -> Path:
    """Mirror api.core's resolution: env override, then the local bundle, then the
    main checkout (the lookup is gitignored and not bundled into worktrees)."""
    env = os.environ.get("JOBADS_POSTING_LOOKUP")
    if env:
        return Path(env)
    local = REPO_ROOT / "data" / "derived" / "labor_market_dashboard_v1" / "posting_lookup.parquet"
    if local.exists():
        return local
    return Path("/Volumes/ACLMR/jobads-dashboard/data/derived/"
                "labor_market_dashboard_v1/posting_lookup.parquet")


def build() -> pd.DataFrame:
    df = pd.read_parquet(_posting_lookup(), columns=["month", "wage_hourly", "education"])
    df = df.dropna(subset=["wage_hourly", "education"])
    df = df[(df["wage_hourly"] >= WAGE_MIN) & (df["wage_hourly"] <= WAGE_MAX)]
    df = df[df["education"].isin(EDU_ORDER)]
    month = str(pd.to_datetime(df["month"]).max().date())

    rows = []
    for i, cat in enumerate(EDU_ORDER):
        w = df.loc[df["education"] == cat, "wage_hourly"]
        if len(w) < MIN_SAMPLE:
            continue
        q = w.quantile([0.25, 0.5, 0.75])
        rows.append({
            "education": cat,
            "education_order": i,
            "n": int(len(w)),
            "wage_p25": round(float(q[0.25]), 2),
            "wage_median": round(float(q[0.5]), 2),
            "wage_p75": round(float(q[0.75]), 2),
            "month": month,
            "source": "posting_lookup latest-month sample; advertised hourly wage; "
                      "postings with both a wage and a stated education requirement",
        })
    return pd.DataFrame(rows)


def main() -> int:
    df = build()
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(OUT_PATH, index=False)
    print(f"wrote {OUT_PATH} ({len(df)} rows)")
    print(df[["education", "n", "wage_p25", "wage_median", "wage_p75"]].to_string(index=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
