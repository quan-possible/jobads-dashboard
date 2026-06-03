# Private Query Dashboard Runbook

## Purpose

Run `jobads-dashboard` as a private ACLMR query dashboard from the Mac mini, with the app and derived dashboard bundle on the ACLMR external drive. The app remains curated: it exposes aggregate queries and a bounded private posting lookup, not arbitrary SQL or bulk raw-text export.

## Recommended Layout

```text
/Volumes/ACLMR/
  jobads-data/
    main/
      data/processed/...
  jobads-dashboard/
    data/derived/labor_market_dashboard_v1/
    src/jobads_dashboard/
```

Keeping `jobads-dashboard` beside `jobads-data/main` preserves the existing source discovery rule for `../jobads-data/main/data/processed`.

## Mirror The Dashboard

From the development Mac, mirror the current dashboard repo onto the external drive:

```bash
rsync -a --delete \
  --exclude '.venv/' \
  --exclude '.tmp/' \
  --exclude 'logs/' \
  --exclude 'output/' \
  "/Users/brucenguyen/Library/CloudStorage/GoogleDrive-aclmr_data@aclmr.ca/My Drive/Projects/Vicinity Data/jobads-dashboard/" \
  "/Volumes/ACLMR/jobads-dashboard/"
```

If the Google Drive source is not mounted locally, use the ACLMR Drive remote instead and keep the destination the same.

## Mac Mini Setup

On the Mac mini:

```bash
cd /Volumes/ACLMR/jobads-dashboard
python3 -m venv .venv
.venv/bin/python -m pip install -e '.[dev]'
```

Refresh after upstream processed data changes:

```bash
.venv/bin/jobads-dashboard refresh \
  --source-root /Volumes/ACLMR/jobads-data/main/data/processed \
  --output-root /Volumes/ACLMR/jobads-dashboard/data/derived/labor_market_dashboard_v1
```

Build or refresh the private posting lookup index without rebuilding every aggregate:

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

Launch privately on the Mac mini:

```bash
.venv/bin/jobads-dashboard app \
  --output-root /Volumes/ACLMR/jobads-dashboard/data/derived/labor_market_dashboard_v1 \
  -- --server.address 127.0.0.1 --server.port 8520 --server.headless true
```

## Supervisor Access

Preferred private browser access:

```bash
ssh -L 8520:127.0.0.1:8520 <mac-mini-host>
```

Then open:

```text
http://127.0.0.1:8520
```

If using Tailscale, keep the app bound to localhost unless a Tailscale-only bind is explicitly configured. Grant access to the Mac mini or dashboard port only.

## Query Surface Rules

- Keep the `Explore` tab curated: filters, aggregate tables, charts, and the private posting lookup only.
- Do not add unrestricted SQL in the supervisor-facing app.
- Do not expose bulk raw posting downloads from the app.
- Posting descriptions should remain bounded excerpts unless a separate raw-text sharing decision is made.
- The default posting lookup is bounded by a recent-month window and row limit. Set `--posting-lookup-limit 0` only for a deliberate full private index.
- Keep refresh-time scans in the CLI; the Streamlit app should read only the local derived bundle.

## Verification

Minimum check after deployment changes:

```bash
PYTHONPATH=src .venv/bin/pytest -q
.venv/bin/jobads-dashboard validate \
  --source-root /Volumes/ACLMR/jobads-data/main/data/processed \
  --output-root /Volumes/ACLMR/jobads-dashboard/data/derived/labor_market_dashboard_v1
curl -fsS http://127.0.0.1:8520/_stcore/health
```
