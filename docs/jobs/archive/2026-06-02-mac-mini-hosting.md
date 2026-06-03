# Mac Mini dashboard hosting

## Goal

Copy the current `jobads-dashboard` working tree to `bruces-mac-mini` and host the Streamlit dashboard there on port `8520`.

## Result

- Mirrored local source `/Volumes/ACLMR/jobads-dashboard` to `bruces-mac-mini:/Users/brucenguyen/jobads-dashboard/`.
- Installed the remote environment with `/usr/local/bin/python3.12` and `.venv/bin/python -m pip install -e '.[dev]'`.
- Launched the remote app on `127.0.0.1:8520` with:

```bash
.venv/bin/jobads-dashboard app \
  --output-root /Users/brucenguyen/jobads-dashboard/data/derived/labor_market_dashboard_v1 \
  -- --server.address 127.0.0.1 --server.port 8520 --server.headless true
```

- Opened a local SSH tunnel on `127.0.0.1:8521`.

## Live State

- Remote app PID: `43762`
- Remote Streamlit listener PID: `43763`
- Remote app log: `/Users/brucenguyen/jobads-dashboard-logs/app-20260602-204800.log`
- Local tunnel PID: `91741`
- Remote URL from the Mini: `http://127.0.0.1:8520`
- Local tunneled URL: `http://127.0.0.1:8521`

## Verification

- Remote focused tests: `PYTHONPATH=src .venv/bin/pytest -q tests/test_app_surface.py tests/test_posting_lookup.py` -> `13 passed`.
- Remote health: `curl -fsS http://127.0.0.1:8520/_stcore/health` -> `ok`.
- Local tunnel health: `curl -fsS http://127.0.0.1:8521/_stcore/health` -> `ok`.
- Remote root page and local tunneled root page both returned HTTP `200`.

## Caveat

`/Volumes/ACLMR` was not mounted on the Mac Mini during deployment. The remote app serves the copied derived bundle, including `posting_lookup.parquet`, but remote refresh, live-source validation, and lookup rebuilds need `jobads-data/main` or the ACLMR drive to be mounted or copied onto the Mini.

## Persistent Public Website

The public website was later moved onto the Mac Mini with user LaunchAgents so it survives the Codex session closing.

- Public-safe data root: `/Users/brucenguyen/jobads-dashboard-public-data/labor_market_dashboard_v1`
- Public-safe app port on the Mini: `127.0.0.1:8522`
- Public ngrok URL: `https://047e-2001-56a-f068-c900-dc77-45fd-2bfb-31da.ngrok-free.app`
- Private posting lookup is excluded from the public-safe data root.

LaunchAgent labels:

- `com.aclmr.jobads-dashboard-public`
- `com.aclmr.jobads-dashboard-ngrok`
- `com.aclmr.jobads-dashboard-caffeinate`

Logs:

- `/Users/brucenguyen/jobads-dashboard-logs/public-launchd.out.log`
- `/Users/brucenguyen/jobads-dashboard-logs/public-launchd.err.log`
- `/Users/brucenguyen/jobads-dashboard-logs/ngrok-launchd.out.log`
- `/Users/brucenguyen/jobads-dashboard-logs/ngrok-launchd.err.log`
- `/Users/brucenguyen/jobads-dashboard-logs/caffeinate-launchd.out.log`
- `/Users/brucenguyen/jobads-dashboard-logs/caffeinate-launchd.err.log`

Health checks:

```bash
ssh bruces-mac-mini 'curl -fsS http://127.0.0.1:8522/_stcore/health'
ssh bruces-mac-mini 'curl -fsS http://127.0.0.1:4040/api/tunnels'
```

Stop commands:

```bash
ssh bruces-mac-mini 'uid=$(id -u); launchctl bootout gui/$uid ~/Library/LaunchAgents/com.aclmr.jobads-dashboard-ngrok.plist'
ssh bruces-mac-mini 'uid=$(id -u); launchctl bootout gui/$uid ~/Library/LaunchAgents/com.aclmr.jobads-dashboard-public.plist'
ssh bruces-mac-mini 'uid=$(id -u); launchctl bootout gui/$uid ~/Library/LaunchAgents/com.aclmr.jobads-dashboard-caffeinate.plist'
```

Restart commands:

```bash
ssh bruces-mac-mini 'uid=$(id -u); launchctl bootstrap gui/$uid ~/Library/LaunchAgents/com.aclmr.jobads-dashboard-public.plist'
ssh bruces-mac-mini 'uid=$(id -u); launchctl bootstrap gui/$uid ~/Library/LaunchAgents/com.aclmr.jobads-dashboard-ngrok.plist'
ssh bruces-mac-mini 'uid=$(id -u); launchctl bootstrap gui/$uid ~/Library/LaunchAgents/com.aclmr.jobads-dashboard-caffeinate.plist'
```

Verification:

- Mini app health on `127.0.0.1:8522` returned `ok`.
- Mini ngrok API returned the public URL above.
- Browser verification through the ngrok URL showed the real dashboard content, including `25,356,735` postings and latest month `2026-03`, with no missing-bundle error.
