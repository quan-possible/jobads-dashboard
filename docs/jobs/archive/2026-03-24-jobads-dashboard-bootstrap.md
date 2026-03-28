# Jobads dashboard bootstrap job

- status: completed
- created: 2026-03-24
- codex_session_id: unavailable
- codex_session_ids: [unavailable]

## Goal
- Make jobads-dashboard the standalone canonical project for the labor-market dashboard.

## Scope
- Scaffold the new project.
- Move the dashboard specification into this project.
- Remove prior ownership from ai_labor and jobads-data/main.

## Notes
- Upstream source data stays in jobads-data/main.
- All dashboard implementation should happen in jobads-dashboard.

## Outcome
- Bootstrapped `jobads-dashboard` as a standalone project with core docs and memory files.
- Added the canonical labor-market dashboard specification to this repo.
- Removed live spec ownership from both `ai_labor` and `jobads-data/main`.
