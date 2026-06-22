# Job: Golden-file test suite for the dashboard — "is the information in each plot correct?"

**Slug:** 2026-06-22-golden-testing
**Status:** DONE — implemented and green on `redesign2-audit-fixes` (the active redesign2 worktree). 156 golden tests pass; full repo suite 333 passed.
**Target:** the **`redesign2`** branch (worktree `.claude/worktrees/redesign2`) — Next.js (`web/`) + FastAPI (`api/`) + the Plotly viz core (`src/jobads_dashboard/viz/`). redesign2 is the most up-to-date version; **43 charts** in `api/figures.REGISTRY`. The Streamlit app under `src/jobads_dashboard/dashboard/*` is the *aggregate builder* (still used); the legacy Streamlit UI is not the target.
**Method, by user instruction:** golden-file testing only — known-correct expected output, given a known input, compared against what the code produces. No property tests, no fuzzing, no snapshot-of-own-output. The user's framing: *"we create outputs that we know to be correct given a certain input, then run the code on the same input and see if it produces the same result."*

> **Provenance note (2026-06-22):** first drafted against the now-deleted `worktree-greenfield-aclmr` branch (38 charts); re-pointed and rewritten for `redesign2` (43 charts, different set + AI-exposure / per-capita / education-wage families). The constants and `compute.py` transforms were verified identical on redesign2.

---

## 1. Goal and the one principle that makes this worth doing

The question is **"is the information in each plot correct?"** — the actual numbers a reader sees: bar heights, treemap rectangle sizes, choropleth colors, line values, hover text, animation frames. Not styling, not whether the page renders.

The suite rests on one principle every reviewer of a golden file must honor:

> **A golden file is a correctness test only if its expected output was derived independently of the code under test.** Bless the code's own output and you have a regression test that guards a bug forever. So every expected value here is **known by construction** — the fixture corpus is built from an explicit spec where counts, wages, and skill mentions are chosen by hand, so the correct aggregate and the correct plotted number are known before any production code runs. Where a chart also reads a frozen reference asset (AI-β, labour force, wage-by-education), the expected combines the hand-built postings with the committed asset values — both stable and inspectable.

Honest limit (state it): golden tests prove correctness **only for the inputs in the fixture**. That finite coverage is why this never reaches "100%". We narrow the gap two ways: (a) the fixture is *designed* to hit every code path that carries a number; (b) the pure-math layer (Layer A) is tested on crafted inputs where the answer is analytic, covering those transforms for all inputs of their shape.

---

## 2. What we test, and what we deliberately do not

**In scope (the information):**
- Aggregation raw postings → derived parquet (`prepare.py`, DuckDB): counts, rollups, wage quantiles, coverage, skill unnest.
- Transforms (`compute.py`): LQ, contribution, shift-share, YoY, indexing, HHI/Gini, decomposition, robust-z, diffusion. (Confirmed: 12 functions, unchanged on redesign2.)
- The data inside each of the 43 figures (`figures.build`): plotted arrays, animation frames, FR chrome.
- The new families that combine postings with a frozen reference asset (AI-exposure, per-capita, education-wage).
- Cross-chart reconciliation the corpus makes exact (treemap children sum to the headline; choropleth share sums to 100).

**Out of scope:**
- Pure styling (colors/fonts/margins/template) — already structurally asserted in `api/tests/test_figures.py`; not "information". Do not golden the whole `layout` JSON.
- The browser render. `web/components/RemoteFigure.tsx` renders figure JSON verbatim (only overrides `height`), so the Python figure-data goldens ARE what the user sees.
- `posting_lookup` / private endpoints — separate concern.
- Re-deriving the frozen reference assets themselves (AI-β values, LFS numbers). We treat them as trusted committed inputs; we verify the charts *use them correctly*, not that Eloundou's betas are right.

---

## 3. The three golden layers

