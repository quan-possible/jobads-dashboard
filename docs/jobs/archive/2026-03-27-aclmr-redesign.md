## ACLMR Dashboard Redesign Ongoing

- date: 2026-03-26
- codex_session_id: unavailable
- codex_session_ids:
  - unavailable
- thread_id: 019d2b7e-67af-7520-bc1b-78d688d711eb
- scope: ACLMR `jobads-dashboard` visual redesign

## Objective

Redesign the `jobads-dashboard` UI so it follows the ACLMR design language closely while still working as a usable data dashboard.

## Constraints

- Preserve the dashboard's operational clarity and existing data workflow.
- Apply the ACLMR visual system without turning the app into a marketing landing page.
- Use the `aclmr-design-language` skill and `frontend-skill` as the design contract.
- Re-verify the app with user-facing checks after edits.

## Plan

1. Audit the existing dashboard layout, CSS injection path, and test expectations.
2. Rework the Streamlit shell, section hierarchy, metrics, filters, and charts to fit the ACLMR brand rhythm.
3. Verify with tests plus rendered browser screenshots on desktop and mobile.

## Status

- Completed: ACLMR-branded shell, sidebar, hero, section rhythm, tab styling, metric card styling, and footer note implemented in the Streamlit app.
- Completed: Plotly palette and visual theme tokens updated to match the ACLMR navy-teal-sand-orange system.
- Completed: Requirements tab now applies scoped selector filters to `monthly_skills_topk` before summarizing skills, which fixes an over-broad aggregation path and reduces warm-state render cost.
- Completed: User-visible item lists now follow a shared `10-item` contract across selector dropdowns, ranked chart series/bars, and capped tables.
- Completed: CLI defaults for `--top-markets-per-province` and `--skills-top-k` now align to the same `10-item` rule.
- Completed: Follow-up polish loop added stronger Streamlit chrome masking, widened the hero callout treatment, tightened the tab ribbon, and replaced deprecated `use_container_width` usage in the app layer with `width="stretch"` helpers.
- Completed: Default Skills rendering no longer depends on nonexistent `All ...` rows in `monthly_skills_topk`; the tab now treats unselected scopes as wildcards before aggregating skills.
- Completed: Final inspector-driven polish loop closed cleanly. The last dedicated inspection subagent reported no meaningful remaining problems in the agreed checklist: default Skills empty state, visible mobile Streamlit chrome leak, and materially unfinished tab ribbon.
- Verified: `python3 -m py_compile src/jobads_dashboard/dashboard/app.py src/jobads_dashboard/dashboard/constants.py`
- Verified: `JOBADS_DASHBOARD_DATA_ROOT=/tmp/jobads-dashboard-data .venv/bin/pytest -q tests/test_app_surface.py`
- Verified: `JOBADS_DASHBOARD_DATA_ROOT=/Users/brucenguyen/Library/CloudStorage/GoogleDrive-aclmr_data@aclmr.ca/My Drive/Projects/Vicinity Data/jobads-dashboard/data/derived/labor_market_dashboard_v1 PYTHONPATH=src .venv/bin/pytest -q` -> `18 passed`
- Verified: `python3 -m py_compile src/jobads_dashboard/dashboard/app.py tests/test_app_surface.py`
- Verified: `JOBADS_DASHBOARD_DATA_ROOT=/tmp/jobads-dashboard-data PYTHONPATH=src .venv/bin/pytest -q tests/test_app_surface.py` -> `7 passed`
- Verified: Restarted the live app on `http://localhost:8517` against `/tmp/jobads-dashboard-data` and rechecked the Skills tab; the default Skills empty state no longer reproduces in the live browser pass.
- Verified: Browser inspection artifacts captured during the final loop under `output/playwright/`, including overview, skills, and mobile states.
- Verified: Final inspection subagent verdict: `There are no meaningful problems left in that checklist.`
- Risk: cold reads from the synced Google Drive data root can still make first-run local verification look hung; the same test file passes 5/5 in 23.67s against a local mirror in `/tmp/jobads-dashboard-data`.
- Risk: the main remaining items are lower-priority product follow-ups outside the final polish checklist, not blockers on the redesigned surface.
