# Repository Guidelines

## Required Startup
1. Read this file and any skill or workflow implicated by the request.
2. Read `STATUS.md` for the live project position.
3. Read `MEMORY.md` for bounded historical orientation.
4. Read the relevant canonical owner and any overlapping job under `docs/jobs/active/`.
5. Open `memory/YYYY-MM-DD.md` only when historical detail, verification, or reconstruction requires it.
6. Before planning or editing the dashboard product, read `docs/analyses/labor_market_dashboard_spec/report.md`.

## Documentation And State Owners
1. `AGENTS.md` owns durable project-specific behavior, boundaries, and document routing.
2. `README.md` owns the human-facing purpose, setup, architecture, and documentation map.
3. `STATUS.md` owns the compact live position, priorities, next actions, risks, and current owners.
4. `MEMORY.md` is the bounded, progressively condensed historical index; `memory/YYYY-MM-DD.md` is its chronological source layer.
5. `docs/analyses/labor_market_dashboard_spec/report.md` owns the product and metric contract and the original version 1 implementation baseline. `README.md` describes the current runtime architecture.
6. `docs/analyses/<slug>/` owns durable specifications, investigations, screenshots, and operator writeups.
7. `docs/jobs/active/` owns unfinished continuity, `docs/jobs/done/` owns completed work and its evidence, and `docs/jobs/archive/` preserves legacy records. Loose `docs/jobs/*-ongoing.md` files are pre-migration continuity to preserve until reconciled; do not create new loose jobs.
8. Reusable implementation belongs in `src/jobads_dashboard/`; project-local derived data belongs in `data/derived/`.
9. `tmp/` is disposable scratch and `archive/` is recovery material.

## Critical Must-Read
- `docs/analyses/labor_market_dashboard_spec/report.md`: canonical product and metric contract and original version 1 implementation baseline.
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
5. Use the project memory workflow after material changes: update the narrowest canonical owner, today's dated record, `STATUS.md` when live state changed, the overlapping job when continuity changed, and `MEMORY.md` only for lasting historical recall.
6. After any page/dashboard UI change or page bug fix, rebuild and deploy the updated Next.js/FastAPI page through the project's public path before sign-off.
7. Treat FastAPI on `http://127.0.0.1:8530`, Next.js on `http://127.0.0.1:8522`, and the current Cloudflare quick tunnel to port `8522` as the canonical public topology. Reuse healthy services and the active tunnel instead of creating a parallel deployment.
8. Recover the current quick-tunnel hostname from `/Users/brucenguyen/jobads-dashboard-logs/cloudflared-launchd.err.log` and verify it live. If the services or tunnel must restart and the hostname rotates, report the verified replacement explicitly instead of implying that an older URL still works.
9. macOS Keychain is the intended owner of the public dashboard password, never a repository file. When the password is needed, try `security find-generic-password -a jobads-dashboard-public -s jobads-dashboard-public-password -w`; if the entry is unavailable, stop the password-bearing handoff until the user restores or confirms the credential source. Do not copy a secret from process configuration into the repo, and do not commit the plaintext password or password hash.

## Scope Guardrails
1. Do not implement dashboard logic inside `jobads-data/main` or `ai_labor`.
2. Do not query the full processed corpus repeatedly at app runtime; precompute aggregates first.
3. Do not treat job ads as direct measures of employment, unemployment, or total vacancies.
4. Keep sparse-field and provenance caveats visible in both planning and implementation.
5. Cap every chart at 10 distinct categories/items **for the public view** — counting bars, treemap tiles, pie slices, heatmap rows or columns, line-series legend entries, labelled scatter points, and choropleth fill values. This cap is required by the Vicinity Jobs API terms of service, so it is the default for every unauthenticated viewer and must not be removed from the public path. When a dimension has more, keep the numbers honest rather than dropping categories silently: for a chart that shows how a whole splits up, fold the long tail into a residual "Other" group (or a meaningful grouping such as merging the four Atlantic provinces into "Atlantic Canada") so the parts still sum to the total; a chart that is explicitly a "top N" may simply show the top 10. Time axes are exempt — for example, the seasonality heatmap's twelve months stay. Reuse the viz layer's existing capping helpers instead of re-implementing the logic per chart.

   **Exemption — authenticated team view.** A valid team session (the Explore password) lifts the cap site-wide: logged-in viewers see full, uncapped detail on every chart. This is driven per request by the `jobads_dashboard.viz._capctx.UNCAPPED` contextvar — `api.figures.build(..., uncapped=True)` sets it, and the cap helpers (`cap_other`, `cap_columns`, `category_cap`, the province-region folds) no-op when it is set. So a new capped site must read the cap through those helpers, never hard-code a fixed 10, and the server must only serve the uncapped figure to a verified session (`uncapped = full AND authed`) — the `full=1` request flag alone must never bypass the cap.
