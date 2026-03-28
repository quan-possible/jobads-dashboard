"""Build the local aggregate package for the labor-market dashboard."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

import duckdb

from .constants import (
    ALL_CANADA,
    ALL_INDUSTRIES,
    ALL_OCCUPATIONS,
    COVERAGE_FIELDS,
    NAICS_SECTOR_LABELS,
    NOC_BROAD_LABELS,
)

REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_OUTPUT_ROOT = REPO_ROOT / "data" / "derived" / "labor_market_dashboard_v1"
SOURCE_GLOB = "20*/processed_*.parquet"


def discover_source_root(repo_root: Path) -> Path:
    for anchor in (repo_root, *repo_root.parents):
        candidate = anchor.parent / "jobads-data" / "main" / "data" / "processed"
        if candidate.exists():
            return candidate
    return repo_root.parent / "jobads-data" / "main" / "data" / "processed"


DEFAULT_SOURCE_ROOT = discover_source_root(REPO_ROOT)


def sql_literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def build_noc_case() -> str:
    lines = ["CASE"]
    for code, label in NOC_BROAD_LABELS.items():
        lines.append(
            f"    WHEN noc_broad_code = {sql_literal(code)} "
            f"THEN {sql_literal(f'{code} | {label}')}"
        )
    lines.append("    ELSE 'Unknown occupation group'")
    lines.append("END")
    return "\n".join(lines)


def build_naics_case() -> str:
    lines = ["CASE"]
    for code, label in NAICS_SECTOR_LABELS.items():
        lines.append(
            f"    WHEN naics_sector_code = {sql_literal(code)} "
            f"THEN {sql_literal(f'{code} | {label}')}"
        )
    lines.append("    ELSE 'Unknown industry group'")
    lines.append("END")
    return "\n".join(lines)


def normalized_view_sql(source_glob: str) -> str:
    noc_case = build_noc_case()
    naics_case = build_naics_case()
    return f"""
CREATE OR REPLACE TEMP VIEW normalized_postings AS
WITH raw AS (
    SELECT * FROM read_parquet({sql_literal(source_glob)}, union_by_name=True)
)
SELECT
    CAST(date_trunc('month', CAST(dateFound AS DATE)) AS DATE) AS month,
    CAST(dateFound AS DATE) AS date_found,
    COALESCE(NULLIF(TRIM(province), ''), 'Unknown') AS province,
    COALESCE(NULLIF(TRIM(location), ''), 'Unknown') AS location,
    COALESCE(NULLIF(TRIM("cma-ca"), ''), NULLIF(TRIM(location), ''), 'Unknown market') AS market,
    COALESCE(NULLIF(TRIM(district), ''), 'Unknown') AS district,
    COALESCE(NULLIF(TRIM(devRegion), ''), 'Unknown') AS dev_region,
    NULLIF(regexp_extract(noc, '^([0-9]{{5}})', 1), '') AS noc_code,
    NULLIF(regexp_extract(noc, '^([0-9])', 1), '') AS noc_broad_code,
    {noc_case} AS noc_broad_label,
    NULLIF(regexp_extract(naics, '^([0-9]{{2,6}})', 1), '') AS naics_code,
    CASE
        WHEN NULLIF(regexp_extract(naics, '^([0-9]{{2,6}})', 1), '') IS NULL THEN NULL
        WHEN substr(regexp_extract(naics, '^([0-9]{{2,6}})', 1), 1, 2) IN ('31', '32', '33') THEN '31-33'
        WHEN substr(regexp_extract(naics, '^([0-9]{{2,6}})', 1), 1, 2) IN ('44', '45') THEN '44-45'
        WHEN substr(regexp_extract(naics, '^([0-9]{{2,6}})', 1), 1, 2) IN ('48', '49') THEN '48-49'
        ELSE substr(regexp_extract(naics, '^([0-9]{{2,6}})', 1), 1, 2)
    END AS naics_sector_code,
    {naics_case} AS naics_sector_label,
    remunerationHrly,
    remunerationMin,
    remunerationMax,
    remunerationUnit,
    COALESCE(NULLIF(TRIM(experience), ''), 'Unknown') AS experience,
    NULLIF(TRIM(experienceDetails), '') AS experience_details,
    CASE
        WHEN experienceDetails IS NULL OR TRIM(experienceDetails) = '' THEN 'Not reported'
        WHEN lower(experienceDetails) LIKE '%less than 1 year%' THEN '<1 year'
        WHEN lower(experienceDetails) LIKE '%1 year%' OR lower(experienceDetails) LIKE '%2 year%' THEN '1-3 years'
        WHEN lower(experienceDetails) LIKE '%3 year%' OR lower(experienceDetails) LIKE '%4 year%' THEN '3-5 years'
        WHEN lower(experienceDetails) LIKE '%5 year%' OR lower(experienceDetails) LIKE '%more than 5%' THEN '5+ years'
        ELSE 'Other specified'
    END AS experience_band,
    COALESCE(NULLIF(TRIM(education), ''), 'Unknown') AS education,
    COALESCE(NULLIF(TRIM(type), ''), 'Unknown') AS employment_type,
    COALESCE(NULLIF(TRIM(duration), ''), 'Unknown') AS duration,
    COALESCE(NULLIF(TRIM(studentJobFlag), ''), 'Unknown') AS student_job_flag,
    COALESCE(NULLIF(TRIM(advertisedBy), ''), 'Unknown') AS advertised_by,
    NULLIF(TRIM(remoteWorkOptions), '') AS remote_work_options,
    CASE
        WHEN remoteWorkOptions IS NULL OR TRIM(remoteWorkOptions) = '' THEN 'Not reported'
        WHEN lower(remoteWorkOptions) LIKE '%hybrid%' THEN 'Hybrid'
        WHEN lower(remoteWorkOptions) LIKE '%not available%' THEN 'On-site / unspecified'
        WHEN lower(remoteWorkOptions) LIKE '%remote%' THEN 'Remote'
        ELSE TRIM(remoteWorkOptions)
    END AS remote_class,
    NULLIF(TRIM(primaryPostingLanguage), '') AS primary_posting_language,
    NULLIF(TRIM(englishLanguageRequirement), '') AS english_language_requirement,
    NULLIF(TRIM(frenchLanguageRequirement), '') AS french_language_requirement,
    NULLIF(TRIM(skills), '') AS skills,
    NULLIF(TRIM(certs), '') AS certs,
    NULLIF(TRIM(cips), '') AS cips,
    noc,
    naics
