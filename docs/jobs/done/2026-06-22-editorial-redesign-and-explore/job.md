# Editorial redesign + focused Explore builder

**Status:** DONE & verified 2026-06-22 — all of WS-A, WS-B, WS-C implemented and live-verified (EN+FR). See §9 final entry for evidence and the two documented scope calls (no new skills coverage_line; momentum un-caveated).
**Opened:** 2026-06-22 · branch `redesign2`
**Owner context:** Bruce asked for an editorial design pass over the whole app, then a detailed plan written into a job before any code changes. The scope-filter approach was settled in conversation first (see Decisions).

---

## 1. The job in one paragraph

The dashboard is well-built and, in places, unusually honest, but it has drifted from its own spec
(`docs/analyses/labor_market_dashboard_spec/report.md`): the spec says a **"single descriptive
labor-market product… a place to build intuition, not a place to make causal claims,"** explicitly
**"Not an AI dashboard"** and **"Not a causal inference surface."** The build has become part
analysis-paper (a hardcoded 2019/COVID comparison frame) and carries some honesty bugs. This job
(a) records the editorial findings, (b) reworks the curated pages back toward neutral description,
(c) adds a **focused self-serve chart-builder** on the Explore page so "specific questions"
(slice by Ontario healthcare, compare any two years) get their own home instead of cluttering every
chart, and (d) fixes the data-honesty defects. **No universal filter bars on the curated charts** —
that was rejected as the cheap solution.

---

## 2. Decisions locked in (from the conversation)

1. **Keep all three AI charts** (occupations AI-exposure scatter, geography AI-exposure map, skills
   AI-diffusion). Bruce's call, overriding the earlier "cut them" recommendation. They stay as
   *deeper/descriptive* charts with their existing caveats; only wording is touched.
2. **No uniform filter bar on the curated charts.** Stapling identical filter buttons onto all 29
   charts is the cheap solution and is rejected.
3. **Three-tier architecture by intent:**
   - **Curated narrative** (home + topic pages): designed, descriptive, opinionated charts.
     Interactivity is *intrinsic and sparing* (only where it is part of that chart's idea — the
     geography measure toggle, the time slider on treemaps). Default to the **full 2016→now trend**;
     no COVID framing.
   - **Explore = focused chart-builder** (rebuild of `/explore`): user picks one breakdown + one
     measure + a time window → one good chart + download. **All** slicing/filtering and the
     "any two years" comparison live here, and nowhere else.
   - **Find postings** (existing password-gated raw-ad search): unchanged, becomes the third tier.
4. **Explore ambition = Focused**, not a full pivot tool. One breakdown, one measure, one window.
5. **Scope filters reset per page** (Bruce's pick) — moot for the curated pages (they carry no global
   scope), and the Explore builder keeps its own state in the URL.
6. *(Recommended, not yet confirmed by Bruce)* **Keep 2019 only as the index *base*** (an index needs
   a disclosed base; `2019 = 100` is conventional and fine). The thing to remove is the
   *"change since 2019 / 2019 → 2024" comparison framing* presented as neutral description. This is
   the natural resolution of Bruce's original 2019 objection, but confirm it (see §7).

### 2.1 Confirmed by Bruce 2026-06-22 (supersedes the §5/§7 "cut" proposals)

7. **No chart cuts. Keep all charts — make the year-anchored ones *general* instead.** Bruce's exact
   answer to the cut question: *"keep all but like make them general, for example instead with 2019
   we let users choose years etc."* So the dumbbell, waterfall, momentum, indexed-lines, contribution
   bars and skill-churn all **stay where they are**, but every chart that currently hard-codes a 2019
   (or 2019→2024) comparison gets a **small inline year control** so the user chooses the comparison
   years. This is *intrinsic* interactivity (the chart is about comparing years) — consistent with
   Decision §2.2 (no uniform geo/occ/ind filter bars) and §2.3 (sparing intrinsic interactivity).
   skill-churn is **not** moved off the occupations page.
8. **Explore measures = {postings count, share of total, YoY %, two-year change (A vs B)} + median
   wage** (median wage included as a sample/coverage-gated measure).
9. **Explore layout = two tabs under `/explore`:** "Build a chart" (public) + "Find postings" (gated).
10. **Adopted defaults (my call, low-risk):** "as of" = `2026-03`; default comparison end = latest
    *complete* year = **2025**; keep `2019 = 100` as the disclosed, **user-rebaseable** index base.

