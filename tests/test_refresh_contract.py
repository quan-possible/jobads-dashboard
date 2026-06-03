import json
from pathlib import Path

import duckdb
import pandas as pd

from jobads_dashboard.dashboard.prepare import SOURCE_GLOB, discover_source_root, normalized_view_sql, validate_derived_package


def write_minimal_bundle(tmp_path: Path, source_glob: str | None = None, source_total: int = 3) -> None:
    shared_scope = {
        "month": ["2025-07-01"],
        "province_scope": ["All Canada"],
        "occupation_scope": ["All occupations"],
        "industry_scope": ["All industries"],
        "postings_total": [3],
    }
    pd.DataFrame(
        {
            **shared_scope,
            "wage_postings": [1],
            "noc_postings": [2],
            "naics_postings": [2],
            "remote_field_postings": [1],
            "primary_language_postings": [1],
            "english_requirement_postings": [1],
            "french_requirement_postings": [1],
            "experience_detail_postings": [1],
            "education_postings": [1],
            "skills_postings": [1],
            "employment_type_postings": [1],
            "duration_postings": [1],
            "advertised_by_postings": [1],
        }
    ).to_parquet(tmp_path / "monthly_filter_cube.parquet")
    pd.DataFrame(shared_scope).to_parquet(tmp_path / "monthly_overall.parquet")
    pd.DataFrame(shared_scope).to_parquet(tmp_path / "monthly_by_province.parquet")
    pd.DataFrame({**shared_scope, "market_province": ["ON"], "market": ["Toronto"], "market_label": ["ON | Toronto"]}).to_parquet(
        tmp_path / "monthly_by_market.parquet"
    )
    pd.DataFrame(shared_scope).to_parquet(tmp_path / "monthly_by_noc_broad.parquet")
    pd.DataFrame(shared_scope).to_parquet(tmp_path / "monthly_by_naics_broad.parquet")
    pd.DataFrame({**shared_scope, "wage_postings": [1], "wage_p25": [10.0], "wage_median": [12.0], "wage_p75": [14.0]}).to_parquet(
        tmp_path / "monthly_wage_cube.parquet"
    )
    pd.DataFrame({**shared_scope, "wage_postings": [1], "wage_p25": [10.0], "wage_median": [12.0], "wage_p75": [14.0]}).to_parquet(
        tmp_path / "monthly_wage_by_province.parquet"
    )
    pd.DataFrame({**shared_scope, "wage_postings": [1], "wage_p25": [10.0], "wage_median": [12.0], "wage_p75": [14.0]}).to_parquet(
        tmp_path / "monthly_wage_by_noc_broad.parquet"
    )
    pd.DataFrame({**shared_scope, "dimension": ["Employment type"], "category": ["Full-time"]}).to_parquet(
        tmp_path / "monthly_conditions.parquet"
    )
    pd.DataFrame({**shared_scope, "dimension": ["Primary posting language"], "category": ["English"]}).to_parquet(
        tmp_path / "monthly_language.parquet"
    )
    pd.DataFrame({**shared_scope, "dimension": ["Education"], "category": ["Bachelor's"]}).to_parquet(
        tmp_path / "monthly_requirements.parquet"
    )
    pd.DataFrame({**shared_scope, "skill_code": ["python"], "skill_rank": [1]}).to_parquet(
        tmp_path / "monthly_skills_topk.parquet"
    )
    pd.DataFrame({**shared_scope, "field_name": ["skills"], "populated_postings": [1]}).to_parquet(
        tmp_path / "coverage_by_field_monthly.parquet"
    )
    pd.DataFrame({"province": ["ON"], "market": ["Toronto"], "market_label": ["ON | Toronto"], "postings_total": [3], "first_month": ["2025-07-01"], "last_month": ["2025-07-31"]}).to_parquet(
        tmp_path / "geography_top_markets.parquet"
    )
    metadata = {
        "headline_counts": {"postings_total": 3},
        "source_window": {"min_date": "2025-07-01", "max_date": "2025-07-01"},
    }
    if source_glob is not None:
        metadata["source_glob"] = source_glob
        metadata["source_root"] = str(Path(source_glob).parent)
        metadata["headline_counts"]["postings_total"] = source_total
    (tmp_path / "metadata.json").write_text(json.dumps(metadata), encoding="utf-8")


def test_validate_derived_package_detects_complete_minimal_bundle(tmp_path: Path) -> None:
    write_minimal_bundle(tmp_path)
    result = validate_derived_package(tmp_path)
    assert result["validated"] is True
    assert result["missing_files"] == []
    assert result["schema_issues"] == {}


def test_validate_derived_package_fails_when_source_totals_drift(tmp_path: Path) -> None:
    source_dir = tmp_path / "upstream" / "2025"
    source_dir.mkdir(parents=True)
    pd.DataFrame({"dateFound": ["2025-07-01"] * 4}).to_parquet(source_dir / "processed_test.parquet")
    write_minimal_bundle(tmp_path, source_glob=str(source_dir / "processed_*.parquet"), source_total=3)
    result = validate_derived_package(tmp_path)
    assert result["source_postings_total"] == 4
    assert result["validated"] is False


