# Dashboard redesign implementation

Status: active in an isolated worktree; implementation and parent verification
complete, fresh adversarial review pending, production publication blocked.

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
- Mobile Pulse and Explore targets plus four Mobbin interaction references are
  preserved under this job's `evidence/` directory.
- The intended Keychain password lookup exits 44, so production authenticated
  verification remains blocked pending credential-source restoration or
  confirmation.
- Implementation worktree: `/Users/brucenguyen/.codex/worktrees/jobads-dashboard-redesign`.
- Branch: `codex/dashboard-redesign-production`; current canonical `main` at
  `463d919a` has been merged into the candidate.
- The canonical `8522`/`8530` services and Cloudflare tunnel remain untouched.
- All nine routes, the shell, shared charts, and Explore workspace have been
  migrated to the ACLMR design language. The design-system inputs now enumerate
  16 reusable components locally; the remote Claude Design package is not yet
  republished.

## Orchestrator assignments

| Scope | Owner | Paths | State |
| --- | --- | --- | --- |
| Baseline evidence | Worker | `agents/baseline.md`, read-only project/runtime inspection | Complete; publication blocked |
| Responsive reference evidence | Worker | `evidence/mobile-references/`, `agents/mobile-references.md` | Complete |
| Responsive composition targets | Parent | `evidence/mobile-targets/` | Complete |
| Shared UI implementation | Worker | shell, shared presentational components, Pulse | Complete |
| Figure language | Worker | `src/jobads_dashboard/viz/`, figure goldens | Complete |
| Public routes | Worker | seven remaining routes and shared route grammar | Complete |
| Explore workspace | Worker | authenticated builder, posting lookup, responsive detail | Complete |
| Integration and acceptance | Parent | combined worktree, job state, visual judgment | Parent checks complete; adversarial review pending |

## Next action

Run the fresh-context adversarial review against the merged release candidate.
If it returns READY, freeze the candidate and hand it back for an explicit
integration/release decision. Do not restart the public services.

## Verification evidence

- `349 passed` in the complete Python suite; one upstream Starlette deprecation
  warning only.
- ESLint, TypeScript, and the Next 16.2.9 webpack production build passed.
- `jobads-dashboard validate --source-root /Volumes/ACLMR/jobads-data/main/data/processed`
  reconciled 25,356,735 postings with no missing files or schema issues.
- Design-sync declaration and Tailwind generation passed for the 16-component
  local surface.
- Browser QA passed 45 route/viewport checks: nine routes at 390, 768, 1280,
  and 1440 px in English, plus all nine routes at 390 px in French. All returned
  200 with no console errors, request failures, missing headings, or page-level
  overflow.
- Authenticated mobile Explore opened a posting detail dialog, closed it, moved
  to the chart builder, and returned to posting results without overflow.
- Response inspection confirmed anonymous and anonymous `full=1` views both
  returned 8 categories, while the valid team session returned 11 with
  `Cache-Control: private, no-store`.
- Complete Pulse, Geography, Method, locked Explore, authenticated Explore, and
  French mobile captures were inspected from the isolated 8521/8531 preview.
