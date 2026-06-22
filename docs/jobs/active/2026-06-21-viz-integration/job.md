# Job: Put the redesign2 visuals on the redesign website (figure-bridge, national, time sliders)

**Slug:** 2026-06-21-viz-integration
**Status:** IMPLEMENTED — S0–S5 all landed & verified (commits c06b82b, bb520fc, 585e641, 60d4c89, dc2ee5e). Open: confirm fate of the private `/explore` lookup; optional follow-ups (see §11). See §10 Progress.
**Target:** the `redesign` branch — **Next.js (`web/`) + FastAPI (`api/`)** app, worktree `.claude/worktrees/greenfield-aclmr` (the Streamlit app in `src/` is legacy, ignore).
**Source of charts:** `redesign2`'s Python Plotly factories (`src/jobads_dashboard/viz/`), worktree `.claude/worktrees/redesign2`.
**Detailed build spec (file-level, code skeletons):** see `implementation.md` in this folder.

---

## 1. The decision, in one paragraph
The site becomes a **curated national dashboard of redesign2's visuals**, organized Core→Deep, **navigated through time with sliders** — no province/occupation/industry filtering, no profession-selector explorer. Charts are **not** hand-rebuilt in TypeScript. Instead the **Python factories are the single source of truth**: a FastAPI endpoint renders a factory to **Plotly figure JSON**, and a thin React host draws it. Adding a visual later = write one Python factory + register it. The old redesign chart layer is **discarded**; only the KPI tiles and the app shell stay.

This reverses two earlier ideas in this ledger: (a) we are **not** reimplementing charts in TS (too brittle/duplicative — Bruce's call, correct), and (b) we are **not** keeping the overlapping or interactive redesign charts ("the old version is just not good … more for redesigning the UI than making nice useful visuals").

### Decisions locked (2026-06-21)
- **Architecture:** figure-JSON **bridge** (Python factory → `fig.to_plotly_json()` → React host). Not TS reimplementation; not the data-only API + TS-built charts.
- **Filtering:** **none** — national curated visuals + **time sliders**. (User chose "National + time sliders".)
- **Discard:** the entire old redesign chart layer, incl. the `ExplorerView` profession-selector pages and all `web/components/*Chart*`/restyle work.
- **Keep:** `KpiTile` (HTML KPI cards — user liked them) + app shell (nav, editorial `<Figure>` frame, i18n, layout, build/deploy). Open: the private team-only `/explore` posting lookup (`api/private.py`) — likely keep as a separate tool; confirm.
- **Look:** ship redesign2's own template (`aclmr_light`) as authored — it's the design Bruce reviewed and liked; the host renders the figure's embedded theme rather than forcing the old `aclmrWarm`.

---

## 2. How the bridge works (concrete)
**Server (`api/`):**
- New module, e.g. `api/figures.py`: a registry mapping a chart id → a redesign2 factory call. Builds a `DataSource` once (cached), calls the factory, returns `json.loads(fig.to_json())` → `{data, layout, frames?}`.
- New endpoint, e.g. `GET /api/figure/{chart_id}?locale=en|fr&as_of=YYYY-MM` (locale + optional as-of only; **no scope params**). Cache hard (`revalidate: 3600`, parquet only — honors the no-raw-corpus rule).
- Reuses `jobads_dashboard.viz` directly (the factories already read the derived bundle via `DataSource`). No re-plumbing for scope — the factories are already national.

**Client (`web/`):**
- `RemoteFigure.tsx`: fetch `{data, layout, frames}` for a chart id + locale, then render. Like the existing `PlotlyFigure` but (1) renders the figure's **own** template (don't inject `aclmrWarm`), and (2) supports **frames** (`Plotly.newPlot` / `addFrames`) so animated/slider figures work. The `ChoroplethTime` component already proves frames render in this stack — copy its frame handling.
- Pages (`web/app/*/page.tsx`) become thin: a server component lays out `<Figure>` editorial frames (localized headline/notes from the page i18n dict) each wrapping a `<RemoteFigure chartId=… locale=…/>`, grouped Core→Deep.
- Register the **union of trace types** the factories use in `web/lib/plotly/index.ts`: current `bar, scatter, choropleth, heatmap` **plus** `treemap`, `waterfall` (and `indicator`/`scattergeo` only if we keep those charts). Bundle grows modestly; far less than full plotly.js.

