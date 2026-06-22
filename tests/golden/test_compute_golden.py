"""Layer A — golden tests for the pure transforms in ``viz/compute.py``.

The expected values here are **analytic**: each input is crafted so the correct
output is known from the mathematics of the transform, independent of the code
under test. This is the layer that proves the formulas; the fixture-backed
layers (B aggregation, C figure data) prove the wiring around them.

No fixtures, no I/O — these run anywhere the package imports.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from jobads_dashboard.viz import compute as C


# --------------------------------------------------------------------------- #
# Time-series basics
# --------------------------------------------------------------------------- #


def test_moving_average_partial_then_full_window():
    # window=3, min_periods=max(1, 3//2)=1 → leading partial means, then full.
    s = pd.Series([3.0, 6.0, 9.0, 12.0])
    got = C.moving_average(s, window=3)
    # [mean(3), mean(3,6), mean(3,6,9), mean(6,9,12)]
    assert got.tolist() == [3.0, 4.5, 6.0, 9.0]


def test_yoy_pct_doubling_after_twelve_months():
    months = pd.date_range("2020-01-01", periods=24, freq="MS")
    # first year = 100 flat, second year = 200 flat → +100% YoY from month 13 on.
    values = [100.0] * 12 + [200.0] * 12
    df = pd.DataFrame({"month": months, "v": values})
    out = C.yoy_pct(df, value="v")
    assert out["yoy_pct"].iloc[:12].isna().all()           # no 12-mo lag yet
    assert np.allclose(out["yoy_pct"].iloc[12:], 100.0)     # exact doubling


def test_index_to_base_rescales_so_base_year_mean_is_100():
    months = pd.date_range("2019-01-01", periods=24, freq="MS")
    # base year 2019 mean = 50 by construction (all 50). 2020 = 75 → index 150.
    values = [50.0] * 12 + [75.0] * 12
    df = pd.DataFrame({"month": months, "v": values})
    out = C.index_to_base(df, value="v", base_year=2019)
    assert np.allclose(out["index"].iloc[:12], 100.0)       # base year → 100
    assert np.allclose(out["index"].iloc[12:], 150.0)       # 75/50*100


def test_index_to_base_returns_nan_when_base_missing():
    months = pd.date_range("2021-01-01", periods=12, freq="MS")
    df = pd.DataFrame({"month": months, "v": [10.0] * 12})
    out = C.index_to_base(df, value="v", base_year=2019)    # no 2019 rows
    assert out["index"].isna().all()


# --------------------------------------------------------------------------- #
# Decomposition: what drove the change
# --------------------------------------------------------------------------- #


def test_contribution_to_growth_sums_to_overall_growth():
    base, end = pd.Timestamp("2019-06-01"), pd.Timestamp("2024-12-01")
    df = pd.DataFrame({
        "month": [base, base, end, end],
        "g": ["g1", "g2", "g1", "g2"],
        "v": [100.0, 100.0, 150.0, 100.0],
    })
    out = C.contribution_to_growth(df, group="g", value="v", base=base, end=end)
    by = out.set_index("g")["contribution_pp"]
    # total_base=200; g1 contributes (150-100)/200*100 = 25pp, g2 contributes 0.
    assert by["g1"] == 25.0
    assert by["g2"] == 0.0
    # accounting identity: contributions sum to the overall growth rate (25%).
    assert out["contribution_pp"].sum() == 25.0
    # sorted descending by contribution.
    assert out["g"].tolist() == ["g1", "g2"]


def test_shift_share_three_components_sum_to_actual_change():
    base, end = pd.Timestamp("2019-06-01"), pd.Timestamp("2024-12-01")
    rows = [
        (base, "R1", "gA", 50.0), (base, "R1", "gB", 50.0),
        (base, "R2", "gA", 30.0), (base, "R2", "gB", 70.0),
        (end,  "R1", "gA", 60.0), (end,  "R1", "gB", 40.0),
        (end,  "R2", "gA", 50.0), (end,  "R2", "gB", 90.0),
    ]
    df = pd.DataFrame(rows, columns=["month", "region", "g", "v"])
    out = C.shift_share(df, region="region", group="g", value="v", base=base, end=end)
    s = out.set_index("region")
    # NS + IM + RS == actual_change, the defining identity, for every region.
    recon = s["national_share"] + s["industry_mix"] + s["competitive_shift"]
    assert np.allclose(recon.values, s["actual_change"].values)
    # actual change == end_total - base_total per region (R1: 100→100=0; R2: 100→140=+40).
    assert s.loc["R1", "actual_change"] == 0.0
    assert s.loc["R2", "actual_change"] == 40.0


# --------------------------------------------------------------------------- #
# Specialisation & concentration
# --------------------------------------------------------------------------- #


def test_location_quotient_known_matrix():
    # A is 80/20, B is 20/80; national is 50/50 → LQ is the mirror pair.
    df = pd.DataFrame({
        "region": ["A", "A", "B", "B"],
        "g": ["g1", "g2", "g1", "g2"],
        "v": [80.0, 20.0, 20.0, 80.0],
    })
    lq = C.location_quotient(df, region="region", group="g", value="v")
    assert np.allclose(lq.loc["A", "g1"], 1.6)
    assert np.allclose(lq.loc["A", "g2"], 0.4)
    assert np.allclose(lq.loc["B", "g1"], 0.4)
    assert np.allclose(lq.loc["B", "g2"], 1.6)


def test_hhi_known_values():
    assert C.hhi(np.array([50, 50])) == 0.5            # two equal halves
    assert C.hhi(np.array([100])) == 1.0               # monopoly
    assert C.hhi(np.array([25, 25, 25, 25])) == 0.25   # four equal quarters


def test_lorenz_gini_equal_and_one_takes_all():
    _, _, gini_equal = C.lorenz_curve(np.array([25, 25, 25, 25]))
    assert np.isclose(gini_equal, 0.0)                 # perfect equality
    _, _, gini_skew = C.lorenz_curve(np.array([0, 0, 0, 100]))
    assert np.isclose(gini_skew, 0.75)                 # (n-1)/n with n=4


def test_topk_cumulative_share():
    out = C.topk_cumulative_share(np.array([40, 30, 20, 10]), k=2)
    assert out["rank"].tolist() == [1, 2]
    assert out["cum_share_pct"].tolist() == [40.0, 70.0]


# --------------------------------------------------------------------------- #
# Seasonality & anomalies
# --------------------------------------------------------------------------- #


def test_classical_decompose_recovers_linear_trend_and_seasonal():
    idx = pd.date_range("2019-01-01", periods=48, freq="MS")
    t = np.arange(48, dtype="float64")
    trend = 100.0 + 2.0 * t
    # a zero-mean (over the 12 calendar months) seasonal pattern.
    pattern = np.array([10, -5, 3, -8, 4, 6, -2, 7, -9, 1, -3, -4], dtype="float64")
    assert pattern.sum() == 0.0
    seasonal = pattern[(idx.month - 1).to_numpy()]
    observed = pd.Series(trend + seasonal, index=idx)

    res = C.classical_decompose(observed, period=12)
    interior = slice(6, 42)  # the 13-term centred MA needs 6 points each side
    assert np.allclose(res["trend"].to_numpy()[interior], trend[interior], atol=1e-6)
    assert np.allclose(res["seasonal"].to_numpy()[interior], seasonal[interior], atol=1e-6)
    assert np.allclose(res["resid"].to_numpy()[interior], 0.0, atol=1e-6)


def test_robust_z_known_median_and_mad():
    resid = pd.Series([1.0, 2.0, 3.0, 4.0, 5.0])   # median 3, MAD = median(|r-3|) = 1
    z = C.robust_z(resid)
    assert np.allclose(z.to_numpy(), 0.6745 * (np.array([1, 2, 3, 4, 5]) - 3.0))
    flat = C.robust_z(pd.Series([7.0, 7.0, 7.0]))  # MAD 0 → defined as all-zero
    assert np.allclose(flat.to_numpy(), 0.0)


def test_diffusion_index_rising_unchanged_falling():
    # 13 rows so row 12 has a 12-lag predecessor (row 0). 4 components:
    # A rises, B falls, C unchanged, D rises → (2 + 0.5*1)/4 * 100 = 62.5.
    rows = [[10.0, 10.0, 10.0, 10.0]] * 12 + [[20.0, 5.0, 10.0, 30.0]]
    wide = pd.DataFrame(rows, columns=list("ABCD"))
    di = C.diffusion_index(wide, lag=12, eps=0.0)
    assert di.iloc[:12].isna().all()       # no 12-lag predecessor yet
    assert di.iloc[12] == 62.5
