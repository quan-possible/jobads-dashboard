# STATUS

Last updated: 2026-08-12

<!-- Live state only. Target: 80 lines / 6 KiB. Maximum: 100 lines / 8 KiB. -->

## Purpose

Maintain a descriptive Canadian labour-demand dashboard built from Vicinity job ads, with precomputed aggregates and explicit evidence limits.

## Current position

- Local `main` contains deployed release `b7bebe5b` plus its cutover record; `origin/main` remains at `98edbe04` because the unresolved Render auto-deploy boundary makes a push unsafe. The prior production source is preserved at `backup/main-pre-dashboard-redesign-20260812-463d919a`.
- The current product is a Next.js web app backed by FastAPI and the Python Plotly figure layer. Runtime reads `data/derived/labor_market_dashboard_v1/`; refresh reads only canonical upstream parquet files under `../jobads-data/main/data/processed/<year>/`.
- The derived bundle was generated on 2026-06-03 from 164 files, covers `2016-01-01` through `2026-03-31`, and records 25,356,735 postings. This is current local metadata, not proof that upstream has not advanced.
- The redesign is live through the existing Mac public stack: FastAPI on `127.0.0.1:8530`, Next 16.3.0 on `127.0.0.1:8522`, and the unchanged Cloudflare quick tunnel at `https://topics-marion-although-restore.trycloudflare.com`. The tunnel hostname is ephemeral and must still be recovered from its log after any future tunnel restart.
- Claude Design still contains 14 components. The local package has 16; republishing remains a follow-up. `.design-sync/NOTES.md` owns the detail.
- The 2026-08-11 redesign exploration now has a durable, adversarially verified home at `docs/analyses/labor_market_dashboard/redesign-foundation/`, with separate desktop targets, design-system material, source-state UI kit, provenance, and ACLMR brand audit. The package uses the exact live ACLMR logo, PT Sans, target-aligned navy navigation and CTA families, accessible trend/contrast cues, and explicit mobile gates. This groundwork did not change the current application or deployment.
- The installed public LaunchAgent was backed up and now starts Uvicorn with `--no-proxy-headers`. The deployed security probe returned eight `401` responses followed by two `429` responses despite rotating forged `X-Forwarded-For`; anonymous and forged-`full=1` figures stayed capped at 10 categories while the verified team view returned uncapped detail with `private, no-store`.
- Post-cutover verification passed 362 Python tests, ESLint, TypeScript, a Next 16.3 production build, zero-vulnerability audits, reconciliation of 25,356,735 postings, all nine English and French routes, mobile/desktop Browser inspection, team login, Explore detail, logout relock, and the approved ACLMR visual comparison. A fresh read-only reviewer returned `READY` with no material finding.

## Active priorities

1. Resolve the Render service ownership/auto-deploy boundary before pushing the 18 local `main` commits to `origin/main`; the local Cloudflare-backed production release is already complete.
2. Restore the intended Keychain credential owner and remove reliance on the existing mode-600 local fallback when practical.
3. Refresh and validate the derived bundle when fresher canonical upstream processed data is available.

## Next actions

1. Confirm Render authority and whether pushing `main` would replace the reachable older Streamlit service; do not push until this is explicit.
2. Restore the Keychain entry without putting a plaintext password or password hash in repository files.
3. Republish the locally verified 16-component Claude Design package only as an explicitly authorized external follow-up.

## Risks and blockers

- The remote history was deliberately replaced to make the new design canonical. The prior `main` tip is recoverable locally through `backup/main-pre-new-design-20260811-3b037d7d`, but it is no longer on the remote `main` line.
- The quick-tunnel hostname is ephemeral even when the LaunchAgent and local services are healthy.
- The dashboard measures job-ad activity, not employment, unemployment, economy-wide vacancies, or wages paid; sparse-field and provenance caveats remain required.
- Public charts must stay at 10 categories through shared cap helpers. Only a verified team session may receive uncapped figures; a `full=1` flag alone must never bypass the cap.
- Historical jobs include stale status wording. Preserve ambiguous jobs until their commits, branches, deployment state, and inbound links are reconciled.
- The design-system export enumerates components by hand in `web/.ds-entry.tsx`, so a component added to `web/components/` will not reach the design system until it is added there.
- The Keychain credential remains unavailable. A mode-600 local credential source matched the installed production hash and enabled live auth verification, but it is not the intended durable owner.
- The Render CLI session is expired and the reachable Render hostname appears to serve an older Streamlit surface. This blocks remote publication/push, not the verified local Cloudflare-backed release.

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
