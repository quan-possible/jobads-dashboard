# Production dashboard redesign plan

Status: ready to begin design completion and implementation; not ready for a
production cutover.

## Decision

Redesign the existing Next.js/FastAPI application in place, on an isolated
release branch and preview stack. Do not build a second application, replace
the Python figure layer, or deploy partially redesigned routes.

The preserved desktop targets are strong enough to govern the public Pulse
page and the authenticated Explore workspace. They are not a complete release
specification. Production work may start only with the preparatory gates below;
the current public site should remain unchanged until the assembled redesign is
verified and ready for one controlled cutover.

## Why this is the right route

Three options were considered:

1. **Restyle the current application component by component.** Recommended.
   The app already owns the real data, nine routes, bilingual copy,
   accessibility work, server-side figures, authentication, public category
   caps, and the public deployment topology. The redesign can replace its
   visual system without recreating those verified behaviours.
2. **Build a separate replacement frontend.** Rejected. It would duplicate
   authentication, i18n, filters, error states, figure fetching, and deployment
   plumbing, then require a riskier all-at-once data integration.
3. **Copy the prototype or portable design-system code into `web/`.** Rejected.
   The prototypes contain illustrative charts and values, fixed desktop
   geometry, and simplified interactions. They are visual references, not a
   production implementation.

This conclusion is grounded in the [current product and metric contract](../../../analyses/labor_market_dashboard_spec/report.md),
the [redesign handoff](../../../analyses/labor_market_dashboard/redesign-foundation/README.md),
the [ACLMR brand audit](../../../analyses/labor_market_dashboard/redesign-foundation/BRAND_AUDIT.md),
the [Pulse desktop target](../../../analyses/labor_market_dashboard/redesign-foundation/evidence/screenshots/pulse-hifi-desktop.png),
the [Explore desktop target](../../../analyses/labor_market_dashboard/redesign-foundation/evidence/screenshots/explore-hifi-desktop.png),
and inspection of the currently running Next.js application at desktop and
390 px mobile widths.

## Goal

Ship one coherent redesign of the current dashboard that:

- looks and behaves like the approved ACLMR redesign across all nine routes;
- preserves the real data, figure bridge, copy, filters, bilingual experience,
  accessibility, and failure states;
- keeps public figures capped at 10 categories and exposes uncapped detail only
  to a verified team session;
- keeps Explore private and non-cacheable while adopting the dark team surface;
- works at phone, tablet, laptop, and wide desktop sizes without horizontal
  page scrolling; and
- can be deployed and rolled back through the existing public topology.

The prototype figures, values, and editorial wording do not override production
data or copy. In particular, keep the current dynamic hero logic and wording
unchanged unless the user separately asks for copy work.

## Release boundaries

- Keep implementation in `web/`, `api/`, and `src/jobads_dashboard/`; do not add
  a dependency on `ai_labor` or write dashboard code into `jobads-data`.
- Keep the precomputed aggregate boundary. Do not add full-corpus queries at
  request time.
- Keep public category limits behind the shared cap helpers and the existing
  authenticated `UNCAPPED` context. Never hard-code a new client-side limit or
  let `full=1` lift the cap without a verified session.
- Treat the official ACLMR wordmark as identity and pixel tiles as decoration.
- Keep analytical controls compact and square. Reserve the ACLMR pill families
  for navigation, access, or promotional actions.
- Preserve English and French layouts. Allow longer French labels to influence
  spacing and breakpoints rather than shrinking the type.
- Do not push to `origin/main`, rebuild the public service, restart LaunchAgents,
  or touch the Cloudflare tunnel until the release gate explicitly authorizes
  production deployment. `render.yaml` can auto-deploy `main`, so a main push
  must be treated as a publication event if that Render service is still active.

## Gate 0 — establish a trustworthy baseline

Before redesign edits:

1. Start from the exact canonical `main` commit in a dedicated redesign branch
   and worktree. Preserve the unrelated modified `AGENTS.md`; do not absorb it
   into the redesign.
2. Record the local commit, `origin/main`, current `.next/BUILD_ID`, API/web
   health, auth configuration status, and every reachable public endpoint.
   The local branch is currently two commits ahead of `origin/main`, so resolve
   that publication boundary before treating a remote build as authoritative.
3. Determine whether the Render service is still reachable and auto-deploying.
   The project-owned public topology remains FastAPI on `127.0.0.1:8530`, Next
   on `127.0.0.1:8522`, and the active Cloudflare quick tunnel to `8522` unless
   current evidence changes that conclusion.
4. Rebuild and verify the current, unredesigned baseline from the chosen base
   before changing UI. This separates pre-existing defects from redesign
   regressions and proves which commit the release work inherits.
5. Restore or confirm the macOS Keychain owner for the production dashboard
   password. The documented lookup currently exits 44. Isolated development may
   use a temporary local credential, but production sign-in verification and a
   password-bearing handoff are blocked until the intended credential source is
   available.

Gate 0 passes when the base commit, public endpoints, build identity, credential
owner, and rollback commit are explicit and reproducible.

