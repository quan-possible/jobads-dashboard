# Code simplification — make the dashboard codebase lean without changing what it renders

- **Status:** PLAN READY — investigation complete, plan written, **no code changed yet** (user chose plan-only).
- **Date:** 2026-06-22
- **Branch / worktree:** `sleepy-euler-04a7d0` (off `main`, HEAD `5b9f099`, clean tree at start).
- **Skill:** `simplify` (this is its planning deliverable).
- **Decisions taken** (from the user, 2026-06-22):
  1. **Remove the unused typed-JSON "Public data API"**; reduce the `/developers` page to the 2 endpoints the UI actually uses. Keep the page and its footer link.
  2. **Plan only this session, then stop.** Execution is a follow-up.

---

## 1. The requirement we are simplifying against (the guardrail)

Make the code as simple and concise as possible **while the rendered dashboard stays identical.** Concretely, the following must not change:

- **Every rendered page** (`/`, `/occupations`, `/industries`, `/geography`, `/wages`, `/skills`, `/method`, `/explore`, `/developers`) — same layout, same charts, same interactions.
- **Every figure**, byte-equivalent or visually identical: all 41 chart ids in the figure-bridge `REGISTRY` (`api/figures.py:61`), in both **English and French**.
- **Both locales.** French is a required, user-visible locale (`LocaleToggle`). No visible EN or FR string may change.
- **The derived data.** The 16 aggregate parquet files under `data/derived/labor_market_dashboard_v1/` must be reproduced byte-/row-identically by `refresh`, and `jobads-dashboard validate` must still pass.
- **The private Explore path** (`/api/auth`, `/api/postings*`, posting lookup) and the password gate.

The single architectural fact that makes deep cuts safe: **the dashboard renders entirely through the figure bridge** — `web` pages fetch Plotly figure JSON from `GET /api/figure/{id}` (`api/figures.py` → `jobads_dashboard.viz.DataSource` reading derived parquet directly). The large typed-JSON read API (`api/queries.py`) is a **separate path the UI barely uses**, and the viz layer carries a lot of dead scaffolding left over from the redesign. Verified independently: `api/figures.py:34-44` imports only `jobads_dashboard.viz.*` + `core`; it never imports `queries.py`.

---

## 2. What must stay the same (the must-keep list)

| Area | Must keep | Why |
|---|---|---|
| Read API | `/api/meta`, `/api/overview` and their query functions | The only read endpoints the rendered UI fetches (`layout.tsx:49`, all researcher pages, `method/page.tsx`; homepage `page.tsx:46`). |
| queries.py internals | `_rank_dim`, `postings_series`, `_kpis`, `_streak`, `_key_points`, `_series_frame`, `get_meta`, `overview`, `resolve_scope`, `_scope_where`, `_entity_trends`, `_wage_trend`, `_COVERAGE_LABELS`, plus small helpers | `_rank_dim` (`queries.py:459`) and `postings_series` (`queries.py:457`) are **transitively live via `overview()`** even though the `rank`/`series` endpoints are being removed. |
| overview payload | `top_growing`/`top_cooling` fields | Unused by the UI but pinned by `overview` tests; cheap to keep. |
| Figure bridge | All 41 `REGISTRY` factories + `_FR_CHROME` | This is the live render path. |
| Derived data | All 16 parquet builders, `validate_derived_package` required-files + schema sets, NOC/NAICS `'code \| label'` format | Pinned by `tests/test_refresh_contract.py`; figures read these tables. |
| Reference assets | `data/ai/occupation_ai_exposure.parquet`, `data/derived/wage_by_education.parquet` (git-tracked) | Live figures read them (`datasource.py:352,360`). |
| i18n | Every EN + FR string that renders; the `page-*.ts` per-page split; the `{en,fr}` dict shape; `api/figures.py:_FR_CHROME` | French stays; the shape is already near-minimal. |
| Explore | `web/lib/explore.ts`, `explore/*` components, `api/routers/private.py`, `api/auth.py` | Separate live feature. |
| Filters | `FilterSpine`, `Select`, `options.ts`, `useFilters` (geo/occ/ind/q) | Functional on `/explore` (scopes the posting search). Hidden elsewhere by design — not vestigial. |

---

