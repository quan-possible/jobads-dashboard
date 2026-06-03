from pathlib import Path

import pandas as pd

from jobads_dashboard.dashboard.app import (
    ALL_CANADA,
    ALL_INDUSTRIES,
    ALL_OCCUPATIONS,
    query_posting_lookup,
)


def test_query_posting_lookup_filters_and_searches_private_index(tmp_path: Path) -> None:
    data_root = tmp_path / "bundle"
    data_root.mkdir()
    pd.DataFrame(
        {
            "posting_id": ["1", "2"],
            "month": pd.to_datetime(["2025-07-01", "2025-06-01"]),
            "date_found": pd.to_datetime(["2025-07-01", "2025-06-01"]),
            "job_title": ["Data Analyst", "Cook"],
            "employer": ["ACME Analytics", "Cafe Example"],
            "province_scope": ["ON", "BC"],
            "market": ["Toronto", "Vancouver"],
            "occupation_scope": ["1 | Business, finance and administration occupations", "6 | Sales and service occupations"],
            "industry_scope": ["54 | Professional, scientific and technical services", "72 | Accommodation and food services"],
            "noc_label": ["11200 - Professional occupations", "63200 - Cooks"],
            "naics_label": ["54 - Professional services", "72 - Accommodation and food services"],
            "wage_hourly": [32.0, 20.0],
            "employment_type": ["Full-time", "Part-time"],
            "duration": ["Permanent", "Permanent"],
            "experience": ["Experience an asset", "Will train"],
            "education": ["Bachelor's degree", "No degree"],
            "remote_class": ["Hybrid", "On-site / unspecified"],
            "data_source": ["vicinity", "vicinity"],
            "has_description": [True, True],
            "description_excerpt": ["Python SQL dashboard work", "Kitchen prep"],
        }
    ).to_parquet(data_root / "posting_lookup.parquet")

    result = query_posting_lookup(
        str(data_root),
        start_date="2025-01-01",
        end_date="2025-12-31",
        province_scope="ON",
        occupation_scope=ALL_OCCUPATIONS,
        industry_scope=ALL_INDUSTRIES,
        search_term="python",
        limit=10,
    )

    assert result["posting_id"].tolist() == ["1"]
    assert result["job_title"].tolist() == ["Data Analyst"]


def test_query_posting_lookup_returns_empty_when_index_missing(tmp_path: Path) -> None:
    result = query_posting_lookup(
        str(tmp_path),
        start_date="2025-01-01",
        end_date="2025-12-31",
        province_scope=ALL_CANADA,
        occupation_scope=ALL_OCCUPATIONS,
        industry_scope=ALL_INDUSTRIES,
        search_term="anything",
        limit=10,
    )

    assert result.empty


def test_query_posting_lookup_returns_empty_when_index_is_partial(tmp_path: Path) -> None:
    (tmp_path / "posting_lookup.parquet").write_bytes(b"")

    result = query_posting_lookup(
        str(tmp_path),
        start_date="2025-01-01",
        end_date="2025-12-31",
        province_scope=ALL_CANADA,
        occupation_scope=ALL_OCCUPATIONS,
        industry_scope=ALL_INDUSTRIES,
        search_term="anything",
        limit=10,
    )

    assert result.empty
