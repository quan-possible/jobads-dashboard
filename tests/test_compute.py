"""Unit tests for the dependency-free decomposition / indexing math.

Guards two correctness fixes from the redesign2 audit:
  * S08 — the even-period centred MA must not shift the trend by a month.
  * S09 — a genuine zero base-year mean must yield NaN, not a fabricated index
          anchored to the first observation.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

from jobads_dashboard.viz.compute import MONTH, classical_decompose, index_to_base


def test_classical_decompose_trend_is_not_shifted() -> None:
    """A linear trend plus a pure period-12 seasonal must recover the linear
    trend exactly at interior points — i.e. the centred MA is symmetric and not
    offset by a month (S08)."""
    idx = pd.date_range("2016-01-01", periods=60, freq="MS")
    t = np.arange(60, dtype="float64")
    trend_true = 100.0 + 2.0 * t  # clear slope, so any month-shift is visible
    month = idx.month.to_numpy()
    seasonal_true = 5.0 * np.sin(2 * np.pi * month / 12) + 3.0 * np.cos(2 * np.pi * month / 12)
    observed = pd.Series(trend_true + seasonal_true, index=idx)

    res = classical_decompose(observed, period=12)
    trend = res["trend"].to_numpy()

    # 13-term centred window is defined for indices 6 .. 53.
    interior = slice(6, 54)
    assert np.allclose(trend[interior], trend_true[interior], atol=1e-6), (
        "centred MA should recover the linear trend exactly (no month shift)"
    )
    # Explicit anti-shift check: trend[i] must be nearer trend_true[i] than the
    # neighbouring months (the old even-window MA landed ~1 month early).
    i = 30
    assert abs(trend[i] - trend_true[i]) < abs(trend[i] - trend_true[i - 1])
    assert abs(trend[i] - trend_true[i]) < abs(trend[i] - trend_true[i + 1])


def test_index_to_base_zero_base_is_nan() -> None:
    """A zero base-year mean is undefined; index_to_base returns NaN rather than
    rescaling against the first observation (S09)."""
    df = pd.DataFrame(
        {
            MONTH: pd.date_range("2019-01-01", periods=24, freq="MS"),
            "v": [0.0] * 12 + [10.0] * 12,  # all of base-year 2019 is zero
        }
    )
    out = index_to_base(df, "v", base_year=2019)
    assert out["index"].isna().all()


def test_index_to_base_normal_case() -> None:
    df = pd.DataFrame(
        {
            MONTH: pd.date_range("2019-01-01", periods=12, freq="MS"),
            "v": [100.0] * 12,
        }
    )
    out = index_to_base(df, "v", base_year=2019)
    assert np.allclose(out["index"].to_numpy(), 100.0)
