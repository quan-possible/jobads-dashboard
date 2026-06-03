# MEMORY

Last updated: 2026-06-02

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
- A follow-up same-day polish loop now also closes the remaining partial-bundle operator rough edge: the app validates the local derived bundle at load time, stops early with a branded ACLMR guidance panel when required parquet files are missing or unreadable, and carries a regression test for that failure mode while the healthy bundle still passes the full suite and build.
- The page is now redeployed through the project’s ngrok path after the latest fix, and the project instruction now makes that deploy step mandatory after any future page/dashboard UI change or page bug fix.
- The current canonical live dashboard URL is `https://3ce3-2001-56a-f068-c900-99a3-5b2a-192-b1e4.ngrok-free.app` on local app port `8520`; future work should reuse that exact live URL whenever the tunnel is still active, and only rotate it when the tunnel has actually been lost.
- Render hosting is now live for this repo on `https://jobads-dashboard.onrender.com`, using a Docker-based free-tier Render web service that deploys from GitHub branch `codex/render-hosting`.
- The repo now has first-class Render deployment assets: the Docker entrypoint honors Render's dynamic `PORT`, and root `render.yaml` defines the web service with `/_stcore/health` as the health check.
- On 2026-06-02, the dashboard gained an `Explore` tab for curated supervisor-facing queries plus a bounded private posting lookup. It uses the existing derived dashboard bundle and intentionally does not expose arbitrary SQL, raw posting downloads, or bulk raw text browsing.
- The recommended private deployment path is now Mac mini plus `/Volumes/ACLMR/jobads-dashboard`, kept beside `/Volumes/ACLMR/jobads-data/main`, with access through Tailscale or an SSH tunnel. See `docs/analyses/private_query_dashboard/runbook.md`.
- A 2026-06-02 Browser-based UI polish pass fixed the Streamlit sidebar collapse/reopen flow, tightened the ACLMR-style filter drawer button states, removed deprecated Plotly width usage, and guarded the private posting lookup against partial or zero-byte lookup indexes.
- The latest local checks for that pass are `PYTHONPATH=src pytest -q` with `25 passed`, local `/_stcore/health` returning `ok`, and in-app Browser interaction through sidebar open/close, filters, Explore, and Data Quality views.
- A low-impact follow-up pass kept the app on the existing 64 MB derived aggregate bundle, avoided upstream refresh/query builds, fixed a desktop scrolled-page drawer trap, restored normal vertical page scrolling while preventing horizontal overflow, and verified sidebar reopen at `1440x1000`, `1024x768`, `768x900`, and `390x844` using the in-app Browser viewport control.
- A final low-impact Browser-only polish pass rebalanced the tab ribbon into clean wrapped grids, hid the default Streamlit tab underline, applied compact occupation/industry labels in the sidebar, verified all tabs plus Explore question switching, and confirmed no horizontal page movement at mobile width.
- The prior canonical ngrok URL was lost; the current live tunnel for local port `8520` is `https://d04f-2001-569-5046-4801-c86f-a223-3a1e-dd7c.ngrok-free.app`.
- A 2026-06-02 data refresh rebuilt the local dashboard bundle from canonical upstream year folders only, excluding backup/sample-like processed directories by tightening the source glob to `20[0-9][0-9]/processed_*.parquet`.
- The refreshed bundle now covers `2016-01-01` through `2026-03-31` from 164 canonical upstream parquet files, with 25,356,735 postings in metadata, monthly overall, and live-source validation.
- The refreshed local app is running on `http://127.0.0.1:8520` in tmux session `jobads-dashboard`; the current live ngrok tunnel is `https://d5e4-162-156-88-90.ngrok-free.app`.
- A 2026-06-02 sidebar follow-up fixed clipped Streamlit dropdown labels by matching the visible select boxes to Streamlit's 64px internal text layer. Browser checks confirmed `All Canada`, `All occupations`, and `All industries` fit inside their boxes, with the old internal-facing wording absent from the live page.
- A later 2026-06-02 sidebar follow-up gave Streamlit's open and close sidebar controls fixed visible hit areas, hid the inactive wrapper in each state, and restored date-range handle labels above the two slider knobs while keeping the lower duplicate tick labels hidden.
- The desktop sidebar now reflows the dashboard when open: at a 1040px viewport the main section moves from full width to `left: 352px` and `width: 682px`, while mobile keeps the overlay-style drawer.
- The date-range control now uses a custom compact header with the selected start/end month pills above a simple slider rail; Streamlit's built-in slider label, thumb values, and tick labels are hidden to avoid cramped duplicate text.
- The dashboard is now also hosted privately on `bruces-mac-mini` from `/Users/brucenguyen/jobads-dashboard`, using Python 3.12 and a copied local derived bundle. The remote app listens on `127.0.0.1:8520`; the current local SSH tunnel listens on `http://127.0.0.1:8521` and forwards to the Mini.
- The Mac Mini did not have `/Volumes/ACLMR` mounted during deployment, so the remote app can serve the copied dashboard bundle but cannot refresh from `../jobads-data/main` until the ACLMR data path is mounted or copied there.
- The public Render website deploy now launches through `jobads-dashboard app --output-root /app/data/derived/labor_market_dashboard_v1`, fixing the old container path issue where Streamlit looked for data under Python's site-package directory.
- While Render remained on the old container, the public-safe website was served through the project ngrok path at `https://d5e4-162-156-88-90.ngrok-free.app`, backed by a temporary aggregate bundle that excludes private `posting_lookup.parquet`.

