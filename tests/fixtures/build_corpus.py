"""Deterministic generator for the golden fixture corpus.

Builds a tiny, hand-specified set of raw postings whose every aggregate is
**known by construction** (see ``docs/jobs/.../fixture-spec.md`` §B–§D). No
randomness: the same grid is stamped out for each scheduled month, scaled by a
fixed factor, with wage and skill rows injected into known cells.

Run as a module to (re)write the committed parquet under
``tests/fixtures/golden_corpus/<year>/processed_fixture_<year>.parquet``::

    uv run python -m tests.fixtures.build_corpus   # from repo root

The expected golden values are hand-derived from this construction, never dumped
from a production run — that independence is what makes the suite a correctness
test rather than a regression snapshot.
"""

from __future__ import annotations

from pathlib import Path

import pandas as pd

# Real taxonomy codes from data/reference/skills.csv (str keys; the skills table
# joins on these). AI_CODE is in the "Artificial Intelligence" sub-group so
# ai_skill_diffusion is non-degenerate; the others are non-AI leaves.
SKILL_AI = "30080004"     # Technologies | Artificial Intelligence | Artificial Intelligence (AI)
SKILL_GEN1 = "10010001"   # Occupational Skills | Administrative | Backroom organization
SKILL_GEN2 = "10010002"   # Occupational Skills | Administrative | Calendar management

# The unit grid U: one base month = 10 postings. Province shares 50/30/20;
# national NOC-broad shares 40/30/30. (province, noc_raw, naics_raw|None, n).
UNIT = [
    ("ON", "21234 - Sciences occupation", "541110 - Professional services", 3),  # noc broad 2, sector 54
    ("ON", "31234 - Health occupation", "621110 - Health care", 1),              # noc broad 3, sector 62
    ("ON", "62345 - Sales occupation", "445110 - Retail trade", 1),              # noc broad 6, sector 44-45
    ("AB", "21234 - Sciences occupation", "541110 - Professional services", 1),
    ("AB", "31234 - Health occupation", "621110 - Health care", 2),
    ("BC", "62345 - Sales occupation", None, 2),                                  # uncoded NAICS → 80% coverage
]

# (month, scale). 2019-06 base; year anchors; 24 contiguous months 2023-01..2024-12;
# 2024 at x2 so the level step gives a real +100% YoY / +100% growth.
SCHEDULE = [
    ("2019-06", 1), ("2020-12", 1), ("2021-12", 1),
    *[(f"2022-{m:02d}", 1) for m in range(1, 13)],
    *[(f"2023-{m:02d}", 1) for m in range(1, 13)],
    *[(f"2024-{m:02d}", 2) for m in range(1, 13)],
]

PROVINCE_CITY = {"ON": "Toronto", "AB": "Calgary", "BC": "Vancouver"}

# Every column normalized_view_sql reads; union_by_name=True tolerates extras but
# we emit the full set so the fixture mirrors a real processed parquet.
_NULL_COLS = ["remunerationMin", "remunerationMax", "remunerationUnit",
              "experience", "experienceDetails", "studentJobFlag",
              "remoteWorkOptions", "certs", "cips"]


def _broad(noc_raw: str) -> str:
    return noc_raw.strip()[0]


def _row(pid: int, month: str, province: str, noc_raw: str, naics_raw: str | None) -> dict:
    broad = _broad(noc_raw)
    education = {"2": "Undergraduate Degree (Bachelors)",
                 "3": "College Diploma or Certification",
                 "6": "High School Completion"}[broad]
    if province == "AB":
        education = None  # AB rows carry no education → Unknown band, 70% coverage overall
    row = {
        "id": pid,
        "dateFound": f"{month}-15",
        "jobTitle": "Fixture posting",
        "jobTitleText": "Fixture posting",
        "employer": "Fixture Employer",
        "dataSource": "fixture",
        "province": province,
        "location": PROVINCE_CITY[province],
        "cma-ca": PROVINCE_CITY[province],
        "district": PROVINCE_CITY[province],
        "devRegion": PROVINCE_CITY[province],
        "noc": noc_raw,
        "naics": naics_raw,
        "remunerationHrly": None,
        "education": education,
        "type": {"2": "full-time", "3": "part-time", "6": "full-time or part-time"}[broad],
        "duration": "Temporary" if province == "AB" else "Permanent",
        "advertisedBy": "Employer",
        "primaryPostingLanguage": "fr" if province == "BC" else "en",
        "englishLanguageRequirement": "not required" if broad == "6" else "mandatory",
        "frenchLanguageRequirement": "mandatory" if province == "BC" else "not required",
        "skills": None,
        "description": "Fixture description.",
    }
    for col in _NULL_COLS:
        row.setdefault(col, None)
    return row


def build_frame() -> pd.DataFrame:
    rows: list[dict] = []
    pid = 1
    for month, scale in SCHEDULE:
        month_rows: list[dict] = []
        for province, noc_raw, naics_raw, n in UNIT:
            for _ in range(n * scale):
                month_rows.append(_row(pid, month, province, noc_raw, naics_raw))
                pid += 1
        # Inject the fixed wage and skill cells (counts fixed per month, not scaled):
        on_noc2 = [r for r in month_rows if r["province"] == "ON" and r["noc"].startswith("21234")]
        ab_noc3 = [r for r in month_rows if r["province"] == "AB" and r["noc"].startswith("31234")]
        for r, wage in zip(on_noc2[:3], [10.0, 20.0, 30.0]):   # 3 wage rows → p25/median/p75 = 15/20/25
            r["remunerationHrly"] = wage
        for r in on_noc2[:2]:                                  # 2 postings carry AI + a generic skill
            r["skills"] = f"{SKILL_AI}|{SKILL_GEN1}"
        if ab_noc3:                                            # 1 posting carries a second generic skill
            ab_noc3[0]["skills"] = SKILL_GEN2
        rows.extend(month_rows)
    return pd.DataFrame(rows)


def build(root: Path | str) -> Path:
    """Write the corpus as per-year parquet under ``root/<year>/processed_fixture_<year>.parquet``."""
    root = Path(root)
    frame = build_frame()
    frame["_year"] = frame["dateFound"].str.slice(0, 4)
    for year, part in frame.groupby("_year"):
        year_dir = root / str(year)
        year_dir.mkdir(parents=True, exist_ok=True)
        part.drop(columns=["_year"]).to_parquet(
            year_dir / f"processed_fixture_{year}.parquet", index=False
        )
    return root


CORPUS_ROOT = Path(__file__).resolve().parent / "golden_corpus"


if __name__ == "__main__":
    out = build(CORPUS_ROOT)
    df = build_frame()
    print(f"wrote {len(df)} rows across {df['dateFound'].str.slice(0, 4).nunique()} years to {out}")