---

## 3. Time sliders (new requirement)
Plotly animation is native: a figure carries **one frame per period** (month/year) + a **slider** (and optional play button) in `layout.sliders`/`updatemenus`. Built in the Python factory (`go.Figure(data, frames=[go.Frame(...)], layout=…sliders…)` or `px ... animation_frame=`), shipped in the figure JSON, drawn by Plotly's own slider — no custom React state.
- **Proven here:** `ChoroplethTime` is exactly this (gapminder frames + slider).
- **Apply to snapshot charts:** treemaps (the example Bruce gave), choropleths, occ×industry & LQ heatmaps, rankings, concentration — each gains a "drag through time" slider instead of being pinned to one window.
- **Factory work:** add an optional `animate=by-year|by-month` path to the relevant factories that emits frames; default static frame = latest period.
- **Host work:** `RemoteFigure` must pass `frames` through (small, pattern exists in `ChoroplethTime`).

---

## 4. The two seams to solve once (in Python)
1. **In-figure i18n (EN/FR).** Factories bake English chrome (titles, axis titles, hover, annotations, legend names). For the bilingual site: pass a `locale` into the factory (or a localized-labels dict), and EITHER keep titles in-figure but localized, OR strip titles and let the editorial `<Figure>` frame supply the localized headline (the site's existing convention). Build a small **chart-chrome EN/FR dictionary** (like the per-page dicts, but for ~41 chart titles/subtitles/axis labels). Taxonomy labels (NOC/NAICS/skill names) stay untranslated, as today. **Recommendation:** titles → editorial frame (localized HTML); localize only axis/hover/annotation via the locale param.
2. **Theme parity.** Ship redesign2's `aclmr_light` template as the look (Bruce prefers it). Make sure honesty bands (COVID/provisional/pre-2021), label convention, and palette travel in the JSON (they do — they're layout shapes / trace data). Reconcile fonts/paper color with the page background once so figures sit flush in the `<Figure>` cards.

---

## 5. The chart set (what ships, from `redesign2/viz/figures/`)
All 41 factories are candidates; group Core→Deep per page. Sliders flagged where "go through time" applies.

| Page (route) | Core charts | Deep charts | Sliders |
|---|---|---|---|
| Home / Pulse | KPI tiles (KEPT, HTML) · demand ribbon · yoy bars · seasonality heatmap | stl panel · anomaly flags · sa-vs-nsa · diffusion · cycle plot | — (these are inherently time-series) |
| Geography | share choropleth · ranked provinces · lq choropleth | lq heatmap · shift-share · province tile grid · (bubble map opt.) | **choropleths + heatmap** (by year) |
| Occupations | treemap · indexed lines · contribution bars | waterfall · dumbbell · bump · concentration trio · horizon wall* | **treemap** (by year) |
| Industries | coverage line · treemap · share-over-time | contribution bars | **treemap** (by year) |
| Pay & conditions | wage band · wage dumbbell | wage×demand quadrant · conditions mix · language gap | quadrant (by year) opt. |
| Skills & requirements | skill-lift bars | education composition · experience mix | — |
| Data quality | coverage lines · coverage latest bars | — | coverage latest (by year) opt. |

\* `horizon_wall` is **blocked**: needs a fine-NOC rollup not produced upstream — defer with the data dependency documented.

Trace modules to add for the above: **treemap**, **waterfall** (Core/Deep need them); `scattergeo` only if the bubble map is kept; `indicator` not needed (KPIs stay HTML).

---

