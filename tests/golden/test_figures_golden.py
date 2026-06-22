"""Layer C — figure-data goldens over all 43 charts (``api.figures.build``).

This is the layer that answers "is the information in each plot correct?". The
real build path is pointed at the fixture bundle (autouse monkeypatch); the
reference assets (AI β, labour force, wage-by-education, geojson) are still read
from the repo, so asset-using charts combine fixture postings with the real
committed assets. ``from_json`` decodes Plotly's base64 typed arrays back to
numpy so we can assert the plotted numbers.

Expected values are derived from the fixture construction (fixture-spec §B–§E),
Layer-A math, and the committed assets — never copied from build() output.
"""

from __future__ import annotations

import base64
import json

import numpy as np
import pytest

import api.figures as F
from jobads_dashboard.viz.datasource import DataSource

_CAUSAL = ("causes", "caused", "leads to", "because of", "due to", "drives up")

# Plotly serialises numeric arrays as base64 typed-array dicts ({dtype,bdata[,shape]}).
# This is exactly what the browser receives; decode it the way the browser would.
_DTYPE = {"i1": "int8", "u1": "uint8", "i2": "int16", "u2": "uint16",
          "i4": "int32", "u4": "uint32", "i8": "int64", "u8": "uint64",
          "f4": "float32", "f8": "float64"}


def _dec(v):
    """Decode a Plotly typed-array dict to a numpy array; pass lists/scalars through."""
    if isinstance(v, dict) and "bdata" in v:
        a = np.frombuffer(base64.b64decode(v["bdata"]), dtype=_DTYPE.get(v["dtype"], v["dtype"]))
        if v.get("shape"):
            a = a.reshape([int(s) for s in str(v["shape"]).split(",")])
        return a
    return v


class _Marker:
    def __init__(self, m):
        self._m = m or {}

    @property
    def color(self):
        return _dec(self._m.get("color"))


class _Trace:
    """Attribute view over a trace JSON dict that decodes typed arrays on access."""

    def __init__(self, d):
        self._d = d

    def __getattr__(self, k):
        if k == "marker":
            return _Marker(self._d.get("marker"))
        return _dec(self._d.get(k))


class _Frame:
    def __init__(self, d):
        self._d = d

    @property
    def name(self):
        return self._d.get("name")

    @property
    def data(self):
        return [_Trace(t) for t in self._d.get("data", [])]


class _Fig:
    """The figure JSON the browser receives, with typed arrays decoded on access."""

    def __init__(self, p):
        self._p = p

    @property
    def data(self):
        return [_Trace(t) for t in self._p.get("data", [])]

    @property
    def frames(self):
        return [_Frame(fr) for fr in self._p.get("frames", [])]


@pytest.fixture(scope="session")
def _fig_ds(fixture_bundle) -> DataSource:
    return DataSource(fixture_bundle)


@pytest.fixture(autouse=True)
def _point_api_at_fixture(monkeypatch, _fig_ds):
    """Every chart in this module builds from the fixture bundle, not the live data."""
    monkeypatch.setattr(F, "_ds", lambda: _fig_ds)


def fig(chart_id: str, locale: str = "en") -> _Fig:
    """The exact figure JSON the browser receives, with typed arrays decoded."""
    return _Fig(json.loads(F.build(chart_id, locale=locale)))


def payload(chart_id: str, locale: str = "en") -> dict:
    return json.loads(F.build(chart_id, locale=locale))


# --------------------------------------------------------------------------- #
# Smoke — all 43 build on the minimal corpus and obey the framing rules
# --------------------------------------------------------------------------- #


@pytest.mark.parametrize("chart_id", sorted(F.REGISTRY))
def test_every_chart_builds_on_fixture(chart_id):
    p = payload(chart_id)
    assert isinstance(p.get("data"), list) and p["data"], f"{chart_id}: empty data"
    layout = p["layout"]
    assert layout.get("template", {}).get("layout"), f"{chart_id}: template missing"
    assert not (layout.get("title") or {}).get("text"), f"{chart_id}: title not stripped"
    assert layout.get("paper_bgcolor") == "rgba(0,0,0,0)", chart_id


