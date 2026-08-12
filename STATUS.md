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
- The 14 presentational `web/components/` are published as a Claude Design system (`https://claude.ai/design/p/c9764078-3970-42c2-be34-2e6acce106b9`), driven by inputs committed locally as `a741d8c1` under `.design-sync/` and four dot-prefixed files in `web/`. `.design-sync/NOTES.md` owns the operating detail.
- The 2026-08-11 redesign exploration now has a durable, adversarially verified home at `docs/analyses/labor_market_dashboard/redesign-foundation/`, with separate desktop targets, design-system material, source-state UI kit, provenance, and ACLMR brand audit. The package uses the exact live ACLMR logo, PT Sans, target-aligned navy navigation and CTA families, accessible trend/contrast cues, and explicit mobile gates. This groundwork did not change the current application or deployment.

## Active priorities

1. Rebuild the public deployment from `main`, then verify the auth/cap behavior and complete live UI against that exact bundle.
2. Confirm the deployed Next.js/FastAPI bundle matches `main`; current service health alone does not establish that.
3. Refresh and validate the derived bundle when fresher canonical upstream processed data is available.
4. Before implementing the new dashboard direction, create and inspect mobile targets for Pulse and Explore; the preserved high-fidelity prototypes settle desktop composition only.

## Next actions

1. Deploy the verified canonical `main` line through the existing launchd and Cloudflare topology without creating a parallel stack.
2. Reconcile stale entries under `docs/jobs/active/` and loose `docs/jobs/*-ongoing.md` records only after confirming whether each is complete, superseded, or still needed; several predate the current branch topology.
3. Restore or confirm the Keychain credential source before any password-bearing handoff; the documented lookup returned exit 44 on 2026-08-11. Never place the plaintext password or password hash in repository files.

## Risks and blockers

- The remote history was deliberately replaced to make the new design canonical. The prior `main` tip is recoverable locally through `backup/main-pre-new-design-20260811-3b037d7d`, but it is no longer on the remote `main` line.
- The quick-tunnel hostname is ephemeral even when the LaunchAgent and local services are healthy.
- The dashboard measures job-ad activity, not employment, unemployment, economy-wide vacancies, or wages paid; sparse-field and provenance caveats remain required.
- Public charts must stay at 10 categories through shared cap helpers. Only a verified team session may receive uncapped figures; a `full=1` flag alone must never bypass the cap.
- Historical jobs include stale status wording. Preserve ambiguous jobs until their commits, branches, deployment state, and inbound links are reconciled.
- `web/components/PixelTiles.tsx` renders the brand mark as solid navy: `pick()` clamps at `Math.min(0.999, …)` so only `STOPS[0]` is ever selected, and the navy→teal→sand→orange mosaic has never appeared. On the navy footer the mark is invisible. Affects `Brand`, `TopNav`, `Footer`, `KeyPoints`, `AuthGate`. Unfixed — the fix changes the live brand mark and may move golden-file output.
- The design-system export enumerates components by hand in `web/.ds-entry.tsx`, so a component added to `web/components/` will not reach the design system until it is added there.
- The redesign high-fidelity prototypes have a fixed 1100 px minimum and are not production-ready mobile specifications. Do not ship horizontal scrolling as their responsive adaptation.

## Current owners

- `AGENTS.md`: project-specific behavior, boundaries, and routing.
- `README.md`: human setup, architecture, commands, and documentation map.
- `docs/analyses/labor_market_dashboard_spec/report.md`: product and metric contract plus the original version 1 baseline.
- `docs/analyses/labor_market_dashboard/redesign-foundation/`: redesign visual targets, portable design reference, provenance, and brand audit.
- `docs/jobs/active/2026-06-25-login-uncapped/JOB.md`: current feature continuity and promotion work.
- `src/jobads_dashboard/`: aggregate, metric, and visualization implementation.
- `api/` and `web/`: FastAPI service and Next.js product UI.