FROM raw
WHERE dateFound IS NOT NULL
"""


ROLLUP_GROUPS = """
GROUP BY GROUPING SETS (
    (month, province, noc_broad_code, noc_broad_label, naics_sector_code, naics_sector_label),
    (month, province, noc_broad_code, noc_broad_label),
    (month, province, naics_sector_code, naics_sector_label),
    (month, province),
    (month, noc_broad_code, noc_broad_label, naics_sector_code, naics_sector_label),
    (month, noc_broad_code, noc_broad_label),
    (month, naics_sector_code, naics_sector_label),
    (month)
)
"""


def selector_projection() -> str:
    return f"""
COALESCE(province, {sql_literal(ALL_CANADA)}) AS province_scope,
COALESCE(noc_broad_label, {sql_literal(ALL_OCCUPATIONS)}) AS occupation_scope,
COALESCE(naics_sector_label, {sql_literal(ALL_INDUSTRIES)}) AS industry_scope
"""


def write_query_to_parquet(con: duckdb.DuckDBPyConnection, query: str, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    con.execute(
        f"COPY ({query}) TO {sql_literal(output_path.as_posix())} (FORMAT PARQUET, COMPRESSION ZSTD)"
    )


def build_monthly_filter_cube(con: duckdb.DuckDBPyConnection, output_root: Path) -> None:
    query = f"""
SELECT
    month,
    {selector_projection()},
    count(*) AS postings_total,
    count(remunerationHrly) AS wage_postings,
    count(noc) AS noc_postings,
    count(naics) AS naics_postings,
    count(remote_work_options) AS remote_field_postings,
    count(*) FILTER (WHERE remote_class IN ('Remote', 'Hybrid')) AS remote_or_hybrid_postings,
    count(primary_posting_language) AS primary_language_postings,
    count(english_language_requirement) AS english_requirement_postings,
    count(french_language_requirement) AS french_requirement_postings,
    count(experience_details) AS experience_detail_postings,
    count(education) FILTER (WHERE education <> 'Unknown') AS education_postings,
    count(skills) AS skills_postings,
    count(employment_type) FILTER (WHERE employment_type <> 'Unknown') AS employment_type_postings,
    count(duration) FILTER (WHERE duration <> 'Unknown') AS duration_postings,
    count(advertised_by) FILTER (WHERE advertised_by <> 'Unknown') AS advertised_by_postings