## Active Focus
- Preserve the standalone project boundary: `jobads-dashboard` owns dashboard implementation, while `jobads-data/main` remains the upstream data source.
- Keep the implementation contract aligned with upstream data caveats, especially `2025` provenance and sparse-field coverage limits.
- Keep the aggregate refresh contract stable so the app continues to load only local derived parquet tables.
- Keep validation strong enough to catch source drift and schema regressions before future handoffs claim the dashboard is complete.
- Keep the hosted Render service aligned with repo state until the deployment branch is merged or the service is repointed to `main`.

## Next Actions
1. Add saved screenshots or inspection artifacts under `docs/analyses/labor_market_dashboard/` when a polished visual handoff is needed.
2. Re-run `jobads-dashboard refresh` after upstream processed data updates land, using only canonical year folders under `../jobads-data/main/data/processed/<year>/`.
3. If future work needs more detailed drill-downs, add richer derived rollups without relaxing the local-only runtime boundary.
4. Use `docs/jobs/archive/2026-03-25-jobads-dashboard-extensive-verification-rerun.md` as the current trust checkpoint for the data/logic surface, and the archived 2026-03-26 redesign job as the UI polish checkpoint.
5. Treat the `10-item` presentation cap plus the compact tab-ribbon/mobile-toggle treatment as the default UI contract unless a future redesign explicitly reopens them.
6. Treat the off-canvas mobile sidebar and hidden chart modebar as part of the default polish contract unless a future interaction redesign reopens those choices.
7. Treat the Streamlit sidebar reopen control as a required interaction check after any CSS change that touches chrome, sidebar, toolbar, app shell selectors, or page overflow. Check it both from the top of the page and after the main page has been scrolled.
8. Merge `codex/render-hosting` or repoint the Render service to `main` after the deployment changes are accepted, so hosting no longer depends on a temporary branch.
9. For supervisor-facing ACLMR access, prefer the private Mac Mini deployment over public Render hosting because the public free service can sleep and should not carry private data. Use the current local tunnel at `http://127.0.0.1:8521`, or recreate it with `ssh -L 8521:127.0.0.1:8520 bruces-mac-mini`.
10. Mount or copy `jobads-data/main` onto the Mac Mini before expecting remote refresh, validation against live upstream, or posting-lookup rebuilds to work there.

## Risks/Blockers
- `../jobads-data/main` 2025 raw fetch provenance remains imperfect, so freshness messaging must remain cautious.
- Several attractive descriptive fields remain sparse or historically unstable, especially wages, remote work, language, and detailed experience.
- The skills aggregate is still one of the slower refresh steps, but it is now bounded as a detailed local aggregate instead of an oversized grouped top-k cube.
- The current app is verified through Streamlit's testing harness and live server checks, but browser automation via the bundled Playwright wrapper is still awkward in this environment.
- The user now prefers the in-app Browser for dashboard UI walkthroughs rather than Playwright, so Browser interaction should be the default visual verification path for this app when feasible.
- For local-polish work, avoid `refresh`, posting-lookup builds, and repeated upstream scans unless explicitly needed; the existing derived dashboard bundle is small enough for app verification, but upstream querying is the part most likely to make the machine lag.
- A fresh full-source `jobads-dashboard validate` pass was started during the 2026-03-27 polishing rerun but did not return within the verification window against the cloud-backed upstream source, so that specific reconciliation check was not used as the blocking gate for the UI-only fix.
- Lower-priority follow-ups remain after sign-off: compensation views still use latest-month medians instead of fuller distribution views, startup is still heavier than the spec ideal, same-dimension filters are still not fully global for the Occupations and Industries tabs, and wheel-installed default paths are still layout-sensitive unless users pass explicit roots.
- The new selector cap intentionally hides some long-tail geography/occupation/industry options from the sidebar; that matches the current request, but it is now a product choice rather than an incidental implementation detail.
- The live Render service currently deploys from `codex/render-hosting`, not `main`, so branch drift would matter until that branch is merged or the Render config is updated.
- The private `Explore` tab is intentionally a first safe query surface. Full raw text, arbitrary SQL, and `ai-labor` research-output ingest still require separate governance and derived-table design before exposure.
- The Mac Mini deployment currently uses a copied derived bundle whose metadata still records the local build path under `/Volumes/ACLMR`; this is acceptable for serving but should be regenerated on the Mini once the upstream data path is present.
- If the public website shows the branded missing-bundle panel, first check the Docker entrypoint and `JOBADS_DASHBOARD_DATA_ROOT`; the expected container data root is `/app/data/derived/labor_market_dashboard_v1`.
- The current ngrok website intentionally omits `posting_lookup.parquet`; the Explore tab can still show aggregate queries, but posting lookup should remain private unless explicitly approved for public exposure.

## Sources
- `docs/analyses/labor_market_dashboard_spec/report.md`
- `README.md`
- `AGENTS.md`
- `memory/2026-03-24.md`
- `memory/2026-03-25.md`
- `data/derived/labor_market_dashboard_v1/metadata.json`
- `streamlit_app.py`
- `docs/analyses/private_query_dashboard/runbook.md`
