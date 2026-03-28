# jobads-dashboard

## Purpose
- Build a standalone interactive dashboard that helps users understand labor-market conditions from Vicinity job-ads data.
- Keep the product economics-driven, descriptive, and independent from both `jobads-data/main` implementation code and `ai_labor` research outputs.

## Getting Started
1. Read `AGENTS.md` for execution rules.
2. Read `MEMORY.md` for current priorities and risks.
3. Read the latest files in `memory/` for recent history and evidence.
4. Read `docs/analyses/labor_market_dashboard_spec/report.md` before planning or implementation.

## Environment

```bash
python -m pip install -e .
```

Optional dev extras:

```bash
python -m pip install -e '.[dev]'
```

## Main Commands

Refresh the local dashboard aggregates from the upstream processed parquet layer:

```bash
jobads-dashboard refresh
```

Validate that the derived package exists and reconciles with metadata totals:

```bash
jobads-dashboard validate
```

Launch the Streamlit app:

```bash
jobads-dashboard app
```

The app reads only from:

- `data/derived/labor_market_dashboard_v1/`

The refresh step reads only from:

- `../jobads-data/main/data/processed/<year>/processed_*.parquet`

## Refresh Contract

The version 1 workflow is intentionally two-step:

1. Build local aggregate tables under `data/derived/labor_market_dashboard_v1/`.
2. Serve the dashboard only from those local aggregates.

This keeps runtime fast and avoids repeated scans over the full upstream processed corpus.

## Verification

The minimum verification loop for implementation work is:

1. `PYTHONPATH=src pytest -q`
2. `jobads-dashboard refresh`
3. `jobads-dashboard validate`
4. `jobads-dashboard app`

`jobads-dashboard validate` is expected to reconcile the derived bundle against the live upstream processed source window, not just against local metadata.

Direct UI verification should inspect the actual Streamlit surface, not just the Python modules.

## Upstream Inputs
- Primary upstream data repo:
  - `../jobads-data/main`
- Canonical source-of-truth input:
  - `../jobads-data/main/data/processed/<year>/processed_*.parquet`
- Upstream schema and pipeline references:
  - `../jobads-data/main/docs/metadata.md`
  - `../jobads-data/main/config/config.yaml`
  - `../jobads-data/main/docs/plans/README.md`

## Project Layout
- `docs/analyses/labor_market_dashboard_spec/`: implementation contract for the dashboard.
- `docs/jobs/`: ongoing and archived job continuity notes.
- `src/jobads_dashboard/`: reusable dashboard implementation code.
- `data/derived/`: project-local aggregated dashboard data products.
- `memory/`: dated project history and evidence-backed updates.

## Documentation Map
- `AGENTS.md`: execution rules and collaboration contract.
- `MEMORY.md`: current objective, active focus, next actions, and blockers.
- `memory/YYYY-MM-DD.md`: dated project history and evidence-backed updates.
- `docs/analyses/labor_market_dashboard_spec/report.md`: canonical implementation contract.
- `docs/analyses/labor_market_dashboard/README.md`: dashboard runbook, screenshots, and operator notes.
- `docs/jobs/`: live continuity notes for longer-running work.

## Current Runtime Surface

- CLI entrypoint: `jobads-dashboard`
- Aggregate builder: `src/jobads_dashboard/dashboard/prepare.py`
- App entrypoint: `src/jobads_dashboard/dashboard/app.py`
- Shared metric helpers: `src/jobads_dashboard/dashboard/metrics.py`
