# Redesign deep audit

- Mode: `converge`
- Status: `COMPLETE`
- Date: 2026-08-11
- Candidate: `/Users/brucenguyen/.codex/worktrees/jobads-dashboard-redesign`
- Branch: `codex/dashboard-redesign-production`
- Starting revision: `77926310`
- Canonical revision at start: `463d919a`
- Parent job: [`../JOB.md`](../JOB.md)

## Goal and scope

Audit the complete redesign candidate to convergence without modifying or
deploying the canonical site. Judge the assembled nine-route Next.js/FastAPI
product, its precomputed data and Plotly layer, public/team authorization and
category-cap boundary, bilingual and accessible interaction, reusable design
package, production packaging, operations, and whole-product craft against the
canonical product contract, ACLMR design language, approved project targets,
and downloaded Mobbin interaction references.

## Exclusions and safety boundary

- Do not deploy, push, publish the Claude Design package, rotate credentials,
  restart the canonical 8522/8530 services, or alter the Cloudflare tunnel.
- Do not change upstream `jobads-data` or `ai_labor`.
- Use only the isolated candidate and disposable preview ports for mutations or
  runtime probes.
- Production-authenticated and provider-specific cutover verification remains
  blocked until the Keychain credential and Render ownership are restored.

## Output index

- [`findings.md`](findings.md): confirmed defects and remediation status.
- [`ux-audit.md`](ux-audit.md): reference-grounded whole-product design review.
- `evidence/`: audit-specific screenshots, browser results, response samples,
  and logs.

## Coverage ledger

| Flow or surface | Important states | Evidence target | Status | Round |
| --- | --- | --- | --- | ---: |
| Public navigation and shell | desktop/mobile, menu, active route, EN/FR, keyboard/focus | isolated browser + accessibility tree | complete | 2 |
| Pulse | desktop/mobile/tablet, loading/error, real figures, narrative honesty | current render vs approved targets | complete | 2 |
| Occupations and Industries | dense charts, caps, long labels, responsive flow | isolated browser + API samples | complete | 2 |
| Geography | map modes, animation controls, compact legends, ranked/decomposition charts | isolated browser + target evidence | complete | 2 |
| Wages and Skills | sparse-data caveats, coverage, dense labels, responsive flow | isolated browser + figure responses | complete | 2 |
| Method and Developers | editorial reading, tables/code, links, small viewport | isolated browser | complete | 2 |
| Explore locked/auth | valid/invalid login, nav reveal, filters, search, no-results, paging, drawer/sheet, builder, logout, expired session | isolated browser and API | complete | 2 |
| Public/team cap boundary | anonymous, forged `full=1`, valid session, cache headers | direct response inspection + tests | complete | 2 |
| Data package and figures | schema, reconciliation, metric contracts, category helpers, golden output | CLI/tests/source audit | complete | 2 |
| Security and privacy | cookies, CSRF/CORS/proxy/rate limit, secret handling, raw-posting boundary | source/tests/runtime probes | complete | 2 |
| Reliability and performance | fetch cancellation, cache/failure recovery, asset/package build, API-down behavior | source/runtime/build | complete | 2 |
| Accessibility and localization | semantics, focus trap/return, touch targets, contrast, reduced motion, FR strings | browser/source/contrast checks | complete | 2 |
| Deployment and rollback | Docker/entrypoint/health, canonical isolation, provider boundary | static and safe local packaging checks | complete except provider cutover | 2 |
| Design-package permanence | 16-component build/render, official logo, tokens, current previews | fresh package build and rendered inspection | complete | 2 |

## Baseline position

- Candidate and canonical worktrees were clean at audit start.
- Candidate started 12 commits ahead of canonical `main`; canonical had no
  candidate-external commit to incorporate at start.
- Existing evidence reports 349 Python tests, lint/type/build, data
  reconciliation, a 45-case responsive route matrix, authenticated Explore,
  public/team cap checks, and an adversarial `READY`. The deep audit treats this
  as baseline evidence, not as authority.

## Round log

### Round 0 — orientation and coverage declaration

- Loaded the deep-audit, memory, live-QA, product-UI/UX, subagent, and
  verification contracts.
- Declared comprehensive black-box, source, data/security, operations, and
  reference-grounded design coverage above.
- Started independent read-only backend/security, frontend/accessibility, and
  whole-product design reviews; parent retains runtime QA, finding adjudication,
  implementation, and final judgment.

## Current next step

Hand the committed worktree candidate back for an explicit integration decision.
Production cutover remains a separate, credential-, provider-authority-, and
LaunchAgent-hardening-gated operation.

### Round 1 — complete black-box and source audit

- Ran all nine routes at 390, 768, and 1440 pixels: 27/27 returned 200 with one
  H1, no horizontal overflow, no unavailable chart, no missing image alt text,
  no duplicate IDs, and no non-abort request or console failure. Next RSC
  speculative `ERR_ABORTED` cancellations were classified and rejected.
- Exercised skip navigation, mobile menu and focus return, EN/FR, invalid and
  valid login, Explore navigation reveal, paging, filters, no results, builder,
  posting detail sheet, logout, mid-session expiry, and API-down behavior.
- Confirmed 19 distinct findings after refutation across responsive product
  quality, localization/auth state, API privacy/security, refresh publication,
  private lookup integrity, deployment proxy behavior, and dependencies.

### Round 2 — repairs and convergence recheck

- Repaired all admitted findings in the isolated candidate, including atomic
  directory and lookup publication, fail-closed proxy handling, server-side
  private cache policy, serialized rate limiting, session-state recovery,
  French metadata/provenance, keyboard focus, mobile Plotly layout, and the
  reusable design package.
- Upgraded Next.js and its paired lint config to 16.3.0; both complete and
  production-only `npm audit` checks report zero vulnerabilities.
- Full Python suite: 362 passed with one pre-existing Starlette deprecation
  warning. ESLint, TypeScript, production build, shell syntax, and diff checks
  pass. The design bundle rebuilt and rendered 16/16 previews; direct inspection
  confirms its official logo, navy KeyPoints panel, and full-width Figure.
- The in-app Browser exposed a literal HTML entity in one live posting after the
  first repair. The lookup boundary now decodes character entities as well as
  recognized mojibake while preserving valid Unicode; the current lookup is
  being republished through the new atomic path before the final journey pass.

### Round 3 — final complete pass and adversarial convergence

- The rebuilt private index contains 100,000 rows. Direct source scans and live
  Browser searches confirm that the known mojibake/codepage families and literal
  HTML character entities are normalized while already-valid Unicode remains.
- The final live matrix passed 27/27 cases and every declared user journey. A
  direct in-app Browser pass inspected the final mobile heatmap, authenticated
  Explore hero, `École` search result, and settled `multi‑phase` posting sheet.
- A current canonical refresh was a no-op: canonical `463d919a` is already an
  ancestor of the candidate, and canonical health remained 200 throughout.
- Fresh-context adversarial verdict: **READY as an isolated release candidate;
  NOT READY for production cutover.** All original 19 remediations survived. The
  reviewer confirmed the external installed LaunchAgent as the remaining
  publication prerequisite captured in S20.
