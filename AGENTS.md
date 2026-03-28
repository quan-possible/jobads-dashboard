# Repository Guidelines

## Required Pre-Read
1. Before substantive work, read `AGENTS.md`, `MEMORY.md`, and the latest `memory/YYYY-MM-DD.md` when present.
2. Treat these files as the high-level contract and context-loading index.
3. Read the matching `docs/jobs/*-ongoing.md` file when the task matches an active dashboard job.
4. Before planning or edits related to the dashboard product, read `docs/analyses/labor_market_dashboard_spec/report.md`.

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

## Scope Guardrails
1. Do not implement dashboard logic inside `jobads-data/main` or `ai_labor`.
2. Do not query the full processed corpus repeatedly at app runtime; precompute aggregates first.
3. Do not treat job ads as direct measures of employment, unemployment, or total vacancies.
4. Keep sparse-field and provenance caveats visible in both planning and implementation.
