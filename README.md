# jobads-dashboard

## Purpose
- Build a standalone interactive dashboard that helps users understand labor-market conditions from Vicinity job-ads data.
- Keep the product economics-driven, descriptive, and independent from both `jobads-data/main` implementation code and `ai_labor` research outputs.

## Getting Started
1. Read `AGENTS.md` for execution rules.
2. Read `STATUS.md` for current priorities, risks, and next actions.
3. Read `MEMORY.md` for bounded historical orientation.
4. Read the relevant active job and canonical document. Open dated files in `memory/` only when more historical detail is needed.
5. Read `docs/analyses/labor_market_dashboard_spec/report.md` before dashboard planning or implementation.

## Environment

```bash
python -m pip install -e .
```

Optional dev extras:

```bash
python -m pip install -e '.[dev]'
```

## Architecture

The dashboard is a two-process web app:

- `web/` — the public UI, a **Next.js** app (server-rendered pages + Plotly figures).
- `api/` — a **FastAPI** service that serves typed JSON over the derived
  aggregates, plus a figure bridge that renders the Python Plotly factories in
  `src/jobads_dashboard/viz/` to figure JSON for the web app.

The browser calls `/api/*` on the web server, which proxies to FastAPI (Next
`rewrites()`); server-side rendering fetches FastAPI directly. The Python CLI
(`jobads-dashboard`) only builds and validates the derived data the API reads.

## Main Commands

Refresh the local dashboard aggregates from the upstream processed parquet layer:

```bash
jobads-dashboard refresh
```

Validate that the derived package exists and reconciles with metadata totals:

```bash
jobads-dashboard validate
```

Run the app locally (two processes):

```bash
# Terminal 1 — the API (reads only derived parquet)
python -m pip install -e '.[api]'
uvicorn api.main:app --port 8530 --no-proxy-headers

# Terminal 2 — the web UI (proxies /api/* to the API above)
npm --prefix web install
npm --prefix web run dev
```

## Private Mac Mini Deployment

For ACLMR-private supervisor access, use the existing dashboard app rather than a second query system:

1. Mirror this repo to `/Volumes/ACLMR/jobads-dashboard`.
2. Keep `/Volumes/ACLMR/jobads-dashboard` beside `/Volumes/ACLMR/jobads-data/main`.
3. Run the app on the Mac mini (the FastAPI service plus the Next.js web server, or the single Docker image below).
4. Share access through Tailscale or an SSH tunnel, not a public URL.

The supervisor-facing `Explore` tab exposes curated aggregate queries plus a private posting lookup built from a local `posting_lookup.parquet` index. It does not provide arbitrary SQL, raw posting downloads, or bulk raw text browsing.

Detailed runbook:

- `docs/analyses/private_query_dashboard/runbook.md`

## Public Password Gate

The private `Explore` posting lookup is gated by the API. Configure the password in the service environment (see `api/auth.py`):

- `JOBADS_DASHBOARD_PASSWORD_HASH=<pbkdf2_sha256 hash>` (production), or
- `JOBADS_DASHBOARD_PASSWORD=<plain>` (local dev only).

Do not commit the password or the hash into the repository. macOS Keychain is
the intended password source on the Mac Mini. The documented lookup still
returns exit 44; a pre-existing mode-600 local source matched the installed
production hash for the 2026-08-12 deployment verification, but the Keychain
owner should be restored before any password-bearing handoff.

## Render Hosting

This repo deploys as a single Docker-based Render web service. The image runs
both processes: FastAPI on an internal port and the Next.js standalone server on
Render's `$PORT` (see `Dockerfile` and `docker-entrypoint.sh`).

Render-specific files:

- `Dockerfile`
- `docker-entrypoint.sh`
- `render.yaml`

Local preflight:

```bash
python -m pip install -e '.[api,dev]'
PYTHONPATH=src pytest -q          # Python + API tests
npm --prefix web run build        # web build (also type-checks/lints)
```

Render deployment options:

1. Blueprint flow:

```bash
render login
render blueprints validate render.yaml
```

Then create or sync the service from the Render dashboard using the repo's root-level `render.yaml`.

2. Direct CLI flow:

```bash
render login
render services create \
  --type web_service \
  --runtime docker \
  --name jobads-dashboard \
  --plan free \
  --repo https://github.com/quan-possible/jobads-dashboard \
  --branch main \
  --health-check-path /healthz \
  --output json
```

Notes:

- The container honors Render's dynamic `PORT` environment variable.
- The default blueprint uses the free plan, which can idle out after inactivity.
- Upgrading the plan on Render avoids free-tier sleep behavior.

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

1. `PYTHONPATH=src pytest -q` (Python + API tests)
2. `npm --prefix web run build` (web build, type-check, lint)
3. `jobads-dashboard validate`

`jobads-dashboard validate` is expected to reconcile the derived bundle against the live upstream processed source window, not just against local metadata.

Direct UI verification should inspect the actual Next.js UI in the browser, not just the Python modules.

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
- `docs/analyses/labor_market_dashboard_spec/`: product and metric contract plus the original version 1 implementation baseline.
- `docs/jobs/active/`: unfinished job continuity.
- `docs/jobs/done/`: completed job records and verification evidence.
- `docs/jobs/archive/`: legacy job records kept for recovery.
- `src/jobads_dashboard/`: reusable dashboard implementation code.
- `data/derived/`: project-local aggregated dashboard data products.
- `memory/`: chronological project-history source records.
- `tmp/`: disposable or reproducible scratch.
- `archive/`: recovery material.

## Documentation Map
- `AGENTS.md`: project-specific execution rules, boundaries, and routing.
- `STATUS.md`: current position, priorities, next actions, risks, and owners.
- `MEMORY.md`: bounded, progressively condensed historical index.
- `memory/YYYY-MM-DD.md`: chronological source records for history and reconstruction.
- `docs/analyses/labor_market_dashboard_spec/report.md`: canonical product and metric contract and original version 1 baseline.
- `docs/analyses/labor_market_dashboard/README.md`: dashboard runbook, screenshots, and operator notes.
- `docs/jobs/active/`, `docs/jobs/done/`, `docs/jobs/archive/`: unfinished, completed, and legacy job records. Loose `docs/jobs/*-ongoing.md` files are pre-migration records awaiting reconciliation.

## Current Runtime Surface

- Data CLI entrypoint: `jobads-dashboard` (refresh / validate / posting-lookup)
- Aggregate builder: `src/jobads_dashboard/dashboard/prepare.py`
- Web UI: `web/` (Next.js)
- API + figure bridge: `api/` (FastAPI), figures from `src/jobads_dashboard/viz/`
- Shared loaders/constants/metrics: `src/jobads_dashboard/dashboard/{data,constants,metrics}.py`
