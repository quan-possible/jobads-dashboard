#!/usr/bin/env python3
"""Build the broad-NOC AI-exposure reference asset (Eloundou β).

This is dashboard-side *reference-data tooling*, not the upstream corpus pipeline.
It builds a small static asset once (re-run only when the inputs change); the
output is committed and read at request time like the bundled geojson.

What it does
------------
1. Eloundou et al. "GPTs are GPTs" task-based AI-exposure, keyed at O*NET-SOC.
   Headline metric = β (LLM + tools can cut task time ≥50%); we keep α (LLM
   alone) and γ/ζ (LLM + all complementary software) as bounds. Human ratings are
   primary, the model ("dv") ratings are the fallback for occupations the human
   panel did not score.
2. A published O*NET-SOC → NOC 2021 crosswalk from bcgov/onet-noc2021-crosswalk,
   which is itself built from Statistics Canada's official SOC 2018(US) ↔ NOC 2016
   concordance and StatCan's NOC 2016 ↔ NOC 2021 concordance. We use the NOC 2021
   output directly because the dashboard's postings are cut on NOC 2021 broad
   groups — the NOC 2016 first digit does NOT line up with NOC 2021 (the 2021 TEER
   restructuring dissolved the old "0 = Management" top digit), so going through the
   raw 2016 concordance and taking its first digit would mis-bin the exposure.
3. Roll detailed exposure up to the 10 broad NOC 2021 groups (first digit of the
   5-digit code), splitting one O*NET occupation across the NOC codes it maps to by
   the crosswalk's mapping-strength weight, then taking the strength-weighted mean
   within each broad group.

Honesty notes baked into the asset's ``method`` string:
- The roll-up is *mapping-strength* weighted, NOT employment weighted (no public
  NOC-employment table is bundled). The broad ranking is robust to this.
- Exposure is US-task-based (Eloundou) mapped onto Canadian occupations — a
  *potential-exposure* signal, not realized automation, shown only at the broad level.

Usage
-----
    python tools/build_ai_exposure.py            # download (cache) + build
    python tools/build_ai_exposure.py --offline  # use cached sources only

Sources (public):
- Eloundou occ_level.csv : openai/GPTs-are-GPTs (MIT)
- O*NET→NOC2021 mapping  : bcgov/onet-noc2021-crosswalk (Apache-2.0), built from
                           StatCan concordances (StatCan Open Licence).
"""

from __future__ import annotations

import argparse
import sys
import urllib.request
from pathlib import Path

import pandas as pd

REPO_ROOT = Path(__file__).resolve().parents[1]
SRC_DIR = REPO_ROOT / "data" / "ai" / "_sources"
OUT_PATH = REPO_ROOT / "data" / "ai" / "occupation_ai_exposure.parquet"

ELOUNDOU_URL = "https://raw.githubusercontent.com/openai/GPTs-are-GPTs/main/data/occ_level.csv"
CROSSWALK_URL = ("https://raw.githubusercontent.com/bcgov/onet-noc2021-crosswalk/"
                 "main/output/3.0.0/onet_to_noc2021_mapping.csv")

NOC_BROAD_NAMES = {
    "0": "Legislative and senior management",
    "1": "Business, finance and administration",
    "2": "Natural and applied sciences",
    "3": "Health",
    "4": "Education, law, social & government",
    "5": "Art, culture, recreation and sport",
    "6": "Sales and service",
    "7": "Trades, transport and equipment operators",
    "8": "Natural resources and agriculture",
    "9": "Manufacturing and utilities",
}

METHOD = ("Eloundou et al. 'GPTs are GPTs' beta exposure (human-rated primary, model "
          "fallback), mapped O*NET-SOC -> NOC 2021 via bcgov crosswalk (built from "
          "StatCan SOC2018us<->NOC concordances), rolled to broad NOC by "
          "mapping-strength-weighted mean. Not employment-weighted.")


def _fetch(url: str, dest: Path, *, offline: bool) -> Path:
    if dest.exists():
        return dest
    if offline:
        raise SystemExit(f"--offline but missing cached source: {dest}\n  expected from {url}")
    dest.parent.mkdir(parents=True, exist_ok=True)
    print(f"  downloading {url}")
    urllib.request.urlretrieve(url, dest)  # noqa: S310 (trusted public raw URLs)
    return dest


def build(offline: bool = False) -> pd.DataFrame:
    eloundou_csv = _fetch(ELOUNDOU_URL, SRC_DIR / "eloundou_occ_level.csv", offline=offline)
    crosswalk_csv = _fetch(CROSSWALK_URL, SRC_DIR / "onet_to_noc2021_mapping.csv", offline=offline)

    # 1. Eloundou exposure, collapsed to SOC 2018 6-digit (mean over the .xx variants).
    e = pd.read_csv(eloundou_csv)
    e.columns = [c.strip() for c in e.columns]
    e["soc6"] = e["O*NET-SOC Code"].astype(str).str.split(".").str[0]
    e["beta"] = e["human_rating_beta"].fillna(e["dv_rating_beta"])
    e["beta_dv"] = e["dv_rating_beta"]
    e["alpha"] = e["human_rating_alpha"].fillna(e["dv_rating_alpha"])
    e["gamma"] = e["human_rating_gamma"].fillna(e["dv_rating_gamma"])
    occ = e.groupby("soc6", as_index=False)[["beta", "beta_dv", "alpha", "gamma"]].mean()

    # 2. Crosswalk edges collapsed to (SOC6 -> NOC broad) with summed mapping weight.
    x = pd.read_csv(crosswalk_csv, dtype={"onet_soc_code": str, "noc_2021": str})
    x["soc6"] = x["onet_soc_code"].str.split(".").str[0]
    x["broad"] = x["noc_2021"].str[0]
    edges = x.groupby(["soc6", "broad"], as_index=False)["equal_weight"].sum()

    # 3. Attach exposure to each edge and take the weight-weighted mean per broad group.
    m = edges.merge(occ, on="soc6", how="inner")

    def _wmean(g: pd.DataFrame, col: str) -> float:
        w = g["equal_weight"]
        return float((g[col] * w).sum() / w.sum()) if w.sum() else float("nan")

    rows = []
    for broad, g in m.groupby("broad"):
        rows.append({
            "noc_code": broad,
            "noc_name": NOC_BROAD_NAMES.get(broad, broad),
            "exposure_beta": _wmean(g, "beta"),
            "exposure_beta_dv": _wmean(g, "beta_dv"),
            "exposure_alpha": _wmean(g, "alpha"),
            "exposure_gamma": _wmean(g, "gamma"),
            "n_occupations": int(g["soc6"].nunique()),
            "method": METHOD,
        })
    out = pd.DataFrame(rows).sort_values("noc_code").reset_index(drop=True)
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--offline", action="store_true", help="use cached sources only")
    args = ap.parse_args()

    df = build(offline=args.offline)
    if len(df) != 10:
        print(f"WARNING: expected 10 broad NOC rows, got {len(df)}", file=sys.stderr)
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(OUT_PATH, index=False)
    print(f"wrote {OUT_PATH} ({len(df)} rows)")
    with pd.option_context("display.width", 140, "display.max_columns", None):
        print(df[["noc_code", "noc_name", "exposure_beta", "n_occupations"]].to_string(index=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