**Architectural implication of #7:** the figure bridge must accept optional year params. Extend
`GET /api/figure/{chart_id}` to pass `**params` (e.g. `base_year`, `year_a`, `year_b`, `end_year`)
through `figures.build()` to the factory; factories that take year args use them, others ignore. The
front-end gives those specific charts a thin year-picker that refetches. This is the same param plumbing
the Explore endpoint needs, so build it once and share it.

---

## 3. What exists today (investigation results)

### 3.1 Surface inventory
- **29 charts** across 8 content pages + `method` + `developers`. Every content page already splits
  into a headline tier and a **"Going deeper"** tier (so a two-tier instinct is already in the code).
- Chart bodies come from a **figure bridge**: Python `plotly` factories in
  `src/jobads_dashboard/viz/figures/*.py` → registered in `api/figures.py` (`REGISTRY`, ~40 ids) →
  served as Plotly JSON by `GET /api/figure/{chart_id}?locale=` (`api/routers/figures.py`).
- **The figure bridge is national by construction** (`api/figures.py` docstring + comment): the
  factories hard-filter to All-Canada / All-occupations / All-industries. **No chart accepts any
  scope param today.** The scope params on the developers page apply only to `/api/overview` and
  `/api/meta` (`api/routers/read.py`).

### 3.2 Where text lives (matters for retitling)
- **Page chrome** (eyebrow / title / note / aria) lives in TS i18n dicts
  `web/lib/i18n/dict/page-*.ts`, each with `en` + `fr` blocks, keyed `charts.<chartKey>.{eyebrow,title,note,aria}`.
  Consumed by `web/components/Figure.tsx`; fetched server-side via `api.figureSafe(id, locale)`
  (`web/lib/api.ts:40`).
- **In-figure text** (axis titles, legend, annotations, colorbar) is baked into the Python factory
  and, for French, mapped by `_FR_CHROME` in `api/figures.py:119`.
- **Retitling rule:** page title/note → edit the TS dict; axis/legend/annotation → edit the Python
  factory **and** the matching `_FR_CHROME` key; keep them in sync.

