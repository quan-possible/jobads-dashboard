"""Shared infrastructure for the API: paths, scope constants, DuckDB access.

The API reads ONLY from the local derived aggregates (and the bundled reference
files). It never scans the upstream processed corpus at request time.
"""

from __future__ import annotations

import functools
import os
import pathlib
import threading
from datetime import date

import duckdb
import pandas as pd

# --------------------------------------------------------------------------- #
# Paths
# --------------------------------------------------------------------------- #

REPO_ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA_DIR = REPO_ROOT / "data" / "derived" / "labor_market_dashboard_v1"
REFERENCE_DIR = REPO_ROOT / "data" / "reference"


def _resolve_skills_csv() -> pathlib.Path:
    """Prefer the bundled copy; fall back to the upstream config; else env."""
    env = os.environ.get("JOBADS_SKILLS_CSV")
    if env:
        return pathlib.Path(env)
    local = REFERENCE_DIR / "skills.csv"
    if local.exists():
        return local
    return pathlib.Path("/Volumes/ACLMR/jobads-data/main/config/skills.csv")


def _resolve_posting_lookup() -> pathlib.Path:
    """Private posting-level lookup. Gitignored, so it is read from the main
    checkout (or an explicit env override), never bundled into the worktree."""
    env = os.environ.get("JOBADS_POSTING_LOOKUP")
    if env:
        return pathlib.Path(env)
    local = DATA_DIR / "posting_lookup.parquet"
    if local.exists():
        return local
    return pathlib.Path(
        "/Volumes/ACLMR/jobads-dashboard/data/derived/labor_market_dashboard_v1/posting_lookup.parquet"
    )


SKILLS_CSV = _resolve_skills_csv()
POSTING_LOOKUP = _resolve_posting_lookup()
PROVINCE_LF_CSV = REFERENCE_DIR / "province_labour_force.csv"
PROVINCE_TOPO = REFERENCE_DIR / "canada_provinces.topo.json"
METADATA_JSON = DATA_DIR / "metadata.json"

# --------------------------------------------------------------------------- #
# Scope sentinels (verified against the real aggregates)
# --------------------------------------------------------------------------- #

ALL_GEO = "All Canada"
ALL_OCC = "All occupations"
ALL_IND = "All industries"

UNKNOWN_OCC = "Unknown occupation group"
UNKNOWN_IND = "Unknown industry group"

# Demand index baseline: Jan 2019 = 100 (pre-pandemic reference month).
INDEX_BASE_MONTH = date(2019, 1, 1)

# Minimum posting count before a wage statistic is shown.
WAGE_MIN_SAMPLE = 100
# Minimum posting count before a sparse-field share is shown.
SHARE_MIN_SAMPLE = 100

# Province/territory display names (the 13 standard codes).
PROVINCE_NAMES: dict[str, str] = {
    "AB": "Alberta",
    "BC": "British Columbia",
    "MB": "Manitoba",
    "NB": "New Brunswick",
    "NL": "Newfoundland and Labrador",
    "NS": "Nova Scotia",
    "NT": "Northwest Territories",
    "NU": "Nunavut",
    "ON": "Ontario",
    "PE": "Prince Edward Island",
    "QC": "Quebec",
    "SK": "Saskatchewan",
    "YT": "Yukon",
}

# --------------------------------------------------------------------------- #
# Table registry
# --------------------------------------------------------------------------- #

TABLES = {
    "overall": "monthly_overall",
    "filter_cube": "monthly_filter_cube",
    "by_noc": "monthly_by_noc_broad",
    "by_naics": "monthly_by_naics_broad",
    "by_province": "monthly_by_province",
    "wage_cube": "monthly_wage_cube",
    "wage_by_noc": "monthly_wage_by_noc_broad",
    "wage_by_province": "monthly_wage_by_province",
    "skills": "monthly_skills_topk",
    "conditions": "monthly_conditions",
    "language": "monthly_language",
    "requirements": "monthly_requirements",
    "by_market": "monthly_by_market",
}


def parquet(name: str) -> str:
    """Return a `read_parquet('…')` expression for a registered table key."""
    fname = TABLES[name]
    return f"read_parquet('{DATA_DIR / (fname + '.parquet')}')"


# --------------------------------------------------------------------------- #
# DuckDB access — one connection, per-query cursors, guarded by a lock.
# --------------------------------------------------------------------------- #

_CON: duckdb.DuckDBPyConnection | None = None
_LOCK = threading.Lock()


def connection() -> duckdb.DuckDBPyConnection:
    global _CON
    if _CON is None:
        with _LOCK:
            if _CON is None:
                _CON = duckdb.connect(database=":memory:")
                _CON.execute("PRAGMA threads=4")
    return _CON


def query_df(sql: str, params: list | None = None) -> pd.DataFrame:
    """Run a read query and return a DataFrame. Thread-safe via a fresh cursor."""
    cur = connection().cursor()
    try:
        return cur.execute(sql, params or []).fetch_df()
    finally:
        cur.close()


# --------------------------------------------------------------------------- #
# Scope helpers
# --------------------------------------------------------------------------- #


@functools.lru_cache(maxsize=1)
def latest_month() -> date:
    df = query_df(f"SELECT max(month) AS m FROM {parquet('overall')}")
    return df["m"].iloc[0].date() if hasattr(df["m"].iloc[0], "date") else df["m"].iloc[0]


@functools.lru_cache(maxsize=1)
def earliest_month() -> date:
    df = query_df(f"SELECT min(month) AS m FROM {parquet('overall')}")
    return df["m"].iloc[0].date() if hasattr(df["m"].iloc[0], "date") else df["m"].iloc[0]


def month_floor(value: str | date) -> date:
    """Normalize a 'YYYY-MM' or 'YYYY-MM-DD' value to the first of its month."""
    if isinstance(value, date):
        return value.replace(day=1)
    text = str(value).strip()
    parts = text.split("-")
    year, month = int(parts[0]), int(parts[1])
    return date(year, month, 1)