## Gate 1 — finish the missing design decisions

Create project-specific responsive targets before production UI code changes.
Do not scale the fixed 1100 px prototypes down or accept horizontal scrolling.

Required targets:

- **Pulse at 390 × 844:** closed and open navigation, hero, KPI arrangement,
  first analytical section, chart annotation strategy, and section rhythm.
- **Explore at 390 × 844:** locked state, authenticated filter controls, tabs,
  results list, selected-posting detail, and the mobile replacement for the
  desktop split pane.
- **Tablet at approximately 768–834 px:** navigation, KPI transition, figure
  grids, filters, and wide-table behaviour.

Use the existing desktop targets as the visual authority. If external mobile
interaction references are needed, source only equivalent dashboard, filter,
table, and detail-pane states through Mobbin, save the selected images with the
job evidence, and inspect those downloaded files directly. External references
may resolve interaction mechanics but must not replace the ACLMR art direction.

Two additional composition checks prevent the Pulse/Explore designs from being
stretched mechanically over the rest of the product:

- adapt one dense data route, preferably Geography, to settle maps, toggles,
  chart pairs, and responsive legends;
- adapt one editorial route, preferably Method, to settle long-form explanation,
  caveats, code/data notes, and numbered sections without turning it into a
  generic card wall.

Do not create eight independent high-fidelity mockups. Approve the shared rules
through these representative surfaces, then apply the system consistently.

Gate 1 passes only after the assembled mobile and representative-page targets
have been inspected and approved. The targets and their source files belong
under this job, not in temporary downloads.

## Implementation sequence

Use an isolated preview stack so the current public service remains untouched:
an unoccupied Next.js port such as `8520` and, if API changes are needed, an
unoccupied API port such as `8531`. Point the preview through
`JOBADS_API_ORIGIN`; do not modify the `8522`/`8530` LaunchAgents during build
work.

### 1. Foundation and shell

- Reconcile the approved tokens with `web/app/globals.css` rather than adding a
  second CSS system. Preserve PT Sans and tabular numerals.
- Add the official ACLMR wordmark to the production public assets and update
  `Brand`, `TopNav`, and `Footer` so the wordmark carries identity.
- Fix `PixelTiles.pick()` so the decorative mosaic can actually use navy, teal,
  sand, and orange. Recheck every current consumer on light and dark surfaces.
- Implement the navy masthead, restrained gradient rail, cream public canvas,
  dark Explore shell, responsive containers, focus treatment, touch targets,
  and reduced-motion behaviour.
- Redesign `TopNav`, `TopNavAuth`, `LocaleToggle`, and mobile navigation as one
  system. Preserve the current rule that Explore is hidden from public
  navigation and revealed only after authentication, even where a prototype
  uses an illustrative Explore action.

Before writing Next.js code, read the relevant documentation bundled with the
installed Next.js 16.2.9 package under `web/node_modules/next/dist/docs/`.

### 2. Shared analytical components

Refactor the current components instead of cloning prototype components:

- `KpiTile`, `Sparkline`, `Figure`, `KeyPoints`, and `DeepDivider` for the
  overlapping KPI strip and numbered editorial sections;
- `Select`, `FilterSpine`, `MapToggle`, and Explore controls for the square,
  dense analytical grammar;
- `RemoteFigure`, `TunableFigure`, and `ErrorCard` for loading, empty, error,
  and responsive chart states.

Keep existing public interfaces where practical. Where an API must change,
migrate all consumers in the same change and remove obsolete styles rather
than carrying two design systems indefinitely.

### 3. Production figure language

Update the shared Plotly template and common figure builders in
`src/jobads_dashboard/viz/` so production charts match the redesigned framing:
type, axes, grid lines, annotations, legends, semantic growth/decline colours,
and responsive margins. Do not redraw production charts as static SVGs or copy
prototype data.

Apply changes through shared figure helpers first, then inspect every registry
figure. Preserve truthful categorical encodings, provenance notes, sparse-field
coverage, and the cap helpers. Review golden changes semantically; never accept
new golden files solely because the renderer produced them.

### 4. Migrate the pages

Migrate in this order because each step exercises a broader part of the system:

1. **Pulse:** match the approved desktop composition with real data, then match
   the approved mobile target. This establishes the public-page grammar.
2. **Geography:** settle maps, toggles, legends, paired panels, and dense
   responsive behaviour.
3. **Occupations, Industries, Wages, and Skills:** apply the proven public-page
   grammar, retaining each route's real figures and caveats.
4. **Method and Developers:** use the editorial grammar; keep technical material
   legible and navigable without inheriting unnecessary data-card chrome.
5. **Explore:** apply the approved dark workspace to the real `AuthGate`, chart
   builder, posting lookup, results table, and detail pane. Preserve real auth,
   bounded lookup, private `no-store` responses, rate/error handling, and
   site-wide uncapped behaviour for a verified session.

Keep each internal migration buildable, but do not deploy a mixed old/new public
site. The release candidate must contain all routes and shared states.