def test_validate_derived_package_fails_when_source_glob_cannot_be_read(tmp_path: Path) -> None:
    write_minimal_bundle(tmp_path, source_glob=str(tmp_path / "missing" / "processed_*.parquet"))
    result = validate_derived_package(tmp_path)
    assert result["source_postings_total"] is None
    assert result["source_error"] is not None
    assert result["validated"] is False


def test_validate_derived_package_uses_source_root_override_instead_of_stale_metadata_glob(tmp_path: Path) -> None:
    source_root = tmp_path / "upstream"
    source_dir = source_root / "2025"
    source_dir.mkdir(parents=True)
    pd.DataFrame({"dateFound": ["2025-07-01"] * 3}).to_parquet(source_dir / "processed_test.parquet")

    write_minimal_bundle(
        tmp_path,
        source_glob=str(tmp_path / "missing" / "processed_*.parquet"),
        source_total=3,
    )

    result = validate_derived_package(tmp_path, source_root=source_root)

    assert result["source_postings_total"] == 3
    assert result["source_window_match"] is True
    assert result["source_error"] is None
    assert result["validated"] is True


def test_validate_derived_package_ignores_backup_like_processed_dirs(tmp_path: Path) -> None:
    source_root = tmp_path / "upstream"
    canonical_dir = source_root / "2025"
    backup_dir = source_root / "2025.previous_20260503T195500Z"
    canonical_dir.mkdir(parents=True)
    backup_dir.mkdir(parents=True)
    pd.DataFrame({"dateFound": ["2025-07-01"] * 3}).to_parquet(canonical_dir / "processed_test.parquet")
    pd.DataFrame({"dateFound": ["2025-07-01"] * 99}).to_parquet(backup_dir / "processed_test.parquet")

    write_minimal_bundle(tmp_path, source_glob=str(source_root / SOURCE_GLOB), source_total=3)

    result = validate_derived_package(tmp_path, source_root=source_root)

    assert result["source_postings_total"] == 3
    assert result["validated"] is True


def test_discover_source_root_walks_up_to_find_sibling_repo(tmp_path: Path) -> None:
    source_root = tmp_path / "Projects" / "Vicinity Data" / "jobads-data" / "main" / "data" / "processed"
    source_root.mkdir(parents=True)
    repo_root = tmp_path / "Projects" / "Vicinity Data" / "jobads-dashboard" / "tmp" / "extensive-verification" / "review-copy"
    repo_root.mkdir(parents=True)

    assert discover_source_root(repo_root) == source_root


def test_normalized_view_sql_maps_two_digit_noc_rows_to_broad_group(tmp_path: Path) -> None:
    source_dir = tmp_path / "processed" / "2025"
    source_dir.mkdir(parents=True)
    pd.DataFrame(
        {
            "id": [1, 2, 3, 4],
            "jobTitle": ["A", "B", "C", "D"],
            "jobTitleText": ["A", "B", "C", "D"],
            "employer": ["Employer A", "Employer B", "Employer C", "Employer D"],
            "dataSource": ["test", "test", "test", "test"],
            "description": ["Desc A", "Desc B", "Desc C", "Desc D"],
            "dateFound": ["2025-07-01", "2025-07-01", "2025-07-01", "2025-07-01"],
            "province": ["ON", "ON", "AB", "BC"],
            "location": ["Toronto", "Toronto", "Calgary", "Vancouver"],
            "cma-ca": ["Toronto", "Toronto", "Calgary", "Vancouver"],
            "district": ["Toronto", "Toronto", "Calgary", "Vancouver"],
            "devRegion": ["Toronto", "Toronto", "Calgary", "Vancouver"],
            "noc": [
                "00 - Legislative and senior management occupations",
                "60 - Middle management occupations in retail and wholesale trade",
                "12345 - Professional occupations in business management consulting",
                None,
            ],
            "naics": [None, None, None, None],
            "remunerationHrly": [None, None, None, None],
            "remunerationMin": [None, None, None, None],
            "remunerationMax": [None, None, None, None],
            "remunerationUnit": [None, None, None, None],
            "experience": [None, None, None, None],
            "experienceDetails": [None, None, None, None],
            "education": [None, None, None, None],
            "type": [None, None, None, None],
            "duration": [None, None, None, None],
            "studentJobFlag": [None, None, None, None],
            "advertisedBy": [None, None, None, None],
            "remoteWorkOptions": [None, None, None, None],
            "primaryPostingLanguage": [None, None, None, None],
            "englishLanguageRequirement": [None, None, None, None],
            "frenchLanguageRequirement": [None, None, None, None],
            "skills": [None, None, None, None],
            "certs": [None, None, None, None],
            "cips": [None, None, None, None],
        }
    ).to_parquet(source_dir / "processed_test.parquet")

    con = duckdb.connect()
    con.execute(normalized_view_sql(str(source_dir / "processed_*.parquet")))
    rows = con.execute(
        """
        SELECT noc, noc_broad_code, noc_broad_label
        FROM normalized_postings
        ORDER BY noc NULLS LAST
        """
    ).fetchall()

    assert rows[0][1:] == ("0", "0 | Legislative and senior management occupations")
    assert rows[1][1:] == ("1", "1 | Business, finance and administration occupations")
    assert rows[2][1:] == ("6", "6 | Sales and service occupations")
    assert rows[3][1:] == (None, "Unknown occupation group")
