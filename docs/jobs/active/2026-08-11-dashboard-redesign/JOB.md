# Dashboard redesign implementation

Status: deployed through the existing local public stack; remote publication
remains blocked pending Render authority.

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
- The deployed app is healthy at `127.0.0.1:8522`, the API is healthy at
  `127.0.0.1:8530`, and the public tunnel serves the exact canonical build from
  release commit `b7bebe5b` (Next build ID `R1XRrat8L-kJFQH4OLwqr`).
- Mobile Pulse and Explore targets plus four Mobbin interaction references are
  preserved under this job's `evidence/` directory.
- The intended Keychain password lookup still exits 44. The existing mode-600
  local credential matched the installed production hash and enabled live team
  verification without exposing or copying the secret.
- Implementation worktree: `/Users/brucenguyen/.codex/worktrees/jobads-dashboard-redesign`.
- Branch `codex/dashboard-redesign-production` remains at release `b7bebe5b`;
  canonical local `main` contains that release plus this cutover record. Rollback is preserved at
  `backup/main-pre-dashboard-redesign-20260812-463d919a`.
- The existing `8522`/`8530` LaunchAgent was rebuilt and restarted; its plist
  was backed up and hardened with `--no-proxy-headers`. The Cloudflare agent
  was left running and retained
  `https://topics-marion-although-restore.trycloudflare.com`.
- All nine routes, the shell, shared charts, and Explore workspace have been
  migrated to the ACLMR design language. The design-system inputs now enumerate
  16 reusable components locally; the remote Claude Design package is not yet
  republished.

## Orchestrator assignments

| Scope | Owner | Paths | State |
| --- | --- | --- | --- |
| Baseline evidence | Worker | `agents/baseline.md`, read-only project/runtime inspection | Complete |
| Responsive reference evidence | Worker | `evidence/mobile-references/`, `agents/mobile-references.md` | Complete |
| Responsive composition targets | Parent | `evidence/mobile-targets/` | Complete |
| Shared UI implementation | Worker | shell, shared presentational components, Pulse | Complete |
| Figure language | Worker | `src/jobads_dashboard/viz/`, figure goldens | Complete |
| Public routes | Worker | seven remaining routes and shared route grammar | Complete |
| Explore workspace | Worker | authenticated builder, posting lookup, responsive detail | Complete |
| Integration and acceptance | Parent | combined worktree, job state, visual judgment | Complete; fresh reviewer returned `READY` at `229c9ae2` |

## Next action

Keep the local public release in service. Resolve Render ownership and its
auto-deploy behavior before pushing local `main` to `origin/main`; restore the
Keychain credential owner and republish the 16-component Claude Design package
as separately authorized follow-ups.

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
- A fresh adversarial reviewer initially found that the portable package lost
  the host-relative official logo. `Brand` now imports the exact vendored SVG as
  a self-contained data URI; its bytes retain SHA-256
  `bd308c4d221076e515bad78093e68b460967180b96c5765855d9ea3a691a8217`.
  The same reviewer rebuilt and rendered all 16 components, confirmed Brand,
  Footer, and TopNav, and returned `READY` at `229c9ae2`.
- Deep-audit convergence then admitted and repaired 19 candidate defects across
  mobile product quality, bilingual/auth states, security/privacy, data
  publication, lookup text integrity, dependencies, and package permanence.
  The complete suite passed 362 Python tests, lint, type, Next 16.3 build, two
  zero-vulnerability npm audits, 27/27 live route/viewport checks, real Explore
  failure paths, and 16/16 portable-package renders. A fresh adversarial review
  returned `READY` for the candidate and `NOT READY` for production cutover.
- The earlier external LaunchAgent prerequisite is resolved: the installed
  plist now includes `--no-proxy-headers`, and the forged-header throttle probe
  passed after the authorized cutover.
- Authorized cutover completed on 2026-08-12. The plist backup is
  `tmp/deployment/2026-08-12-dashboard-redesign/com.aclmr.jobads-dashboard-public.plist.before`;
  its SHA-256 is
  `05de524d64fdf5030dc0471b2be4885d4761fed6d3d15388ac6a21877afb2795`.
- Canonical verification repeated after integration: 362 Python tests passed;
  ESLint, TypeScript, Next 16.3 build, both npm audits, and derived-data
  reconciliation passed. The live forged-header sequence was
  `401` × 8 then `429` × 2; anonymous and anonymous `full=1` returned 10
  categories, verified team returned 11, and team figure/posting responses
  were `private, no-store`.
- Live Browser QA inspected English desktop Pulse, French mobile Geography,
  locked and authenticated mobile Explore, menu focus return, French switching,
  team login, 25 posting rows, a posting drawer with no known mojibake/entities,
  and logout relock. Current deployed captures are under
  `deep-audit/evidence/live-qa/deployed-*.png`.
- After this cutover record, local `main` is 18 commits ahead of `origin/main`.
  It was not pushed because
  Render CLI authority is expired and the reachable Render hostname appears to
  serve an older Streamlit application; avoiding an uncoordinated second
  deployment is intentional.
- A fresh read-only post-deployment reviewer returned `READY`: canonical and
  runtime identity matched `b7bebe5b` / `R1XRrat8L-kJFQH4OLwqr`, local and
  public health passed, all nine EN/FR routes returned 200, anonymous `full=1`
  stayed capped, protected endpoints stayed protected, the running LaunchAgent
  included `--no-proxy-headers`, and all four deployed captures were coherent.
