"""Tests for the Explore figure builder (api/explore.py + /api/explore/figure).

Run with:
    PYTHONPATH=src .venv/bin/python -m pytest api/tests/test_explore.py -q

Coverage:
  * Every breakdown dim builds a parseable, themed figure.
  * Every measure builds.
  * Gate 1 (axis): dim == a singly-pinned scope dim → friendly note, no bars.
  * Gate 2 (data): an empty scope slice → "No data" note.
  * Gate 3 (sample): a slice under the n<100 floor → "Insufficient sample" note.
  * The HTTP endpoint returns verbatim Plotly JSON and validates params.
"""

from __future__ import annotations

import base64
import json

import numpy as np
import pytest
from fastapi.testclient import TestClient

from api import explore
from api.main import app

client = TestClient(app)

# A real, populated scope-label combination present in the cubes.
ON = "ON"
HEALTH_OCC = "3 | Health occupations"
HEALTH_IND = "62 | Health care and social assistance"


def _payload(blob: str) -> dict:
    return json.loads(blob)


def _is_themed_figure(payload: dict) -> None:
    """Every Explore figure must carry the inlined look + stripped headline,
    exactly like the registered charts (apply_house_style contract)."""
    layout = payload["layout"]
    assert layout.get("template", {}).get("layout"), "template missing"
    assert not (layout.get("title") or {}).get("text"), "title not stripped"
    assert layout.get("paper_bgcolor") == "rgba(0,0,0,0)"


def _annotation_text(payload: dict) -> str:
    anns = payload["layout"].get("annotations") or []
    return " ".join(a.get("text", "") for a in anns)


def _has_bars(payload: dict) -> bool:
    return any(t.get("type") == "bar" for t in payload["data"])


def _values(arr) -> list[float]:
    """Plotly base64-encodes numeric arrays as a typed-array dict; decode either form."""
    if isinstance(arr, dict) and "bdata" in arr:
        raw = base64.b64decode(arr["bdata"])
        return np.frombuffer(raw, dtype=arr["dtype"]).astype(float).tolist()
    return [float(v) for v in arr]


# --------------------------------------------------------------------------- #
# Each dim builds
# --------------------------------------------------------------------------- #


@pytest.mark.parametrize("dim", ["province", "occupation", "industry", "time"])
def test_each_dim_builds(dim: str) -> None:
    payload = _payload(explore.build_explore_figure(dim, "postings"))
    _is_themed_figure(payload)
    assert payload["data"], f"{dim}: no traces"


# --------------------------------------------------------------------------- #
# Each measure builds (use a bar dim so per-category measures are exercised)
# --------------------------------------------------------------------------- #


@pytest.mark.parametrize("measure", ["postings", "share", "yoy", "two_year", "wage"])
def test_each_measure_builds_on_bar_dim(measure: str) -> None:
    payload = _payload(
        explore.build_explore_figure(
            "occupation", measure, start_year=2019, end_year=2024
        )
    )
    _is_themed_figure(payload)
    assert payload["data"], f"{measure}: no traces"


# two_year is intentionally excluded here — it has no honest line representation
# and is gated to a "switch to a category" note (see test below).
@pytest.mark.parametrize("measure", ["postings", "share", "yoy", "wage"])
def test_each_measure_builds_on_time_dim(measure: str) -> None:
    payload = _payload(
        explore.build_explore_figure("time", measure, start_year=2019, end_year=2024)
    )
    _is_themed_figure(payload)
    assert payload["data"], f"{measure}: no traces"


def test_two_year_on_time_returns_breakdown_note() -> None:
    """two_year has no honest line form → a 'switch to a category' note, no line,
    and never a raw "change {a}→{b}" placeholder leaking onto the axis (S03)."""
    payload = _payload(
        explore.build_explore_figure("time", "two_year", start_year=2019, end_year=2024)
    )
    _is_themed_figure(payload)
    assert not any(t.get("type") == "scatter" for t in payload["data"])
    txt = _annotation_text(payload).lower()
    assert "breakdown" in txt or "répartition" in txt
    # the unfilled placeholder must never reach a label
    assert "{a}" not in json.dumps(payload) and "{b}" not in json.dumps(payload)