FROM normalized_postings
{ROLLUP_GROUPS}
ORDER BY month, province_scope, occupation_scope, industry_scope
"""
    write_query_to_parquet(con, query, output_root / "monthly_filter_cube.parquet")


def build_monthly_overall(con: duckdb.DuckDBPyConnection, output_root: Path) -> None:
    query = f"""
SELECT *
FROM read_parquet({sql_literal((output_root / 'monthly_filter_cube.parquet').as_posix())})
WHERE province_scope = {sql_literal(ALL_CANADA)}
  AND occupation_scope = {sql_literal(ALL_OCCUPATIONS)}
  AND industry_scope = {sql_literal(ALL_INDUSTRIES)}
ORDER BY month
"""
    write_query_to_parquet(con, query, output_root / "monthly_overall.parquet")


def build_monthly_by_province(con: duckdb.DuckDBPyConnection, output_root: Path) -> None:
    query = f"""
SELECT *
FROM read_parquet({sql_literal((output_root / 'monthly_filter_cube.parquet').as_posix())})
WHERE occupation_scope = {sql_literal(ALL_OCCUPATIONS)}
  AND industry_scope = {sql_literal(ALL_INDUSTRIES)}
  AND province_scope <> {sql_literal(ALL_CANADA)}
ORDER BY month, province_scope
"""
    write_query_to_parquet(con, query, output_root / "monthly_by_province.parquet")


def build_monthly_by_noc_broad(con: duckdb.DuckDBPyConnection, output_root: Path) -> None:
    query = f"""
SELECT *
FROM read_parquet({sql_literal((output_root / 'monthly_filter_cube.parquet').as_posix())})
WHERE province_scope = {sql_literal(ALL_CANADA)}
  AND industry_scope = {sql_literal(ALL_INDUSTRIES)}
  AND occupation_scope <> {sql_literal(ALL_OCCUPATIONS)}
ORDER BY month, occupation_scope
"""
    write_query_to_parquet(con, query, output_root / "monthly_by_noc_broad.parquet")


def build_monthly_by_naics_broad(con: duckdb.DuckDBPyConnection, output_root: Path) -> None:
    query = f"""
SELECT *
FROM read_parquet({sql_literal((output_root / 'monthly_filter_cube.parquet').as_posix())})
WHERE province_scope = {sql_literal(ALL_CANADA)}
  AND occupation_scope = {sql_literal(ALL_OCCUPATIONS)}
  AND industry_scope <> {sql_literal(ALL_INDUSTRIES)}
ORDER BY month, industry_scope
"""
    write_query_to_parquet(con, query, output_root / "monthly_by_naics_broad.parquet")


def build_monthly_wage_cubes(con: duckdb.DuckDBPyConnection, output_root: Path) -> None:
    query = f"""
SELECT
    month,
    {selector_projection()},
    count(remunerationHrly) AS wage_postings,
    quantile_cont(remunerationHrly, 0.25) FILTER (WHERE remunerationHrly IS NOT NULL) AS wage_p25,
    quantile_cont(remunerationHrly, 0.50) FILTER (WHERE remunerationHrly IS NOT NULL) AS wage_median,
    quantile_cont(remunerationHrly, 0.75) FILTER (WHERE remunerationHrly IS NOT NULL) AS wage_p75
FROM normalized_postings
{ROLLUP_GROUPS}
ORDER BY month, province_scope, occupation_scope, industry_scope
"""
    write_query_to_parquet(con, query, output_root / "monthly_wage_cube.parquet")

    province_query = f"""
SELECT *
FROM read_parquet({sql_literal((output_root / 'monthly_wage_cube.parquet').as_posix())})
WHERE occupation_scope = {sql_literal(ALL_OCCUPATIONS)}
  AND industry_scope = {sql_literal(ALL_INDUSTRIES)}
  AND province_scope <> {sql_literal(ALL_CANADA)}
ORDER BY month, province_scope
"""
    write_query_to_parquet(con, province_query, output_root / "monthly_wage_by_province.parquet")

    noc_query = f"""
SELECT *
FROM read_parquet({sql_literal((output_root / 'monthly_wage_cube.parquet').as_posix())})
WHERE province_scope = {sql_literal(ALL_CANADA)}
  AND industry_scope = {sql_literal(ALL_INDUSTRIES)}
  AND occupation_scope <> {sql_literal(ALL_OCCUPATIONS)}
