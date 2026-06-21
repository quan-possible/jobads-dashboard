"""pytest suite for the ACLMR Labour Market API.

Run with:
    PYTHONPATH=src .venv/bin/python -m pytest api/tests/ -q

Coverage:
  1. Health + meta
  2. Overview national
  3. No causal language (critical)
  4. Series endpoint
  5. Rank
  6. Geography
  7. Wages gating (critical)
  8. Skills
  9. Requirements
  10. Cross-filter integrity
  11. Validation (422)
"""

from __future__ import annotations

import json
import re
import warnings
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Suppress the httpx/starlette deprecation warning that does not affect test logic.
warnings.filterwarnings("ignore", category=DeprecationWarning, module="starlette.testclient")

from api.main import app  # noqa: E402  (import after sys.path is set by PYTHONPATH=src)

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

DATA_DIR = Path(__file__).resolve().parents[2] / "data" / "derived" / "labor_market_dashboard_v1"
METADATA_PATH = DATA_DIR / "metadata.json"

VALID_PROVINCE_CODES = {
    "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT",
}

# Causal words / phrases to forbid in key_points (whole-word, case-insensitive).
CAUSAL_WORDS = [
    "because",
    "caused",
    "cause",
    "due to",
    "drove",
    "drives",
    "driven",
    "led to",
    "leads to",
    "result of",
    "thanks to",
    "owing to",
    "reflects",
    "spurred",
    "fueled",
    "boosted",
]


@pytest.fixture(scope="session")
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture(scope="session")
def metadata() -> dict:
    return json.loads(METADATA_PATH.read_text())


@pytest.fixture(scope="session")
def overview_national(client: TestClient) -> dict:
    r = client.get("/api/overview")
    assert r.status_code == 200
    return r.json()


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _contains_causal_language(text: str) -> list[str]:
    """Return list of matched causal words/phrases found (case-insensitive whole-word)."""
    found = []
    lower = text.lower()
    for phrase in CAUSAL_WORDS:
        # Match whole-word for single words; substring match for multi-word phrases.
        if " " in phrase:
            if phrase in lower:
                found.append(phrase)
        else:
            pattern = r"\b" + re.escape(phrase) + r"\b"
            if re.search(pattern, lower):
                found.append(phrase)
    return found


# ---------------------------------------------------------------------------
# 1. Health + meta
# ---------------------------------------------------------------------------


def test_health(client: TestClient) -> None:
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_meta_status(client: TestClient) -> None:
    r = client.get("/api/meta")
    assert r.status_code == 200


def test_meta_postings_total_matches_metadata_json(client: TestClient, metadata: dict) -> None:
    r = client.get("/api/meta")
    assert r.status_code == 200
    d = r.json()
    expected = metadata["headline_counts"]["postings_total"]
    assert d["postings_total"] == expected, (
        f"postings_total from /api/meta ({d['postings_total']}) "
        f"!= headline_counts.postings_total in metadata.json ({expected})"
    )


def test_meta_coverage_shares_in_range(client: TestClient) -> None:
    r = client.get("/api/meta")
    d = r.json()
    for item in d["coverage"]:
        assert 0.0 <= item["share"] <= 1.0, (
            f"coverage[{item['field']}].share={item['share']} not in [0,1]"
        )


def test_meta_latest_month(client: TestClient) -> None:
    r = client.get("/api/meta")
    d = r.json()
    assert d["latest_month"] == "2026-03", (
        f"expected latest_month='2026-03', got {d['latest_month']!r}"
    )


def test_meta_caveats_non_empty(client: TestClient) -> None:
    r = client.get("/api/meta")
    d = r.json()
    assert isinstance(d["caveats"], list) and len(d["caveats"]) > 0, (
        "caveats must be a non-empty list"
    )


# ---------------------------------------------------------------------------
# 2. Overview national
# ---------------------------------------------------------------------------


def test_overview_national_status(overview_national: dict) -> None:
    # Already checked in fixture; just confirm dict is non-empty.
    assert overview_national


def test_overview_as_of_equals_meta_latest_month(client: TestClient, overview_national: dict) -> None:
    meta = client.get("/api/meta").json()
    assert overview_national["as_of"] == meta["latest_month"], (
        f"overview.as_of={overview_national['as_of']!r} != meta.latest_month={meta['latest_month']!r}"
    )


