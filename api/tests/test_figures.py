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
    # The house template must travel to the browser.
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


def test_fr_localizes_pulse_residual_legend():
    fr = json.loads(figures.build("pulse.composition", locale="fr"))
    names = [trace.get("name") for trace in fr["data"]]
    assert "Autres groupes" in names
    assert "Other groups" not in names


@pytest.mark.parametrize(("chart_id", "english_leaks"), [
    ("occupations.treemap", ("All occupations", "Sales & service", "Unknown<br>")),
    ("occupations.indexed_lines", ("Manufacturing & utilities", "Sciences & engineering")),
    ("occupations.skill_churn", ("Communication skills", "Customer Service", "Interpersonal Skills")),
    ("pulse.composition", ("Sales & service", "Business & finance", "Trades & transport")),
    ("pulse.occupation_trends", ("Sales & service", "Business & finance", "Trades & transport")),
    ("industries.treemap", ("All industries", "Health care & social", "Other sectors<br>")),
    ("geography.ranked_provinces", ("British Columbia", "Quebec", "Atlantic Canada")),
    ("geography.cma_demand", ("(CMA)",)),
    ("geography.shift_share", ("National trend", "Occupation mix", "Local (competitive)", "Quebec")),
    ("geography.yoy_choropleth", ("March 2026", "British Columbia", "Quebec")),
    ("pay.wage_dumbbell", ("British Columbia", "Quebec", "Newfoundland & Labrador")),
    ("pay.wage_by_education", ("No requirement", "High school", "Doctorate")),
    ("pay.conditions_mix", ("full-time", "part-time", "Unknown")),
    ("skills.education", ("Graduate Degree", "High School", "No Education")),
    ("skills.experience", ("1-3 years", "Not reported", "Other specified")),
    ("skills.skill_occupation_heatmap", ("Teamwork", "Customer Service", "Decision-Making")),
    ("skills.skill_lift", ("Splints", "Physical Assessment", "Intensive Care")),
])
def test_fr_figures_do_not_leak_known_english_labels(chart_id, english_leaks):
    blob = figures.build(chart_id, locale="fr")
    assert not [text for text in english_leaks if text in blob]


@pytest.mark.parametrize("chart_id", ["occupations.indexed_lines", "skills.top_skills_trend"])
def test_indexed_lines_do_not_use_endpoint_text_annotations(chart_id):
    """Endpoint labels duplicate the legend and make Plotly extend mobile time axes years past the data."""
    payload = json.loads(figures.build(chart_id))
    annotations = payload["layout"].get("annotations") or []
    assert all("<b>" not in str(item.get("text", "")) for item in annotations)


def test_education_legend_uses_complete_short_labels():
    payload = json.loads(figures.build("skills.education"))
    names = {trace.get("name") for trace in payload["data"]}
    assert {"Doctorate", "Master’s", "Bachelor’s", "College / certificate"} <= names
    assert not any(name and name.endswith(("Doctora", "Bachelor", "Certificati")) for name in names)


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


# --------------------------------------------------------------------------- #
# Uncapped team view: full=1 is honoured only for a valid session.
# --------------------------------------------------------------------------- #

# A chart whose public cap (10) bites and whose uncapped set is clearly larger:
# ranked provinces fold the Atlantic four into one bar publicly (≤10) but split
# into 11 individual provinces for the team view.
_CAPPED_CHART = "geography.ranked_provinces"

_PASSWORD = "test-figure-password"


def _bar_count(blob: str) -> int:
    """Number of categories on the first bar trace of a figure JSON string."""
    payload = json.loads(blob)
    for trace in payload["data"]:
        y = trace.get("y")
        if isinstance(y, list):
            return len(y)
    raise AssertionError("no bar trace found")


@pytest.fixture()
def _configured(monkeypatch):
    """A known plaintext password + non-secure cookies (the TestClient talks
    plain http), mirroring api/tests/test_private.py."""
    from api import auth
    from api.routers import private as private_router

    monkeypatch.delenv(auth.PASSWORD_HASH_ENV, raising=False)
    monkeypatch.setenv(auth.PASSWORD_PLAIN_ENV, _PASSWORD)
    monkeypatch.setenv("JOBADS_API_COOKIE_SECURE", "false")
    private_router._AUTH_FAILURES.clear()


def test_build_uncapped_has_more_categories():
    """The figure factory itself returns more categories uncapped than capped."""
    capped = _bar_count(figures.build(_CAPPED_CHART))
    full = _bar_count(figures.build(_CAPPED_CHART, uncapped=True))
    assert full > capped, f"uncapped should exceed capped: {full} vs {capped}"


def test_full_without_session_stays_capped():
    """full=1 from an anonymous client is ignored — the public cap holds and the
    response stays cacheable (no private/no-store)."""
    anon = TestClient(app)
    plain = anon.get(f"/api/figure/{_CAPPED_CHART}")
    full = anon.get(f"/api/figure/{_CAPPED_CHART}?full=1")
    assert full.status_code == 200
    assert _bar_count(full.text) == _bar_count(plain.text)
    assert "no-store" not in full.headers.get("cache-control", "").lower()


def test_full_with_session_is_uncapped_and_private(_configured):
    """A valid session + full=1 returns the uncapped figure, marked private so it
    never lands in a shared cache."""
    c = TestClient(app)
    assert c.post("/api/auth", json={"password": _PASSWORD}).status_code == 200

    capped = c.get(f"/api/figure/{_CAPPED_CHART}")           # no full → public
    full = c.get(f"/api/figure/{_CAPPED_CHART}?full=1")      # authed + full → uncapped
    assert full.status_code == 200
    assert _bar_count(full.text) > _bar_count(capped.text)
    cc = full.headers.get("cache-control", "").lower()
    assert "private" in cc and "no-store" in cc, cc
    # Without full=1 the same authed client still gets the cacheable public view.
    assert "no-store" not in capped.headers.get("cache-control", "").lower()