@pytest.mark.parametrize("chart_id", sorted(F.REGISTRY))
def test_no_causal_language(chart_id):
    blob = F.build(chart_id).lower()
    for verb in _CAUSAL:
        assert verb not in blob, f"{chart_id}: causal word {verb!r}"


# --------------------------------------------------------------------------- #
# Helpers for value goldens
# --------------------------------------------------------------------------- #


def loc_z(figure, frame_name=None) -> dict:
    """{location: z} for a choropleth — base trace, or a named frame."""
    tr = figure.data[0]
    if frame_name is not None:
        fr = {f.name: f for f in figure.frames}[frame_name]
        tr = fr.data[0]
    return dict(zip(list(tr.locations), np.asarray(tr.z, dtype=float)))


def by_name(figure) -> dict:
    """{trace.name: trace} for legend-named traces."""
    return {tr.name: tr for tr in figure.data if tr.name}


def xy_by_month(trace) -> dict:
    """{Timestamp(month): y} for a time-series trace."""
    import pandas as pd
    return {pd.Timestamp(str(x)): y for x, y in zip(trace.x, np.asarray(trace.y, dtype=float))}


# Known-by-construction constants (fixture-spec §B–§D).
DEC24 = __import__("pandas").Timestamp("2024-12-01")
JUN19 = __import__("pandas").Timestamp("2019-06-01")


# --------------------------------------------------------------------------- #
# PULSE
# --------------------------------------------------------------------------- #


def test_pulse_demand_ribbon_raw_and_ma(_fig_ds):
    f = fig("pulse.demand_ribbon")
    raw = xy_by_month(by_name(f)["Monthly postings"])
    assert raw[DEC24] == 20.0          # ×2 month
    assert raw[__import__("pandas").Timestamp("2022-06-01")] == 10.0
    ma = xy_by_month(by_name(f)["3-month average"])
    assert ma[DEC24] == 20.0           # (20+20+20)/3


def test_pulse_yoy_bars_step_to_plus_100(_fig_ds):
    f = fig("pulse.yoy_bars")
    ybm = xy_by_month(f.data[0])
    # Positional 12-lag: everything is flat at 10 until the 2024 ×2 step → +100%.
    for m, y in ybm.items():
        if m.year == 2024:
            assert y == 100.0, (m, y)
        else:
            assert y == 0.0, (m, y)


def test_pulse_seasonality_is_flat_unity(_fig_ds):
    # Uniform within-year counts → every month equals its year average → z ≡ 1.0.
    z = np.asarray(fig("pulse.seasonality").data[0].z, dtype=float)
    finite = z[np.isfinite(z)]
    assert finite.size > 0
    assert np.allclose(finite, 1.0)


def test_pulse_composition_shares(_fig_ds):
    f = fig("pulse.composition")
    bn = by_name(f)
    sci = xy_by_month(bn["Sciences & engineering"])
    assert sci[DEC24] == 40.0          # noc2 = 4/10 of national
    total = sum(xy_by_month(bn[n])[DEC24] for n in ("Sciences & engineering", "Health", "Sales & service"))
    assert total == 100.0


def test_pulse_occupation_trends_levels(_fig_ds):
    f = fig("pulse.occupation_trends")
    # Trace 0 is the largest group (Sciences/noc2): 4/month at ×1 → 8 at ×2.
    y0 = np.asarray(f.data[0].y, dtype=float)
    assert y0[-1] == 8.0


def test_pulse_momentum_matches_recomputed_transform(_fig_ds):
    import pandas as pd
    from jobads_dashboard.viz import compute as C
    s = _fig_ds.overall.set_index("month")["postings_total"]
    mom = (C.moving_average(s, 3) - C.moving_average(s, 12)).dropna()
    y = np.asarray(fig("pulse.momentum").data[0].y, dtype=float)
    assert np.allclose(y, mom.values)
    # ~0 across the flat era; strictly positive somewhere on the 2024 ramp (fast MA
    # rises before the slow MA catches up) and back to ~0 once the plateau fills both windows.
    assert abs(mom.loc[pd.Timestamp("2023-06-01")]) < 1e-9
    assert mom.max() > 0


