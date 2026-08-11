"""Build every dashboard asset and report its category count.

Run from the repo root:  PYTHONPATH=src .venv/bin/python docs/jobs/done/2026-06-25-ten-category-cap/evidence/count_categories.py

Counts, per trace: horizontal-bar y / vertical-bar x (datetime axes = 0, i.e. time),
treemap tiles (labels - root), heatmap max(rows, cols), choropleth distinct z,
marker-scatter points, and base-figure legend line series. Anything > 10 is flagged;
`pulse.seasonality` is the one allowed exception (12 months on a time axis).
"""
import os
import sys

_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", ".."))
sys.path[:0] = [_ROOT, os.path.join(_ROOT, "src")]

import numpy as np
import pandas as pd

import api.figures as F
from api.explore import build_explore_figure
import json

ds = F._ds()


def _arr(a):
    return [] if a is None else list(a)


def _is_time(vals):
    v = list(vals)[:3]
    out = bool(v)
    for x in v:
        out = out and (isinstance(x, (pd.Timestamp, np.datetime64))
                       or (isinstance(x, str) and len(x) >= 7 and "-" in x))
    return out


def _cat_count(tr):
    t = tr.type
    if t == "bar":
        cats = _arr(tr.y if tr.orientation == "h" else tr.x)
        return 0 if (cats and _is_time(cats)) else len(cats)
    if t == "treemap":
        return len(_arr(tr.labels)) - 1
    if t == "heatmap":
        return max(len(_arr(tr.x)), len(_arr(tr.y)))
    if t == "choropleth":
        return len(set(np.round(np.asarray(tr.z, float), 6)))
    if t in ("scatter", "scattergl"):
        x = _arr(tr.x)
        if "markers" in (tr.mode or "") and len(x) > 0 and not _is_time(x):
            return len(x)
    return 0


def registered():
    worst = {}
    for cid, fn in F.REGISTRY.items():
        fig = fn(ds, locale="en")
        traces = list(fig.data)
        for fr in (fig.frames or []):
            traces += list(fr.data)
        maxn = max([_cat_count(tr) for tr in traces] + [0])
        series = sum(1 for tr in fig.data if tr.type in ("scatter", "scattergl")
                     and "lines" in (tr.mode or "") and (tr.showlegend in (True, None)))
        worst[cid] = max(maxn, series)
    return worst


def explore():
    out = {}
    for dim in ("province", "occupation", "industry"):
        for measure in ("postings", "share", "yoy", "two_year", "wage"):
            fig = json.loads(build_explore_figure(dim, measure, start_year=2019, end_year=2024))
            n = max([len(tr.get("y", [])) for tr in fig.get("data", []) if tr.get("type") == "bar"] + [0])
            out[f"explore:{dim}/{measure}"] = n
    return out


if __name__ == "__main__":
    counts = {**registered(), **explore()}
    over = {k: v for k, v in counts.items() if v > 10 and k != "pulse.seasonality"}
    for k, v in sorted(counts.items(), key=lambda x: -x[1]):
        flag = "  <-- OVER 10" if (v > 10 and k != "pulse.seasonality") else (
            "  (time axis, exempt)" if k == "pulse.seasonality" else "")
        print(f"{v:3d}  {k}{flag}")
    print(f"\nassets over 10 (excl. seasonality time axis): {len(over)}")
