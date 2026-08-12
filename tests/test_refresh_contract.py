import json
from pathlib import Path

import duckdb
import pandas as pd

import pytest

from jobads_dashboard.dashboard.prepare import (
    EXPERIENCE_BAND_SQL,
    SOURCE_GLOB,
    build_posting_lookup_from_source,
    discover_source_root,
    normalized_view_sql,
    publish_staged_package,
    refresh_dashboard_data,
    validate_derived_package,
)


@pytest.mark.parametrize(
    "text, expected",
    [
        (None, "Not reported"),
        ("", "Not reported"),
        ("less than 1 year", "<1 year"),
        ("1 year", "1-3 years"),
        ("2 years", "1-3 years"),
        ("3 years", "3-5 years"),
        ("4 years", "3-5 years"),
        ("5 years", "5+ years"),
        ("6 years", "5+ years"),
        ("6-9 years", "5+ years"),   # leading-substring "6 year" would never match the old chain
        ("10 years", "5+ years"),    # old chain dropped this to "Other specified"
        ("12 years", "5+ years"),    # old chain misread as "1-3 years" via "2 year"
        ("more than 5 years", "5+ years"),
        ("more than 10 years", "5+ years"),
        ("negotiable", "Other specified"),
    ],
)
def test_experience_band_numeric_bucketing(text, expected):
    """S07: bucket by the extracted leading year count, not substring match."""
    con = duckdb.connect()
    got = con.execute(
        f"SELECT {EXPERIENCE_BAND_SQL} AS band "
        "FROM (SELECT CAST(? AS VARCHAR) AS experienceDetails) t",
        [text],
    ).fetchone()[0]
    assert got == expected, (text, got, expected)