## 3. What is excess (the evidenced inventory)

All line counts are estimates from the read-only investigation; cited `file:line` is the anchor for each. Risk = risk to the **rendered dashboard**.

### Tier 1 — Dead code, provably zero rendered-output risk

**Web (TypeScript/React)**

| Item | Location | ~Lines | Evidence |
|---|---|---|---|
| `openapi.json` (stale OpenAPI dump) | `web/lib/openapi.json` | **1834** | Zero importers across `web/`,`api/`,`src/`. The `/developers` page hardcodes its own endpoint data (`developers/page.tsx:25-100`). |
| `DownloadCSV` component | `web/components/DownloadCSV.tsx` | 78 | No JSX usage anywhere; the would-be CSV export was never wired in. |
| CSV helpers | `web/lib/csv.ts` | 54 | Only importer is the dead `DownloadCSV`. |
| `plotTheme.ts` (old Observable-Plot theme) | `web/lib/plotTheme.ts` | 34 | Zero importers; superseded by `plotly/theme.ts`. |
| Dead `format.ts` exports | `fmtShare`, `fmtIndex`, `fmtMonthShort`, `trendClass` | ~16 | 0 references. |
| Dead `plotly/theme.ts` exports | `aclmrWarm`, `PC`, `PLOT_FONT`, `monthDate` | ~50 | Only `baseConfig` is imported (`RemoteFigure.tsx:4`); figures arrive pre-themed from the bridge. |
| Vestigial filter fields | `useFilters.ts:24-26`, `Filters` in `types.ts` (`start`,`end`,`cmp`) | ~8 | Nothing reads them, not even Explore. |

**i18n (FR preserved throughout)**

| Item | Location | ~Lines | Evidence |
|---|---|---|---|
| 6 dead blocks in `pages.ts` (`pulse`,`explorers`,`geography`,`wages`,`skills`,`method`) | `pages.ts` EN 7-78, FR 125-196 | ~144 | `index.ts:17` consumes only `pages[locale].explore`; real pages use `page-*.ts`. |
| 11 unused `common` keys | `common.ts` (both locales) | ~22 | `csv`,`download`,`reset`,`retry`,`asOf`,`noData`,`search`,`langShort`,`apiDownTitle`,`apiDownBody`,`somethingWrong` — 0 refs. |

**Python (viz + dashboard + api)**

| Item | Location | ~Lines | Evidence |
|---|---|---|---|
| `review.py` (dev-only review page) | `src/jobads_dashboard/viz/review.py` | **240** | Not served by the bridge, no test imports it, and it **already crashes** — it names 12 factories that no longer have a `def` (deleted in the redesign). |
| Dead `compute.py` functions | `lorenz_curve`,`topk_cumulative_share`,`hhi`,`location_quotient`,`robust_z`,`classical_decompose` | ~75 | 0 callers (supported deleted charts). |
| Dead `theme.py` machinery | `aclmr_dark` registration, `palette()`, `DARK`, `coverage_opacity()`, `INK`, `DEMAND_SIGNAL_NOTE` | ~25 | Bridge only inlines `aclmr_light` (`figures.py:233`); dark template never serialized; helpers have 0 callers. |
| Dead `DataSource` members | `table()`, `first_month`, `metadata` | ~12 | 0 callers (`metadata` only via `review.py`). |
| Dead `labels.py` helpers | `naics_short()`,`full_label()`,`truncate()` | ~14 | 0 callers. |
| Dead factory `pulse.kpi_row` | `figures/pulse.py:27-72` | ~46 | Not in `REGISTRY`; only ref is `review.py`. |
| Dead `_FR_LORENZ` branch | `api/figures.py:193,199-201` | ~4 | No live factory emits the "Lorenz curve" string. |
| Dead `constants.py` | `THEME`,`PLOTLY_SEQUENCE`,`VisualTheme` | ~40 | 0 importers; live theme is `viz/theme.py`. |
| Dead `metrics.py` | `summarize_headlines`,`HeadlineMetrics`,`format_int` | ~35 | 0 production/test callers. (`safe_pct`/`format_pct` kept only by `test_metrics.py` — see Open items.) |
| Dead `data.py` | `load_metadata` | ~17 | 0 callers; `datasource.py:367` reads metadata inline. |
| Built-but-never-read aggregate | `geography_top_markets` — `prepare.py:328-341` builder + `prepare.py:778,824` validation + `data.py:28` + `api/core.py:111` registry + `test_refresh_contract.py:70` | ~14 + contract edits | No `parquet('geography_markets')` read in `queries.py`; not read by `datasource.py`. Geography figures use `monthly_by_market`. Remove end-to-end **including the test/validation entries in lockstep.** |