def test_overview_series_non_empty(overview_national: dict) -> None:
    series = overview_national["series"]
    assert len(series) > 0, "overview.series must be non-empty"


def test_overview_series_months_strictly_increasing(overview_national: dict) -> None:
    months = [p["month"] for p in overview_national["series"]]
    for i in range(1, len(months)):
        assert months[i] > months[i - 1], (
            f"series months not strictly increasing at index {i}: {months[i - 1]} >= {months[i]}"
        )


def test_overview_series_postings_non_negative(overview_national: dict) -> None:
    for pt in overview_national["series"]:
        assert pt["postings"] >= 0, f"postings < 0 at month {pt['month']}"


def test_overview_series_index_base_month_near_100(overview_national: dict) -> None:
    base_month = "2019-01"
    base_pts = [p for p in overview_national["series"] if p["month"] == base_month]
    assert base_pts, f"Base month {base_month!r} not found in series"
    base_index = base_pts[0]["index"]
    assert base_index is not None, f"index is None at {base_month}"
    assert abs(base_index - 100.0) <= 0.5, (
        f"index at {base_month} = {base_index}, expected within 0.5 of 100.0"
    )


def test_overview_kpis_active_postings_equals_last_series(overview_national: dict) -> None:
    last = overview_national["series"][-1]
    kpi = overview_national["kpis"]["active_postings"]
    assert kpi == last["postings"], (
        f"kpis.active_postings={kpi} != last series postings={last['postings']}"
    )


def test_overview_top_growing_sorted_by_yoy_desc(overview_national: dict) -> None:
    growing = overview_national["top_growing"]
    yoy_vals = [i["yoy"] for i in growing if i["yoy"] is not None]
    assert yoy_vals == sorted(yoy_vals, reverse=True), (
        f"top_growing not sorted by yoy desc: {yoy_vals}"
    )


def test_overview_top_cooling_first_item_has_lowest_yoy(overview_national: dict) -> None:
    cooling = overview_national["top_cooling"]
    yoy_vals = [i["yoy"] for i in cooling if i["yoy"] is not None]
    if len(yoy_vals) < 2:
        pytest.skip("Not enough cooling items to check sort order")
    assert yoy_vals[0] <= min(yoy_vals), (
        f"top_cooling first item yoy={yoy_vals[0]} is not the minimum: {yoy_vals}"
    )


def test_overview_posting_intensity_is_none(overview_national: dict) -> None:
    """posting_intensity is a Phase-5 column absent from the current data layer."""
    assert overview_national["kpis"]["posting_intensity"] is None, (
        "posting_intensity should be None (data-layer column absent)"
    )


def test_overview_postings_new_is_none(overview_national: dict) -> None:
    """postings_new is a Phase-5 column absent from the current data layer."""
    assert overview_national["kpis"]["postings_new"] is None, (
        "postings_new should be None (data-layer column absent)"
    )


# ---------------------------------------------------------------------------
# 3. No causal language (critical)
# ---------------------------------------------------------------------------


def test_no_causal_language_national(overview_national: dict) -> None:
    """key_points must contain no causal verbs/phrases for the national scope."""
    violations: list[str] = []
    for text in overview_national["key_points"]:
        found = _contains_causal_language(text)
        if found:
            violations.append(f"{text!r} contains causal word(s): {found}")
    assert not violations, "\n".join(violations)


def test_no_causal_language_filtered_scope(client: TestClient) -> None:
    """key_points must contain no causal verbs/phrases for a filtered scope."""
    r = client.get(
        "/api/overview",
        params={"geo": "ON", "occ": "3 | Health occupations"},
    )
    assert r.status_code == 200
    d = r.json()
    violations: list[str] = []
    for text in d["key_points"]:
        found = _contains_causal_language(text)
        if found:
            violations.append(f"{text!r} contains causal word(s): {found}")
    assert not violations, "\n".join(violations)


# ---------------------------------------------------------------------------
# 4. Series endpoint
# ---------------------------------------------------------------------------


def test_series_postings_length_matches_overview(client: TestClient, overview_national: dict) -> None:
    r = client.get("/api/series/postings")
    assert r.status_code == 200
    series = r.json()
    assert len(series) == len(overview_national["series"]), (
        f"/api/series/postings length {len(series)} != overview series length {len(overview_national['series'])}"
    )