def write_minimal_bundle(tmp_path: Path, source_glob: str | None = None, source_total: int = 3) -> None:
    shared_scope = {
        "month": ["2025-07-01"],
        "province_scope": ["All Canada"],
        "occupation_scope": ["All occupations"],
        "industry_scope": ["All industries"],
        "postings_total": [3],
    }
    # The count-cube family (monthly_overall + the sliced cubes) all share this wide
    # schema in the real bundle, so the fixtures must carry it too.
    count_cube = {
        **shared_scope,
        "wage_postings": [1],
        "noc_postings": [2],
        "naics_postings": [2],
        "remote_field_postings": [1],
        "remote_or_hybrid_postings": [1],
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
    pd.DataFrame(count_cube).to_parquet(tmp_path / "monthly_filter_cube.parquet")
    pd.DataFrame(count_cube).to_parquet(tmp_path / "monthly_overall.parquet")
    pd.DataFrame(count_cube).to_parquet(tmp_path / "monthly_by_province.parquet")
    pd.DataFrame({**shared_scope, "market_province": ["ON"], "market": ["Toronto"], "market_label": ["ON | Toronto"]}).to_parquet(
        tmp_path / "monthly_by_market.parquet"
    )
    pd.DataFrame(count_cube).to_parquet(tmp_path / "monthly_by_noc_broad.parquet")
    pd.DataFrame(count_cube).to_parquet(tmp_path / "monthly_by_naics_broad.parquet")
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


def test_posting_lookup_uses_current_source_window_when_metadata_is_stale(tmp_path: Path) -> None:
    fixture_path = next((Path(__file__).parent / "fixtures" / "golden_corpus" / "2024").glob("processed_*.parquet"))
    template = pd.read_parquet(fixture_path).iloc[[0]].copy()
    source_root = tmp_path / "processed"
    for year, posting_id, date_found in [(2025, 1, "2025-01-15"), (2026, 2, "2026-06-15")]:
        frame = template.copy()
        frame["id"] = posting_id
        frame["dateFound"] = date_found
        if year == 2026:
            frame["jobTitle"] = "Analyste â€” &#201;nergie"
            frame["employer"] = "CafÃ© Québec"
            frame["experienceDetails"] = "multiâ€‘phase"
            frame["description"] = "ambition â€” cafÃ© &amp; déjà Franí§ais.â€¯ ã…¤"
        year_root = source_root / str(year)
        year_root.mkdir(parents=True)
        frame.to_parquet(year_root / f"processed_{year}.parquet", index=False)

    output_root = tmp_path / "derived"
    output_root.mkdir()
    (output_root / "metadata.json").write_text(
        json.dumps({"source_window": {"min_date": "2025-01-15", "max_date": "2025-01-15"}}),
        encoding="utf-8",
    )

    path = build_posting_lookup_from_source(
        source_root,
        output_root,
        posting_lookup_limit=100,
        posting_lookup_recent_months=1,
    )

    lookup = pd.read_parquet(path)
    assert lookup["posting_id"].tolist() == ["2"]
    assert lookup["date_found"].astype(str).tolist() == ["2026-06-15"]
    assert lookup["job_title"].tolist() == ["Analyste — Énergie"]
    assert lookup["employer"].tolist() == ["Café Québec"]
    assert lookup["experience_details"].tolist() == ["multi‑phase"]
    assert lookup["description_full"].tolist() == ["ambition — café & déjà Français.  ㅤ"]


def test_standalone_lookup_failure_preserves_existing_file(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    import jobads_dashboard.dashboard.prepare as prepare

    source_root = Path(__file__).parent / "fixtures" / "golden_corpus"
    output_root = tmp_path / "derived"
    output_root.mkdir()
    output_path = output_root / "posting_lookup.parquet"
    output_path.write_bytes(b"last-known-good")

    def fail_write(*_args, **_kwargs) -> None:
        raise RuntimeError("injected standalone build failure")

    monkeypatch.setattr(prepare, "write_query_to_parquet", fail_write)
    with pytest.raises(RuntimeError, match="injected standalone build failure"):
        build_posting_lookup_from_source(
            source_root,
            output_root,
            posting_lookup_limit=100,
            posting_lookup_recent_months=1,
        )

    assert output_path.read_bytes() == b"last-known-good"
    assert not list(output_root.glob(".posting_lookup.staging-*.parquet"))


def test_refresh_failure_leaves_existing_bundle_unchanged(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    import jobads_dashboard.dashboard.prepare as prepare

    output_root = tmp_path / "derived"
    output_root.mkdir()
    (output_root / "current-release.txt").write_text("keep me", encoding="utf-8")
    source_root = Path(__file__).parent / "fixtures" / "golden_corpus"

    def fail_after_first_output(*_args, **_kwargs) -> None:
        raise RuntimeError("injected build failure")

    monkeypatch.setattr(prepare, "build_monthly_overall", fail_after_first_output)

    with pytest.raises(RuntimeError, match="injected build failure"):
        refresh_dashboard_data(
            source_root=source_root,
            output_root=output_root,
            skills_top_k=10,
            posting_lookup_limit=100,
            posting_lookup_recent_months=1,
        )

    assert sorted(path.name for path in output_root.iterdir()) == ["current-release.txt"]
    assert (output_root / "current-release.txt").read_text(encoding="utf-8") == "keep me"
    assert not list(tmp_path.glob(".derived.staging-*"))
    assert not list(tmp_path.glob(".derived.backup-*"))


def test_publish_failure_restores_prior_bundle(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    output_root = tmp_path / "derived"
    output_root.mkdir()
    (output_root / "release.txt").write_text("old", encoding="utf-8")
    staging_root = tmp_path / ".derived.staging-test"
    staging_root.mkdir()
    (staging_root / "release.txt").write_text("new", encoding="utf-8")
    real_rename = Path.rename

    def fail_staging_publish(path: Path, target: Path) -> Path:
        if path == staging_root:
            raise OSError("injected publish failure")
        return real_rename(path, target)

    monkeypatch.setattr(Path, "rename", fail_staging_publish)

    with pytest.raises(OSError, match="injected publish failure"):
        publish_staged_package(staging_root, output_root)

    assert (output_root / "release.txt").read_text(encoding="utf-8") == "old"
    assert (staging_root / "release.txt").read_text(encoding="utf-8") == "new"
    assert not list(tmp_path.glob(".derived.backup-*"))


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
