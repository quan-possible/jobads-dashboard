"""Layer A (property-based) — invariants the pure transforms in ``viz/compute.py``
must hold for *all* inputs of their shape, not just the hand-built fixtures.

These complement ``test_compute_golden.py``: that file pins exact values on
crafted inputs; this file asserts the defining identities (shift-share
reconciliation, index base = 100, contribution sums to total growth, diffusion
bounds, HHI bounds) across Hypothesis-generated inputs. Together they cover both
"is this number right here" and "does the law hold everywhere".

Generators use strictly positive magnitudes where a zero total would make the
identity itself undefined (a division by zero), which is the documented edge the
golden file checks separately.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from hypothesis import assume, given, settings
from hypothesis import strategies as st
from hypothesis.extra.numpy import arrays

from jobads_dashboard.viz import compute as C

BASE = pd.Timestamp("2019-01-01")
END = pd.Timestamp("2024-01-01")

_mag = st.floats(min_value=1.0, max_value=1e6, allow_nan=False, allow_infinity=False)
_nonneg = st.floats(min_value=0.0, max_value=1e6, allow_nan=False, allow_infinity=False)


@st.composite
def _panel(draw, single_group: bool = False):
    """A two-period long frame: columns month/region/group/value over a
    regions x groups grid with strictly positive values (so every row/col total
    is non-zero and the shift-share / contribution identities are well defined)."""
    n_region = 1 if single_group else draw(st.integers(min_value=2, max_value=4))
    n_group = draw(st.integers(min_value=2, max_value=5))
    b = draw(arrays(np.float64, (n_region, n_group), elements=_mag))
    e = draw(arrays(np.float64, (n_region, n_group), elements=_mag))
    rows = []
    for i in range(n_region):
        for j in range(n_group):
            rows.append({"month": BASE, "region": f"R{i}", "group": f"G{j}", "value": float(b[i, j])})
            rows.append({"month": END, "region": f"R{i}", "group": f"G{j}", "value": float(e[i, j])})
    return pd.DataFrame(rows)


@given(_panel())
@settings(max_examples=150, deadline=None)
def test_shift_share_reconciles(df: pd.DataFrame) -> None:
    """NS + IM + RS == actual_change for every region (the defining identity)."""
    ss = C.shift_share(df, "region", "group", "value", BASE, END)
    recon = ss["national_share"] + ss["industry_mix"] + ss["competitive_shift"]
    assert np.allclose(recon.to_numpy(), ss["actual_change"].to_numpy(), atol=1e-6, rtol=1e-9)


@given(_panel(single_group=True))
@settings(max_examples=150, deadline=None)
def test_contribution_sums_to_total_growth(df: pd.DataFrame) -> None:
    """Per-group contributions sum to the overall growth rate (an accounting identity)."""
    out = C.contribution_to_growth(df, "group", "value", BASE, END)
    base_total = df.loc[df["month"] == BASE, "value"].sum()
    end_total = df.loc[df["month"] == END, "value"].sum()
    expected = (end_total - base_total) / base_total * 100.0
    assert abs(out["contribution_pp"].sum() - expected) <= 1e-6 * max(1.0, abs(expected))
    # delta is exactly end - base per group
    assert np.allclose((out["end"] - out["base"]).to_numpy(), out["delta"].to_numpy(), atol=1e-9)


@given(st.lists(_mag, min_size=12, max_size=12))
@settings(max_examples=150, deadline=None)
def test_index_base_year_mean_is_100(vals: list[float]) -> None:
    """index_to_base rescales so the base-year mean is exactly 100."""
    months = pd.date_range("2019-01-01", periods=12, freq="MS")
    df = pd.DataFrame({"month": months, "value": vals})
    out = C.index_to_base(df, "value", 2019)
    assert abs(out.loc[out["month"].dt.year == 2019, "index"].mean() - 100.0) <= 1e-6


@given(arrays(np.float64, st.tuples(st.integers(13, 28), st.integers(2, 6)), elements=_nonneg))
@settings(max_examples=150, deadline=None)
def test_diffusion_index_in_range(a: np.ndarray) -> None:
    """The diffusion index is always within [0, 100] wherever it is defined."""
    di = C.diffusion_index(pd.DataFrame(a), lag=12).to_numpy()
    di = di[~np.isnan(di)]
    assert np.all((di >= -1e-9) & (di <= 100.0 + 1e-9))


@given(st.lists(_mag, min_size=1, max_size=12))
@settings(max_examples=150, deadline=None)
def test_hhi_bounds_and_singleton(vals: list[float]) -> None:
    """HHI lies in (0, 1]; a single competitor is a perfect monopoly (1.0)."""
    h = C.hhi(np.array(vals))
    assert 0.0 < h <= 1.0 + 1e-9
    if len(vals) == 1:
        assert abs(h - 1.0) <= 1e-9


@given(st.lists(_mag, min_size=2, max_size=10))
@settings(max_examples=100, deadline=None)
def test_moving_average_of_constant_is_constant(vals: list[float]) -> None:
    """A flat series has a flat moving average (no spurious trend)."""
    c = vals[0]
    s = pd.Series([c] * len(vals), dtype="float64")
    ma = C.moving_average(s, window=3)
    assume(not np.isnan(ma.to_numpy()).all())
    assert np.allclose(ma.dropna().to_numpy(), c, atol=1e-9)