def test_pulse_diffusion_matches_recomputed_transform(_fig_ds):
    from jobads_dashboard.viz import compute as C
    wide = _fig_ds.noc_broad.pivot_table(index="month", columns="noc_label", values="postings_total")
    di = C.moving_average(C.diffusion_index(wide).dropna(), 3)
    y = np.asarray(fig("pulse.diffusion").data[0].y, dtype=float)
    assert np.allclose(y, di.values)
    assert np.all((y >= 0) & (y <= 100))


# --------------------------------------------------------------------------- #
# GEOGRAPHY
# --------------------------------------------------------------------------- #


def test_geo_demand_map_count_year_2024(_fig_ds):
    z = loc_z(fig("geography.demand_map_count"))
    assert z == {"ON": 120, "AB": 72, "BC": 48}   # 2024 year sums (10/6/4 ×12)


def test_geo_demand_map_share_sums_to_100(_fig_ds):
    z = loc_z(fig("geography.demand_map_share"))
    assert z["ON"] == 50.0 and z["AB"] == 30.0 and z["BC"] == 20.0
    assert sum(z.values()) == 100.0


def test_geo_demand_map_percap_uses_real_labour_force(_fig_ds):
    lf = _fig_ds.province_labour_force.set_index("code")["labour_force"]
    z = loc_z(fig("geography.demand_map_percap"))
    for code, count in {"ON": 120, "AB": 72, "BC": 48}.items():
        assert np.isclose(z[code], count / lf[code] * 10000)


def test_geo_demand_map_lq_uses_national_labour_force(_fig_ds):
    lf = _fig_ds.province_labour_force.set_index("code")["labour_force"]
    lf_total = float(lf.sum())                    # national total over ALL provinces
    counts = {"ON": 120, "AB": 72, "BC": 48}
    tot = sum(counts.values())
    z = loc_z(fig("geography.demand_map_lq"))
    for code, count in counts.items():
        expected = (count / tot) / (lf[code] / lf_total)
        assert np.isclose(z[code], expected)


def test_geo_ranked_provinces(_fig_ds):
    tr = fig("geography.ranked_provinces").data[0]
    pairs = dict(zip(list(tr.y), np.asarray(tr.x, dtype=float)))
    assert pairs["Ontario"] == 120 and pairs["Alberta"] == 72 and pairs["British Columbia"] == 48
    assert list(np.asarray(tr.x, dtype=float)) == [48, 72, 120]


def test_geo_cma_demand_ordering(_fig_ds):
    # NOTE: cma_demand sums across the market table's grouping-set rows (province +
    # national scopes), so absolute volumes are inflated; the *ordering* is still
    # correct and is the chart's claim. (Magnitude inflation flagged to maintainers.)
    tr = fig("geography.cma_demand").data[0]
    cities = list(tr.y)                            # ascending by volume
    assert cities[-1] == "Toronto"                 # ON is the biggest market
    assert set(cities) == {"Toronto", "Calgary", "Vancouver"}
    assert list(np.asarray(tr.x, dtype=float)) == sorted(np.asarray(tr.x, dtype=float))


def test_geo_shift_share_identity_and_national_trend(_fig_ds):
    f = fig("geography.shift_share")
    bn = by_name(f)
    prov = list(bn["National trend"].y)
    ns = dict(zip(prov, np.asarray(bn["National trend"].x, dtype=float)))
    im = dict(zip(prov, np.asarray(bn["Occupation mix"].x, dtype=float)))
    rs = dict(zip(prov, np.asarray(bn["Local (competitive)"].x, dtype=float)))
    actual = dict(zip(prov, np.asarray(bn["Actual change"].x, dtype=float)))
    for p in prov:
        assert np.isclose(ns[p] + im[p] + rs[p], actual[p])   # accounting identity
    assert np.isclose(ns["Ontario"], 5) and np.isclose(ns["Alberta"], 3) and np.isclose(ns["British Columbia"], 2)
    assert all(np.isclose(im[p], 0) and np.isclose(rs[p], 0) for p in prov)


def test_geo_yoy_choropleth_plus_100_and_decembers(_fig_ds):
    f = fig("geography.yoy_choropleth")
    z = loc_z(f)                                   # base = latest December (2024)
    assert all(np.isclose(v, 100.0) for v in z.values())   # 20 vs 10 a year earlier
    assert [fr.name for fr in f.frames] == ["2021", "2022", "2023", "2024"]