def test_two_year_equal_years_returns_note() -> None:
    """From a year to itself is 0% everywhere → a friendly note, not a flat chart (S16)."""
    payload = _payload(
        explore.build_explore_figure("occupation", "two_year", start_year=2022, end_year=2022)
    )
    _is_themed_figure(payload)
    assert not _has_bars(payload)
    txt = _annotation_text(payload).lower()
    assert "different" in txt or "différentes" in txt


def test_share_bar_excludes_unknown_from_numerator_but_not_denominator() -> None:
    """Breakdown shares are against the All-dimension total (Unknown included in
    the denominator), so the shown bars sum to clearly under 100% — matching the
    curated treemaps instead of overstating against a survivors-only base (S02)."""
    payload = _payload(explore.build_explore_figure("occupation", "share"))
    assert _has_bars(payload)
    shares = _values(payload["data"][0]["x"])
    assert shares, "share bars empty"
    # Old (buggy) behaviour summed to ~100; the honest denominator leaves the
    # uncategorized + sub-sample remainder out of the visible bars.
    assert sum(shares) < 99.0, f"shares sum to {sum(shares):.1f}; Unknown not in denominator"
    # the axis discloses the exclusion
    assert "excludes" in json.dumps(payload).lower() or "hors" in json.dumps(payload).lower()


def test_time_yoy_values_are_finite() -> None:
    """The calendar-aligned YoY (reindexed to a contiguous monthly index) never
    emits inf/NaN from a sparse-cube row mispair (S01)."""
    payload = _payload(explore.build_explore_figure("time", "yoy"))
    ys = _values(payload["data"][0]["y"])
    assert ys, "no yoy points"
    assert all(np.isfinite(v) for v in ys), "YoY produced a non-finite value"


def test_postings_bar_is_horizontal_bars() -> None:
    payload = _payload(explore.build_explore_figure("province", "postings"))
    assert _has_bars(payload)
    assert payload["data"][0].get("orientation") == "h"


def test_time_is_a_line() -> None:
    payload = _payload(explore.build_explore_figure("time", "postings"))
    assert payload["data"][0].get("type") == "scatter"
    assert "lines" in payload["data"][0].get("mode", "")


# --------------------------------------------------------------------------- #
# Gate 1: axis gate
# --------------------------------------------------------------------------- #


def test_axis_gate_province_pinned() -> None:
    """dim=province while geo is one province is incoherent → note, no bars."""
    payload = _payload(explore.build_explore_figure("province", "postings", geo=ON))
    _is_themed_figure(payload)
    assert not _has_bars(payload), "axis gate must not draw bars"
    assert "breakdown" in _annotation_text(payload).lower()


def test_axis_gate_occupation_pinned() -> None:
    payload = _payload(
        explore.build_explore_figure("occupation", "postings", occ=HEALTH_OCC)
    )
    assert not _has_bars(payload)
    assert _annotation_text(payload)


def test_axis_gate_industry_pinned() -> None:
    payload = _payload(
        explore.build_explore_figure("industry", "postings", ind=HEALTH_IND)
    )
    assert not _has_bars(payload)
    assert _annotation_text(payload)


def test_axis_gate_does_not_fire_for_orthogonal_pin() -> None:
    """Breaking down by occupation while geo is pinned is coherent — bars expected."""
    payload = _payload(explore.build_explore_figure("occupation", "postings", geo=ON))
    assert _has_bars(payload), "orthogonal pin must still draw the breakdown"


# --------------------------------------------------------------------------- #
# Gate 2: data gate (empty slice)
# --------------------------------------------------------------------------- #