**Tier 1 subtotal ≈ 2,762 lines** (of which `openapi.json` is 1,834 — a single dead artifact).

### Decision-driven cut — Remove the unused typed-JSON "Public data API"

The UI fetches only `/api/meta` + `/api/overview`. The remaining 12 read endpoints are documented-but-unused (6) or fully dead (6). Per the user's decision, remove all 12 and reduce the developers page.

| Item | Location | ~Lines | Notes |
|---|---|---|---|
| Dead query functions | `queries.py` (`geography`,`wages`,`wage_trend`,`composition`,`concentration`,`occ_province_matrix`,`coverage_trend`,`geography_trend`,`skills`,`requirements`,`rank` wrapper + private helpers) | ~540 | File shrinks 963 → ~420. **Keep** `_rank_dim`, `postings_series` (live via `overview`). |
| Dead response models | `models.py` (16 response/item models) | ~135 | Keep `Scope`,`SourceWindow`,`CoverageItem`,`Meta`,`SeriesPoint`,`Kpis`,`RankItem`,`OverviewResponse` + the Auth/Posting block. |
| Dead route handlers | `routers/read.py` (12 of 14) | ~95 | File shrinks 132 → ~37 (keep `meta`,`overview`). |
| Dead client methods | `web/lib/api.ts` (12 methods) | ~26 | Keep `meta`,`overview`,`figure`,`get`,`qs`,`API_BASE`. |
| Dead types | `web/lib/types.ts` (~21 interfaces) | ~135 | Keep `Meta`,`OverviewResponse`,`Kpis`,`SeriesPoint`,`RankItem`,`FigJSON`,`Filters`,`Scope`?(only if referenced) + Explore types. |
| Dead/edited tests | `api/tests/test_read.py` | ~33 tests (~300+ lines) | Bucket C has **no tests**; bucket B drops ~33 test fns; 2 `overview` tests cross-check `/api/series/postings` (`test_read.py:278-292`) and must be edited. |
| Trim developers page | `web/app/developers/page.tsx` ENDPOINTS array | ~60 | Reduce from 8 documented endpoints to `meta` + `overview`. Page + footer link stay. Swagger `/docs` link stays (lists fewer routes). |

**Decision cut subtotal ≈ 930 lines of code + ~300 test lines + the doc trim.** Zero change to what renders (the developers page is static JSX; it renders identically).

### Tier 2 — Mechanical de-duplication (low risk; output must stay byte-identical)

| Item | Location | ~Lines | Approach |
|---|---|---|---|
| Filter-cube slice helper | `prepare.py:197-278` (4 slices + 2 wage slices) | ~35-40 | One `_slice_filter_cube(...)` parameterized by WHERE predicates + ORDER BY. |
| Stacked-dimension helper | `prepare.py:344-452` (`conditions`/`language`/`requirements`) | ~55-70 | Shared `WITH stacked … GROUPING SETS` builder over a `(label, expr)` list (block triplicated verbatim). |
| Hoist NAICS/NOC CASE | `prepare.py:88-99,642-651,685-686` | ~12-20 | One reused SQL-string constant. |
| Parameterize market CTEs | `prepare.py:283-318` | ~12-15 | Only `province_scope` expr differs. |
| Viz constant/scaffolding hoists | `UP`/`DOWN`→`theme.py` (4 modules); single `PROVISIONAL_FROM`/`stable_window()`; shared `_treemap_trace`; hoist local `COLORWAY` imports | ~27 | Identical constants/kwargs → identical traces. |
| Shared page chrome | `<Hero>`, `<DeepDivider>`, `<ApiDown>` components + `loadFigures(ids, locale)` across 8 pages | ~150-220 net | Pages share an identical fetch+try/catch+figs-map skeleton and 3 repeated `<section>` blocks. Keep per-figure grids inline (heights/columns/toggles differ). **Preserve the hardcoded `uvicorn …` string** in geography/wages `ApiDown`. |

