# Dashboard redesign implementation

Status: implementation complete; the local public release was taken offline by
user request. The historical Render service remains blocked on Render authority.

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
- The local app and API are stopped, and the public, Cloudflare, and ngrok
  LaunchAgents are disabled and unloaded. The former tunnel URLs return `530`
  and `404`.
- The separate historical Streamlit service on Render remains reachable. The
  local Render token is expired, so its takedown requires restored ownership.
- Mobile Pulse and Explore targets plus four Mobbin interaction references are
  preserved under this job's `evidence/` directory.
- The intended Keychain password lookup still exits 44. The existing mode-600
  local credential matched the installed production hash and enabled live team
  verification without exposing or copying the secret.
- Implementation worktree: `/Users/brucenguyen/.codex/worktrees/jobads-dashboard-redesign`.
- Branch `codex/dashboard-redesign-production` remains at release `b7bebe5b`;
  canonical local `main` contains that release plus this cutover record. Rollback is preserved at
  `backup/main-pre-dashboard-redesign-20260812-463d919a`.
- The hardened `8522`/`8530` LaunchAgent and both tunnel agents remain installed
  for recovery but are disabled and unloaded.
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
| Integration and acceptance | Parent | combined worktree, job state, visual judgment | Complete after reopening and repairing the missed mobile Explore target |

## Next action

Keep the local public release and both tunnels disabled unless Bruce explicitly
authorizes a new launch. Restore Render ownership and suspend or delete the
historical Streamlit service if the takedown is meant to cover every endpoint;
do not push local `main` while its auto-deploy behavior is unresolved.

## Verification evidence

- On 2026-08-13, `com.aclmr.jobads-dashboard-public`,
  `com.aclmr.jobads-dashboard-cloudflared`, and
  `com.aclmr.jobads-dashboard-ngrok` were disabled and unloaded. No dashboard
  process or listener remained on `8522`/`8530`; the former Cloudflare URL
  returned `530` and the former ngrok URL returned `404`. The separate Render
  health endpoint still returned `200`, and `render whoami` reported
  unauthorized.

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
- That verdict was retracted when a direct comparison exposed an authoritative
  390 px Explore mismatch: the deployed page permanently expanded all filters,
  omitted the target KPI strip, and hid team state in the closed masthead. The
  audit's claim that the KPI rhythm could be waived was not authorized by the
  target owner.
- Corrected release `cc2ec4f7` collapses the mobile scope behind a 44 px filter
  disclosure, uses unique mobile/desktop control IDs, shows four truthful
  current-scope metrics, and keeps an authenticated team badge beside the
  mobile menu. ESLint, TypeScript, and two Next 16.3 production builds passed.
- An isolated 8531 API with a disposable credential exercised login, live
  filter changes, EN/FR KPIs, results, and the posting bottom sheet in Chrome.
  The isolated service was stopped and production was rebuilt against 8530.
- The existing LaunchAgent now serves build `ifCthJv9b7_bykFttVtY1`.
  Local/public health, all nine EN/FR routes, protected posting access,
  deployed mobile disclosure, French state, desktop toolbar, zero duplicate
  IDs, no console errors, and no page overflow passed. Corrective screenshots
  are `candidate-explore-auth-390-fr-repair.png` and
  `deployed-explore-locked-390-en-repair.png`.
- The whole-dashboard copy pass reviewed every public route in English and
  French against ONS/Government Analysis Function chart-text guidance. Page
  descriptions and chart titles were shortened, `hiring` was replaced with
  posting-accurate terms, repeated chart/section dates and generic caveats were
  removed, and French metadata, hover text, labels, and narrative grammar were
  repaired. The page masthead now owns the single data date.
- The palette pass checked live `aclmr.ca`: primary text on navy now uses exact
  white while secondary text remains muted. Fresh 1440 px English and 390 px
  French captures show the intended ACLMR shell with no page overflow.
- ESLint, TypeScript, the Next 16.3 webpack build, all 382 Python tests,
  and `git diff --check` passed. A live nine-route EN desktop and FR mobile sweep
  returned 200 everywhere, no banned copy, chart titles no longer than seven
  words, one data date per analytical page, white hero headings, no page-level
  overflow, and no console errors. Generated build
  `ifCthJv9b7_bykFttVtY1` is healthy locally and through the unchanged tunnel.
- Live QA exposed Next's persistent public fetch cache retaining a prior API
  narrative across rebuilds. `web/package.json` now clears only
  `.next/cache/fetch-cache` before production builds; the deployed HTML serves
  the current concise narrative after restart.
- The first independent copy review rejected the release for English taxonomy,
  geography, education, experience, and control text inside French Plotly
  figures; wrong footer identity; active-listing language; and locale number/date
  formatting. The repaired runtime localizes those generated labels, identifies
  the Alberta Centre correctly, names the latest-month metric accurately, and
  adds regression coverage for the known leaks. The complete EN desktop and FR
  mobile route sweeps then passed again on the public build.
- A second fresh reviewer found redundant endpoint annotations stretching two
  390 px time axes years past the March 2026 data. Removing those duplicate
  labels restored both Occupations and Skills to the exact 2016-01–2026-03
  range; the live DOM, 222 focused figure/golden tests, and a regression guard
  now cover the fix.
- The same reviewer then found mechanically truncated English education labels.
  Curated complete labels replaced raw slicing, the live public legend was
  rechecked, and the independent final verdict is `READY` with 223 focused
  figure/golden tests, no overflow, and no console errors.
- The final dashboard-language pass removed the Pulse conclusion headline and
  Summary panel, made every page and chart measure-first, expanded reader-facing
  statistical shorthand, removed repeated nonessential notes, and retained only
  boundaries that change interpretation (advertised wages, coded-industry
  denominators, sample gates, accounting decompositions, and task exposure).
  The same rules now cover the Python figure factories, Plotly hover/axis chrome,
  Explore states and errors, Method, Developers, navigation, and footer in EN/FR.
- Current verification: 383 Python tests passed (one upstream Starlette warning),
  focused figure/Explore runs passed 255 tests, ESLint and TypeScript passed, and
  the Next 16.3 webpack production build succeeded. Live Browser checks covered
  every route at EN desktop and FR mobile widths with no banned narrative copy or
  page overflow; the affected final Pulse build was rechecked at 1440 and 390 px.
  A 390 px French capture caught clipped KPI comparison labels before release;
  the card layout now wraps cleanly. The final adversarial reviewer returned
  `READY`; its only non-blocking note, a truncated mobile seasonality colorbar
  title, was shortened and rechecked as `moyenne annuelle`. Local web, API, and public health are 200 on
  build `Yr_bsL_RHqDGbg96bezak` through the unchanged tunnel.