ORDER BY month, occupation_scope
"""
    write_query_to_parquet(con, noc_query, output_root / "monthly_wage_by_noc_broad.parquet")


def build_monthly_by_market(con: duckdb.DuckDBPyConnection, output_root: Path, top_markets_per_province: int) -> None:
    query = f"""
WITH province_scope_rows AS (
    SELECT
        month,
        province AS province_scope,
        COALESCE(noc_broad_label, {sql_literal(ALL_OCCUPATIONS)}) AS occupation_scope,
        COALESCE(naics_sector_label, {sql_literal(ALL_INDUSTRIES)}) AS industry_scope,
        province AS market_province,
        market,
        province || ' | ' || market AS market_label,
        count(*) AS postings_total
    FROM normalized_postings
    GROUP BY GROUPING SETS (
        (month, province, noc_broad_label, naics_sector_label, market),
        (month, province, noc_broad_label, market),
        (month, province, naics_sector_label, market),
        (month, province, market)
    )
),
national_scope_rows AS (
    SELECT
        month,
        {sql_literal(ALL_CANADA)} AS province_scope,
        COALESCE(noc_broad_label, {sql_literal(ALL_OCCUPATIONS)}) AS occupation_scope,
        COALESCE(naics_sector_label, {sql_literal(ALL_INDUSTRIES)}) AS industry_scope,
        province AS market_province,
        market,
        province || ' | ' || market AS market_label,
        count(*) AS postings_total
    FROM normalized_postings
    GROUP BY GROUPING SETS (
        (month, province, noc_broad_label, naics_sector_label, market),
        (month, province, noc_broad_label, market),
        (month, province, naics_sector_label, market),
        (month, province, market)
    )
)
SELECT *
FROM province_scope_rows
UNION ALL
SELECT *
FROM national_scope_rows
ORDER BY month, province_scope, occupation_scope, industry_scope, market_province, market
"""
    write_query_to_parquet(con, query, output_root / "monthly_by_market.parquet")

    top_market_query = f"""
SELECT
    province,
    market,
    province || ' | ' || market AS market_label,
    count(*) AS postings_total,
    min(date_found) AS first_month,
    max(date_found) AS last_month
FROM normalized_postings
GROUP BY province, market
QUALIFY row_number() OVER (PARTITION BY province ORDER BY count(*) DESC, market) <= {int(top_markets_per_province)}
ORDER BY province, postings_total DESC, market
"""
    write_query_to_parquet(con, top_market_query, output_root / "geography_top_markets.parquet")


def build_monthly_conditions(con: duckdb.DuckDBPyConnection, output_root: Path) -> None:
    query = f"""
WITH stacked AS (
    SELECT month, province, noc_broad_label, naics_sector_label, 'Employment type' AS dimension, employment_type AS category
    FROM normalized_postings
    UNION ALL
    SELECT month, province, noc_broad_label, naics_sector_label, 'Duration' AS dimension, duration AS category
    FROM normalized_postings
    UNION ALL
    SELECT month, province, noc_broad_label, naics_sector_label, 'Student job flag' AS dimension, student_job_flag AS category
    FROM normalized_postings
    UNION ALL
    SELECT month, province, noc_broad_label, naics_sector_label, 'Advertised by' AS dimension, advertised_by AS category
    FROM normalized_postings
)
SELECT
    month,
    COALESCE(province, {sql_literal(ALL_CANADA)}) AS province_scope,
    COALESCE(noc_broad_label, {sql_literal(ALL_OCCUPATIONS)}) AS occupation_scope,
    COALESCE(naics_sector_label, {sql_literal(ALL_INDUSTRIES)}) AS industry_scope,
    dimension,
    category,
    count(*) AS postings_total
FROM stacked
GROUP BY GROUPING SETS (
    (month, province, noc_broad_label, naics_sector_label, dimension, category),
    (month, province, noc_broad_label, dimension, category),
    (month, province, naics_sector_label, dimension, category),
    (month, province, dimension, category),
    (month, noc_broad_label, naics_sector_label, dimension, category),
    (month, noc_broad_label, dimension, category),
    (month, naics_sector_label, dimension, category),
    (month, dimension, category)
)
ORDER BY month, dimension, province_scope, occupation_scope, industry_scope, postings_total DESC
"""
    write_query_to_parquet(con, query, output_root / "monthly_conditions.parquet")


def build_monthly_language(con: duckdb.DuckDBPyConnection, output_root: Path) -> None:
    query = f"""
