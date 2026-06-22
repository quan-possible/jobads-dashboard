"""Analytical transforms shared by the figure factories.

Pure functions over tidy DataFrames - no Plotly, no I/O - so they are unit-test
friendly and reused verbatim by the live site. Each transform is *descriptive*:
contribution and shift-share are accounting identities, not causal claims, and the
docstrings say so where it matters.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

MONTH = "month"


# --------------------------------------------------------------------------- #
# Time-series basics
# --------------------------------------------------------------------------- #


def moving_average(s: pd.Series, window: int = 3) -> pd.Series:
    return s.rolling(window, min_periods=max(1, window // 2)).mean()


def yoy_pct(df: pd.DataFrame, value: str, by: str | None = None, x: str = MONTH) -> pd.DataFrame:
    """Append ``yoy_pct`` = year-over-year % change (12-month lag) within each group."""
    out = df.sort_values(x).copy()
    if by:
        out["yoy_pct"] = out.groupby(by, observed=True)[value].transform(lambda v: v.pct_change(12) * 100.0)
    else:
        out["yoy_pct"] = out[value].pct_change(12) * 100.0
    return out


def index_to_base(df: pd.DataFrame, value: str, base_year: int, by: str | None = None,
                  x: str = MONTH) -> pd.DataFrame:
    """Append ``index`` = value rescaled so the mean of ``base_year`` == 100 per group."""
    out = df.sort_values(x).copy()

    def _idx(g: pd.DataFrame) -> pd.Series:
        base = g.loc[g[x].dt.year == base_year, value].mean()
        if not base or np.isnan(base):
            base = g[value].iloc[0]
        return g[value] / base * 100.0

    if by:
        out["index"] = out.groupby(by, observed=True, group_keys=False).apply(_idx, include_groups=False)
    else:
        out["index"] = _idx(out)
    return out


# --------------------------------------------------------------------------- #
# Decomposition: what drove the change
# --------------------------------------------------------------------------- #


def contribution_to_growth(
    df: pd.DataFrame, group: str, value: str, base: pd.Timestamp, end: pd.Timestamp,
    x: str = MONTH,
) -> pd.DataFrame:
    """Per-group contribution to the total growth rate between two periods.

    ``contribution_i = (X_i,end - X_i,base) / T_base`` (percentage points). The
    contributions sum exactly to the overall growth rate - an accounting identity,
    not a causal attribution. Returns columns: group, base, end, delta, contribution_pp.
    """
    b = df[df[x] == base].set_index(group)[value]
    e = df[df[x] == end].set_index(group)[value]
    idx = b.index.union(e.index)
    b = b.reindex(idx).fillna(0.0)
    e = e.reindex(idx).fillna(0.0)
    total_base = b.sum()
    out = pd.DataFrame({
        group: idx,
        "base": b.values,
        "end": e.values,
        "delta": (e - b).values,
        "contribution_pp": ((e - b) / total_base * 100.0).values if total_base else np.nan,
    })
    return out.sort_values("contribution_pp", ascending=False, ignore_index=True)


def shift_share(
    df: pd.DataFrame, region: str, group: str, value: str,
    base: pd.Timestamp, end: pd.Timestamp, x: str = MONTH,
) -> pd.DataFrame:
    """Classic three-component shift-share by region (accounting identity, not causation).

    For each region the base-period employment-of-demand is decomposed into:
      - national share (NS): growth if the region had tracked the national total;
      - industry/occupation mix (IM): effect of the region's base composition;
      - regional/competitive shift (RS): the residual local performance.
    NS + IM + RS == actual change. Fixed pre-COVID base recommended by the caller.
    """
    piv_b = df[df[x] == base].pivot_table(index=region, columns=group, values=value, aggfunc="sum", fill_value=0.0)
    piv_e = df[df[x] == end].pivot_table(index=region, columns=group, values=value, aggfunc="sum", fill_value=0.0)
    cols = piv_b.columns.union(piv_e.columns)
    piv_b = piv_b.reindex(columns=cols, fill_value=0.0)
    piv_e = piv_e.reindex(columns=cols, fill_value=0.0)

    nat_b = piv_b.sum().sum()
    nat_e = piv_e.sum().sum()
    g_nat = (nat_e - nat_b) / nat_b if nat_b else 0.0

    grp_b = piv_b.sum(axis=0)
    grp_e = piv_e.sum(axis=0)
    g_grp = (grp_e - grp_b) / grp_b.replace(0, np.nan)  # national growth per group

    rows = []
    for r in piv_b.index:
        e_rg_b = piv_b.loc[r]
        ns = e_rg_b.sum() * g_nat
        im = (e_rg_b * (g_grp - g_nat)).sum()
        # competitive: actual region change minus NS minus IM
        actual = piv_e.loc[r].sum() - e_rg_b.sum()
        rs = actual - ns - im
        rows.append({region: r, "national_share": ns, "industry_mix": im,
                     "competitive_shift": rs, "actual_change": actual})
    return pd.DataFrame(rows)


# --------------------------------------------------------------------------- #
# Breadth of growth
# --------------------------------------------------------------------------- #


def diffusion_index(wide: pd.DataFrame, lag: int = 12, eps: float = 0.0) -> pd.Series:
    """Breadth of growth across components: (%rising) + 0.5*(%unchanged), in [0, 100].

    ``wide`` is a period x component matrix. A component is "rising" when its value
    exceeds its value ``lag`` periods earlier by more than ``eps``. 50 = balanced.
    """
    prev = wide.shift(lag)
    diff = wide - prev
    rising = (diff > eps).sum(axis=1)
    unchanged = (diff.abs() <= eps).sum(axis=1)
    valid = wide.notna() & prev.notna()
    n = valid.sum(axis=1).replace(0, np.nan)
    return (rising + 0.5 * unchanged) / n * 100.0