def test_series_postings_last_value_matches_overview(client: TestClient, overview_national: dict) -> None:
    r = client.get("/api/series/postings")
    series = r.json()
    assert series[-1]["postings"] == overview_national["series"][-1]["postings"], (
        "last postings value differs between /api/series/postings and overview"
    )


# ---------------------------------------------------------------------------
# 5. Rank
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("limit", [5, 10])
def test_rank_occupations_value_order_and_limit(client: TestClient, limit: int) -> None:
    r = client.get("/api/rank/occupations", params={"order": "value", "limit": limit})
    assert r.status_code == 200
    items = r.json()
    assert len(items) <= limit
    values = [i["value"] for i in items]
    assert values == sorted(values, reverse=True), f"Not sorted by value desc: {values}"


def test_rank_occupations_shares_in_range(client: TestClient) -> None:
    r = client.get("/api/rank/occupations", params={"order": "value", "limit": 5})
    items = r.json()
    for item in items:
        if item["share"] is not None:
            assert 0 < item["share"] <= 1.0, f"share={item['share']} not in (0,1] for {item['label']!r}"


def test_rank_occupations_labels_non_empty(client: TestClient) -> None:
    r = client.get("/api/rank/occupations", params={"order": "value", "limit": 5})
    items = r.json()
    for item in items:
        assert item["label"].strip(), f"Empty label for code={item['code']!r}"


def test_rank_occupations_excludes_unknown(client: TestClient) -> None:
    r = client.get("/api/rank/occupations", params={"order": "value", "limit": 50})
    items = r.json()
    labels = [i["label"] for i in items]
    assert "Unknown occupation group" not in labels, (
        "rank/occupations must exclude 'Unknown occupation group'"
    )


def test_rank_industries_yoy_sorted_desc(client: TestClient) -> None:
    r = client.get("/api/rank/industries", params={"order": "yoy"})
    assert r.status_code == 200
    items = r.json()
    yoy_vals = [i["yoy"] for i in items if i["yoy"] is not None]
    assert yoy_vals == sorted(yoy_vals, reverse=True), (
        f"rank/industries?order=yoy not sorted desc: {yoy_vals}"
    )


def test_rank_industries_yoy_all_non_null(client: TestClient) -> None:
    r = client.get("/api/rank/industries", params={"order": "yoy"})
    items = r.json()
    for item in items:
        assert item["yoy"] is not None, (
            f"yoy is None for {item['label']!r} when order=yoy (should be filtered out)"
        )


# ---------------------------------------------------------------------------
# 6. Geography
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("measure", ["per10k", "count", "lq"])
def test_geography_status_200(client: TestClient, measure: str) -> None:
    r = client.get("/api/geography", params={"measure": measure})
    assert r.status_code == 200


def test_geography_per10k_at_most_13_items(client: TestClient) -> None:
    r = client.get("/api/geography", params={"measure": "per10k"})
    d = r.json()
    assert len(d["items"]) <= 13, f"Expected <= 13 province items, got {len(d['items'])}"


def test_geography_per10k_valid_province_codes(client: TestClient) -> None:
    r = client.get("/api/geography", params={"measure": "per10k"})
    d = r.json()
    for item in d["items"]:
        assert item["code"] in VALID_PROVINCE_CODES, (
            f"code={item['code']!r} is not a valid 2-letter province code"
        )


def test_geography_per10k_count_non_negative(client: TestClient) -> None:
    r = client.get("/api/geography", params={"measure": "per10k"})
    d = r.json()
    for item in d["items"]:
        if item["count"] is not None:
            assert item["count"] >= 0, f"count={item['count']} < 0 for code={item['code']!r}"


def test_geography_per10k_sorted_by_value_desc(client: TestClient) -> None:
    r = client.get("/api/geography", params={"measure": "per10k"})
    d = r.json()
    vals = [i["value"] for i in d["items"] if i["value"] is not None]
    assert vals == sorted(vals, reverse=True), (
        f"geography items not sorted by value desc: {vals}"
    )


@pytest.mark.parametrize("measure", ["count", "lq"])
def test_geography_measure_consistent_count(client: TestClient, measure: str) -> None:
    """count and lq measures should return the same number of items as per10k."""
    r_base = client.get("/api/geography", params={"measure": "per10k"})
    r_measure = client.get("/api/geography", params={"measure": measure})
    n_base = len(r_base.json()["items"])
    n_meas = len(r_measure.json()["items"])
    assert n_base == n_meas, (
        f"measure={measure!r} returned {n_meas} items vs per10k's {n_base}"
    )


