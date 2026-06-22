# Fixture spec — the golden corpus (concrete, buildable, redesign2)

Companion to `job.md`. A corpus small enough to hand-check, dense enough to make every charted number non-degenerate, with **counts chosen by construction**. Numbers marked **fixed** are load-bearing for a golden assertion. Targets `redesign2`'s 43 charts.

---

## A. Dimensions (tiny on purpose)

**Provinces (3):** `ON`, `AB`, `BC` — 2-letter codes.

**NOC broad groups (3)** — broad group = first digit of the 5-digit `noc` (`prepare.py:89`). Pick groups whose AI-β differ in `data/ai/occupation_ai_exposure.parquet`:
| raw `noc` | broad | `NOC_SHORT` |
|---|---|---|
| `"21234 - Sci occ"` | `2` | Sciences & engineering |
| `"31234 - Health occ"` | `3` | Health |
| `"62345 - Sales occ"` | `6` | Sales & service |

**NAICS sectors (3)** — sector = first 2 digits w/ consolidation (`prepare.py:91-98`): `noc2→"541234"` (54), `noc3→"621234"` (62), `ON·noc6→"445110"` (44-45), `BC·noc6→NULL` (uncoded).

**Skills — MUST use real codes from `data/reference/skills.csv`** (the figures join on it for names, and `ai_skill_diffusion` keys on `sub_group_label == "Artificial Intelligence"`). Pick during implementation:
- `AI_CODE` — a leaf whose `sub_group_label == "Artificial Intelligence"` (e.g. Machine Learning / Generative AI).
- `GEN_CODE_1`, `GEN_CODE_2` — two non-AI leaves.
Document the chosen codes here once picked. Fake codes like `"S1"` map to "Unknown" and break `skill_lift/churn/diffusion/heatmap`.

---

## B. The unit grid `U` (one month at base level = 10 postings)

`scale × U` per populated month. Province shares 50/30/20; national noc shares .40/.30/.30 (clean LQ):

| cell | noc2 | noc3 | noc6 | total |
|---|---|---|---|---|
| **ON** | 3 | 1 | 1 | 5 |
| **AB** | 1 | 2 | 0 | 3 |
| **BC** | 0 | 0 | 2 | 2 |
| **national** | **4** | **3** | **3** | **10** |

**NAICS within a cell:** `noc2→54`, `noc3→62`, `ON·noc6→44-45`, **`BC·noc6→NULL`** (uncoded → 80% NAICS coverage, exercises the `All industries` COALESCE).

**Per-posting field rules (deterministic → known coverage/conditions):**
- `remunerationHrly`: exactly **3 postings/month** carry `[10,20,30]` (place in ON·noc2); else NULL → `quantile_cont` = p25 15 / median 20 / p75 25.
- `skills`: **2 postings/month** carry `"{AI_CODE}|{GEN_CODE_1}"` (ON·noc2), **1 posting/month** carries `"{GEN_CODE_2}"` (AB·noc3); else NULL.
- `type`: noc2=`full-time`, noc3=`part-time`, noc6=`full-time or part-time`. `duration`: ON,BC=`Permanent`, AB=`Temporary`.
- `education`: noc2=`Undergraduate Degree (Bachelors)`, noc3=`College Diploma or Certification`, noc6=`High School Completion`; **AB rows = NULL** (→ Unknown).
- `primaryPostingLanguage`: `en` except BC=`fr`. `englishLanguageRequirement`: noc2,noc3=`mandatory`, noc6=`not required`. `frenchLanguageRequirement`: BC=`mandatory`, else `not required`.
- `id` sequential; `dateFound` 15th of month; `employer`/`description` non-null.

---

## C. Month & level schedule