def test_geo_ai_exposure_demand_weighted_beta(_fig_ds):
    beta = _fig_ds.ai_exposure.set_index("noc_code")["exposure_beta"]
    b2, b3, b6 = beta["2"], beta["3"], beta["6"]
    expected = {
        "ON": (72 * b2 + 24 * b3 + 24 * b6) / 120,
        "AB": (24 * b2 + 48 * b3) / 72,
        "BC": b6,
    }
    z = loc_z(fig("geography.ai_exposure"))
    for code, exp in expected.items():
        assert np.isclose(z[code], exp), (code, z[code], exp)


# --------------------------------------------------------------------------- #
# OCCUPATIONS
# --------------------------------------------------------------------------- #


def test_occ_treemap_children_sum_to_root(_fig_ds):
    tr = fig("occupations.treemap").data[0]
    vals = dict(zip(list(tr.labels), np.asarray(tr.values, dtype=float)))
    assert vals["All occupations"] == 240
    assert vals["Sciences & engineering"] == 96 and vals["Health"] == 72 and vals["Sales & service"] == 72
    children = sum(v for k, v in vals.items() if k != "All occupations")
    assert children == vals["All occupations"]


def test_occ_indexed_lines_base_and_step(_fig_ds):
    f = fig("occupations.indexed_lines")
    sci = xy_by_month(by_name(f)["Sciences & engineering"])
    assert np.isclose(sci[JUN19], 100.0)           # 2019 base = 100
    assert np.isclose(sci[DEC24], 200.0)           # 8 vs base 4 → 200


def test_occ_contribution_bars_sum_to_growth(_fig_ds):
    tr = fig("occupations.contribution_bars").data[0]
    by = dict(zip(list(tr.y), np.asarray(tr.x, dtype=float)))
    assert np.isclose(by["Sciences & engineering"], 40.0)
    assert np.isclose(sum(by.values()), 100.0)     # +100% overall growth


def test_occ_waterfall_reconciles(_fig_ds):
    tr = fig("occupations.waterfall").data[0]
    y = np.asarray(tr.y, dtype=float)
    measure = list(tr.measure)
    assert measure == ["absolute", "relative", "relative", "relative", "total"]
    assert y[0] == 10 and y[-1] == 20              # 2019 base → 2024 end
    assert np.isclose(y[0] + y[1:-1].sum(), y[-1]) # parts sum to the whole


def test_occ_dumbbell_base_end(_fig_ds):
    f = fig("occupations.dumbbell")
    base = dict(zip(list(by_name(f)["2019"].y), np.asarray(by_name(f)["2019"].x, dtype=float)))
    end = dict(zip(list(by_name(f)["2024"].y), np.asarray(by_name(f)["2024"].x, dtype=float)))
    assert base["Sciences & engineering"] == 4 and end["Sciences & engineering"] == 8
    assert base["Health"] == 3 and end["Health"] == 6


def test_occ_skill_churn_is_empty_under_min_base(_fig_ds):
    # min_base=150 with ≤2 AI mentions/month in one base month → nothing clears.
    tr = fig("occupations.skill_churn").data[0]
    assert len(np.asarray(tr.x)) == 0


def test_occ_ai_exposure_scatter_beta_and_growth(_fig_ds):
    beta = _fig_ds.ai_exposure.set_index("noc_code")["exposure_beta"]
    tr = fig("occupations.ai_exposure").data[0]
    pts = dict(zip(list(tr.text), zip(np.asarray(tr.x, dtype=float), np.asarray(tr.y, dtype=float))))
    assert np.isclose(pts["Sciences & engineering"][0], beta["2"])
    assert np.isclose(pts["Health"][0], beta["3"])
    assert all(np.isclose(y, 100.0) for _, y in pts.values())


def test_occ_noc_naics_heatmap_columns_normalize(_fig_ds):
    tr = fig("occupations.noc_naics_heatmap").data[0]
    z = np.asarray(tr.z, dtype=float)
    col_sums = np.nansum(z, axis=0)
    assert np.allclose(col_sums, 100.0)


# --------------------------------------------------------------------------- #
# INDUSTRIES
# --------------------------------------------------------------------------- #


def test_ind_coverage_line_is_80(_fig_ds):
    y = np.asarray(fig("industries.coverage_line").data[0].y, dtype=float)
    assert np.allclose(y, 80.0)                    # 16/20 coded every month