# ---------------------------------------------------------------------------
# 7. Wages gating (critical)
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("dim", ["occupation", "province"])
def test_wages_gating_invariant(client: TestClient, dim: str) -> None:
    """n < 100 -> gated=True and median/p25/p75 are None; n >= 100 -> gated=False and median is a number."""
    r = client.get("/api/wages", params={"dim": dim})
    assert r.status_code == 200
    d = r.json()
    assert d["min_sample"] == 100
    violations: list[str] = []
    for item in d["items"]:
        n = item["n"]
        gated = item["gated"]
        median = item["median"]
        p25 = item["p25"]
        p75 = item["p75"]
        if n < 100:
            if not gated:
                violations.append(f"{dim}:{item['label']!r} n={n}<100 but gated=False")
            if median is not None:
                violations.append(f"{dim}:{item['label']!r} n={n}<100 but median={median} (not None)")
            if p25 is not None:
                violations.append(f"{dim}:{item['label']!r} n={n}<100 but p25={p25} (not None)")
            if p75 is not None:
                violations.append(f"{dim}:{item['label']!r} n={n}<100 but p75={p75} (not None)")
        else:
            if gated:
                violations.append(f"{dim}:{item['label']!r} n={n}>=100 but gated=True")
            if median is None:
                violations.append(f"{dim}:{item['label']!r} n={n}>=100 but median is None")
    assert not violations, "\n".join(violations)


@pytest.mark.parametrize("dim", ["occupation", "province"])
def test_wages_percentile_ordering(client: TestClient, dim: str) -> None:
    """When not gated and all three percentiles are present: p25 <= median <= p75."""
    r = client.get("/api/wages", params={"dim": dim})
    d = r.json()
    violations: list[str] = []
    for item in d["items"]:
        if not item["gated"] and None not in (item["p25"], item["median"], item["p75"]):
            p25, med, p75 = item["p25"], item["median"], item["p75"]
            if not (p25 <= med <= p75):
                violations.append(
                    f"{dim}:{item['label']!r} violates p25({p25}) <= median({med}) <= p75({p75})"
                )
    assert not violations, "\n".join(violations)


# ---------------------------------------------------------------------------
# 8. Skills
# ---------------------------------------------------------------------------


def test_skills_top_shares_in_range(client: TestClient) -> None:
    r = client.get("/api/skills", params={"mode": "top"})
    assert r.status_code == 200
    d = r.json()
    for item in d["items"]:
        assert 0.0 <= item["share"] <= 1.0, (
            f"share={item['share']} not in [0,1] for skill {item['label']!r}"
        )


def test_skills_top_sorted_by_count_desc(client: TestClient) -> None:
    r = client.get("/api/skills", params={"mode": "top"})
    d = r.json()
    counts = [i["count"] for i in d["items"]]
    assert counts == sorted(counts, reverse=True), (
        f"top skills not sorted by count desc: {counts}"
    )


def test_skills_top_labels_non_empty(client: TestClient) -> None:
    r = client.get("/api/skills", params={"mode": "top"})
    d = r.json()
    for item in d["items"]:
        assert item["label"].strip(), f"Empty label for skill code={item['code']!r}"


def test_skills_top_labels_are_not_raw_codes(client: TestClient) -> None:
    """Top skill labels should be human-readable names, not raw numeric codes."""
    r = client.get("/api/skills", params={"mode": "top"})
    d = r.json()
    numeric_labels = [i["label"] for i in d["items"][:10] if i["label"].strip().isdigit()]
    assert not numeric_labels, (
        f"Top skills have raw numeric code labels: {numeric_labels}"
    )


def test_skills_distinctive_has_lift(client: TestClient) -> None:
    r = client.get(
        "/api/skills",
        params={"mode": "distinctive", "geo": "ON", "occ": "3 | Health occupations"},
    )
    assert r.status_code == 200
    d = r.json()
    assert len(d["items"]) > 0, "distinctive mode returned no items"
    null_lifts = [i["label"] for i in d["items"] if i["lift"] is None]
    assert not null_lifts, f"Some distinctive items have null lift: {null_lifts}"