### 3.3 Data model (decides what is filterable)
- **Cube tables** carry full `province × occupation × industry × month` cells and *also contain the
  national total and the single-dimension marginals* (verified: `monthly_filter_cube` etc. have
  combos by #non-all dims `{3: 2436, 2: 583, 1: 43, 0: 1}`). So the cubes are a **superset** of the
  marginal tables. Cube-backed: `monthly_filter_cube`, `monthly_wage_cube`, `monthly_conditions`,
  `monthly_requirements`, `monthly_skills_topk`, `coverage_by_field_monthly`, `monthly_by_market`.
- **Curated charts mostly read the *marginal* tables** (`monthly_by_province`, `monthly_by_noc_broad`,
  `monthly_by_naics_broad`) or `monthly_overall` — i.e. the cubes are currently **underused**.
- The cube holds a **curated ~2,400 three-way combinations, not the full cross-product** → an
  explorer must offer only combos that exist and show "no data" otherwise.
- **Reference assets carry no scope:** AI-exposure β (10-row broad-NOC asset), `wage_by_education`
  (latest-month cross-section), `province_labour_force` (static 2024). These are **not** slice-able.
- **Data window:** `2016-01-01 → 2026-03-31` (`metadata.json`). So "MAR 2026" stamps are correct;
  the "→ 2024" comparison end is stale (a leftover `end_year=2024` from when 2025 was provisional).

### 3.4 Reusable backbone for the Explore builder
- **Backend:** `Scope` model (`api/models.py:17`), `resolve_scope()` (`api/queries.py:68`),
  `_scope_where()` (`api/queries.py:98`), `_series_frame()` (`api/queries.py:222`),
  `postings_series()` (`api/queries.py:243`), `scope_dependency` (FastAPI Depends). These already
  query cubes with scope for `/api/overview` — the builder reuses them.
- **Frontend:** `web/components/FilterSpine.tsx` + `web/lib/useFilters.ts` (URL-based geo/occ/ind
  controls), `web/components/RemoteFigure.tsx` (Plotly renderer), `web/lib/i18n/dict/filter.ts`,
  `web/components/explore/*` (AuthGate, ExploreView, PostingDrawer — keep for "Find postings").
- **Theme:** `api/figures.py:build()` inlines the `aclmr_light` template + transparent bg + title
  strip. Refactor this into a shared helper the Explore endpoint can call too.

---

## 4. Findings the rework must address

### 4.1 Honesty defects (independent of the redesign — fix regardless)
| ID | Where | Problem | Severity |
|----|-------|---------|----------|
| H1 | `figures/geography.py:123` `cma_demand` | Sums the un-filtered `monthly_by_market` cube → triple-counts; every CMA volume is **exactly 8× too large** (Toronto ~3.5M vs ~439k real). Confirmed against shipped data. Fix: filter to All/All/All before grouping (pattern already in `wage_overall`). | HIGH |
| H2 | titles/axes across `geography.py`, `pulse.py`, `occupations.py`, `skills.py` + `_FR_CHROME` | The word **"demand"** runs unqualified in titles/axes ("Labour demand", "demand intensity", "biggest labour markets"), treating the *posting flow* as economic demand stock. Spec: "counts measure posting activity." Fix: say "postings"/"posted demand". | HIGH |
| M1 | `pulse.demand_ribbon`, treemaps, `cma_demand`, `pulse.momentum` | Raw cross-year volumes ride **sample size** (2016 = 931k postings vs 2022 = 3.66M scraped) → "more scraping" reads as "more hiring". Fix: prefer indexed/share defaults; put a sample-size caveat on raw-count charts. | MED |
| M3 | `datasource.skill_churn` (`occupations.skill_churn`) | `end_year` hardcoded 2024; growth `clip(upper=300)` hides the biggest risers; `min_base≥150` in 2019 **structurally excludes genuinely new skills** (AI tooling) the chart claims to show. | MED |
| M4/M6 | `skills.*`, `pay.conditions_mix`, education/experience | Skills & requirements/conditions charts show shares **without a coverage denominator**, unlike `industries.coverage_line`. Spec rule: every wage chart must show wage coverage; same discipline needed for the sparsest fields. | MED |
| M7 | `geography.demand_map` percap | Per-capita divides time-varying postings by a **frozen 2024 labour force** across the animation. Disclosed in subtitle but anachronistic for early years. | MED |
| date | cards + factories | "as of MAR 2026" but comparisons end **2024**. Pick one "as of" month (2026-03) and one comparison end (latest complete year) and apply everywhere. | MED |

### 4.2 Redundancy / clutter (the curated trim)
- **Occupations page shows "what grew since 2019" five ways**: treemap, indexed-lines, contribution
  bars, waterfall, dumbbell. Two+ are redundant.
- **"Is demand speeding up?" appears three times**: YoY bars, momentum, diffusion.
- **Contribution-to-growth bars duplicated** on occupations *and* industries (keep — consistent pattern).

---

## 5. Workstreams

### WS-A — Honesty fixes (do first; low risk, high value, mostly independent)
1. **H1** fix `cma_demand` to filter the cube to All/All/All before grouping. Regenerate goldens.
2. **H2** de-"demand" pass: retitle in factories + TS dicts + `_FR_CHROME` keys (e.g.
   `"share of demand"`, `"demand LQ"`, `"YoY demand growth"`, `"mean AI exposure"` titles). List
   every occurrence during implementation.
3. **M1** add a standing sample-size caveat to raw-count charts (ribbon, treemaps, CMA, momentum if
   kept); promote the `DEMAND_SIGNAL_NOTE` idea (currently only in `review.py`) into the figure notes.
4. **M3** fix `skill_churn`: use latest complete year as `end_year`; drop or clearly label the 300%
   clip; lower/rethink `min_base` so new skills can surface (or add a separate "new entrants" view).
5. **M4/M6** add a coverage line/denominator to the skills page (mirror `industries.coverage_line`)
   and a coverage note to wage charts that lack it (`wage_dumbbell`, `wage_by_education`,
   `education_wage_proxy`, `wage_demand_quadrant`).
6. **M7** either freeze the per-capita map to the LF year, or add a per-frame caveat.
7. **date** standardize "as of" = 2026-03 and comparison end = latest complete year, everywhere.

### WS-B — Curated narrative rework
1. **Full-trend defaults:** ensure the trend charts show 2016→now with no COVID framing. Keep
   `2019 = 100` as the disclosed index *base* only.
2. **Make year-anchored charts general (Bruce's decision §2.1.7 — NO cuts).** Every curated chart
   that currently hard-codes a 2019 / 2019→2024 comparison gets an inline year control instead:
   - Occupations: **dumbbell** (year A vs year B pickers), **waterfall** (start/end year),
     **indexed-lines** (rebaseable index base), **contribution bars** (start/end year),
     **skill-churn** (base/end year — stays on occupations).
   - Home: **momentum** stays; **YoY bars** already rolling.
   - Default comparison: full span where neutral; keep `2019 = 100` as the rebaseable index base.
3. **Retitle for neutral description** (the de-"demand" + drop "since 2019" language in titles).
4. **Keep AI charts**, reword only: AI-diffusion title → "AI skills as a share of skill mentions";
   AI-exposure charts keep their "potential exposure, not realized automation / descriptive, not
   predictive" caveats.
5. Update `developers` page + `method` glossary to match (later, after WS-C lands the endpoint).

### WS-C — Focused Explore chart-builder (the new feature)
**Frontend** (`web/app/explore/page.tsx` → two tabs):
- **"Build a chart"** (new, public, aggregate): controls = breakdown dimension
  {province | occupation | industry | over-time}, measure {postings | share | YoY % | change between
  year A & year B | median wage*}, time window (range + a "compare two years" mode). Reuse
  `FilterSpine`/`useFilters` for optional scope narrowing; render via `RemoteFigure`; add CSV + PNG
  download. *median wage and any sparse measure are coverage/sample-gated.
- **"Find postings"** (existing): keep `AuthGate` → `ExploreView` exactly as is.

**Backend** (new endpoint, e.g. `GET /api/explore/figure`):
- Params: `dim`, `measure`, `geo`, `occ`, `ind`, `start`, `end` (reuse `scope_dependency` / `Scope` /
  `resolve_scope` / `_scope_where`).
- Reads the right cube (`monthly_filter_cube` for counts/shares/YoY/two-year-change;
  `monthly_wage_cube` for wage measures), applies scope, builds a Plotly figure via the shared theme
  helper refactored out of `api/figures.py:build()`.
- **Enforce the three gates:**
  - *Axis:* the breakdown `dim` may not equal a single-selected scope filter (disable in UI).
  - *Data:* only offer combinations present in the cube; return a friendly "no data for this
    combination" figure otherwise.
  - *Sample:* apply the n≥100 gate (consistent with the existing sample-gate convention); return an
    "insufficient sample" state rather than drawing noise.
- **Get H1's lesson right:** always scope-filter the cube before aggregating.

**i18n:** extend `web/lib/i18n/dict/explore.ts` (en + fr) for the new controls.

---

## 6. Sequencing, risks, dependencies

**Order:** WS-A (honesty) → WS-B (narrative) → WS-C (Explore builder). WS-A and WS-B both touch
factories/dicts and should land before WS-C builds on the refactored theme helper.

**Hard dependency — golden tests.** `tests/golden/` (`test_figures_golden.py`,
`test_aggregation_golden.py`, `test_compute_golden.py`, + property tests) pin chart/aggregate output.
**Every factory edit (H1, de-"demand", skill_churn, cuts) will break goldens** → regenerate and
*review the diff* (the golden suite previously caught the H1 bug, so treat diffs as findings, not
rubber-stamps). Update `api/tests/test_figures.py` when REGISTRY ids are removed.

**Other risks:**
- i18n parity: every retitle must update en + fr + `_FR_CHROME`; a French run must be checked.
- Removing a `chart_id` from `REGISTRY` breaks any page still referencing it — update the page JSX +
  dict together.
- Explore cube sparsity: many narrow combos are empty/low-n → the gate UX must be solid.
- `cma_demand` fix changes a shipped number → confirm nothing downstream hardcodes the inflated value.

---

## 7. Open questions — RESOLVED 2026-06-22 (see §2.1)

1. **Redundancy cuts** → **No cuts.** Keep all charts, make the year-anchored ones general (§2.1.7).
2. **Explore measures** → {postings, share, YoY %, two-year change} + median wage (gated) (§2.1.8).
3. **Comparison end year** → latest complete year **2025**; "as of" = **2026-03** (§2.1.10).
4. **Explore layout** → **two tabs** under `/explore` (§2.1.9).
5. **2019 as index base** → keep `2019 = 100` as the disclosed, **rebaseable** base (§2.1.10).

---

## 8. Verification plan (for the implementation phase)

- Invoke the `verification` skill per change set.
- `pytest` incl. `tests/golden/` (regenerate + review diffs) and `api/tests/`.
- Run the app on `127.0.0.1:8520` + ngrok per `AGENTS.md`; preview each reworked page; check the
  Explore builder against edge combos (empty slice, low-n, axis==filter) and in both locales.
- Confirm the `cma_demand` numbers match the ~439k-class corrected values.

---

## 9. Status log
- 2026-06-22 — Investigation complete (inventory, honesty audit, data model, spec, reusable
  backbone). Architecture + Explore ambition agreed. Plan written.
- 2026-06-22 — §7 resolved by Bruce (see §2.1): no cuts, make year-anchored charts general; Explore =
  two tabs + 5 measures; 2025 comparison end / 2026-03 as-of / rebaseable 2019 base. **Implementation
  started:** WS-A (honesty) → WS-B (general year controls) → WS-C (Explore builder).
- 2026-06-22 — **WS-A done+verified:** H1 (cma_demand 8× → All/All/All marginal, golden pins
  Toronto=120 on fixture / ~439k prod), H2 (de-"demand" across factories + `_FR_CHROME` + 8 TS dicts,
  both locales), M3 (skill_churn reworked to share-of-mentions Δ, max(base,end) inclusion, no clip,
  latest_complete_year). **WS-B backend done+verified:** `apply_house_style` extracted; `/api/figure`
  + REGISTRY pass `base_year`/`end_year`; indexed_lines, contribution, waterfall, dumbbell (occ+ind),
  shift-share, skill_churn, ai_exposure, top_skills_trend all general; default end = latest complete
  year (2025) — fixes the stale-2024 date item.
- 2026-06-22 — **WS-C backend done+verified** (subagent): `api/explore.py` + `api/routers/explore.py`
  + `api/tests/test_explore.py` (28 tests). `GET /api/explore/figure?dim&measure&geo&occ&ind&start_year&end_year&locale`.
  4 dims × 5 measures, 3 gates (axis/data/sample n≥100), no double-count, FR. Imports `apply_house_style`.
- 2026-06-22 — **WS-B frontend done+verified on OCCUPATIONS** (vertical slice): new client
  `web/components/TunableFigure.tsx` (year picker in Figure `actions`, client refetch via `api.figure`),
  `api.ts` figure/figureSafe take `extra` params, `common.ts` `yearControl` i18n (en+fr), occupations
  page wired (6 tunable charts), occupations TS titles/notes genericized (no hardcoded years) en+fr.
  **Verified live:** web :3000 + API :8530; SSR renders 11 selects; defaults 2019→2025; titles
  de-yeared; changing a picker refetches `/api/figure/...?base_year&end_year` (network-confirmed);
  0 console errors; `tsc --noEmit` clean. **Backend tests: 305 pass** (incl. 28 explore + figure/golden).
- 2026-06-22 — **REMAINING DONE & verified (this session) — job complete:**
  1. **WS-B frontend replication** — `TunableFigure` wired on **skills** (`top_skills_trend`, mode=base,
     single picker), **geography** (`shift_share`, mode=baseEnd), **industries** (`contribution_bars`,
     mode=baseEnd); titles/notes de-yeared en+fr. Live: skills 1 picker (2019), industries+geography
     2 pickers (2019→2025); industries refetch confirmed `…/industries.contribution_bars?base_year=2019&end_year=2022` (FR).
  2. **WS-C frontend** — new `web/components/explore/ExploreTabs.tsx` (two tabs) + `ExploreBuilder.tsx`
     (dim × measure × year window; scope reused from the shared FilterSpine URL; CSV download), `api.exploreFigure`,
     `explore.ts` `tabs`+`builder` i18n (en+fr), hero reworded for both tabs. Live: refetch on measure change (200),
     axis gate drops the pinned dim (geo=ON → "Province" removed), scope flows into the fetch (`…&geo=ON&…`),
     tab→AuthGate, FR labels complete, 0 console errors.
  3. **WS-A MED notes** — M1 sample-size caveat appended to the raw-count notes (pulse demand_ribbon,
     occupations+industries treemaps, geography cma) en+fr; M7 fixed-2024-LF per-capita caveat on the
     geography demand map en+fr; M4/M6 wage-coverage clause on `wage_demand_quadrant` + `education_wage_proxy`
     en+fr. **Scope calls (documented):** M4/M6 skills coverage is already disclosed (hero lede + per-chart
     "among the N postings that list skills" + sparsely-reported notes), so NO new skills `coverage_line`
     chart was added (would be a new factory + golden churn for redundant disclosure); momentum left
     un-caveated (it is a 3mo-vs-12mo gap, not a raw cross-year level).
  4. **Verification:** `tsc --noEmit` exit 0; `pytest` **321 passed** (no Python changed); live preview on
     web :3000 + API :8530 — Explore builder + all three replicated pickers exercised in EN and FR, 0 console errors.
