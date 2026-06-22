"""Typed, cached access to the derived parquet bundle.

Wraps the existing :func:`jobads_dashboard.dashboard.data.load_tables` loader so
the viz layer and the live app read the data the same way. Accessors return clean,
analysis-ready frames (parsed code/label columns, datetime months, scope-filtered)
and never scan the raw corpus - everything comes from the precomputed aggregates.
"""

from __future__ import annotations

import functools
import json
from pathlib import Path

import pandas as pd

from ..dashboard.constants import ALL_CANADA, ALL_INDUSTRIES, ALL_OCCUPATIONS
from ..dashboard.data import load_tables
from .labels import NAICS_SHORT, NOC_SHORT

# Repo-relative default: <repo>/data/derived/labor_market_dashboard_v1
_DEFAULT_ROOT = Path(__file__).resolve().parents[3] / "data" / "derived" / "labor_market_dashboard_v1"
_GEO_PATH = Path(__file__).resolve().parents[3] / "data" / "geo" / "canada_provinces.geojson"
_REFERENCE = Path(__file__).resolve().parents[3] / "data" / "reference"
_AI_PATH = Path(__file__).resolve().parents[3] / "data" / "ai" / "occupation_ai_exposure.parquet"

#: Last clean pre-COVID year - the cross-series indexing baseline (plan default).
BASE_YEAR = 2019

PROVINCE_NAMES = {
    "AB": "Alberta", "BC": "British Columbia", "MB": "Manitoba", "NB": "New Brunswick",
    "NL": "Newfoundland & Labrador", "NS": "Nova Scotia", "NT": "Northwest Territories",
    "NU": "Nunavut", "ON": "Ontario", "PE": "Prince Edward Island", "QC": "Quebec",
    "SK": "Saskatchewan", "YT": "Yukon",
}

# Approximate province population centroids for the bubble map (lon, lat).
PROVINCE_CENTROID = {
    "AB": (-114.4, 53.0), "BC": (-122.9, 50.5), "MB": (-97.8, 52.0), "NB": (-66.2, 46.5),
    "NL": (-57.0, 49.0), "NS": (-63.3, 45.0), "NT": (-119.0, 64.5), "NU": (-90.0, 66.0),
    "ON": (-82.0, 47.0), "PE": (-63.2, 46.4), "QC": (-72.0, 49.5), "SK": (-106.0, 53.5),
    "YT": (-135.0, 63.5),
}


def _parse_code_label(s: pd.Series) -> pd.DataFrame:
    """Split a 'code | label' scope string into (code, label, short)."""
    parts = s.str.split("|", n=1, expand=True)
    code = parts[0].str.strip()
    label = parts[1].str.strip().where(parts[1].notna(), code)
    return pd.DataFrame({"code": code.values, "label": label.values}, index=s.index)