| month(s) | scale | rows | why |
|---|---|---|---|
| `2019-06` | ×1 (10) | 10 | base for contribution/shift-share/dumbbell/waterfall/skill_churn |
| `2020-12`,`2021-12` | ×1 | 20 | year anchors for `yoy_choropleth` / by-year map frames |
| `2022-01…2022-12` | ×1 | 120 | contiguity for `momentum`/`diffusion`/`seasonality` |
| `2023-01…2023-12` | ×1 | 120 | contiguity; `2023-12` = YoY denominator for Dec-2024 |
| `2024-01…2024-12` | ×2 (20) | 240 | trailing-12; latest month = `2024-12`; level step 1→2 gives real YoY/growth |
| **total** | | **~510** | |

24 contiguous months (2023-01…2024-12) ⇒ decomposition-style charts render. `latest_month = 2024-12`.

---

## D. Worked expected values (known by construction)

### D1. `monthly_overall` 2024-12 (×2): postings 20; wage 3 (15%); naics 16 (80%); skills 3 (15%); education non-Unknown 14 (70%); noc/type/duration/language 100%.
### D2. Trailing-12 (sum of 2024, ×2): national 240; ON 120 / AB 72 / BC 48 → **shares 50/30/20**. noc2 96 / noc3 72 / noc6 72.
### D3. LQ (province×noc, scale-invariant):
| | noc2 | noc3 | noc6 |
|---|---|---|---|
| ON | **1.50** | 0.667 | 0.667 |
| AB | 0.833 | **2.222** | 0.0 |
| BC | 0.0 | 0.0 | **3.333** |
### D4. Wage quantiles (every month): p25 15 / median 20 / p75 25; wage_postings 3.
### D5. Contribution 2019-06(10)→2024-12(20): base noc (4,3,3), end (8,6,6) → `contribution_pp` noc2 **+40**, noc3 **+30**, noc6 **+30**; **sum +100pp = +100% growth**.
### D6. YoY Dec-2024 vs Dec-2023: every province 10→20 → **+100%**.
### D7. Occupations treemap (trailing-12): `values=[240, 96, 72, 72]`; children sum = root 240; 2024 frame=240, 2023 frame=120.
### D8. Conditions/language shares: full-time 40% / part-time 30% / ft-or-pt 30%; French-primary 20%; English-mandatory 70%.
### D9. Coverage latest (2024-12): naics 80%, wage 15%, skills 15%, education 70%, else 100%.

**Asset-using charts (expected = fixture × committed asset, computed in-test):**
### D10. `geography.demand_map_percap` 2024 frame = year-count ÷ real labour force × 10000. ON 120 / AB 72 / BC 48; LFS ON 8,754,700 / AB 2,708,400 / BC 3,085,900 → ON ≈ **0.137**, AB ≈ **0.266**, BC ≈ **0.156**.
### D11. `geography.demand_map_lq` = (province postings share) ÷ (province labour-force share). Derivable from D2 + LFS; **confirm the LFS denominator (national-total vs in-frame) in `geography.py:demand_map`.**
### D12. `geography.ai_exposure` / `occupations.ai_exposure` = demand-weighted mean β over present nocs: `z = Σ(postings_noc·β_noc)/Σ(postings_noc)`, β from `occupation_ai_exposure.parquet` (codes 2,3,6). Compute in-test; assert figure `z`.
### D13. `pay.wage_by_education` echoes the 6 committed rows of `wage_by_education.parquet` (a `2025-12` cross-section) ordered by `education_order` — assert the figure's `[p25,median,p75]` per education equal the asset's, regardless of corpus month.
### D14. `skills.ai_skill_diffusion` = monthly `ai_mentions/all_mentions×100`, ai = `{AI_CODE}` counts. Compute exact share from §B skill placement once codes are fixed.

> `shift_share`, `skill_lift`, `skill_churn`, `education_wage_proxy` are derivable from the grid; expand from the formulas (`compute.py:85`, `datasource.py:185/235/256`). The figure golden asserts the identity (shift-share NS+IM+RS==actual) and the lift/share values.

---

## E. Per-chart probe map (Layer C, all 43)

