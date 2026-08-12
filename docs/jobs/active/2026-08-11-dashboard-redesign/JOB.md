# Dashboard redesign implementation

Status: active in an isolated worktree; redesign implementation in progress,
with production publication blocked at Gate 0.

## Objective

Migrate the current nine-route Next.js/FastAPI dashboard to the approved ACLMR
redesign without disrupting the current public site or weakening data, auth,
category-cap, bilingual, accessibility, or deployment contracts.

## Source of truth

- [`PLAN.md`](PLAN.md) owns the implementation and release plan.
- [`../../../analyses/labor_market_dashboard/redesign-foundation/`](../../../analyses/labor_market_dashboard/redesign-foundation/)
  owns the approved desktop targets and design reference.
- [`../../../analyses/labor_market_dashboard_spec/report.md`](../../../analyses/labor_market_dashboard_spec/report.md)
  owns the product and metric contract.

## Current position

- The preserved Pulse and Explore desktop targets are verified redesign
  groundwork.
- The running app is healthy at `127.0.0.1:8522` and the API is healthy at
  `127.0.0.1:8530`, but the deployed bundle is not proven to match current
  `main`.
- The current site was inspected at desktop and 390 px widths. It is responsive
  enough to provide a behavioural baseline, but it is not the approved redesign
  and the redesign has no mobile target yet.
- `main` is three local commits ahead of `origin/main`; `AGENTS.md` has unrelated
  user-owned modifications that must remain outside this job.
- The intended Keychain password lookup exits 44, so production authenticated
  verification remains blocked pending credential-source restoration or
  confirmation.
- Implementation worktree: `/Users/brucenguyen/.codex/worktrees/jobads-dashboard-redesign`.
- Branch: `codex/dashboard-redesign-production`, based on `9152919a`.
- The canonical `8522`/`8530` services and Cloudflare tunnel remain untouched.

## Orchestrator assignments

| Scope | Owner | Paths | State |
| --- | --- | --- | --- |
| Baseline evidence | Worker | `agents/baseline.md`, read-only project/runtime inspection | Complete; publication blocked |
| Responsive reference evidence | Worker | `evidence/mobile-references/`, `agents/mobile-references.md` | Complete |
| Responsive composition targets | Parent | `evidence/mobile-targets/` | Complete |
| Shared UI implementation | Worker | shell, shared presentational components, Pulse | In progress |
| Figure language | Worker | `src/jobads_dashboard/viz/`, figure goldens | In progress |
| Page and Explore migration | Pending workers | route and Explore component slices | Waiting on shared foundation |
| Integration and acceptance | Parent | combined worktree, job state, visual judgment | Active |

## Next action

Complete Gate 0 evidence while bounded software workers implement against the
approved responsive direction in `shared.md`. Do not restart the public services.