| Layer | Boundary | Input (known) | Expected known from | Catches |
|---|---|---|---|---|
| **A. Transforms** | `viz/compute.py` (12 pure fns) | crafted analytic frames | mathematics | wrong formulas |
| **B. Aggregation** | `dashboard/prepare.py` (`refresh_dashboard_data`) | tiny raw corpus, counts by construction | construction | wrong SQL: grouping sets, rollup scope, quantiles, coverage, skills unnest |
| **C. Figure data** | `api.figures.build(id, locale)` over the Layer-B bundle + frozen assets | the corpus's bundle (+ committed assets) | construction + Layer A + asset values | wrong wiring accessor→transform→plot; share/round/sort/top-N; asset joins; FR chrome; frames |

Layer C builds on Layer B's bundle (one session fixture builds it once), so C re-exercises B implicitly.

**Reference-asset dependency (Layer C only).** Several charts read committed files anchored to the repo, **not** the fixture bundle ([datasource.py:340-364](src/jobads_dashboard/viz/datasource.py:340)): `data/ai/occupation_ai_exposure.parquet`, `data/reference/province_labour_force.csv`, `data/reference/skills.csv`, `data/derived/wage_by_education.parquet`, `data/geo/canada_provinces.geojson`. Tests run inside the redesign2 worktree, so they read the real committed assets. Expected values for asset-using charts are computed from `fixture postings × the committed asset` (read the asset in the test; don't re-hardcode it). If a reference asset is ever edited, those goldens change — that is a deliberate re-bless under §10, not data-refresh churn.

---

## 4. The fixture corpus — the linchpin

A small, frozen, hand-specified corpus of raw postings, with **counts chosen by construction**. Concrete rows, months, field rules, and worked expected values live in **`fixture-spec.md`**. Summary of the design constraints:

- **Raw schema** = the columns `prepare.py:normalized_view_sql` reads. `province`=2-letter code; `noc`=`"<5-digit> - label"` (broad group = first digit); `naics`=`"<4–6 digit> - label"` (sector = first 2 digits, with `31/32/33→31-33`, `44/45→44-45`, `48/49→48-49`); `remunerationHrly` is the wage; `skills`=pipe-delimited codes.
- **Counts known by construction** via a deterministic generator (`tests/fixtures/build_corpus.py`) from an explicit grid. Corpus lives at `tests/fixtures/golden_corpus/<year>/processed_fixture.parquet` (matches `SOURCE_GLOB = "20[0-9][0-9]/processed_*.parquet"`).
- **Skill codes must be real** — taken from `data/reference/skills.csv`, including **≥1 code in the `"Artificial Intelligence"` sub-group** (so `ai_skill_diffusion` is non-degenerate) and ≥1 non-AI code.
- **NOC broad groups must be ≥3 real groups (0–9)** so AI-exposure (β keyed by broad code) and LQ/shift-share vary; ≥3 provinces; ≥2–3 NAICS sectors.
- **Hit the months the charts hard-wire**, or they come back empty: `2019-06` (base) and `2024-12` (end) for contribution/shift-share/dumbbell/waterfall/skill_churn and the `pay.*` `_STABLE_END`; a trailing 12 months ending at `latest_month`; several Decembers for `yoy_choropleth` + the by-year map frames; ≥24 contiguous months so `momentum`/`diffusion`/`seasonality` render.
- **Deliberate null/sparse rows** (no wage, no NAICS, no skills) for known coverage denominators.

Net ~500 generated rows. Small, reviewable, known by construction.

---

## 5. Layer A — transform goldens (`viz/compute.py`)

Unchanged from the original plan; redesign2's `compute.py` is byte-stable (12 functions, verified). Craft an input whose answer is analytic and assert it. File: `tests/golden/test_compute_golden.py`.

| Function | Crafted input | Known output |
|---|---|---|
| `moving_average` | `[3,6,9,12]`, w=3 | `[3,4.5,6,9]` |
| `yoy_pct` | series doubling after 12mo | `+100.0`; NaN first 12 |
| `index_to_base` | 2019 mean = 50 | `value/50*100`; 100 at base mean |
| `contribution_to_growth` | base `{g1:100,g2:100}`, end `{g1:150,g2:100}` | `+25,0` pp; sum == 25% growth |
| `shift_share` | 2-region×2-group crafted | NS+IM+RS == actual per region |
| `location_quotient` | A 80/20, B 20/80 (nat 50/50) | A `(1.6,0.4)`, B `(0.4,1.6)` |
| `hhi` | `[50,50]`;`[100]`;`[25,25,25,25]` | `0.5`;`1.0`;`0.25` |
| `lorenz_curve` | equal; one-takes-all | gini `0.0`; `(n−1)/n` |
| `topk_cumulative_share` | `[40,30,20,10]`,k=2 | `[(1,40),(2,70)]` |
| `classical_decompose` | period-12 sinusoid + linear trend | trend==line, seasonal==sinusoid, resid≈0 |
| `robust_z` | residuals w/ known median & MAD | `0.6745*(r−med)/MAD`; const→0 |
| `diffusion_index` | wide matrix, k of n rose vs 12-lag | `k/n*100` (+0.5·unchanged) |

---

## 6. Layer B — aggregation goldens (`dashboard/prepare.py`)

Run the real builder against the fixture corpus into tmp, compare derived tables to hand-derived expected. File: `tests/golden/test_aggregation_golden.py`; expected CSVs under `tests/golden/aggregation/`.

```python
out = tmp_path / "bundle"
refresh_dashboard_data(source_root=FIXTURE_CORPUS_ROOT, output_root=out,
                       top_markets_per_province=10, skills_top_k=10,
                       posting_lookup_recent_months=0)
```

Assert (known by construction): `monthly_overall` per-month counts and the All-Canada/All-occ/All-ind grand total; `monthly_by_province/by_noc_broad/by_naics_broad` slice counts + broad-group mapping; one fully-crossed `monthly_filter_cube` cell + the GROUPING-SETS rollup identity; `monthly_wage_cube` quantiles (wages chosen so `quantile_cont` is exact, e.g. `[10,20,30]→15/20/25`); `coverage_by_field_monthly` populated counts incl. the `education<>'Unknown'` / `type<>'Unknown'` FILTERs; `monthly_skills_topk` unnest counts; `monthly_conditions/language/requirements` category counts; and `validate_derived_package(out, source_root=...)` → `validated: True` with `monthly_overall_sum == source_postings_total`.

> **`wage_by_education.parquet` is NOT built by `refresh_dashboard_data`** — it's a committed static asset (built by `tools/build_wage_by_education.py`). Layer B does not cover it; its correctness-of-use is checked at Layer C against the committed values.

---

## 7. Layer C — figure-data goldens (all 43 charts)

The layer that answers "is the information in each plot correct?". Point the real build path at the fixture bundle; assert plotted arrays.

**Boundary / inject the fixture.** `api/figures.py` builds from `_ds()`, an `@lru_cache` over `core.DATA_DIR` (no env override). Patch it:

```python
import json, api.figures as F
from jobads_dashboard.viz.datasource import DataSource

@pytest.fixture(scope="session")
def fixture_bundle(tmp_path_factory):
    out = tmp_path_factory.mktemp("bundle")
    refresh_dashboard_data(FIXTURE_CORPUS_ROOT, out, top_markets_per_province=10,
                           skills_top_k=10, posting_lookup_recent_months=0)
    return out

@pytest.fixture(autouse=True)
def _point_api_at_fixture(monkeypatch, fixture_bundle):
    ds = DataSource(fixture_bundle)            # reference assets still read from repo
    monkeypatch.setattr(F, "_ds", lambda: ds)

payload = lambda cid, loc="en": json.loads(F.build(cid, locale=loc))
```

`F.build` strips the title, inlines the `aclmr_light` template, transparent backgrounds, applies FR chrome — the exact JSON the browser receives.

**Enumerate from `sorted(F.REGISTRY)` (43 charts), don't hard-code.** Parametrize a smoke over all 43 (builds + non-empty `data` + no causal language + FR chrome) — extend `api/tests/test_figures.py`. Then layer exact-value goldens per the per-chart probe map in `fixture-spec.md` §E.

**Value-golden everything derivable; for charts that go degenerate on the minimal corpus, assert the known degenerate value AND note what richer coverage would add.** Per-chart specifics (which arrays, expected source, degeneracy notes, threshold traps) are in `fixture-spec.md` §E. Highlights:
- **Asset-using charts** — `geography.demand_map_percap` (postings ÷ real LFS × 10000), `geography.ai_exposure` / `occupations.ai_exposure` (demand-weighted mean of real β by broad NOC), `pay.wage_by_education` (echoes the 6 committed rows), `skills.ai_skill_diffusion` (AI-subgroup mention share). Expected = fixture × the committed asset, read in the test.
- **Threshold/degeneracy traps** (assert the empty/degenerate path, don't let a filter silently blank a chart): `pay.wage_dumbbell` (`wage_postings≥200`), `pay.wage_demand_quadrant` (wages only where present), `occupations.skill_churn` (`min_base=150`), `skills.skill_lift` (`min_postings=50`), `pulse.seasonality` (flat z=1.0 if within-year counts are uniform), `pulse.momentum` (≈0 except near the year-level step).
- **Cross-chart reconciliation** (exact known numbers): treemap children sum to the headline; `demand_map_share` z sums to 100; contribution bars sum to the overall growth pp; per-year map frames sum to that year's overall.
- **FR locale:** assert `_FR_CHROME` translations + animated-slider prefix on 2–3 representative charts.

---

## 8. Where the tests live

```
tests/
  fixtures/
    golden_corpus/<year>/processed_fixture_<year>.parquet
    build_corpus.py
  golden/
    compute/        *.csv
    aggregation/    expected_*.csv
    figures/        expected_*.json
    test_compute_golden.py
    test_aggregation_golden.py
    test_figures_golden.py
    conftest.py     # fixture_bundle + _point_api_at_fixture
```

Run: `uv run pytest tests/golden`. Reuse `tests/test_refresh_contract.py:write_minimal_bundle` as a pattern reference.

---

## 9. Implementation order

1. **Layer A** — pure-function goldens (no fixtures; anchors the math).
2. **Fixture corpus + generator** — pick real skill codes (incl. an AI-subgroup code) from `data/reference/skills.csv`; finalize `fixture-spec.md`.
3. **Layer B** — aggregation goldens; `validate_derived_package` green first.
4. **Layer C smoke** — all 43 build + no causal text + FR chrome.
5. **Layer C value goldens** — simplest first (`ranked_provinces`, `demand_map_*`, treemaps), then transform-backed (LQ, contribution, shift-share, wages, skills), then asset-using (ai_exposure, percap, wage_by_education).
6. **Layer C** — degeneracy/threshold paths + cross-chart reconciliation + FR.

---

## 10. Regeneration and the re-bless rule

Goldens are pinned to the frozen corpus, so a real upstream data refresh changes nothing here. Provide a `--update-golden` path that rewrites expected files **only** for a deliberate change (new chart, corrected formula, edited reference asset). Re-blessing requires a human to confirm the new numbers are right by the §1 standard (independent derivation), not "the test went green". Put that in the script's help text.

---

## 11. Open questions / decisions

1. **Reference-asset coupling.** Asset-using goldens depend on the committed `occupation_ai_exposure.parquet` / `province_labour_force.csv` / `wage_by_education.parquet`. Confirm these are stable (not regenerated per build). If they churn, snapshot a copy into `tests/fixtures/` and point the test at it instead — but that needs overriding the module-level `_AI_PATH` etc., which are not data_root-anchored.
2. **`wage_by_education` reflects month `2025-12`** in the committed asset (a different month than the corpus's `2024-12`). The chart just plots the committed rows, so the golden echoes them regardless of corpus month — fine, but note the mismatch so no one "fixes" it.
3. **Latest month of the corpus** — use `2024-12` to align every hard-wired window and avoid the 2025 provisional band.
4. **Skill-code choice** — pick 2–3 real codes from `skills.csv` so `skill_lift/churn/diffusion/heatmap` are non-degenerate; document them in `fixture-spec.md`.
5. **`active/` deep-audit overlap** — redesign2 has an open deep-audit job (`docs/jobs/active/2026-06-22-redesign2-deep-audit/`, incl. a broken `review.py` finding). Golden tests target `figures.build`, not `review.py`, so they're independent, but coordinate if the audit changes any factory.

---

## 12. Progress ledger

- [x] Layer A — compute goldens (`tests/golden/test_compute_golden.py`, 13 tests; analytic expecteds)
- [x] Fixture corpus + generator (`tests/fixtures/build_corpus.py` → committed `golden_corpus/`, 510 rows; real skill codes `30080004` AI / `10010001` / `10010002`)
- [x] Layer B — aggregation goldens (`tests/golden/test_aggregation_golden.py`, 11 tests; `validate_derived_package` green)
- [x] Layer C — smoke over all 43 (`test_figures_golden.py`: build + non-empty + no-causal)
- [x] Layer C — value goldens incl. asset-using charts (percap/lq ÷ real LFS, ai_exposure × β, wage_by_education echo)
- [x] Layer C — degeneracy/threshold paths (skill_churn / skill_lift / wage_dumbbell empty; seasonality flat z=1) + reconciliation (treemap children=root, shares=100, contribution=+100pp, shift-share identity) + FR
- [x] Regeneration / re-bless rule documented (`tests/golden/README.md`)

## 13. Outcome (2026-06-22)

**Result.** 156 golden tests, all green; full repo suite **333 passed**. Run with `uv run pytest tests/golden`.
All 43 charts have a dedicated value or documented-degenerate golden beyond the smoke. Expecteds are inline by-construction (Layer A analytic; B/C from the corpus + Layer-A math + committed assets), never pasted from `build()`.

**Design deviations from the plan (deliberate, simpler).**
- *Inline expecteds, no expected-file artifacts.* The planned `compute/aggregation/figures/expected_*` files were dropped: an opaque CSV of "correct" outputs is no more independent than an inline literal and is harder to read/verify. So §10's `--update-golden` is moot — the only regenerable artifact is the corpus (`build_corpus.py`); re-blessing = a human edits an inline value with independent derivation. Documented in `tests/golden/README.md`.
- *Path bootstrap.* No repo-wide pytest config exists and `api` is only importable because `api/tests/__init__.py` makes pytest insert the repo root. `tests/golden/conftest.py` inserts the repo root on sys.path so the suite runs from anywhere without touching shared config.
- *Branch.* Implemented on `redesign2-audit-fixes` (the checked-out redesign2 worktree, a superset of `redesign2`; `figures.REGISTRY`==43, identical chart set). New test files are untracked and independent of the active deep-audit edits.

**Findings surfaced by the suite (not blessed).**
- **`geography.cma_demand` inflates volumes ~8×.** `_last12(ds.market).groupby("market_label").sum()` sums across the market table's 4 grouping-sets × 2 scope levels (province + All-Canada), so the "postings (last 12 months)" labels are 8× the truth (Toronto 960 vs 120). Ordering is preserved, so the chart's ranking claim still holds, but the magnitudes are wrong. The golden asserts the correct ordering and flags the magnitude. → spun off as a separate fix task.
- *Benign behaviour confirmed:* uncoded NAICS lands in a real "Unknown industry group" bucket (never NULL), so `by_naics_broad`/filter-cube rollups sum to the full total; momentum is ~0 at 2024-12 (both MAs inside the plateau) and positive only on the ramp; FR correctly translates legend names (Median→médiane) without touching values.

**Close-out:** moved to `docs/jobs/done/2026-06-22-golden-testing/`. Tests uncommitted in the worktree (other active work present; commit on request).