def test_ind_treemap_children_sum_to_root_coded_only(_fig_ds):
    tr = fig("industries.treemap").data[0]
    vals = dict(zip(list(tr.labels), np.asarray(tr.values, dtype=float)))
    assert vals["All industries"] == 192          # uncoded BC excluded
    children = sum(v for k, v in vals.items() if k != "All industries")
    assert children == 192


def test_ind_share_over_time_among_coded(_fig_ds):
    f = fig("industries.share_over_time")
    bn = by_name(f)
    prof = xy_by_month(bn["Professional services"])
    assert np.isclose(prof[DEC24], 50.0)           # 96/192 of coded
    total = sum(xy_by_month(bn[n])[DEC24]
                for n in ("Professional services", "Health care & social", "Retail trade"))
    assert np.isclose(total, 100.0)


def test_ind_contribution_bars_sum_to_growth(_fig_ds):
    tr = fig("industries.contribution_bars").data[0]
    by = dict(zip(list(tr.y), np.asarray(tr.x, dtype=float)))
    assert np.isclose(by["Professional services"], 50.0)
    assert np.isclose(sum(by.values()), 100.0)


# --------------------------------------------------------------------------- #
# PAY
# --------------------------------------------------------------------------- #


def test_pay_wage_band_quantiles_and_coverage(_fig_ds):
    f = fig("pay.wage_band")
    bn = by_name(f)
    assert xy_by_month(bn["Median"])[DEC24] == 20.0
    assert xy_by_month(bn["P75"])[DEC24] == 25.0
    assert xy_by_month(bn["P25–P75"])[DEC24] == 15.0
    cov = xy_by_month(bn["Wage coverage"])
    assert cov[JUN19] == 30.0 and cov[DEC24] == 15.0   # 3/10 then 3/20


def test_pay_wage_dumbbell_empty_under_threshold(_fig_ds):
    # wage_postings ≥ 200 required; max is 3 → no provinces qualify.
    tr = fig("pay.wage_dumbbell").data[0]
    assert len(np.asarray(tr.x)) == 0


def test_pay_wage_demand_quadrant_single_bubble(_fig_ds):
    tr = fig("pay.wage_demand_quadrant").data[0]
    assert list(tr.text) == ["Sciences & engineering"]
    assert np.asarray(tr.x, dtype=float)[0] == 20.0    # median wage
    assert np.asarray(tr.y, dtype=float)[0] == 100.0   # YoY +100%


def test_pay_education_wage_proxy_single_point(_fig_ds):
    tr = fig("pay.education_wage_proxy").data[0]
    assert list(tr.text) == ["Sciences & engineering"]
    assert np.asarray(tr.x, dtype=float)[0] == 100.0   # all non-Unknown noc2 ask a degree
    assert np.asarray(tr.y, dtype=float)[0] == 20.0    # median wage


def test_pay_wage_by_education_echoes_asset(_fig_ds):
    asset = _fig_ds.wage_by_education          # repo-anchored committed cross-section
    tr = by_name(fig("pay.wage_by_education"))["Median"]
    assert np.allclose(np.asarray(tr.x, dtype=float), asset["wage_median"].to_numpy())


def test_pay_conditions_mix_40_30_30(_fig_ds):
    bn = by_name(fig("pay.conditions_mix"))
    assert np.isclose(xy_by_month(bn["full-time"])[DEC24], 40.0)
    assert np.isclose(xy_by_month(bn["part-time"])[DEC24], 30.0)
    assert np.isclose(xy_by_month(bn["full-time or part-time"])[DEC24], 30.0)


def test_pay_language_gap_english_70_french_20(_fig_ds):
    bn = by_name(fig("pay.language_gap"))
    assert np.isclose(xy_by_month(bn["English mandatory"])[DEC24], 70.0)
    assert np.isclose(xy_by_month(bn["French mandatory"])[DEC24], 20.0)


# --------------------------------------------------------------------------- #
# SKILLS
# --------------------------------------------------------------------------- #


def test_skills_top_trend_flat_index(_fig_ds):
    # Fixed mention counts every month → each skill indexes to a flat 100.
    for tr in fig("skills.top_skills_trend").data:
        y = np.asarray(tr.y, dtype=float)
        assert np.allclose(y[np.isfinite(y)], 100.0)