class DataSource:
    """Lazy, cached accessor over one derived bundle."""

    def __init__(self, data_root: Path | str | None = None) -> None:
        self.data_root = Path(data_root) if data_root else _DEFAULT_ROOT
        self._tables = load_tables(self.data_root)

    # -- raw table access ---------------------------------------------------- #
    def table(self, name: str) -> pd.DataFrame:
        return self._tables[name].copy()

    # -- scope-level series -------------------------------------------------- #
    @functools.cached_property
    def overall(self) -> pd.DataFrame:
        return self._tables["monthly_overall"].sort_values("month").reset_index(drop=True)

    @property
    def latest_month(self) -> pd.Timestamp:
        return pd.Timestamp(self.overall["month"].max())

    @property
    def first_month(self) -> pd.Timestamp:
        return pd.Timestamp(self.overall["month"].min())

    @functools.cached_property
    def noc_broad(self) -> pd.DataFrame:
        df = self._tables["monthly_by_noc_broad"].copy()
        cl = _parse_code_label(df["occupation_scope"])
        df["noc_code"], df["noc_label"] = cl["code"], cl["label"]
        df["noc_name"] = df["noc_code"].map(NOC_SHORT).fillna("Unknown")
        return df.sort_values("month").reset_index(drop=True)

    @functools.cached_property
    def naics_broad(self) -> pd.DataFrame:
        df = self._tables["monthly_by_naics_broad"].copy()
        cl = _parse_code_label(df["industry_scope"])
        df["naics_code"], df["naics_label"] = cl["code"], cl["label"]
        df["naics_name"] = df["naics_code"].map(NAICS_SHORT).fillna("Unknown")
        return df.sort_values("month").reset_index(drop=True)

    @functools.cached_property
    def province(self) -> pd.DataFrame:
        df = self._tables["monthly_by_province"].copy()
        df["province_name"] = df["province_scope"].map(PROVINCE_NAMES).fillna(df["province_scope"])
        return df.sort_values("month").reset_index(drop=True)

    @functools.cached_property
    def market(self) -> pd.DataFrame:
        return self._tables["monthly_by_market"].sort_values("month").reset_index(drop=True)

    # -- wages --------------------------------------------------------------- #
    @functools.cached_property
    def wage_overall(self) -> pd.DataFrame:
        df = self._tables["monthly_wage_cube"]
        m = (
            (df["province_scope"] == ALL_CANADA)
            & (df["occupation_scope"] == ALL_OCCUPATIONS)
            & (df["industry_scope"] == ALL_INDUSTRIES)
        )
        return df[m].sort_values("month").reset_index(drop=True)

    @functools.cached_property
    def wage_by_province(self) -> pd.DataFrame:
        df = self._tables["monthly_wage_by_province"].copy()
        df["province_name"] = df["province_scope"].map(PROVINCE_NAMES).fillna(df["province_scope"])
        return df.sort_values("month").reset_index(drop=True)

    @functools.cached_property
    def wage_by_noc(self) -> pd.DataFrame:
        df = self._tables["monthly_wage_by_noc_broad"].copy()
        cl = _parse_code_label(df["occupation_scope"])
        df["noc_code"], df["noc_label"] = cl["code"], cl["label"]
        df["noc_name"] = df["noc_code"].map(NOC_SHORT).fillna("Unknown")
        return df.sort_values("month").reset_index(drop=True)

    # -- categorical dimensions ---------------------------------------------- #
    #: Collapse duplicate employment-type encodings onto canonical labels.
    _EMPLOYMENT_TYPE_MAP = {
        "ft": "full-time", "pt": "part-time", "ft/pt": "full-time or part-time",
    }

    def conditions(self, dimension: str) -> pd.DataFrame:
        df = self._tables["monthly_conditions"]
        sub = df[
            (df["dimension"] == dimension)
            & (df["province_scope"] == ALL_CANADA)
            & (df["occupation_scope"] == ALL_OCCUPATIONS)
            & (df["industry_scope"] == ALL_INDUSTRIES)
        ].copy()
        if dimension == "Employment type":
            sub["category"] = sub["category"].replace(self._EMPLOYMENT_TYPE_MAP)
            sub = sub.groupby(["month", "category"], as_index=False)["postings_total"].sum()
        return sub.sort_values("month").reset_index(drop=True)

    def requirements(self, dimension: str) -> pd.DataFrame:
        df = self._tables["monthly_requirements"]
        sub = df[df["dimension"] == dimension]
        sub = sub[
            (sub["province_scope"] == ALL_CANADA)
            & (sub["occupation_scope"] == ALL_OCCUPATIONS)
            & (sub["industry_scope"] == ALL_INDUSTRIES)
        ]
        return sub.sort_values("month").reset_index(drop=True)

    def requirements_by_occupation(self, dimension: str) -> pd.DataFrame:
        """A requirement dimension (e.g. ``Education``) broken by broad occupation
        group, national (province = industry = all). Carries parsed NOC labels."""
        df = self._tables["monthly_requirements"]
        sub = df[
            (df["dimension"] == dimension)
            & (df["province_scope"] == ALL_CANADA)
            & (df["industry_scope"] == ALL_INDUSTRIES)
            & (df["occupation_scope"] != ALL_OCCUPATIONS)
        ].copy()
        cl = _parse_code_label(sub["occupation_scope"])
        sub["noc_code"] = cl["code"].values
        sub["noc_name"] = pd.Series(sub["noc_code"].values).map(NOC_SHORT).fillna("Unknown").values
        return sub.sort_values("month").reset_index(drop=True)

    def language(self, dimension: str) -> pd.DataFrame:
        df = self._tables["monthly_language"]
        sub = df[
            (df["dimension"] == dimension)
            & (df["province_scope"] == ALL_CANADA)
            & (df["occupation_scope"] == ALL_OCCUPATIONS)
            & (df["industry_scope"] == ALL_INDUSTRIES)
        ]
        return sub.sort_values("month").reset_index(drop=True)

    def skill_lift(self, occupation_scope: str, month: pd.Timestamp | None = None,
                   top: int = 15, min_postings: int = 50) -> pd.DataFrame:
        """Top skills for an occupation by lift = (occupation share) / (national share).

        ``occupation_scope`` is the full 'code | label' scope string used in the skills
        table. The national share is summed across all broad groups (the skills table
        has no 'All occupations' row). Lift>1 = over-represented vs the whole market.
        Skill codes are taxonomy IDs (no public label table in v1).
        """
        sk = self._tables["monthly_skills_topk"]
        month = pd.Timestamp(month) if month is not None else pd.Timestamp(self.latest_month)
        m = sk[sk["month"] == month]
        nat = m.groupby("skill_code")["postings_total"].sum()
        nat_share = nat / nat.sum()
        occ = m[m["occupation_scope"] == occupation_scope].groupby("skill_code")["postings_total"].sum()
        occ_total = occ.sum()
        occ_share = occ / occ_total if occ_total else occ
        df = pd.DataFrame({"occ_postings": occ, "occ_share": occ_share})
        df = df.join(nat_share.rename("nat_share"), how="left")
        df["lift"] = df["occ_share"] / df["nat_share"]
        df = df[df["occ_postings"] >= min_postings]
        df = df.sort_values("lift", ascending=False).head(top)
        df = df.reset_index().rename(columns={"index": "skill_code"})
        df["skill_code"] = df["skill_code"].astype(str)
        names = self.skill_labels.set_index("skill_code")["skill_name"]
        df["skill_name"] = df["skill_code"].map(names).fillna(df["skill_code"])
        return df

    @functools.cached_property
    def skill_labels(self) -> pd.DataFrame:
        """``skill_code`` → human label (leaf) and taxonomy group, from the bundled
        reference table. Turns the cryptic taxonomy IDs into readable skill names."""
        df = pd.read_csv(_REFERENCE / "skills.csv", dtype={"code": str})
        return df[["code", "leaf_label", "group_label", "sub_group_label"]].rename(
            columns={"code": "skill_code", "leaf_label": "skill_name",
                     "group_label": "skill_group", "sub_group_label": "skill_subgroup"})

    def skills_national(self, top: int = 8) -> pd.DataFrame:
        """National monthly postings per skill (summed across the occupation groups,
        since the skills table has no 'All occupations' row), for the top-``top``
        skills by total volume, labelled. One tidy row per (month, skill)."""
        sk = self._tables["monthly_skills_topk"].copy()
        sk["skill_code"] = sk["skill_code"].astype(str)
        nat = sk.groupby(["month", "skill_code"], as_index=False)["postings_total"].sum()
        totals = nat.groupby("skill_code")["postings_total"].sum().sort_values(ascending=False)
        keep = list(totals.index[:top])
        out = nat[nat["skill_code"].isin(keep)].copy()
        names = self.skill_labels.set_index("skill_code")["skill_name"]
        out["skill_name"] = out["skill_code"].map(names).fillna(out["skill_code"])
        return out.sort_values("month").reset_index(drop=True)

    def skill_churn(self, base_year: int = 2019, end_year: int = 2024,
                    top: int = 12, min_base: int = 150) -> pd.DataFrame:
        """Per-skill demand growth, ``base_year`` vs a recent *stable* year (2025+ is
        provisional), national. Returns the top risers and top fallers, labelled, with
        a ``direction`` flag — a descriptive 'what is entering vs leaving demand' view."""
        sk = self._tables["monthly_skills_topk"].copy()
        sk["skill_code"] = sk["skill_code"].astype(str)
        sk["year"] = sk["month"].dt.year
        base = sk[sk["year"] == base_year].groupby("skill_code")["postings_total"].sum()
        end = sk[sk["year"] == end_year].groupby("skill_code")["postings_total"].sum()
        df = pd.DataFrame({"base": base, "end": end}).fillna(0.0)
        df = df[df["base"] >= min_base]
        df["growth_pct"] = (df["end"] / df["base"] - 1) * 100.0
        names = self.skill_labels.set_index("skill_code")["skill_name"]
        df = df.reset_index().rename(columns={"index": "skill_code"})
        df["skill_name"] = df["skill_code"].map(names).fillna(df["skill_code"])
        risers = df.sort_values("growth_pct", ascending=False).head(top).assign(direction="rising")
        fallers = df.sort_values("growth_pct").head(top).assign(direction="falling")
        out = pd.concat([fallers, risers]).drop_duplicates("skill_code")
        return out.sort_values("growth_pct").reset_index(drop=True)

    def skill_by_occupation(self, top: int = 16, month: pd.Timestamp | None = None) -> pd.DataFrame:
        """For the most-demanded skills nationally, their postings within each broad
        occupation group in ``month`` (latest by default), summed across the
        province/industry cells (which partition postings) and labelled. One row per
        (occupation, skill); the factory pivots and column-normalises."""
        sk = self._tables["monthly_skills_topk"].copy()
        sk["skill_code"] = sk["skill_code"].astype(str)
        month = pd.Timestamp(month) if month is not None else pd.Timestamp(self.latest_month)
        m = sk[sk["month"] == month]
        nat = m.groupby("skill_code")["postings_total"].sum().sort_values(ascending=False)
        keep = list(nat.index[:top])
        sub = m[m["skill_code"].isin(keep)].copy()
        cl = _parse_code_label(sub["occupation_scope"])
        sub["noc_code"] = cl["code"].values
        agg = sub.groupby(["noc_code", "skill_code"], as_index=False)["postings_total"].sum()
        agg["noc_name"] = agg["noc_code"].map(NOC_SHORT).fillna("Unknown")
        names = self.skill_labels.set_index("skill_code")["skill_name"]
        agg["skill_name"] = agg["skill_code"].map(names).fillna(agg["skill_code"])
        return agg[~agg["noc_name"].eq("Unknown")].reset_index(drop=True)

    # -- cubes for decomposition / cross-tabs -------------------------------- #
    @functools.cached_property
    def province_occupation(self) -> pd.DataFrame:
        """province x NOC-broad demand (industry = all) for shift-share / LQ."""
        df = self._tables["monthly_filter_cube"]
        m = (
            (df["province_scope"] != ALL_CANADA)
            & (df["occupation_scope"] != ALL_OCCUPATIONS)
            & (df["industry_scope"] == ALL_INDUSTRIES)
        )
        out = df[m].copy()
        cl = _parse_code_label(out["occupation_scope"])
        out["noc_code"], out["noc_label"] = cl["code"], cl["label"]
        out["noc_name"] = out["noc_code"].map(NOC_SHORT).fillna("Unknown")
        out["province_name"] = out["province_scope"].map(PROVINCE_NAMES).fillna(out["province_scope"])
        return out.sort_values("month").reset_index(drop=True)

    @functools.cached_property
    def noc_by_naics(self) -> pd.DataFrame:
        """NOC-broad x NAICS-broad demand (province = all) for the cross-tab heatmap."""
        df = self._tables["monthly_filter_cube"]
        m = (
            (df["province_scope"] == ALL_CANADA)
            & (df["occupation_scope"] != ALL_OCCUPATIONS)
            & (df["industry_scope"] != ALL_INDUSTRIES)
        )
        out = df[m].copy()
        occ = _parse_code_label(out["occupation_scope"])
        ind = _parse_code_label(out["industry_scope"])
        out["noc_code"], out["noc_label"] = occ["code"].values, occ["label"].values
        out["naics_code"], out["naics_label"] = ind["code"].values, ind["label"].values
        out["noc_name"] = pd.Series(out["noc_code"].values).map(NOC_SHORT).fillna("Unknown").values
        out["naics_name"] = pd.Series(out["naics_code"].values).map(NAICS_SHORT).fillna("Unknown").values
        return out.sort_values("month").reset_index(drop=True)

    # -- coverage / quality -------------------------------------------------- #
    @functools.cached_property
    def coverage_overall(self) -> pd.DataFrame:
        df = self._tables["coverage_by_field_monthly"]
        m = (
            (df["province_scope"] == ALL_CANADA)
            & (df["occupation_scope"] == ALL_OCCUPATIONS)
            & (df["industry_scope"] == ALL_INDUSTRIES)
        )
        out = df[m].copy()
        out["coverage_pct"] = out["populated_postings"] / out["postings_total"] * 100.0
        return out.sort_values("month").reset_index(drop=True)

    # -- assets -------------------------------------------------------------- #
    @functools.cached_property
    def geojson(self) -> dict:
        with _GEO_PATH.open() as fh:
            return json.load(fh)

    @functools.cached_property
    def province_labour_force(self) -> pd.DataFrame:
        """Province labour-force + population (StatCan LFS, 2024) for per-capita demand.
        Columns: ``code``, ``province``, ``labour_force``, ``population``, ``year``."""
        return pd.read_csv(_REFERENCE / "province_labour_force.csv", dtype={"code": str})

    @functools.cached_property
    def ai_exposure(self) -> pd.DataFrame:
        """Broad-NOC AI-exposure reference asset (Eloundou β, built by
        ``tools/build_ai_exposure.py``). 10 rows, one per broad NOC group."""
        df = pd.read_parquet(_AI_PATH)
        df["noc_code"] = df["noc_code"].astype(str)
        return df

    @functools.cached_property
    def metadata(self) -> dict:
        path = self.data_root / "metadata.json"
        if path.exists():
            with path.open() as fh:
                return json.load(fh)
        return {}