WITH stacked AS (
    SELECT month, province, noc_broad_label, naics_sector_label, 'Primary posting language' AS dimension, COALESCE(primary_posting_language, 'Not reported') AS category
    FROM normalized_postings
    UNION ALL
    SELECT month, province, noc_broad_label, naics_sector_label, 'English requirement' AS dimension, COALESCE(english_language_requirement, 'Not reported') AS category
    FROM normalized_postings
    UNION ALL
    SELECT month, province, noc_broad_label, naics_sector_label, 'French requirement' AS dimension, COALESCE(french_language_requirement, 'Not reported') AS category
    FROM normalized_postings
)
SELECT
    month,
    COALESCE(province, {sql_literal(ALL_CANADA)}) AS province_scope,
    COALESCE(noc_broad_label, {sql_literal(ALL_OCCUPATIONS)}) AS occupation_scope,
    COALESCE(naics_sector_label, {sql_literal(ALL_INDUSTRIES)}) AS industry_scope,
    dimension,
    category,
    count(*) AS postings_total
FROM stacked
GROUP BY GROUPING SETS (
    (month, province, noc_broad_label, naics_sector_label, dimension, category),
    (month, province, noc_broad_label, dimension, category),
    (month, province, naics_sector_label, dimension, category),
    (month, province, dimension, category),
    (month, noc_broad_label, naics_sector_label, dimension, category),
    (month, noc_broad_label, dimension, category),
    (month, naics_sector_label, dimension, category),
    (month, dimension, category)
)
ORDER BY month, dimension, province_scope, occupation_scope, industry_scope, postings_total DESC
"""
    write_query_to_parquet(con, query, output_root / "monthly_language.parquet")


def build_monthly_requirements(con: duckdb.DuckDBPyConnection, output_root: Path) -> None:
    query = f"""
WITH stacked AS (
    SELECT month, province, noc_broad_label, naics_sector_label, 'Education' AS dimension, education AS category
    FROM normalized_postings
    UNION ALL
    SELECT month, province, noc_broad_label, naics_sector_label, 'Experience category' AS dimension, experience AS category
    FROM normalized_postings
    UNION ALL
    SELECT month, province, noc_broad_label, naics_sector_label, 'Experience details band' AS dimension, experience_band AS category
    FROM normalized_postings
)
SELECT
    month,
    COALESCE(province, {sql_literal(ALL_CANADA)}) AS province_scope,
    COALESCE(noc_broad_label, {sql_literal(ALL_OCCUPATIONS)}) AS occupation_scope,
    COALESCE(naics_sector_label, {sql_literal(ALL_INDUSTRIES)}) AS industry_scope,
    dimension,
    category,
    count(*) AS postings_total
FROM stacked
GROUP BY GROUPING SETS (
    (month, province, noc_broad_label, naics_sector_label, dimension, category),
    (month, province, noc_broad_label, dimension, category),
    (month, province, naics_sector_label, dimension, category),
    (month, province, dimension, category),
    (month, noc_broad_label, naics_sector_label, dimension, category),
    (month, noc_broad_label, dimension, category),
    (month, naics_sector_label, dimension, category),
    (month, dimension, category)
)
ORDER BY month, dimension, province_scope, occupation_scope, industry_scope, postings_total DESC
"""
    write_query_to_parquet(con, query, output_root / "monthly_requirements.parquet")


def build_coverage_table(con: duckdb.DuckDBPyConnection, output_root: Path) -> None:
    field_columns = {
        "noc": "noc_postings",
        "naics": "naics_postings",
        "remunerationHrly": "wage_postings",
        "remoteWorkOptions": "remote_field_postings",
        "primaryPostingLanguage": "primary_language_postings",
        "englishLanguageRequirement": "english_requirement_postings",
        "frenchLanguageRequirement": "french_requirement_postings",
        "experienceDetails": "experience_detail_postings",
        "education": "education_postings",
        "skills": "skills_postings",
        "type": "employment_type_postings",
        "duration": "duration_postings",
        "advertisedBy": "advertised_by_postings",
    }
    union_queries = []
    source_path = output_root / "monthly_filter_cube.parquet"
    for field, column in field_columns.items():
        union_queries.append(
            f"""
