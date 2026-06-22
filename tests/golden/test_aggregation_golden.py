"""Layer B — golden tests for the aggregate builder (``dashboard/prepare.py``).

The real ``refresh_dashboard_data`` runs once against the frozen corpus (session
fixture). Every expected number below is derived from the corpus construction
(fixture-spec §B–§D), not from the builder's own output. This layer catches
wrong SQL: grouping-set scope, rollup identities, quantile interpolation,
coverage FILTERs, and the skills unnest.

Corpus recap (per base month = 10 postings; 2024 months are ×2 = 20):
  province split 50/30/20 (ON/AB/BC); NOC-broad split 40/30/30 (noc2/noc3/noc6);
  3 wage rows [10,20,30] in ON·noc2; skills in 3 postings (AI×2, GEN1×2, GEN2×1);
  AB education NULL; BC·noc6 NAICS NULL.
"""

from __future__ import annotations

import pandas as pd
import pytest

from jobads_dashboard.dashboard.constants import ALL_CANADA, ALL_INDUSTRIES, ALL_OCCUPATIONS
from jobads_dashboard.dashboard.prepare import validate_derived_package

DEC24 = pd.Timestamp("2024-12-01")
JUN19 = pd.Timestamp("2019-06-01")


def _read(bundle, name) -> pd.DataFrame:
    df = pd.read_parquet(bundle / name)
    if "month" in df.columns:
        df["month"] = pd.to_datetime(df["month"])
    return df


# --------------------------------------------------------------------------- #
# Headline counts and the source reconciliation
# --------------------------------------------------------------------------- #


def test_monthly_overall_counts_known_by_construction(fixture_bundle):
    overall = _read(fixture_bundle, "monthly_overall.parquet").set_index("month")
    # 2024-12 is a ×2 month → 20 postings; the coverage numerators are fixed.
    dec = overall.loc[DEC24]
    assert dec["postings_total"] == 20
    assert dec["wage_postings"] == 3          # 3 injected wage rows / month
    assert dec["naics_postings"] == 16        # BC·noc6 (4) uncoded → 16/20 = 80%
    assert dec["skills_postings"] == 3        # 3 skill-bearing postings / month
    assert dec["education_postings"] == 14    # AB rows (6) NULL → 14/20 = 70%
    assert dec["employment_type_postings"] == 20
    assert dec["duration_postings"] == 20
    assert dec["primary_language_postings"] == 20
    # 2019-06 is a ×1 month → 10 postings; the same fixed numerators.
    jun = overall.loc[JUN19]
    assert jun["postings_total"] == 10
    assert jun["wage_postings"] == 3
    assert jun["naics_postings"] == 8         # 8/10 coded
    assert jun["education_postings"] == 7     # 7/10 carry education


def test_grand_total_reconciles_to_corpus(fixture_bundle):
    overall = _read(fixture_bundle, "monthly_overall.parquet")
    # 27 base months ×10 + 12 months ×20 = 270 + 240 = 510.
    assert overall["postings_total"].sum() == 510


def test_validate_derived_package_is_green(fixture_bundle, corpus_root):
    result = validate_derived_package(fixture_bundle, source_root=corpus_root)
    assert result["validated"] is True, result
    assert result["monthly_overall_sum"] == 510
    assert result["source_postings_total"] == 510


# --------------------------------------------------------------------------- #
# Sliced cubes: province / NOC-broad / NAICS-broad scope
# --------------------------------------------------------------------------- #


def test_by_province_split_is_50_30_20(fixture_bundle):
    prov = _read(fixture_bundle, "monthly_by_province.parquet")
    dec = prov[prov["month"] == DEC24].set_index("province_scope")["postings_total"]
    assert dec["ON"] == 10 and dec["AB"] == 6 and dec["BC"] == 4   # ×2 of 5/3/2


def test_by_noc_broad_split_is_40_30_30(fixture_bundle):
    noc = _read(fixture_bundle, "monthly_by_noc_broad.parquet")
    dec = noc[noc["month"] == DEC24]
    by_code = {scope.split(" | ")[0]: tot
               for scope, tot in zip(dec["occupation_scope"], dec["postings_total"])}
    assert by_code["2"] == 8 and by_code["3"] == 6 and by_code["6"] == 6   # ×2 of 4/3/3


def test_by_naics_broad_split_with_uncoded_bucket(fixture_bundle):
    naics = _read(fixture_bundle, "monthly_by_naics_broad.parquet")
    dec = naics[naics["month"] == DEC24]
    by_code = {scope.split(" | ")[0]: tot
               for scope, tot in zip(dec["industry_scope"], dec["postings_total"])}
    assert by_code["54"] == 8 and by_code["62"] == 6 and by_code["44-45"] == 2
    # BC·noc6 has no NAICS → build_naics_case labels it "Unknown industry group"
    # (never NULL), so it is its own sector bucket, not dropped. All 20 appear.
    assert by_code["Unknown industry group"] == 4
    assert dec["postings_total"].sum() == 20