Enumerate `sorted(api.figures.REGISTRY)`. Each probe pulls these from `payload(id)`. "value" = exact numbers; degeneracy/threshold notes flag where the minimal corpus blanks or flattens a chart (assert that known state).

### Pulse (7)
| chart_id | arrays | expected / note |
|---|---|---|
| `pulse.demand_ribbon` | `data[0].y` raw, `data[1].y` 3-mo MA | monthly totals; MA |
| `pulse.yoy_bars` | `data[0].x` month, `.y` yoy, `.marker.color` | +100 at 2024-12; color flips at 0 |
| `pulse.seasonality` | `data[0].z`, `.x` year, `.y` month | **flat z=1.0** (uniform within-year); add a seasonal bump if richer wanted |
| `pulse.composition` | each `.y` share, `.name` | shares sum 100/mo; top-6 + Other |
| `pulse.occupation_trends` | per-panel `.y` postings | per-noc trajectories (10 panels; 3 nocs populated) |
| `pulse.momentum` | `data[0].y` (MA3−MA12) | **≈0 except near the 2023→2024 step** (e.g. +2.5 at 2024-01) |
| `pulse.diffusion` | `data[0].y` | matches `diffusion_index` (Layer A) on the corpus |

### Geography (9)
| chart_id | arrays | expected / note |
|---|---|---|
| `geography.demand_map_count` | `.locations`, `.z`; frames/yr | 2024 frame 120/72/48 |
| `geography.demand_map_share` | `.z` | sum 100 (50/30/20); per-yr frames |
| `geography.demand_map_percap` | `.z` | D10 (÷ real LFS) |
| `geography.demand_map_lq` | `.z` (diverging zmid=1) | D11 (postings-share ÷ LFS-share) |
| `geography.ranked_provinces` | `.x`, `.y`, order | 240 split, ascending |
| `geography.cma_demand` | `.x`, `.y` city | top CMA by volume |
| `geography.shift_share` | `data[0..2].x` NS/IM/RS, `data[3].x` actual | NS+IM+RS==actual per province |
| `geography.yoy_choropleth` | `.z`; `frames[*].name` Decembers | 2024 frame +100 |
| `geography.ai_exposure` | `.z` mean β | D12 (× asset β) |

### Occupations (8)
| chart_id | arrays | expected / note |
|---|---|---|
| `occupations.treemap` | `.labels/.parents/.values`; frames | D7; children sum to root |
| `occupations.indexed_lines` | each `.y` index | 2019=100 per group |
| `occupations.contribution_bars` | `.x` pp, `.y` | D5; sum==+100pp |
| `occupations.waterfall` | `.y` base/deltas/end, `.measure` | base 10→end 20; abs/rel…/total |
| `occupations.dumbbell` | per-noc `[base,end]` + end markers | base(4,3,3)→end(8,6,6) |
| `occupations.skill_churn` | `.x` growth%, `.y` skill, `.marker.color` | **`min_base=150` may blank** → assert empty path unless counts cleared |
| `occupations.ai_exposure` | `.x` β, `.y` chg%, `.marker.size` | β(asset) × YoY(2019→2024) |
| `occupations.noc_naics_heatmap` | `.z` col-norm %, `.x` naics, `.y` noc | diagonal (noc2-54, noc3-62, noc6-44-45) |

### Industries (4)
| chart_id | arrays | expected / note |
|---|---|---|
| `industries.coverage_line` | `.y` NAICS coverage | 80% on 2024 |
| `industries.treemap` | `.labels/.values`; frames | sectors 54/62/44-45 |
| `industries.share_over_time` | each `.y` share | top-7 + Other; sum 100 |
| `industries.contribution_bars` | `.x` pp | sum==growth (coded only) |

