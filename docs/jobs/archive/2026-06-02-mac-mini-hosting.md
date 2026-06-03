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