def test_skills_distinctive_sorted_by_lift_desc(client: TestClient) -> None:
    r = client.get(
        "/api/skills",
        params={"mode": "distinctive", "geo": "ON", "occ": "3 | Health occupations"},
    )
    d = r.json()
    lifts = [i["lift"] for i in d["items"] if i["lift"] is not None]
    assert lifts == sorted(lifts, reverse=True), (
        f"distinctive skills not sorted by lift desc: {lifts}"
    )


# ---------------------------------------------------------------------------
# 9. Requirements
# ---------------------------------------------------------------------------


def test_requirements_national_status(client: TestClient) -> None:
    r = client.get("/api/requirements")
    assert r.status_code == 200


@pytest.mark.parametrize("field", ["employment_type", "education", "language"])
def test_requirements_national_lists_non_empty(client: TestClient, field: str) -> None:
    r = client.get("/api/requirements")
    d = r.json()
    assert len(d[field]) > 0, f"requirements.{field} must be non-empty"


@pytest.mark.parametrize("field", ["employment_type", "education", "language"])
def test_requirements_shares_sum_to_at_most_1(client: TestClient, field: str) -> None:
    r = client.get("/api/requirements")
    d = r.json()
    total = sum(i["share"] for i in d[field])
    assert total <= 1.001, (
        f"requirements.{field} shares sum to {total:.4f} > 1.001"
    )


def test_requirements_remote_shares_sum_to_approx_1(client: TestClient) -> None:
    r = client.get("/api/requirements")
    d = r.json()
    remote = d.get("remote", [])
    if not remote:
        pytest.skip("No remote data available")
    total = sum(i["share"] for i in remote)
    assert abs(total - 1.0) <= 0.01, (
        f"remote shares sum to {total:.4f}, expected ~1.0"
    )


def test_requirements_language_labels_mapped(client: TestClient) -> None:
    """Language labels should be 'English'/'French', not raw codes 'en'/'fr'."""
    r = client.get("/api/requirements")
    d = r.json()
    raw_code_labels = [i["label"] for i in d["language"] if i["label"] in ("en", "fr")]
    assert not raw_code_labels, (
        f"Language labels not mapped: found raw codes {raw_code_labels}"
    )
    # Confirm that at least one canonical label is present.
    mapped_labels = {i["label"] for i in d["language"]}
    canonical = {"English", "French", "English or French", "Unknown"}
    assert mapped_labels & canonical, (
        f"No canonical language labels found in {mapped_labels}"
    )


# ---------------------------------------------------------------------------
# 10. Cross-filter integrity
# ---------------------------------------------------------------------------


def test_cross_filter_overview_positive_active_postings(client: TestClient) -> None:
    r = client.get(
        "/api/overview",
        params={
            "geo": "ON",
            "occ": "3 | Health occupations",
            "ind": "62 | Health care and social assistance",
        },
    )
    assert r.status_code == 200
    d = r.json()
    assert d["kpis"]["active_postings"] is not None and d["kpis"]["active_postings"] > 0, (
        "cross-filter active_postings should be positive"
    )


def test_cross_filter_active_postings_smaller_than_national(
    client: TestClient, overview_national: dict
) -> None:
    r = client.get(
        "/api/overview",
        params={
            "geo": "ON",
            "occ": "3 | Health occupations",
            "ind": "62 | Health care and social assistance",
        },
    )
    d = r.json()
    national_ap = overview_national["kpis"]["active_postings"]
    filtered_ap = d["kpis"]["active_postings"]
    assert filtered_ap < national_ap, (
        f"filtered active_postings ({filtered_ap}) should be < national ({national_ap})"
    )


# ---------------------------------------------------------------------------
# 11. Validation — invalid params return 422
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "path, params",
    [
        ("/api/geography", {"measure": "invalid_measure"}),
        ("/api/skills", {"mode": "invalid_mode"}),
        ("/api/series/postings", {"metric": "invalid_metric"}),
        ("/api/wages", {"dim": "invalid_dim"}),
        ("/api/rank/occupations", {"order": "invalid_order"}),
    ],
)
def test_invalid_enum_returns_422(client: TestClient, path: str, params: dict) -> None:
    r = client.get(path, params=params)
    assert r.status_code == 422, (
        f"Expected 422 for {path} params={params}, got {r.status_code}"
    )