SELECT
    month,
    province_scope,
    occupation_scope,
    industry_scope,
    {sql_literal(field)} AS field_name,
    postings_total,
    {column} AS populated_postings
FROM read_parquet({sql_literal(source_path.as_posix())})
"""
        )
    query = "\nUNION ALL\n".join(union_queries) + "\nORDER BY month, field_name, province_scope, occupation_scope, industry_scope"
    write_query_to_parquet(con, query, output_root / "coverage_by_field_monthly.parquet")


def build_skills_table(
    con: duckdb.DuckDBPyConnection,
    output_root: Path,
    skills_top_k: int,
) -> None:
    del skills_top_k  # The app computes top-k after filtering from this detailed aggregate.
    query = f"""
SELECT
    month,
    province AS province_scope,
    noc_broad_label AS occupation_scope,
    COALESCE(naics_sector_label, 'Unknown industry group') AS industry_scope,
    trim(skill_value.skill_code) AS skill_code,
    count(*) AS postings_total
FROM normalized_postings,
LATERAL UNNEST(string_split(skills, '|')) AS skill_value(skill_code)
WHERE skills IS NOT NULL
GROUP BY month, province_scope, occupation_scope, industry_scope, skill_code
ORDER BY month, province_scope, occupation_scope, industry_scope, postings_total DESC, skill_code
"""
    write_query_to_parquet(con, query, output_root / "monthly_skills_topk.parquet")


def collect_metadata(
    con: duckdb.DuckDBPyConnection,
    source_root: Path,
    output_root: Path,
) -> dict:
    source_files = sorted(source_root.glob(SOURCE_GLOB))
    summary = con.execute(
        """
SELECT
    min(date_found) AS min_date,
    max(date_found) AS max_date,
    count(*) AS postings_total,
    count(remunerationHrly) AS wage_postings,
    count(naics) AS naics_postings,
    count(noc) AS noc_postings,
    count(remote_work_options) AS remote_postings
FROM normalized_postings
"""
    ).fetchone()
    return {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "source_root": source_root.as_posix(),
        "source_glob": (source_root / SOURCE_GLOB).as_posix(),
        "output_root": output_root.as_posix(),
        "source_file_count": len(source_files),
        "source_window": {
            "min_date": str(summary[0]),
            "max_date": str(summary[1]),
        },
        "headline_counts": {
            "postings_total": int(summary[2]),
            "wage_postings": int(summary[3]),
            "naics_postings": int(summary[4]),
            "noc_postings": int(summary[5]),
            "remote_field_postings": int(summary[6]),
        },
        "known_caveats": [
            "Job ads measure posted labor demand, not employment or unemployment.",
            "The 2025 upstream raw fetch provenance remains under audit; freshness should be read with caution.",
            "Wages, remote work, language, and detailed experience fields are sparse or historically unstable.",
        ],
    }


def validate_derived_package(output_root: Path, *, source_root: Path | None = None) -> dict:
    required = [
        "metadata.json",
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
    ]
    missing = [name for name in required if not (output_root / name).exists()]
    metadata_path = output_root / "metadata.json"
    metadata = json.loads(metadata_path.read_text(encoding="utf-8")) if metadata_path.exists() else {}
    con = duckdb.connect()
    schema_requirements = {
        "monthly_skills_topk.parquet": {
            "month",
            "province_scope",
            "occupation_scope",
            "industry_scope",
            "skill_code",
            "postings_total",
        },
        "monthly_by_market.parquet": {
            "month",
            "province_scope",
            "occupation_scope",
            "industry_scope",
            "market_province",
            "market",
            "market_label",
            "postings_total",
        },
    }
    schema_issues: dict[str, list[str]] = {}
    for name, required_columns in schema_requirements.items():
        path = output_root / name
        if not path.exists():
            continue
        present_columns = {
            row[0]
            for row in con.execute(
                f"DESCRIBE SELECT * FROM read_parquet({sql_literal(path.as_posix())})"
            ).fetchall()
        }
        missing_columns = sorted(required_columns - present_columns)
        if missing_columns:
            schema_issues[name] = missing_columns
    overall_path = output_root / "monthly_overall.parquet"
    overall_total = None
    if overall_path.exists():
        overall_total = con.execute(
            f"SELECT sum(postings_total) FROM read_parquet({sql_literal(overall_path.as_posix())})"
        ).fetchone()[0]
    source_total = None
    source_window_match = None
    source_error = None
    source_glob = (source_root / SOURCE_GLOB).as_posix() if source_root is not None else metadata.get("source_glob")
    if source_glob:
        try:
            source_summary = con.execute(
                f"""
