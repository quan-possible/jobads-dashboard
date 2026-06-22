"""pytest suite for the ACLMR Labour Market API read endpoints.

Run with:
    PYTHONPATH=src .venv/bin/python -m pytest api/tests/ -q

The dashboard renders its charts through the figure bridge; the only typed-JSON
read endpoints are ``/api/meta`` and ``/api/overview``. Coverage:
  1. Health + meta
  2. Overview national
  3. No causal language (critical)
  4. Cross-filter integrity
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
# 4. Cross-filter integrity
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
