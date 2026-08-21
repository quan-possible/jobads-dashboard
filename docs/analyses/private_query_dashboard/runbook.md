# Private Dashboard Runbook

## Purpose

Run the canonical Next.js/FastAPI dashboard privately from the Mac mini. The
product exposes curated aggregate views and a bounded authenticated posting
lookup; it does not provide arbitrary SQL, bulk raw-text export, or another
dashboard implementation.

## Canonical Layout

```text
/Volumes/ACLMR/
  jobads-data/main/data/processed/...
  jobads-dashboard/
    api/
    web/
    src/jobads_dashboard/
    data/derived/labor_market_dashboard_v1/
```

Keeping the two repositories beside each other preserves the default source
discovery rule for `../jobads-data/main/data/processed`.

## Install

```bash
cd /Volumes/ACLMR/jobads-dashboard
python3 -m venv .venv
.venv/bin/python -m pip install -e '.[api,dev]'
npm --prefix web ci
```

Production authentication should use
`JOBADS_DASHBOARD_PASSWORD_HASH`; local development may use
`JOBADS_DASHBOARD_PASSWORD`. Set `JOBADS_API_SESSION_SECRET` to a stable value
of at least 32 characters when sessions must survive process restarts. Keep all
credentials outside Git.

## Refresh Data

Refresh after the upstream processed layer changes:

```bash
.venv/bin/jobads-dashboard refresh \
  --source-root /Volumes/ACLMR/jobads-data/main/data/processed \
  --output-root /Volumes/ACLMR/jobads-dashboard/data/derived/labor_market_dashboard_v1
```

Build or refresh the bounded private posting index separately:

```bash
.venv/bin/jobads-dashboard posting-lookup \
  --source-root /Volumes/ACLMR/jobads-data/main/data/processed \
  --output-root /Volumes/ACLMR/jobads-dashboard/data/derived/labor_market_dashboard_v1 \
  --posting-lookup-recent-months 24 \
  --posting-lookup-limit 100000
```

Validate before sharing:

```bash
.venv/bin/jobads-dashboard validate \
  --source-root /Volumes/ACLMR/jobads-data/main/data/processed \
  --output-root /Volumes/ACLMR/jobads-dashboard/data/derived/labor_market_dashboard_v1
```

## Build And Launch

Build the web application:

```bash
npm --prefix web run build
```

Run the two supported processes from the repository root:

```bash
# Terminal 1
.venv/bin/uvicorn api.main:app \
  --host 127.0.0.1 \
  --port 8530 \
  --no-proxy-headers

# Terminal 2
JOBADS_API_ORIGIN=http://127.0.0.1:8530 \
NEXT_PUBLIC_API_BASE=http://127.0.0.1:8530 \
npm --prefix web run start -- --hostname 127.0.0.1 --port 8522
```

The Next.js server is the browser surface and proxies `/api/*` to FastAPI.
FastAPI must remain bound to localhost unless a separately reviewed network
boundary is configured.

## Supervisor Access

Forward the web port over SSH:

```bash
ssh -L 8522:127.0.0.1:8522 <mac-mini-host>
```

Then open `http://127.0.0.1:8522`. Keep the application bound to localhost when
using SSH or Tailscale-mediated access.

## Query And Access Rules

- Keep `/explore` curated and authenticated.
- Do not add unrestricted SQL or bulk posting downloads.
- Keep posting descriptions bounded unless a separate sharing decision is made.
- Set `--posting-lookup-limit 0` only for a deliberate private full index.
- Keep all full-corpus scans in the CLI refresh path.
- Preserve the server rule `uncapped = full AND authenticated`.
- Keep authenticated and uncapped responses private and uncached.

## Verification

After deployment changes, run:

```bash
PYTHONPATH=src .venv/bin/pytest -q
npm --prefix web run build
.venv/bin/jobads-dashboard validate \
  --source-root /Volumes/ACLMR/jobads-data/main/data/processed \
  --output-root /Volumes/ACLMR/jobads-dashboard/data/derived/labor_market_dashboard_v1
curl -fsS http://127.0.0.1:8530/health
curl -fsS http://127.0.0.1:8522/healthz
curl -fsS http://127.0.0.1:8522/api/auth
```

Inspect the actual English and French web routes, the Explore gate, public
category caps, private cache headers, and relevant desktop/mobile widths before
sign-off.