SELECT
    count(*) AS postings_total,
    min(CAST(dateFound AS DATE)) AS min_date,
    max(CAST(dateFound AS DATE)) AS max_date
FROM read_parquet({sql_literal(source_glob)}, union_by_name=True)
WHERE dateFound IS NOT NULL
"""
            ).fetchone()
            source_total = int(source_summary[0])
            source_window_match = (
                str(source_summary[1]) == metadata.get("source_window", {}).get("min_date")
                and str(source_summary[2]) == metadata.get("source_window", {}).get("max_date")
            )
        except Exception as exc:  # pragma: no cover - operator validation fallback
            source_error = str(exc)

    metadata_total = metadata.get("headline_counts", {}).get("postings_total")
    totals_match = metadata_total == int(overall_total or -1)
    source_reconciliation_ok = not source_glob or (
        source_error is None and source_total is not None and source_window_match is True
    )
    source_totals_match = metadata_total == source_total if source_glob else True
    return {
        "output_root": output_root.as_posix(),
        "missing_files": missing,
        "metadata_postings_total": metadata_total,
        "monthly_overall_sum": int(overall_total) if overall_total is not None else None,
        "source_postings_total": source_total,
        "source_window_match": source_window_match,
        "source_error": source_error,
        "schema_issues": schema_issues,
        "validated": not missing
        and totals_match
        and source_reconciliation_ok
        and source_totals_match
        and not schema_issues,
    }


def refresh_dashboard_data(
    source_root: Path,
    output_root: Path,
    top_markets_per_province: int,
    skills_top_k: int,
) -> Path:
    def log(message: str) -> None:
        print(message, flush=True)

    output_root.mkdir(parents=True, exist_ok=True)
    con = duckdb.connect()
    con.execute("PRAGMA threads=4")
    log("Preparing normalized upstream view...")
    con.execute(normalized_view_sql((source_root / SOURCE_GLOB).as_posix()))

    log("Building monthly_filter_cube.parquet ...")
    build_monthly_filter_cube(con, output_root)
    log("Building monthly_overall.parquet ...")
    build_monthly_overall(con, output_root)
    log("Building monthly_by_province.parquet ...")
    build_monthly_by_province(con, output_root)
    log("Building monthly_by_noc_broad.parquet ...")
    build_monthly_by_noc_broad(con, output_root)
    log("Building monthly_by_naics_broad.parquet ...")
    build_monthly_by_naics_broad(con, output_root)
    log("Building wage tables ...")
    build_monthly_wage_cubes(con, output_root)
    log("Building market tables ...")
    build_monthly_by_market(con, output_root, top_markets_per_province=top_markets_per_province)
    log("Building monthly_conditions.parquet ...")
    build_monthly_conditions(con, output_root)
    log("Building monthly_language.parquet ...")
    build_monthly_language(con, output_root)
    log("Building monthly_requirements.parquet ...")
    build_monthly_requirements(con, output_root)
    log("Building coverage_by_field_monthly.parquet ...")
    build_coverage_table(con, output_root)
    log("Building monthly_skills_topk.parquet ...")
    build_skills_table(con, output_root, skills_top_k=skills_top_k)

    log("Writing metadata.json ...")
    metadata = collect_metadata(con, source_root=source_root, output_root=output_root)
    with (output_root / "metadata.json").open("w", encoding="utf-8") as handle:
        json.dump(metadata, handle, indent=2)
    log("Refresh complete.")
    return output_root


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-root", type=Path, default=DEFAULT_SOURCE_ROOT)
    parser.add_argument("--output-root", type=Path, default=DEFAULT_OUTPUT_ROOT)
    parser.add_argument("--top-markets-per-province", type=int, default=10)
    parser.add_argument("--skills-top-k", type=int, default=10)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    output_root = refresh_dashboard_data(
        source_root=args.source_root,
        output_root=args.output_root,
        top_markets_per_province=args.top_markets_per_province,
        skills_top_k=args.skills_top_k,
    )
    print(json.dumps(validate_derived_package(output_root, source_root=args.source_root), indent=2))


if __name__ == "__main__":
    main()