## 6. Stages (each = commit → verify in browser → deploy)
- **S0 — Bridge skeleton + look:** `api/figures.py` registry + `/api/figure/{id}` for 1–2 charts; `RemoteFigure.tsx` (own-template + frames); register `treemap`/`waterfall`; confirm a redesign2 figure renders in the React shell with its own theme. Decide the i18n title approach (frame vs in-figure). **Smallest end-to-end proof.**
- **S1 — Pulse page:** port the pulse factories behind the bridge; wire the home page Core→Deep; keep `KpiTile`. First full page on the new architecture.
- **S2 — Sliders:** add frame/slider support to the snapshot factories (treemaps first — Bruce's example) and the `RemoteFigure` frame path; verify drag-through-time.
- **S3 — Remaining pages:** geography, occupations, industries, pay, skills, quality — each as bridged Core→Deep, with sliders where flagged.
- **S4 — Remove the old layer:** delete the discarded `web/components/*` charts + `ExplorerView` + their API endpoints once nothing references them; trim the partial-bundle/imports. Keep `KpiTile`, shell, i18n, (and the private posting lookup if retained).
- **S5 — i18n pass:** ensure every shipped figure has EN + FR chrome; FR spot-check.
- **Deferred:** `horizon_wall` (needs upstream fine-NOC rollup) — separate data task.

## 7. Verification & acceptance (per stage)
- **API:** `PYTHONPATH=src .venv/bin/python -m pytest api/tests/ -q` green; new figure endpoints return valid `{data,layout,frames}`; no causal language in any emitted figure text; endpoints read only derived parquet.
- **Web:** `web/` builds; bridged figure renders under web `plotly.js ^3.6.0` (re-check format flags vs redesign2's CDN 2.35.2); sliders drag through time; EN **and** FR chrome present; the figure's redesign2 look is intact (honesty bands, label convention, palette); console clean; AA contrast holds.
- **Acceptance:** every non-blocked redesign2 chart live on the site as a bridged Plotly figure, national + Core→Deep, with time sliders where applicable and EN/FR chrome; old chart layer removed; `KpiTile` + shell retained; `horizon_wall` deferred with its data dependency noted.

## 8. Risks / open items
- **Frames host support** — `RemoteFigure` must pass `frames` (pattern exists in `ChoroplethTime`).
- **i18n volume** — ~41 charts' chrome needs EN/FR; mitigated by moving titles to the editorial frame.
- **Bundle growth** — treemap/waterfall (+scattergeo if used) add weight; register only what's used.
- **Figure-JSON payloads** — larger than data-only, but small for these aggregates + cached.
- **Some charts are national-by-construction** (LQ, shift-share) — fine now (site is national); they just won't gain a province dimension.
- **`horizon_wall`** blocked on upstream data.
- **Private `/explore` posting lookup** — keep or cut? (separate from the discarded public explorer.) Confirm.
- **Theme parity** — fonts/paper-color reconciliation so figures sit flush in cards.

## 9. Decision log
- **2026-06-21:** Target is Next.js+FastAPI (not Streamlit). redesign2 `viz/` = chart source of truth.
- **2026-06-21:** Architecture = **figure-JSON bridge** (Python factories → JSON → React host). Rejected: TS reimplementation (brittle/duplicative — user) and the data-only API + TS charts.
- **2026-06-21:** Filtering = **none; national + time sliders** (user chose). Discard old chart layer incl. profession-selector explorer. Keep `KpiTile` + shell. Ship redesign2's own `aclmr_light` look.
- **2026-06-21:** New requirement — **time sliders** (drag through time) on snapshot charts (treemaps etc.), via native Plotly frames built in the factory.
- **2026-06-21:** Go-ahead given ("implement this"). Building stage by stage in the `redesign2` worktree.
- **Pending:** confirm fate of the private `/explore` posting lookup (still open; not yet touched — keep for now).

## 10. Progress

- **S0 — bridge (DONE, verified).** `api/figures.py` (38-chart registry + `build()`: strips title, inlines `aclmr_light` template, transparent bg, reclaims the stripped-title top margin for single-panel figures), `api/routers/figures.py` (`GET /api/figure/{id}?locale=`, `GET /api/figures`), wired in `api/main.py`. `api/tests/test_figures.py` builds every registered chart + endpoint/404/locale/no-causal-text checks. Web: registered `treemap`+`waterfall` traces (`web/lib/plotly/index.ts` + `.d.ts`), `FigJSON` type, `api.figure()`, `RemoteFigure.tsx` (server-fetched figure prop → `newPlot`+`addFrames`, renders the figure's OWN inlined template, ResizeObserver). **Decisions settled:** (1) figures fetched **server-side** in the page (SSR cache), not client-fetched; (2) headline owned by the editorial `<Figure>` frame (title stripped in `build()`); (3) the `aclmr_light` template round-trips through `to_json()` and renders identically; (4) transparent paper/plot bg so figures sit flush on the cream cards.
- **S1 — Pulse page (DONE, verified).** `web/app/page.tsx` rewritten: hero + KPI strip + `KeyPoints` kept; 9 bridged pulse figures Core→Deep (demand ribbon, yoy bars, seasonality, composition · stl, anomaly, sa-vs-nsa, diffusion, cycle). Chart chrome (eyebrow/title/note/aria, EN+FR) added to `page-pulse.ts`. Discarded from this page: `ExplorerChart`, `DivergingMovers`, `SeasonalityHeatmap`, regional `SparklineTable` (removal of the component files is S4).
- **Verification:** `api/tests/` 122 passed (44 figure). `web` `tsc --noEmit` + eslint clean. Browser (dev server on a worktree-local port, API on 8531): all pulse figures render with the redesign2 look flush on cards, COVID/provisional honesty bands intact, no console errors. Initial-render width race self-corrects via the host ResizeObserver.
- **Local dev note:** API ran on **8531** (8530 was already held by another instance); web pointed at it via a gitignored `web/.env.local`. A `redesign2-web` config was added to the **main-repo** `.claude/launch.json` to preview the worktree's web.
- **S3 — remaining pages (DONE, verified).** geography, occupations, industries, wages, skills all rebuilt national on the bridge, Core→Deep, in editorial frames; old `ExplorerView`/per-page charts + filter/scope UI dropped from these routes. Chart chrome (EN+FR) added per page (geography/wages/skills extend existing dicts; occupations/industries get new dicts). Built by 5 parallel subagents off the Pulse template; verified centrally — tsc+eslint clean, every page renders all figures with real content (choropleths via embedded geojson; treemap/waterfall traces), no console errors. Commit bb520fc.
- **S2 — time sliders (DONE, verified).** `add_time_slider()` helper + `animate="by-year"` path on the occupation & industry treemaps (one `go.Frame` per year + native slider/play, drawn by RemoteFigure's `addFrames`). Registry serves both treemaps animated. Browser-verified: occupation treemap shows a 2016–2026 slider; dragging to 2019 swaps the data to that year. Commit 585e641.
- **S4 — remove old layer (DONE, verified).** Deleted 22 dead chart components + 2 orphaned explorer dicts; kept the shell (TopNav/FilterSpine/Footer), KpiTile/Sparkline/KeyPoints, Select, and everything `/explore` + `/method` use. tsc clean; home + bridged pages render (KPI sparklines + filter selects intact). Commit 60d4c89.
- **S5 — FR (DONE, verified).** Page chrome was already bilingual via dicts; FR spot-check on /occupations confirms French eyebrows/titles/notes + `html lang=fr`. Localized the one remaining piece — the treemap slider prefix/play ("Année :"/"▶ Lecture"). Commit dc2ee5e.

## 11. Deferred / decisions needed
- **Private `/explore` posting lookup** — KEPT for now (untouched; distinct from the discarded public profession-selector). Confirm keep vs cut. If cut, FilterSpine + its shared components (Select, PixelTiles, DownloadCSV, etc.) can also go.
- **FilterSpine (global filter bar)** — still in the shell on every page but the bridged visuals ignore it (national). Kept because `/explore` uses it. Remove from the layout if `/explore` is cut (or if you want the curated pages filter-free in the chrome too).
- **Dead API endpoints** — `api/routers/read.py` still exposes rank/geography/wages/composition/etc. that the web no longer calls (only `overview`, `meta`, `figure`). Harmless + tested; left in place. Prune later with their `api.ts` methods + types + tests if desired.
- **More time sliders** — only the two treemaps animate today. Choropleths animate cheaply visually but each frame would re-embed the ~300 KB province geojson (payload blow-up) — needs a shared-geometry approach before animating maps. Heatmaps/rankings could animate by year (light) if wanted.
- **Choropleth payload** — the 3 geography choropleths embed the province geojson (~300 KB each, gzip-compressible, cached hourly). Could serve the geometry once as a shared asset.
- **In-figure axis/hover text** stays English (factories bake it); only titles/notes/eyebrows + slider chrome are localized. Deeper localization is a separate factory seam if needed.
- **Pre-existing lint** in `components/explore/PostingDrawer.tsx` (set-state-in-effect) — untouched, out of scope.
- **Local dev:** API on 8531 (8530 was taken); web preview via the `redesign2-web` config added to the **main-repo** `.claude/launch.json` (uncommitted, dev-only); web points at 8531 via gitignored `web/.env.local`.