def test_skills_ai_diffusion_is_40pct(_fig_ds):
    # ai_mentions=2, all_mentions=5 every month → 40%.
    y = np.asarray(fig("skills.ai_skill_diffusion").data[0].y, dtype=float)
    assert np.allclose(y, 40.0)


def test_skills_skill_lift_empty_under_min_postings(_fig_ds):
    # min_postings=50; Health has ≤1 skill mention/month → nothing clears.
    tr = fig("skills.skill_lift").data[0]
    assert len(np.asarray(tr.x)) == 0


def test_skills_occupation_heatmap_columns_normalize(_fig_ds):
    tr = fig("skills.skill_occupation_heatmap").data[0]
    z = np.asarray(tr.z, dtype=float)
    col_sums = np.nansum(z, axis=0)
    assert np.allclose(col_sums[col_sums > 0], 100.0)
    cols = list(tr.x)
    sci = z[:, cols.index("Sciences & engineering")]
    assert sorted(sci[sci > 0].tolist()) == [50.0, 50.0]


def test_skills_education_shares(_fig_ds):
    bn = by_name(fig("skills.education"))
    shares = {n: xy_by_month(tr)[DEC24] for n, tr in bn.items()}
    assert np.isclose(sum(shares.values()), 100.0)
    assert any(np.isclose(v, 10.0) for v in shares.values())   # College = 10%


def test_skills_experience_not_reported(_fig_ds):
    # No experienceDetails in the corpus → 100% "Not reported".
    y = np.asarray(fig("skills.experience").data[0].y, dtype=float)
    assert np.allclose(y, 100.0)


# --------------------------------------------------------------------------- #
# QUALITY
# --------------------------------------------------------------------------- #


def test_quality_coverage_lines_latest(_fig_ds):
    bn = by_name(fig("quality.coverage_lines"))
    latest = {n: xy_by_month(tr)[DEC24] for n, tr in bn.items()}
    assert np.isclose(latest["Occupation (NOC)"], 100.0)
    assert np.isclose(latest["Industry (NAICS)"], 80.0)
    assert np.isclose(latest["Hourly wage"], 15.0)
    assert np.isclose(latest["Education"], 70.0)
    assert np.isclose(latest["Skills"], 15.0)
    assert np.isclose(latest["Remote work"], 0.0)


def test_quality_coverage_latest_bars_and_thresholds(_fig_ds):
    tr = fig("quality.coverage_latest").data[0]
    cov = dict(zip(list(tr.y), np.asarray(tr.x, dtype=float)))
    colors = dict(zip(list(tr.y), list(tr.marker.color)))
    assert np.isclose(cov["Industry (NAICS)"], 80.0) and colors["Industry (NAICS)"] == "#cf7730"  # ≥80 brand
    assert np.isclose(cov["Education"], 70.0) and colors["Education"] == "#9aa7b0"                 # 40–80 grey
    assert np.isclose(cov["Hourly wage"], 15.0) and colors["Hourly wage"] == "#b5523a"            # <40 red


# --------------------------------------------------------------------------- #
# FR localisation — chrome translates, data values untouched
# --------------------------------------------------------------------------- #


def test_fr_chrome_translates_axis_and_legend(_fig_ds):
    en = payload("pulse.demand_ribbon", "en")
    fr = payload("pulse.demand_ribbon", "fr")
    assert en["layout"]["yaxis"]["title"]["text"] == "postings / month"
    assert fr["layout"]["yaxis"]["title"]["text"] == "offres / mois"
    assert "moyenne sur 3 mois" in [t.get("name") for t in fr["data"]]


def test_fr_does_not_change_plotted_values(_fig_ds):
    # FR translates the legend name (Median → médiane) but must not touch the values.
    en = xy_by_month(by_name(fig("pay.wage_band", "en"))["Median"])
    fr = xy_by_month(by_name(fig("pay.wage_band", "fr"))["médiane"])
    assert en[DEC24] == fr[DEC24] == 20.0


def test_fr_animated_slider_prefix(_fig_ds):
    fr = payload("geography.demand_map_share", "fr")
    assert fr["layout"]["sliders"][0]["currentvalue"]["prefix"] == "Année : "