def test_data_gate_empty_slice() -> None:
    """A scope cell that does not exist in the cube → 'No data' note, no crash."""
    payload = _payload(
        explore.build_explore_figure(
            "occupation", "postings", ind="nonexistent-industry-scope"
        )
    )
    _is_themed_figure(payload)
    assert not _has_bars(payload)
    txt = _annotation_text(payload).lower()
    assert "no data" in txt or "aucune" in txt


# --------------------------------------------------------------------------- #
# Gate 3: sample gate (n < 100)
# --------------------------------------------------------------------------- #


def test_sample_gate_drops_low_n_categories(monkeypatch) -> None:
    """If every category falls below the sample floor, show the low-sample note."""
    import api.explore as ex

    # Force an absurdly high floor so even the national breakdown can't clear it.
    monkeypatch.setattr(ex, "MIN_SAMPLE", 10**12)
    payload = _payload(ex.build_explore_figure("occupation", "postings"))
    assert not _has_bars(payload)
    txt = _annotation_text(payload).lower()
    assert "insufficient" in txt or "n<100" in txt or "insuffisant" in txt


def test_sample_gate_time_low_total(monkeypatch) -> None:
    import api.explore as ex

    monkeypatch.setattr(ex, "MIN_SAMPLE", 10**12)
    payload = _payload(ex.build_explore_figure("time", "postings"))
    assert payload["data"] == [] or not any(
        t.get("type") == "scatter" for t in payload["data"]
    )
    assert _annotation_text(payload)


# --------------------------------------------------------------------------- #
# No double-count: pinned bar total never exceeds the national time total
# --------------------------------------------------------------------------- #


def test_no_double_count_bar_total_matches_marginal() -> None:
    """The occupation breakdown (over the full window) must sum to roughly the
    national postings total, not a multiple of it — guards the 8× cube bug."""
    occ_bars = _payload(explore.build_explore_figure("occupation", "postings"))
    bar_total = sum(_values(occ_bars["data"][0]["x"]))
    prov_bars = _payload(explore.build_explore_figure("province", "postings"))
    prov_total = sum(_values(prov_bars["data"][0]["x"]))
    # Two orthogonal breakdowns of the same scope must agree within rounding/
    # sample-floor drops (a few percent), never by a 2×/8× factor.
    assert prov_total > 0
    assert 0.5 < bar_total / prov_total < 2.0, (
        f"breakdowns disagree by a suspicious factor: occ={bar_total} prov={prov_total}"
    )


# --------------------------------------------------------------------------- #
# HTTP endpoint contract
# --------------------------------------------------------------------------- #


def test_endpoint_ok_and_verbatim_json() -> None:
    r = client.get("/api/explore/figure", params={"dim": "time", "measure": "postings"})
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("application/json")
    body = r.json()
    assert "data" in body and "layout" in body


def test_endpoint_validates_dim_and_measure() -> None:
    assert client.get("/api/explore/figure", params={"dim": "bogus", "measure": "postings"}).status_code == 422
    assert client.get("/api/explore/figure", params={"dim": "time", "measure": "bogus"}).status_code == 422


def test_endpoint_validates_locale() -> None:
    ok = client.get("/api/explore/figure", params={"dim": "time", "measure": "postings", "locale": "fr"})
    assert ok.status_code == 200
    bad = client.get("/api/explore/figure", params={"dim": "time", "measure": "postings", "locale": "de"})
    assert bad.status_code == 422


def test_endpoint_fr_axis_gate_localized() -> None:
    r = client.get(
        "/api/explore/figure",
        params={"dim": "province", "measure": "postings", "geo": ON, "locale": "fr"},
    )
    assert r.status_code == 200
    anns = r.json()["layout"].get("annotations") or []
    assert any("répartition" in a.get("text", "").lower() or "filtré" in a.get("text", "").lower() for a in anns)
