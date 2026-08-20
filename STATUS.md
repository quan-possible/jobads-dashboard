# STATUS

Last updated: 2026-08-20

<!-- Live state only. Target: 80 lines / 6 KiB. Maximum: 100 lines / 8 KiB. -->

## Purpose

Maintain a descriptive Canadian labour-demand dashboard built from Vicinity job ads, with precomputed aggregates and explicit evidence limits.

## Current position

- Local `main` contains the redesigned release, the corrected mobile Explore workspace, and the verified copy/palette pass; the current product also exposes a Team-tagged Explore tab to signed-out visitors and gates the workspace after they open it. `origin/main` remains at `98edbe04` because the unresolved Render auto-deploy boundary makes a push unsafe. The prior production source is preserved at `backup/main-pre-dashboard-redesign-20260812-463d919a`.
- The current product is a Next.js web app backed by FastAPI and the Python Plotly figure layer. Runtime reads `data/derived/labor_market_dashboard_v1/`; refresh reads only canonical upstream parquet files under `../jobads-data/main/data/processed/<year>/`.
- The derived bundle was generated on 2026-06-03 from 164 files, covers `2016-01-01` through `2026-03-31`, and records 25,356,735 postings. Upstream may have advanced.
- The dashboard is running locally for the current Codex task with FastAPI on `127.0.0.1:8530` and Next.js on `127.0.0.1:8522`. The persistent public, Cloudflare, and ngrok LaunchAgents remain disabled and unloaded; no public tunnel was relaunched.
- The historical Streamlit service at `https://jobads-dashboard.onrender.com` is suspended in Render and returns `503`. All known public dashboard endpoints remain offline.
- Claude Design still contains 14 components. The local package has 16; republishing remains a follow-up. `.design-sync/NOTES.md` owns the detail.
- The verified redesign foundation lives at `docs/analyses/labor_market_dashboard/redesign-foundation/`: desktop targets, mobile gates, source-state UI kit, provenance, brand audit, exact ACLMR logo, and PT Sans.
- The installed public LaunchAgent is hardened with `--no-proxy-headers`; prior live probes confirmed rate limits, public caps, and private no-store responses.
- Release `cc2ec4f7` provides the corrected mobile Explore disclosure, KPI strip, results-first hierarchy, and persistent team state.
- The deployed copy/palette pass now uses live ACLMR white for primary dark-surface text, concise EN/FR measure-first page and chart language, posting-accurate terminology, one masthead data date per analytical page, localized Plotly labels/controls/numbers, and only interpretation-critical notes. The Pulse no longer generates a conclusion headline or Summary panel, mobile KPI comparisons wrap without clipping, and all nine EN desktop and FR mobile routes passed the live copy and page-width sweep. Production builds clear Next's public fetch cache so stale API narratives cannot survive into a release.

## Active priorities

1. Keep both public tunnels disabled; the current local task runtime is explicitly authorized and may remain available for Bruce.
2. Keep the Render service suspended; browser access is available through the authorized Chrome session, while the CLI token remains expired.
3. Restore the intended Keychain credential owner only before a password-bearing handoff or separately authorized public relaunch.

## Next actions

1. Do not resume Render service `srv-d74gjbc50q8c73dvqfdg` or re-enable `com.aclmr.jobads-dashboard-public`, `com.aclmr.jobads-dashboard-cloudflared`, or `com.aclmr.jobads-dashboard-ngrok` without explicit authorization.
2. Do not push `main` while the dashboard is intentionally offline unless publication behavior is explicitly approved.
3. If the dashboard is relaunched, restore the Keychain credential owner before any password-bearing handoff.

## Risks and blockers

- The remote history was deliberately replaced to make the new design canonical. The prior `main` tip is recoverable locally through `backup/main-pre-new-design-20260811-3b037d7d`, but it is no longer on the remote `main` line.
- The former quick-tunnel hostname is ephemeral and no longer serves the dashboard.
- The dashboard measures job-ad activity, not employment, unemployment, economy-wide vacancies, or wages paid; sparse-field and provenance caveats remain required.
- Public charts must stay at 10 categories through shared cap helpers. Only a verified team session may receive uncapped figures; a `full=1` flag alone must never bypass the cap.
- Historical jobs include stale status wording. Preserve ambiguous jobs until their commits, branches, deployment state, and inbound links are reconciled.
- The design-system export enumerates components by hand in `web/.ds-entry.tsx`, so a component added to `web/components/` will not reach the design system until it is added there.
- The Keychain credential remains unavailable. A mode-600 local credential source matched the installed production hash and enabled live auth verification, but it is not the intended durable owner.
- The Render CLI session remains expired, but the service is controllable through the authorized Chrome session and is suspended. Resuming or republishing remains separately authorized work.

## Current owners

- `AGENTS.md`: project-specific behavior, boundaries, and routing.
- `README.md`: human setup, architecture, commands, and documentation map.
- `docs/analyses/labor_market_dashboard_spec/report.md`: product and metric contract plus the original version 1 baseline.
- `docs/analyses/labor_market_dashboard/redesign-foundation/`: redesign visual targets, portable design reference, provenance, and brand audit.
- `docs/jobs/active/2026-06-25-login-uncapped/JOB.md`: current feature continuity and promotion work.
- `docs/jobs/active/2026-08-11-dashboard-redesign/PLAN.md`: current production-redesign implementation and release plan.
- `docs/jobs/active/2026-08-11-dashboard-redesign/JOB.md`: candidate implementation, verification evidence, and release blockers.
- `src/jobads_dashboard/`: aggregate, metric, and visualization implementation.
- `api/` and `web/`: FastAPI service and Next.js product UI.
