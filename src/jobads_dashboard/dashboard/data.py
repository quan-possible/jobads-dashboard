"""Aggregate loading helpers for the dashboard app."""

from __future__ import annotations

from dataclasses import dataclass
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
)


@dataclass
class DashboardDataError(RuntimeError):
    """Raised when the local derived dashboard bundle is missing or unreadable."""

    summary: str
    data_root: Path
    missing_files: tuple[str, ...] = ()
    read_errors: tuple[str, ...] = ()

    def __str__(self) -> str:
        return self.summary


def load_tables(data_root: Path) -> dict[str, pd.DataFrame]:
    tables: dict[str, pd.DataFrame] = {}
    missing_files: list[str] = []
    read_errors: list[str] = []
    for name in REQUIRED_TABLES:
        path = data_root / name
        if not path.exists():
            missing_files.append(name)
            continue
        try:
            frame = pd.read_parquet(path)
        except Exception as exc:
            read_errors.append(f"{name}: {exc}")
            continue
        if "month" in frame.columns:
            frame["month"] = pd.to_datetime(frame["month"])
        tables[path.stem] = frame

    if missing_files or read_errors:
        raise DashboardDataError(
            "Derived dashboard data is incomplete or unreadable.",
            data_root=data_root,
            missing_files=tuple(missing_files),
            read_errors=tuple(read_errors),
        )
    return tables
