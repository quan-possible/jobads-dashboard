# Private Query Dashboard Deployment

## Goal

Make `jobads-dashboard` the private query interface for ACLMR job-ads data, hosted from the Mac mini/external-drive setup rather than as a public data surface.

## Scope

- Keep implementation in `jobads-dashboard`.
- Keep `jobads-data/main` as the upstream processed-data source.
- Keep `ai-labor` outputs as future ingest/export inputs, not direct app dependencies.
- Add supervisor-friendly curated querying without arbitrary SQL or raw posting exposure.
- Mirror the runnable repo to `/Volumes/ACLMR/jobads-dashboard` for Mac mini deployment.

## Plan

1. Add an aggregate-only `Explore` tab to the Streamlit app.
2. Add a private Mac mini deployment runbook.
3. Mirror the dashboard repo to `/Volumes/ACLMR/jobads-dashboard`.
4. Run focused tests and a local app check.
5. Archive this note after closeout unless concrete deployment work remains.

## Status

- Completed and ready to archive.

## Outcome

- Added the `Explore` tab to `src/jobads_dashboard/dashboard/app.py` with curated aggregate queries and a bounded private posting lookup.
- Added `docs/analyses/private_query_dashboard/runbook.md`.
- Mirrored the repo to `/Volumes/ACLMR/jobads-dashboard`.
- Created a fresh virtual environment in the external-drive mirror and installed the package.
- Launched the mirrored app on `http://127.0.0.1:8520`.

## Verification

- `.venv/bin/python -m py_compile src/jobads_dashboard/dashboard/app.py tests/test_app_surface.py`
- `PYTHONPATH=src .venv/bin/pytest -q tests/test_refresh_contract.py tests/test_cli.py` from `/Volumes/ACLMR/jobads-dashboard` -> `10 passed`
- `curl -fsS http://127.0.0.1:8520/_stcore/health` -> `ok`
- Browser inspection on `http://127.0.0.1:8520` confirmed the `Explore` tab, aggregate-only/no-arbitrary-SQL boundary text, query selector, and formatted month/postings result table.
- Follow-up posting lookup work added `posting_lookup.parquet` support, `jobads-dashboard posting-lookup`, and a specific-posting branch in the `Explore` tab.

## Notes

- Full Streamlit `AppTest` runs against the Google Drive-backed source folder were stopped because they did not return promptly. The deployment mirror passed fast contract checks and live Browser verification instead.
- The mirror branch status showed an existing `AGENTS.md` modification unrelated to this task; it was left untouched.