**Tier 2 subtotal ≈ 290-380 lines.** Each item is output-preserving; verified by the parity oracle (§5).

### Tier 3 — Structural wins (medium risk; parity-gated)

| Item | Location | ~Lines | Risk / gate |
|---|---|---|---|
| Collapse the two posting-lookup builders | `prepare.py:520-713` — delete `build_posting_lookup_from_source` + `posting_lookup_source_plan`, route the CLI `posting-lookup` subcommand through the view-based builder | ~130-150 | **Medium.** The `_from_source` path has its own recent-months pruning + raw-CAST normalization. Must prove an identical `posting_lookup.parquet`, and `test_cli.py` pins the subcommand. |
| Fold `build_wage_by_education.py` into `refresh` | `tools/build_wage_by_education.py` → a `prepare.py` step | ~75 net | **Low-med.** Must reproduce schema, `MIN_SAMPLE=50`, wage bounds 5/500, latest-month cross-section semantics exactly so `pay.wage_by_education` is unchanged. |
| (Optional, defer) Shared stacked-area helper | 5 viz factories | ~25 | **Medium.** Per-chart bucketing/labels/hover differ — easy to change a trace. Out of scope unless reproduced exactly. |

**Tier 3 subtotal ≈ 150-250 lines.**

### Leave alone (considered, not cutting)

- **`tools/build_ai_exposure.py`** — correctly orphaned reference tooling; downloads external public CSVs, builds a 10-row static asset, no place in the corpus `refresh`. Keep standalone.
- **Filter subsystem** — functional on `/explore`. Only the unused `start`/`end`/`cmp` fields are vestigial (Tier 1).
- **datasource ↔ compute split** — healthy separation (I/O vs math). Keep.
- **i18n `{en,fr}` shape and `page-*.ts` split** — already near-minimal; re-shaping risks visible strings for no real gain.

---

## 4. The smallest coherent end state

- **One data path for the dashboard:** the figure bridge. The read API shrinks to exactly what the UI needs — `meta` + `overview`. `queries.py` 963 → ~420, `read.py` 132 → ~37, `models.py` 316 → ~180.
- **viz package free of redesign debris:** no `review.py`, no dark-theme/`palette()` apparatus, no dead `compute`/`labels`/`datasource` members, no unregistered factories. `theme.py` builds the one `aclmr_light` template the bridge uses.
- **`prepare.py` built on a few shared builders** instead of repeated SQL blocks, producing byte-identical parquet.
- **8 web pages built from shared chrome** (`Hero`/`ApiDown`/`DeepDivider`/`loadFigures`) with only the per-page figure layout inline.
- **No stale artifacts:** `openapi.json`, `plotTheme.ts`, `DownloadCSV`/`csv.ts`, dead i18n blocks gone.

### Headline savings

| Bucket | ~Lines | Output risk |
|---|---|---|
| Tier 1 dead code (incl. 1,834-line `openapi.json`) | ~2,762 | none |
| Remove unused public API + trim dev page | ~930 (+~300 tests) | none (nothing renders differently) |
| Tier 2 mechanical dedup | ~290-380 | low (parity-gated) |
| Tier 3 structural | ~150-250 | medium (parity-gated) |
| **Total** | **~4,100-4,300 code lines** | dashboard renders identically |

Against ~13,500 source lines (~15,300 with `openapi.json`), that is roughly a **27-30% reduction** with the dashboard unchanged.

---

## 5. Parity oracle — capture the baseline BEFORE any change

The whole job rests on "output stays identical," so capture a comparison baseline first and re-run it after each tier. Save under `docs/jobs/active/2026-06-22-code-simplification/evidence/baseline/`.