def test_filter_cube_fully_crossed_cell_and_rollup_identity(fixture_bundle):
    cube = _read(fixture_bundle, "monthly_filter_cube.parquet")
    dec = cube[cube["month"] == DEC24]
    # One fully-crossed cell: ON · Sciences(2) · sector 54 → 3 postings ×2 = 6.
    cell = dec[(dec["province_scope"] == "ON")
               & (dec["occupation_scope"].str.startswith("2 |"))
               & (dec["industry_scope"].str.startswith("54 |"))]
    assert cell["postings_total"].iloc[0] == 6
    # Rollup identity: the fully-crossed cells sum to the all-Canada grand total.
    fully = dec[(dec["province_scope"] != ALL_CANADA)
                & (dec["occupation_scope"] != ALL_OCCUPATIONS)
                & (dec["industry_scope"] != ALL_INDUSTRIES)]
    grand = dec[(dec["province_scope"] == ALL_CANADA)
                & (dec["occupation_scope"] == ALL_OCCUPATIONS)
                & (dec["industry_scope"] == ALL_INDUSTRIES)]["postings_total"].iloc[0]
    # Every posting has a (province, NOC-broad, NAICS-sector) triple — uncoded
    # NAICS lands in the "Unknown industry group" bucket rather than dropping out
    # — so the fully-crossed cells sum exactly to the all-Canada grand total.
    assert fully["postings_total"].sum() == 20
    assert grand == 20


# --------------------------------------------------------------------------- #
# Wage quantiles — quantile_cont linear interpolation on [10,20,30]
# --------------------------------------------------------------------------- #


def test_wage_quantiles_are_exact(fixture_bundle):
    wage = _read(fixture_bundle, "monthly_wage_cube.parquet")
    overall = wage[(wage["province_scope"] == ALL_CANADA)
                   & (wage["occupation_scope"] == ALL_OCCUPATIONS)
                   & (wage["industry_scope"] == ALL_INDUSTRIES)]
    for _, row in overall.iterrows():
        assert row["wage_postings"] == 3
        assert row["wage_p25"] == 15.0
        assert row["wage_median"] == 20.0
        assert row["wage_p75"] == 25.0


# --------------------------------------------------------------------------- #
# Coverage table — populated numerators per field
# --------------------------------------------------------------------------- #


def test_coverage_numerators(fixture_bundle):
    cov = _read(fixture_bundle, "coverage_by_field_monthly.parquet")
    dec = cov[(cov["month"] == DEC24)
              & (cov["province_scope"] == ALL_CANADA)
              & (cov["occupation_scope"] == ALL_OCCUPATIONS)
              & (cov["industry_scope"] == ALL_INDUSTRIES)].set_index("field_name")
    assert dec.loc["naics", "populated_postings"] == 16
    assert dec.loc["remunerationHrly", "populated_postings"] == 3
    assert dec.loc["skills", "populated_postings"] == 3
    assert dec.loc["education", "populated_postings"] == 14
    assert (dec["postings_total"] == 20).all()


# --------------------------------------------------------------------------- #
# Skills unnest — mention counts by code
# --------------------------------------------------------------------------- #


def test_skills_unnest_mention_counts(fixture_bundle):
    sk = _read(fixture_bundle, "monthly_skills_topk.parquet")
    sk["skill_code"] = sk["skill_code"].astype(str)
    dec = sk[sk["month"] == DEC24]
    by_code = dec.groupby("skill_code")["postings_total"].sum()
    # 2 postings carry AI + GEN1; 1 posting carries GEN2 → 2 / 2 / 1 mentions.
    assert by_code.get("30080004", 0) == 2
    assert by_code.get("10010001", 0) == 2
    assert by_code.get("10010002", 0) == 1
    assert dec["postings_total"].sum() == 5   # total skill mentions / month


# --------------------------------------------------------------------------- #
# Conditions / language category counts
# --------------------------------------------------------------------------- #


def test_conditions_employment_type_counts(fixture_bundle):
    cond = _read(fixture_bundle, "monthly_conditions.parquet")
    dec = cond[(cond["month"] == DEC24)
               & (cond["dimension"] == "Employment type")
               & (cond["province_scope"] == ALL_CANADA)
               & (cond["occupation_scope"] == ALL_OCCUPATIONS)
               & (cond["industry_scope"] == ALL_INDUSTRIES)].set_index("category")
    assert dec.loc["full-time", "postings_total"] == 8              # noc2
    assert dec.loc["part-time", "postings_total"] == 6              # noc3
    assert dec.loc["full-time or part-time", "postings_total"] == 6  # noc6
