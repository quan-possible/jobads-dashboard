"""Aggregate loading helpers for the dashboard app."""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd


REQUIRED_TABLES = (
    "monthly_overall.parquet",
    "monthly_filter_cube.parquet",
    "monthly_by_province.parquet",
    "monthly_by_market.parquet",
    "monthly_by_noc_broad.parquet",
    "monthly_by_naics_broad.parquet",
    "monthly_wage_cube.parquet",
    "monthly_wage_by_province.parquet",
    "monthly_wage_by_noc_broad.parquet",
    "monthly_conditions.parquet",
    "monthly_language.parquet",
    "monthly_requirements.parquet",
    "monthly_skills_topk.parquet",
    "coverage_by_field_monthly.parquet",
    "geography_top_markets.parquet",
)


def load_metadata(data_root: Path) -> dict:
    metadata_path = data_root / "metadata.json"
    with metadata_path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def load_tables(data_root: Path) -> dict[str, pd.DataFrame]:
    tables: dict[str, pd.DataFrame] = {}
    for name in REQUIRED_TABLES:
        path = data_root / name
        if path.exists():
            frame = pd.read_parquet(path)
            if "month" in frame.columns:
                frame["month"] = pd.to_datetime(frame["month"])
            tables[path.stem] = frame
    return tables
