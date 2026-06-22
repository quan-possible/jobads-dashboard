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


@pytest.mark.parametrize("chart_id", ["occupations.treemap", "industries.treemap"])
def test_treemaps_are_time_animated(chart_id: str):
    """The treemaps ship one frame per year + a slider so they scrub through time."""
    payload = json.loads(figures.build(chart_id))
    frames = payload.get("frames") or []
    assert len(frames) >= 5, f"{chart_id}: expected yearly frames, got {len(frames)}"
    sliders = payload["layout"].get("sliders") or []
    assert sliders and sliders[0].get("steps"), f"{chart_id}: missing slider steps"
    assert len(sliders[0]["steps"]) == len(frames), f"{chart_id}: step/frame mismatch"


def test_fr_localizes_in_figure_chrome():
    """French requests translate baked-in axis/legend chrome; EN is untouched."""
    en = json.loads(figures.build("pulse.demand_ribbon", locale="en"))
    fr = json.loads(figures.build("pulse.demand_ribbon", locale="fr"))
    assert en["layout"]["yaxis"]["title"]["text"] == "postings / month"
    assert fr["layout"]["yaxis"]["title"]["text"] == "offres / mois"
    assert "moyenne sur 3 mois" in [t.get("name") for t in fr["data"]]


@pytest.mark.parametrize("chart_id", [
    "geography.yoy_choropleth", "geography.demand_map_share",
    "geography.demand_map_count", "geography.demand_map_percap", "geography.demand_map_lq",
])
def test_added_charts_are_time_animated(chart_id: str):
    payload = json.loads(figures.build(chart_id))
    assert len(payload.get("frames") or []) >= 5, f"{chart_id}: missing yearly frames"
    assert (payload["layout"].get("sliders") or [{}])[0].get("steps"), chart_id


def test_demand_map_measures_differ():
    """The four measure variants of the authoritative map must produce different fills."""
    import hashlib
    sigs = {m: hashlib.md5(figures.build(f"geography.demand_map_{m}").encode()).hexdigest()
            for m in ("share", "count", "percap", "lq")}
    assert len(set(sigs.values())) == 4, f"measures not distinct: {sigs}"


def test_skill_charts_use_human_labels():
    """Skill charts must show readable names, not bare taxonomy IDs."""
    blob = figures.build("skills.top_skills_trend")
    assert "Customer Service" in blob or "Communication" in blob, "no skill labels in trend"


@pytest.mark.parametrize("chart_id", ["occupations.ai_exposure", "geography.ai_exposure"])
def test_ai_exposure_charts_build(chart_id: str):
    """The Eloundou AI-exposure layer builds from the committed reference asset."""
    payload = json.loads(figures.build(chart_id))
    assert payload["data"], chart_id


def test_wave2b_charts_build():
    """The conditioned wage premium (wage×education) and AI-skill diffusion build
    from their derived assets."""
    for cid in ("pay.wage_by_education", "skills.ai_skill_diffusion"):
        payload = json.loads(figures.build(cid))
        assert payload["data"], cid


def test_ai_exposure_scatter_covers_broad_groups():
    # Numeric arrays are base64-encoded by Plotly; the string `text` array is plain.
    payload = json.loads(figures.build("occupations.ai_exposure"))
    names = payload["data"][0].get("text") or []
    assert len(names) >= 8, f"expected most broad groups, got {len(names)}"


def test_animated_choropleth_payload_is_cheap():
    """Frames must not re-embed the province geojson (it lives in the base trace)."""
    payload = figures.build("geography.yoy_choropleth")
    assert len(payload) < 600_000, "choropleth frames look like they re-embed geojson"


def test_no_causal_language_in_emitted_text():
    """The demand-signal framing forbids causal claims in chart chrome."""
    for chart_id in sorted(figures.REGISTRY):
        blob = figures.build(chart_id).lower()
        for verb in _CAUSAL:
            assert verb not in blob, f"{chart_id}: causal word {verb!r} in figure text"
