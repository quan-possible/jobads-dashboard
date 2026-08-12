# STATUS

Last updated: 2026-08-11

<!-- Live state only. Target: 80 lines / 6 KiB. Maximum: 100 lines / 8 KiB. -->

## Purpose

Maintain a standalone, descriptive Canadian labour-demand dashboard built from Vicinity job ads, with precomputed local aggregates, explicit evidence limits, and no runtime dependency on `ai_labor`.

## Current position

- `main` and `origin/main` now point to the new Next.js/FastAPI design line. On 2026-08-11 the obsolete 10-commit Streamlit/worktree-only line was deliberately replaced rather than merged; a local recovery ref remains at `backup/main-pre-new-design-20260811-3b037d7d`.
- The current product is a Next.js web app backed by FastAPI and the Python Plotly figure layer. Runtime reads `data/derived/labor_market_dashboard_v1/`; refresh reads only canonical upstream parquet files under `../jobads-data/main/data/processed/<year>/`.
- The derived bundle was generated on 2026-06-03 from 164 files, covers `2016-01-01` through `2026-03-31`, and records 25,356,735 postings. This is current local metadata, not proof that upstream has not advanced.
- Verified on 2026-08-11: the LaunchAgents, local web health (`127.0.0.1:8522/healthz`), API health (`127.0.0.1:8530/health`), authentication status route, and current Cloudflare quick tunnel were healthy. Recover the live hostname from `/Users/brucenguyen/jobads-dashboard-logs/cloudflared-launchd.err.log`; do not rely on an older recorded URL.
- The published Claude Design system still contains the original 14 presentational components. The redesign candidate expands the hand-maintained local package to 16 by adding `RouteMasthead` and `SectionLead`; validation and republishing remain a release follow-up. `.design-sync/NOTES.md` owns the operating detail.
- The 2026-08-11 redesign exploration now has a durable, adversarially verified home at `docs/analyses/labor_market_dashboard/redesign-foundation/`, with separate desktop targets, design-system material, source-state UI kit, provenance, and ACLMR brand audit. The package uses the exact live ACLMR logo, PT Sans, target-aligned navy navigation and CTA families, accessible trend/contrast cues, and explicit mobile gates. This groundwork did not change the current application or deployment.
- A complete redesign candidate now exists in `/Users/brucenguyen/.codex/worktrees/jobads-dashboard-redesign` on `codex/dashboard-redesign-production`. It migrates all nine routes, the shared shell, Plotly language, and authenticated Explore workspace; approved mobile targets and Mobbin evidence are preserved with the active job. The public site and canonical services remain unchanged.
- Candidate verification on 2026-08-11 passed 349 Python tests, ESLint, TypeScript, a production Next build, design-package type/CSS generation, upstream-data reconciliation, 45 EN/FR route-and-viewport checks, authenticated Explore journeys, and public/team cap-response checks. Fresh adversarial review and production release authorization remain outstanding.

## Active priorities

1. Complete fresh-context adversarial review of the assembled redesign candidate and resolve any material finding.
2. Decide when to integrate and release the candidate; do not deploy a partially redesigned route set.
3. Confirm the deployed Next.js/FastAPI bundle and Render publication boundary before production cutover; current service health alone does not establish either.
4. Refresh and validate the derived bundle when fresher canonical upstream processed data is available.

## Next actions

1. Finish the candidate's adversarial review, then freeze its accepted commit and evidence.
2. Restore or confirm the Keychain credential source and Render ownership before any password-bearing or production handoff; never place the plaintext password or password hash in repository files.
3. After explicit release approval, integrate the candidate and deploy through the existing launchd and Cloudflare topology with the plan's rollback procedure.

## Risks and blockers

- The remote history was deliberately replaced to make the new design canonical. The prior `main` tip is recoverable locally through `backup/main-pre-new-design-20260811-3b037d7d`, but it is no longer on the remote `main` line.
- The quick-tunnel hostname is ephemeral even when the LaunchAgent and local services are healthy.
- The dashboard measures job-ad activity, not employment, unemployment, economy-wide vacancies, or wages paid; sparse-field and provenance caveats remain required.
- Public charts must stay at 10 categories through shared cap helpers. Only a verified team session may receive uncapped figures; a `full=1` flag alone must never bypass the cap.
- Historical jobs include stale status wording. Preserve ambiguous jobs until their commits, branches, deployment state, and inbound links are reconciled.
- The design-system export enumerates components by hand in `web/.ds-entry.tsx`, so a component added to `web/components/` will not reach the design system until it is added there.
- The production Keychain credential is unavailable and the Render CLI session is expired; the reachable Render hostname appears to serve an older Streamlit surface. These unresolved ownership boundaries block production release, not local candidate verification.

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
