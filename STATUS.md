# STATUS

Last updated: 2026-08-21

<!-- Live state only. Target: 80 lines / 6 KiB. Maximum: 100 lines / 8 KiB. -->

## Purpose

Maintain a descriptive Canadian labour-demand dashboard built from Vicinity job
ads, with precomputed aggregates and explicit evidence limits.

## Current position

- `main` is the single supported dashboard line locally and on GitHub. It
  contains the current Next.js/FastAPI release, the Python Plotly figure layer,
  the authenticated Explore workspace, and the public 10-category contract.
  Obsolete feature, redesign, audit, and backup branches and the completed
  redesign worktree have been removed.
- The repository has no supported Streamlit, Dash, notebook, or alternate
  worktree application. Historical implementations are available only through
  Git history and completed or archived evidence.
- Runtime reads only `data/derived/labor_market_dashboard_v1/`; refresh reads
  canonical upstream parquet files under
  `../jobads-data/main/data/processed/<year>/`. The `_v1` suffix names the
  current aggregate schema, not an app version.
- The committed derived bundle was generated from 164 files, covers
  `2016-01-01` through `2026-03-31`, and records 25,356,735 postings. Upstream
  may have advanced.
- The local app is healthy with FastAPI on `127.0.0.1:8530` and Next.js on
  `127.0.0.1:8522`. Persistent public, Cloudflare, and ngrok LaunchAgents remain
  disabled and unloaded; no public tunnel was relaunched.
- The old Render service remains suspended and returns `503`; all known public
  dashboard endpoints remain offline.
- The current visual reference lives at
  `docs/analyses/labor_market_dashboard/redesign-foundation/`. Retired UI
  screenshots were removed from the live documentation tree.
- Claude Design contains 14 components while the local package has 16;
  `.design-sync/NOTES.md` owns the separately authorized republication follow-up.

## Active priorities

1. Keep the public tunnels and Render service disabled unless Bruce explicitly
   authorizes a relaunch.
2. Refresh and validate the derived bundle when newer upstream processed data
   is needed.
3. Restore the intended Keychain credential owner before a password-bearing
   handoff or public relaunch.

## Risks and blockers

- The dashboard measures posting activity, not employment, unemployment,
  economy-wide vacancies, or wages paid; sparse-field and provenance caveats
  remain required.
- Public charts must stay at 10 categories through shared cap helpers. Only an
  authenticated team session may receive uncapped private, no-store figures;
  `full=1` alone must never bypass the cap.
- The Keychain credential remains unavailable. A mode-600 local source matched
  the installed hash during earlier verification, but it is not the intended
  durable owner.
- The design-system export enumerates components manually in
  `web/.ds-entry.tsx`; new components require an explicit export entry.
- The Render CLI session remains expired. Resuming the suspended external
  service remains separately authorized work.

## Current owners

- `AGENTS.md`: project-specific behavior, boundaries, and routing.
- `README.md`: setup, architecture, commands, and documentation map.
- `docs/analyses/labor_market_dashboard_spec/report.md`: current product,
  metric, data, and architecture contract.
- `docs/analyses/labor_market_dashboard/redesign-foundation/`: current visual
  targets, portable design reference, provenance, and brand audit.
- `src/jobads_dashboard/`: aggregate, metric, and Plotly implementation.
- `api/` and `web/`: FastAPI service and Next.js product UI.
- `docs/jobs/done/` and `docs/jobs/archive/`: evidence and recovery only, not
  implementation sources.