### Pay (7)
| chart_id | arrays | expected / note |
|---|---|---|
| `pay.wage_band` | median `.y`, p25/p75 fill, coverage `.y` | median 20; coverage = 3/total |
| `pay.wage_dumbbell` | per-province `[p25,p75]`+median | **`wage_postings≥200` → empty**; assert graceful empty |
| `pay.wage_demand_quadrant` | `.x` wage, `.y` YoY, size | only noc2 has wage → **single bubble** |
| `pay.education_wage_proxy` | `.x` degree-share, `.y` wage, size | degree share (requirements) × wage_by_noc |
| `pay.wage_by_education` | `[p25,p75]`+median per edu | D13 (echoes committed asset) |
| `pay.conditions_mix` | each `.y` share | 40/30/30 |
| `pay.language_gap` | English `.y`, French `.y` | English-mandatory 70% |

### Skills (6)
| chart_id | arrays | expected / note |
|---|---|---|
| `skills.top_skills_trend` | each `.y` index | 2019=100; top-8 (3 skills present) |
| `skills.ai_skill_diffusion` | `.y` ai_share, 3-mo smooth | D14 |
| `skills.skill_lift` | `.x` lift, `.y` skill | occ_share/nat_share; `min_postings=50` may blank |
| `skills.skill_occupation_heatmap` | `.z` col-norm %, `.x` noc, `.y` skill | top-16 (3 present) |
| `skills.education` | each `.y` share | AB→Unknown band present |
| `skills.experience` | each `.y` share | by band |

### Quality (2)
| chart_id | arrays | expected / note |
|---|---|---|
| `quality.coverage_lines` | `.y` per field | D9 |
| `quality.coverage_latest` | `.x` %, threshold colors | <40 red, ≥80 brand |

---

## F. Reference assets the goldens depend on (frozen, committed, repo-anchored)

Read via module constants in `datasource.py:340-364`, **not** the fixture bundle — so tests use the real redesign2 files and the fixture does NOT provide them:
| accessor | file | used by |
|---|---|---|
| `ai_exposure` | `data/ai/occupation_ai_exposure.parquet` (β per broad NOC 0–9) | `geography.ai_exposure`, `occupations.ai_exposure` |
| `province_labour_force` | `data/reference/province_labour_force.csv` (LFS 2024) | `geography.demand_map_percap`, `demand_map_lq` |
| `skill_labels` | `data/reference/skills.csv` (code→name, AI subgroup) | all skill charts |
| `wage_by_education` | `data/derived/wage_by_education.parquet` (6 rows, 2025-12) | `pay.wage_by_education`, `education_wage_proxy` |
| `geojson` | `data/geo/canada_provinces.geojson` | all choropleths |

Expected for asset-using charts = `fixture postings × asset values`, **read the asset in the test** (don't re-hardcode). If an asset is edited, its goldens re-bless under job.md §10.

---

## G. Generator shape (`tests/fixtures/build_corpus.py`)

Deterministic (no randomness):

```python
UNIT = [  # (province, noc_raw, naics_raw_or_None, n)
    ("ON","21234 - Sci occ","541234 - Prof svc",3),
    ("ON","31234 - Health occ","621234 - Health care",1),
    ("ON","62345 - Sales occ","445110 - Retail",1),
    ("AB","21234 - Sci occ","541234 - Prof svc",1),
    ("AB","31234 - Health occ","621234 - Health care",2),
    ("BC","62345 - Sales occ",None,2),
]
SCHEDULE = [("2019-06",1),("2020-12",1),("2021-12",1),
            *[(f"2022-{m:02d}",1) for m in range(1,13)],
            *[(f"2023-{m:02d}",1) for m in range(1,13)],
            *[(f"2024-{m:02d}",2) for m in range(1,13)]]
# expand month×scale×UNIT; apply §B field rules; inject 3 wage rows [10,20,30] and
# the skill rows (real codes incl. AI_CODE) per month; write per-year parquet to
# tests/fixtures/golden_corpus/<year>/processed_fixture_<year>.parquet
```

Commit the generated parquet **and** the generator. Expected files in `tests/golden/{aggregation,figures}/` are hand-derived from §D — never dumped from a production run.
