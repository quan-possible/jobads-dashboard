"""Tests for the figure bridge (api/figures.py + /api/figure)."""

from __future__ import annotations

import json

import pytest
from fastapi.testclient import TestClient

from api import figures
from api.main import app

client = TestClient(app)

# Causal verbs the demand-signal framing forbids in emitted chart text.
_CAUSAL = ("causes", "caused", "leads to", "because of", "due to", "drives up")


def test_registry_nonempty():
    assert figures.REGISTRY, "no charts registered"


@pytest.mark.parametrize("chart_id", sorted(figures.REGISTRY))
def test_every_chart_builds(chart_id: str):
    """Every registered factory renders to parseable figure JSON with the look
    inlined and the headline stripped (the editorial frame owns it)."""
    payload = json.loads(figures.build(chart_id))
    assert isinstance(payload.get("data"), list) and payload["data"], chart_id
    layout = payload["layout"]
    # The redesign2 template must travel to the browser.
    assert layout.get("template", {}).get("layout"), f"{chart_id}: template missing"
    # Headline stripped; backgrounds transparent so the figure floats on the card.
    assert not (layout.get("title") or {}).get("text"), f"{chart_id}: title not stripped"
    assert layout.get("paper_bgcolor") == "rgba(0,0,0,0)", chart_id


def test_endpoint_ok_and_verbatim_json():
    r = client.get("/api/figure/pulse.demand_ribbon")
    assert r.status_code == 200
    assert r.headers["content-type"].startswith("application/json")
    body = r.json()
    assert "data" in body and "layout" in body


def test_endpoint_locale_validated():
    assert client.get("/api/figure/pulse.demand_ribbon?locale=fr").status_code == 200
    assert client.get("/api/figure/pulse.demand_ribbon?locale=de").status_code == 422


def test_unknown_chart_id_404():
    assert client.get("/api/figure/nope.nope").status_code == 404


def test_figure_ids_listing():
    ids = client.get("/api/figures").json()["chart_ids"]
    assert "occupations.treemap" in ids


def test_no_causal_language_in_emitted_text():
    """The demand-signal framing forbids causal claims in chart chrome."""
    for chart_id in sorted(figures.REGISTRY):
        blob = figures.build(chart_id).lower()
        for verb in _CAUSAL:
            assert verb not in blob, f"{chart_id}: causal word {verb!r} in figure text"