### 5. Bilingual, responsive, and state completion

For every route and shared component, inspect:

- English and French copy, including long navigation, filter, note, and error
  strings;
- 390 px phone, tablet, 1280 px laptop, and 1440 px desktop layouts;
- navigation open/closed, public/authenticated, loading, empty, API-down,
  invalid-session, no-results, and long-content states;
- keyboard order, visible focus, skip link, dialog semantics, Escape/outside
  dismissal, screen-reader labels, contrast, reduced motion, and touch targets;
- chart labels and notes at small widths without clipped Plotly controls or
  horizontal page scrolling.

Use horizontal scrolling only inside a deliberately scrollable data region when
the approved mobile target requires it; never use it as the page-level response
to the fixed desktop prototype.

### 6. Keep the design sources current

After production components converge:

- update the hand-maintained `.design-sync/` inputs and `web/.ds-entry.tsx` for
  changed or new presentational components;
- validate and republish the Claude Design component package;
- update the redesign foundation only where the approved production decisions
  supersede its guidance; and
- keep runtime code as the production authority and the foundation as the
  visual/design reference.

## Verification and release gate

Verification must judge the assembled result, not only the diff or test output.
Run at least:

```bash
PYTHONPATH=src pytest -q
npm --prefix web run lint
npm --prefix web run build
```

Add a focused browser end-to-end suite for the redesign's highest-risk product
contracts because the repository currently has no web interaction tests. The
minimum useful journeys are:

- public navigation and EN/FR switching on phone and desktop;
- public figures remain capped and `full=1` alone cannot bypass the cap;
- a valid team session reveals Explore and returns uncapped figures without
  populating public caches;
- logout returns the site to capped figures and hides Explore;
- Explore locked, chart-builder, posting-search, selection, no-results, and
  session-expiry flows;
- all nine routes load without console errors, failed responses, clipped
  content, or page-level horizontal overflow.

Do not add a broad component-test stack merely for coverage numbers. A small
Playwright suite against the real preview is the highest-value durable addition;
retain lower-level tests only for logic that the journeys cannot diagnose.

Then perform direct visual comparison against the approved desktop and mobile
targets. Capture complete route surfaces at the agreed viewports, inspect the
actual pixels, and review interactive states rather than treating screenshots
as automatic proof of quality. Finish with a fresh-context adversarial review
of the release candidate. Any material visual, auth, cap, accessibility,
bilingual, or data-honesty finding returns the work to implementation.

The release candidate is ready only when:

- the public shell and Pulse composition visibly match the approved direction;
- Explore is recognizably the approved dark team workspace while obeying the
  real privacy and authentication contract;
- the seven remaining public routes feel deliberately designed within the same
  system, not merely recoloured;
- public/team figure differences are verified from real responses;
- English and French work at all target viewports;
- Python tests, golden review, lint, production build, browser journeys, and
  complete-surface visual review pass; and
- the reviewer returns `READY` with no unresolved material finding.

## Production deployment and rollback

1. Freeze the accepted release commit and record its test output, screenshots,
   build ID, data-bundle metadata, and public/auth response samples in this job.
2. Confirm whether pushing `main` will also publish to Render. Coordinate that
   endpoint or disable unintended auto-deploy before the push; do not allow two
   different “production” builds to emerge silently.
3. Build the accepted commit for the canonical local service, then restart only
   `com.aclmr.jobads-dashboard-public`. Leave the Cloudflare LaunchAgent in place
   unless it is unhealthy.
4. Verify `127.0.0.1:8530/health`, `127.0.0.1:8522/healthz`, the current quick
   tunnel hostname recovered from the cloudflared log, every route, EN/FR, and
   public/authenticated cap behaviour against the deployed build.
5. Keep the previous known-good commit and its build instructions as the
   rollback target. If health, auth, data, or visual checks fail, rebuild that
   commit and restart the public LaunchAgent; do not patch production in place.
6. Only after public verification, update `STATUS.md`, this job, dated memory,
   and the release commit/push state. Report any rotated tunnel hostname
   explicitly.

## Known blockers and decisions already settled

- **Resolved:** mobile Pulse and Explore targets plus Mobbin interaction evidence
  now govern the responsive composition.
- **Blocker:** the deployed bundle has not been proven to match current `main`.
- **Blocker for production auth verification:** the intended Keychain password
  lookup currently fails.
- **Settled:** migrate the existing app; do not build a parallel replacement.
- **Settled:** redesign all routes for one release; do not expose a mixed public
  experience.
- **Settled:** preserve production data, metrics, copy, i18n, auth, cap, and
  deployment behaviour unless a separately approved change is required.
- **Settled:** the desktop Pulse and Explore targets and the live ACLMR language
  govern visual direction; the earlier alternatives and source-tone UI kit do
  not.

The complete implementation candidate is assembled and parent-verified.
Production cutover remains blocked pending fresh adversarial acceptance,
credential restoration, and publication-boundary confirmation.