1. **Figure JSON** — for all 41 `REGISTRY` ids in **en and fr**, save `GET /api/figure/{id}?locale=…` to disk (82 files). After changes, diff. Tier 1/decision cuts must be **byte-identical**; viz hoists (Tier 2) must be byte-identical too (they touch only constants/structure).
2. **Derived parquet** — record row counts + a stable content hash (sorted-rows hash, not file mtime) for all 16 tables + the two reference parquet. After `prepare.py` changes, rebuild and diff. Must match exactly. *(Env caveat: derived data is on a slow external volume; `.venv` lacks working `pyarrow.parquet` — use system `python3` for rebuild/diff.)*
3. **Rendered pages** — screenshot all 9 routes (desktop + mobile, en + fr) via the preview tooling. After web changes, re-shoot and compare.
4. **Test + build snapshot** — `PYTHONPATH=src pytest -q`, `npm --prefix web run build`, `jobads-dashboard validate` all green before starting.

---

## 6. Execution plan (phased, for the follow-up session)

> Not executed this session (user chose plan-only). Sequenced low→high risk; each phase is its own checkpoint commit on this worktree. Commit before fan-out if subagents are used (see [parallel-subagents-git-worktree] memory).

**Phase 0 — Baseline.** Capture the §5 oracle. Confirm clean green baseline.

**Phase 1 — Tier 1 dead-code deletions (zero risk).** Delete the items in §3 Tier 1. Order: web artifacts (`openapi.json`, `plotTheme.ts`, `DownloadCSV`+`csv.ts`, dead `format`/`plotly-theme` exports) → i18n dead blocks → Python viz/dashboard dead code → `geography_top_markets` end-to-end (builder + validation + `data.py` + `core.py` registry + `test_refresh_contract.py:70` together).
- **Verify:** `pytest -q`, `npm run build` (TS catches dead-import slips), `validate`, figure-JSON diff (must be byte-identical), page screenshots.

**Phase 2 — Remove unused public API (decision cut).** Delete the 12 dead read endpoints + their query functions, models, client methods, types, and tests; edit the 2 `overview` tests that referenced `/api/series/postings`; trim `developers/page.tsx` ENDPOINTS to `meta`+`overview`.
- **Verify:** `pytest -q` (read-API tests for `meta`/`overview` still green), `npm run build`, figure-JSON diff, screenshot the `/developers` page (renders identically).

**Phase 3 — Tier 2 mechanical dedup (low risk).** `prepare.py` SQL helpers → rebuild + parquet parity diff. Viz constant/scaffolding hoists → figure-JSON byte diff. Shared page chrome (`Hero`/`ApiDown`/`DeepDivider`/`loadFigures`) → page screenshots + build.
- **Gate:** any parquet/figure diff that is not identical = revert that item.

**Phase 4 — Tier 3 structural (medium risk, optional).** Posting-lookup builder consolidation and `wage_by_education` fold-in, each behind a mandatory rebuild + parquet parity diff and `test_cli` green. Defer the stacked-area helper unless parity is proven.

**Phase 5 — Close out.** Update `MEMORY.md` + `memory/2026-06-22.md`, move this job folder to `docs/done/`, commit. Re-run the full §1 verification loop.

---

## 7. Open items / things to confirm during execution

- **`metrics.py` whole-module question:** after deleting the 3 dead functions, only `safe_pct`/`format_pct` remain, kept alive solely by `test_metrics.py`. Decide: keep the small module, or delete it **and** its test together. (Lean: delete both — no production caller.)
- **`cli.py` passthrough wrappers** (`refresh_dashboard_data`, `validate_derived_package`, `build_posting_lookup`) use lazy imports on purpose (cheap `import cli`). Not dead; leave unless Phase 4 changes the `posting-lookup` builder, which also touches the `build_posting_lookup` wrapper and `test_cli.py`.
- **`types.ts` `Scope`** — confirm it's only referenced by dead response types before deleting (the web-app investigation flagged it as transitively dead).
- **Confirm no consumer of `geography_markets`** beyond the test/registry before deleting that aggregate (none found; it isn't even an endpoint).

---

## 8. Evidence

Five read-only investigators mapped the subsystems on 2026-06-22; findings are folded into §2-§3 with `file:line` citations. Load-bearing facts independently re-verified from source by the lead: figure bridge imports (`api/figures.py:34-44`), nav/footer wiring (`web/lib/nav.ts`, `Footer.tsx:30`), the read-API client surface (`web/lib/api.ts:47-74`), and that only `meta`/`overview` are fetched by the UI. No code was changed during investigation or planning.
