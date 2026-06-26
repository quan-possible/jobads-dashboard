# Repository Guidelines

## Required Pre-Read
1. Read `AGENTS.md`.
2. Read any skill, workflow, profile, or prompt restriction implicated by the prompt.
3. Read `MEMORY.md` and `memory/YYYY-MM-DD.md` only if allowed.
4. Read everything else only after that.
5. Read the matching `docs/jobs/*-ongoing.md` file when the task matches an active dashboard job.
6. Before planning or edits related to the dashboard product, read `docs/analyses/labor_market_dashboard_spec/report.md`.

## State Model
1. `AGENTS.md` defines behavior and policy only.
2. Matching `docs/jobs/*-ongoing.md` files are the canonical live continuity surface for in-progress work.
3. `MEMORY.md` and `memory/YYYY-MM-DD.md` are the canonical durable and daily memory layers.
4. `docs/analyses/<slug>/` is the canonical home for durable dashboard specs, screenshots, and writeups.
5. Reusable implementation belongs in `src/jobads_dashboard/`.
6. Temporary artifacts belong in `tmp/` once that directory exists.

## Critical Must-Read
- `docs/analyses/labor_market_dashboard_spec/report.md`: canonical implementation contract for the dashboard.
- `README.md`: project purpose, upstream dependencies, and doc map.

## Upstream Dependencies
1. Treat `../jobads-data/main/` as the canonical upstream data source for version 1.
2. Use `../jobads-data/main/data/processed/<year>/processed_*.parquet` as the primary source-of-truth data surface unless the spec is explicitly revised.
3. Use `../jobads-data/main/docs/metadata.md`, `../jobads-data/main/config/config.yaml`, and `../jobads-data/main/docs/plans/README.md` as the upstream schema and pipeline contract.
4. Do not make the dashboard depend on `ai_labor`.

## Working Rules
1. Keep the dashboard project independent: all implementation should land in this repo, not in `jobads-data/main` or `ai_labor`.
2. Keep changes targeted and readable; prefer existing modules over broad rewrites.
3. Build the aggregate layer first, then the UI layer.
4. Store project-local derived dashboard data in this repo rather than writing aggregates back into the upstream data repo.
5. Update `MEMORY.md` and the relevant `memory/YYYY-MM-DD.md` file after material project changes.
6. After any page/dashboard UI change or page bug fix, deploy the updated page through the project ngrok path before sign-off.
7. Treat `http://127.0.0.1:8520` plus the current live ngrok URL as the canonical deployment target for this repo. Reuse that exact live URL whenever the existing tunnel is still active instead of creating a fresh tunnel.
8. If the canonical ngrok tunnel is no longer active and the URL must rotate, bring the page back up on port `8520`, create or reconnect the tunnel, and explicitly report the new live URL in the handoff instead of implying the old URL still works.
9. The public Mac Mini dashboard password is stored in macOS Keychain, not in repo files. When the password is needed, retrieve it with `security find-generic-password -a jobads-dashboard-public -s jobads-dashboard-public-password -w`. Do not commit the plaintext password or password hash.

## Scope Guardrails
1. Do not implement dashboard logic inside `jobads-data/main` or `ai_labor`.
2. Do not query the full processed corpus repeatedly at app runtime; precompute aggregates first.
3. Do not treat job ads as direct measures of employment, unemployment, or total vacancies.
4. Keep sparse-field and provenance caveats visible in both planning and implementation.
5. Cap every chart at 10 distinct categories/items **for the public view** — counting bars, treemap tiles, pie slices, heatmap rows or columns, line-series legend entries, labelled scatter points, and choropleth fill values. This cap is required by the Vicinity Jobs API terms of service, so it is the default for every unauthenticated viewer and must not be removed from the public path. When a dimension has more, keep the numbers honest rather than dropping categories silently: for a chart that shows how a whole splits up, fold the long tail into a residual "Other" group (or a meaningful grouping such as merging the four Atlantic provinces into "Atlantic Canada") so the parts still sum to the total; a chart that is explicitly a "top N" may simply show the top 10. Time axes are exempt — for example, the seasonality heatmap's twelve months stay. Reuse the viz layer's existing capping helpers instead of re-implementing the logic per chart.

   **Exemption — authenticated team view.** A valid team session (the Explore password) lifts the cap site-wide: logged-in viewers see full, uncapped detail on every chart. This is driven per request by the `jobads_dashboard.viz._capctx.UNCAPPED` contextvar — `api.figures.build(..., uncapped=True)` sets it, and the cap helpers (`cap_other`, `cap_columns`, `category_cap`, the province-region folds) no-op when it is set. So a new capped site must read the cap through those helpers, never hard-code a fixed 10, and the server must only serve the uncapped figure to a verified session (`uncapped = full AND authed`) — the `full=1` request flag alone must never bypass the cap.
