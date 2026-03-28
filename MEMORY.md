# MEMORY

Last updated: 2026-03-27

## Objective
- Keep `jobads-dashboard` as the standalone implementation home for the labor-market dashboard.

## Current State
- The standalone dashboard implementation now exists in this repo with package metadata, a CLI, an aggregate refresh pipeline, and a Streamlit app.
- The canonical dashboard specification remains at `docs/analyses/labor_market_dashboard_spec/report.md`, and the implementation now follows it with local derived aggregates under `data/derived/labor_market_dashboard_v1/`.
- Upstream source data remains in `../jobads-data/main`, but runtime reads only the local aggregate package after refresh.
- `projects.json` in the ACLMR workspace includes `jobads_dashboard`, so this project is part of the local managed scope.
- The first 2026-03-25 verification/remediation pass tightened the CLI, strengthened validation against the live upstream source, fixed industry-denominator handling, added industry-aware skills aggregation, rebuilt the derived package, and expanded the app closer to the written spec.
- A second same-day `extensive-verification` rerun then completed the full isolated-copy workflow properly and reached sign-off after three waves: validator false-greens now fail, invalid `validate` exits nonzero, province-sensitive views honor filters, rerun duplicate Plotly IDs are gone, top-group share math uses full denominators, broad NOC parsing no longer misclassifies two-digit rows as unknown, and the local derived bundle was rebuilt from upstream with those fixes.
- A later same-day verification follow-up fixed the newly reported Streamlit/table crash and found two more trust issues: the app no longer passes `width=\"stretch\"` to `st.dataframe`, the CLI now validates against a live/discovered source root instead of stale copied metadata paths, and `jobads-dashboard app` now launches from a packaged wrapper while honoring explicit `--output-root`.
- The live ACLMR redesign surface now also enforces a shared `10-item` presentation cap across selector dropdowns, ranked charts, and capped tables: the app keeps detailed derived data locally, but user-visible lists now go through one `MAX_LIST_ITEMS = 10` contract in the Streamlit layer.
- The selector contract is now intentionally narrow: each sidebar dropdown keeps the `All ...` option plus the top 9 real categories by posting volume, rather than exposing every long-tail category in alphabetical order.
- The ACLMR polish loop is now also closed on the live app surface: deprecated Streamlit width usage was removed, the shell/chrome masking was tightened, the tab ribbon was rebalanced for desktop plus mobile, and the Skills tab no longer depends on nonexistent `All ...` skill aggregates.
- The current app/test surface reflects that cap-and-polish contract end to end: CLI defaults for `--top-markets-per-province` and `--skills-top-k` are `10`, the focused surface suite passes with `7` tests green against the local mirror, and a final inspection subagent found no meaningful remaining problems in its checklist (default Skills state, mobile Streamlit chrome leak, tab-ribbon finish).
- A same-day polishing-focused extensive-verification rerun on the live repo found and fixed one remaining scoped-surface bug: the Compensation tab's wage-by-occupation panel had been wired to a national-only wage table, so province-filtered runs could show a false empty state. The app now sources that panel from the filtered wage cube, excludes synthetic occupation groups, and carries a regression test for the province-scoped case.
- A later same-day single-lane polishing rerun tightened the remaining presentation surface too: the collapsed mobile sidebar no longer leaves a large dead layout region before the main tabs/content, the expanded mobile sidebar behaves like a true overlay drawer, the left-rail controls now use ACLMR-style borders/accents instead of raw Streamlit defaults, and Plotly modebar chrome is hidden so chart titles no longer get visually crowded on phone.

## Active Focus
- Preserve the standalone project boundary: `jobads-dashboard` owns dashboard implementation, while `jobads-data/main` remains the upstream data source.
- Keep the implementation contract aligned with upstream data caveats, especially `2025` provenance and sparse-field coverage limits.
- Keep the aggregate refresh contract stable so the app continues to load only local derived parquet tables.
- Keep validation strong enough to catch source drift and schema regressions before future handoffs claim the dashboard is complete.

## Next Actions
1. Add saved screenshots or inspection artifacts under `docs/analyses/labor_market_dashboard/` when a polished visual handoff is needed.
2. Re-run `jobads-dashboard refresh` after upstream processed data updates land.
3. If future work needs more detailed drill-downs, add richer derived rollups without relaxing the local-only runtime boundary.
4. Use `docs/jobs/archive/2026-03-25-jobads-dashboard-extensive-verification-rerun.md` as the current trust checkpoint for the data/logic surface, and the archived 2026-03-26 redesign job as the UI polish checkpoint.
5. Treat the `10-item` presentation cap plus the compact tab-ribbon/mobile-toggle treatment as the default UI contract unless a future redesign explicitly reopens them.
6. Treat the off-canvas mobile sidebar and hidden chart modebar as part of the default polish contract unless a future interaction redesign reopens those choices.

## Risks/Blockers
- `../jobads-data/main` 2025 raw fetch provenance remains imperfect, so freshness messaging must remain cautious.
- Several attractive descriptive fields remain sparse or historically unstable, especially wages, remote work, language, and detailed experience.
- The skills aggregate is still one of the slower refresh steps, but it is now bounded as a detailed local aggregate instead of an oversized grouped top-k cube.
- The current app is verified through Streamlit's testing harness and live server checks, but browser automation via the bundled Playwright wrapper is still awkward in this environment.
- The bundled Playwright wrapper is still not the reliable browser path in this environment, so direct Python Playwright or `npx playwright` remains the practical UI verification route.
- A fresh full-source `jobads-dashboard validate` pass was started during the 2026-03-27 polishing rerun but did not return within the verification window against the cloud-backed upstream source, so that specific reconciliation check was not used as the blocking gate for the UI-only fix.
- Lower-priority follow-ups remain after sign-off: compensation views still use latest-month medians instead of fuller distribution views, partial-bundle failures are still not surfaced as friendly UI errors, startup is still heavier than the spec ideal, same-dimension filters are still not fully global for the Occupations and Industries tabs, and wheel-installed default paths are still layout-sensitive unless users pass explicit roots.
- The new selector cap intentionally hides some long-tail geography/occupation/industry options from the sidebar; that matches the current request, but it is now a product choice rather than an incidental implementation detail.

## Sources
- `docs/analyses/labor_market_dashboard_spec/report.md`
- `README.md`
- `AGENTS.md`
- `memory/2026-03-24.md`
- `memory/2026-03-25.md`
- `data/derived/labor_market_dashboard_v1/metadata.json`
- `streamlit_app.py`
