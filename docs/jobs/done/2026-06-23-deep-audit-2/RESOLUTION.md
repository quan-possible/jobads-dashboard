# Resolution — deep-audit-2 fixes applied (2026-06-23)

All 22 defects (S01–S22) and 9 craft items (U01–U09) from this job are **implemented and verified** on branch **`fix/deep-audit-2026-06-23-2`** (off `redesign2` @ `c4c6d201`). Implemented via Sonnet subagents over disjoint file groups (two waves: defects, then craft); the orchestrator (Opus) made the methodology/design decisions, owned the golden-test updates, and did the final verification — which itself caught a defect the subagents missed (S08, below).

## Verification evidence (current run)
- **pytest: 344 passed** (was 325 baseline). +3 S01 XFF rate-limit tests, +15 S07 experience-band cases, +1 S05 base==end deseasonalization test.
- **Figure goldens: 133 passed** — unchanged; the S05 methodology reproduces the exact expected values on the fixture (see below).
- **web: `tsc --noEmit` clean · `next build` clean** (all 7 routes built).
- **Live (EN+FR, :3000 → fresh FastAPI :8530):**
  - S09 warm-up: first `/api/explore/figure` after a clean boot = **0.007s** (audit measured 124.8s cold). Confirmed.
  - S02: KPI delta direction now in the accessible name (`sr-only` "en hausse"/"en baisse").
  - S03: 11 year-picker `<select>`s carry `focus-visible:outline-2 outline-orange`; broken `focus:border-brand` gone.
  - S04: momentum caption corrected EN ("teal = accelerating, orange = cooling") + FR ("sarcelle = accélère, orange = ralentit") + in-figure subtitle.
  - S06: wage quadrant + education titles show "(Dec 2024)" / "(déc. 2024)".
  - S08: FR `top_skills_trend` legend now French ("Compétences en communication", "Sens de l'organisation", "Service à la clientèle"…).
  - S18: FR percentages render "7,6 %" (narrow no-break space U+202F).
  - U01: indexed-lines/skill-trend now teal-riser vs orange-faller, 4 emphasized, direct end-labels.
  - U02: CMA ranking has 0 non-metro buckets (Unknown/Rural filtered).
  - U06: FilterSpine has a distinct toolbar treatment (opaque bg + 2px orange top border + `role="toolbar"`).

## Two decisions worth recording

### S05 — methodology is **annual-average**, not a same-month December snapshot
The fix-spec offered "same calendar month" or "annual averages". The golden corpus only has **June** for the base year 2019 (`SCHEDULE` in `tests/fixtures/build_corpus.py`), so a same-month Dec→Dec window finds an empty base and 7 goldens fail. Annual-average is also the more defensible deseasonalization (averages over each year's months, robust to single-month noise) and — because 2019 has only June and each fixture year is internally flat — it reproduces the original golden values exactly, so **no fixture surgery or golden rewrites were needed**. Implemented as `annual_means()` in `viz/figures/_common.py`, wired into `occupations.{contribution_bars,waterfall,dumbbell}`, `industries.contribution_bars`, `geography.shift_share_bars`. `_window` now returns `{year}-12-01` keys that select each year's mean. This matches `index_to_base`, which already compared base-year means. New guard test: `test_decomposition_base_equals_end_is_zero`.

### S08 — the audit under-scoped the fix; live verification caught it
The Wave-1 agent added a `locale` param + an FR map and self-checked imports — but two things were wrong and only surfaced on the live FR figure:
1. The API **registry** (`api/figures.py:108,110`) never passed `locale` to `top_skills_trend`/`skill_lift` — that file was outside the agent's file set. Fixed the lambdas to forward `locale`.
2. `SKILL_NAME_FR` keys didn't match the real taxonomy strings ("Communication skills" vs "Communication", "Customer Service" vs "Customer service"). Added the wording variants and made `localize_skill` case-insensitive.

## Known follow-up (operational, not code)
- **S07 served cube:** the `experience_band` logic is fixed and unit-tested, but the **deployed `data/derived` cube must be regenerated** (`jobads-dashboard-refresh`) for the corrected buckets to appear on the live skills page. Not run here (large binary diff; a deploy/data-ops step). The corpus has all-null `experienceDetails`, so the fix is covered by the new `EXPERIENCE_BAND_SQL` unit test instead.
- **S17** was **not applied**: `province_scope` is consumed by `api/queries.py`, `api/private.py`, `api/explore.py` (19 refs), so the "redundant partition" claim was wrong. Left in place.
- Branch is **not committed** — left for review (per the no-commit-unless-asked default).
