# Findings

## Scope and method

This ledger covers only confirmed, distinct findings in the 2026-08-11 redesign
deep audit. Every admitted finding must survive an explicit refutation attempt
against current source, runtime behavior, tests, types, contracts, or rendered
evidence. Candidate observations remain outside this ledger until confirmed.

## Verification note

Convergence and the authorized local public cutover are complete. The final
candidate pass found no code or product blocker; the deployed release then
passed production authentication, cap/cache/security probes, all-route EN/FR
checks, and direct desktop/mobile Browser inspection. The installed LaunchAgent
is hardened and S20 is closed. Render ownership and the missing Keychain owner
remain remote-publication and credential-hardening follow-ups; they did not
block the verified existing Cloudflare-backed release.

## Severity tally

| Severity | Count |
| --- | ---: |
| Critical | 0 |
| High | 2 |
| Medium | 13 |
| Low | 5 |

## Findings

### S01 — High — Several mobile figures are visually unreadable

**Evidence.** At 390 px, dense Plotly annotations and labels collide or clip on
Pulse, Occupations, Industries, Geography, Wages, and Skills. Figure actions
also retain the desktop side-by-side header, compressing some titles into a
narrow column. The problem survives the no-overflow check: content stays inside
the viewport but cannot be read reliably. The approved Pulse mobile target and
the downloaded Plata reference both preserve full readable chart width.

**Refutation attempted.** Geography's ranked lists preserve exact values and
some charts remain legible; that does not repair the core figures whose labels
and titles visibly collide. Admitted.

**Remediation status.** Fixed. Mobile figures use stacked headers, compact axes,
wrapped small-multiple annotations, expanded categorical heights, and explicit
long heatmap ticks. Fresh 390-pixel route renders and direct Browser inspection
confirm readable in-card layouts without horizontal overflow or category loss.

### S02 — Medium — Pulse summary hides its trust framing

`KeyPoints.tsx` requests a navy panel, but hard-coded `text-ink` and
`text-ink-faint` children override the tone. In the assembled desktop and mobile
page the heading/note lose contrast and the card renders unlike the approved
navy summary. The affected text identifies automated interpretation and its
non-causal limit. Admitted after direct source/render comparison.

**Remediation status.** Fixed. The dark card selector now wins over the base
card surface and all child text uses invert-safe tones. The rebuilt package and
live Pulse render both show the intended navy panel and readable caveat.

### S03 — Medium — French Method content contains English provenance copy

The French Method page passes API-supplied coverage labels and caveats through
verbatim. The visible result mixes French headings with English `Occupation
(NOC)`, `Industry (NAICS)`, `Wage`, `Remote-work field`, and English caveat
bullets. Pulse also retains at least one English legend label. These are
interpretive/provenance surfaces, not incidental debug strings.

**Remediation status.** Fixed. Method maps the finite API provenance labels and
caveats in French, route dictionaries supply localized residual labels, and the
French live journey found none of the known English leaks.

### S04 — Medium — Authenticated Explore tells the user to sign in

The Explore hero is outside the auth-state boundary. After successful login,
real private results appear below a hero that still describes the view as gated
and tells the authenticated user to sign in; the closed mobile masthead exposes
no team state. This contradicts the current user state and the approved
workspace target.

**Remediation status.** Fixed. The hero now reads auth state: locked users see
access instructions while verified users see `Team workspace · Full detail`
and `Explore the full dataset`. Both states were checked in the Browser.

### S05 — Medium — Forged `X-Forwarded-For` bypasses the per-IP throttle

The API trusts the rightmost forwarded address from the loopback Next proxy,
but Next 16 preserves a client-provided `X-Forwarded-For` value. A fresh
isolated-proxy probe sent ten wrong passwords with ten forged single addresses;
all ten returned 401 instead of reaching the eight-failure per-IP limit.

**Refutation attempted.** An edge may rewrite the header, but the direct public
Next service does not require that topology, and the local production-shaped
proxy reproduced the bypass. Admitted.

**Remediation status.** Fixed. Trusted proxies are opt-in and the production
Uvicorn command disables proxy-header rewriting. A fresh Next-proxied forged-
header probe returned eight 401 responses followed by 429 responses.

### S06 — Medium — Data refresh publishes a mixed bundle on failure

`refresh_dashboard_data` writes the live directory's Parquet files one at a
time and writes metadata last. An interruption, disk error, or validation
failure can therefore leave old and new tables mixed or incomplete, and a new
API process then fails or reads inconsistent vintages.

**Refutation attempted.** Successful refreshes validate afterward and the
running API caches data, but neither protects the published directory from a
failed/interrupted refresh. Admitted.

**Remediation status.** Fixed. Refresh builds and validates in a sibling staging
directory, then publishes the directory as a unit with backup rollback. Fault
injection confirms a failed build or publish preserves the prior bundle.

### S07 — Medium — Standalone posting lookup can silently omit new source data

The supported `posting-lookup` command uses the previous output metadata's
`max_date` both to choose source years and to cap `dateFound`. A disposable
fixture containing 2025 and 2026 sources with 2025 output metadata selected
only the 2025 file and applied `dateFound <= 2025-01-01`.

**Refutation attempted.** The full refresh path is unaffected; the standalone
command remains a reachable advertised workflow and succeeds with a stale
private index. Admitted.

**Remediation status.** Fixed. The source window is derived from current source
Parquet rather than output metadata. The stale-2025/new-2026 regression fixture
selects the 2026 posting.

### S08 — Medium — Private posting responses are cacheable by default

The posting list and detail routes return titles, employers, wages, and full
descriptions without server `Cache-Control`. The browser asks for `no-store`,
but that does not constrain direct consumers or intermediaries; comparable
private figure responses already set `private, no-store`.

**Remediation status.** Fixed. Posting list/detail success and detail 404
responses set `Cache-Control: private, no-store`; direct and automated checks
cover the headers.

### S09 — Medium — Concurrent login failures bypass the intended threshold

The synchronous FastAPI endpoint checks shared failure lists before password
verification and records the failure afterward without a lock. Concurrent
requests can all pass the same pre-check before any records are visible.
Existing tests are serial and do not refute the thread-pool race.

**Remediation status.** Fixed. Rate check, password verification, and mutation
are serialized under a lock. Concurrent and complete API suites pass.

### S10 — Medium — Posting-detail expiry does not relock Explore

`PostingDrawer` renders a raw fetch error when `fetchPosting` raises
`AuthError`; unlike the list and builder flows, it does not invoke the Explore
lock. A session that expires after the list loads can therefore leave the
workspace visibly unlocked while detail access has failed.

**Remediation status.** Fixed. Posting-detail `AuthError` closes the sheet and
invokes the shared Explore lock. The expired-detail journey returns to the
password gate.

### S11 — Medium — Failed logout creates false client state

The auth provider clears local authentication in `finally`, even if the logout
POST fails and the HttpOnly server cookie remains valid. The UI hides team
controls while the server still considers the session authenticated, and a
reload reverses the apparent logout.

**Remediation status.** Fixed. Failed logout preserves the verified client state
and surfaces a localized retry error; the failure-path journey confirms Explore
remains available before and after reload.

### S12 — Low — French routes keep English document metadata

All routes except Developers use static English title/description metadata.
After switching to French, the body and `lang` change but the browser title and
share metadata remain English.

**Remediation status.** Fixed. Each route now generates metadata from the active
locale. The French Method journey confirms `lang=fr` and `Méthode · ACLMR`.

### S13 — Low — Closing header overlays loses keyboard focus

The login popover and mobile navigation close on Escape without returning focus
to their trigger. If focus was inside a panel that becomes hidden/inert, the
keyboard user's navigation context is lost.

**Remediation status.** Fixed. Both overlays use a shared close path that
restores the appropriate trigger on Escape; keyboard journeys pass.

### S14 — Low — Failed charts keep a successful-chart accessible name

`RemoteFigure` visibly says that a chart is unavailable but retains
`role="img"` with the normal chart label. Assistive technology receives no
failure state.

**Remediation status.** Fixed. Render failures expose a live status and include
the unavailable state in the accessible label.

### S15 — Low — Plotly chart controls miss the minimum target size

In the running 390 px product, each visible Plotly Zoom and Reset button
measures 24 by 22 px. These are discrete controls, not inline-text exceptions,
and miss WCAG 2.2's 24 by 24 CSS-pixel minimum.

**Remediation status.** Fixed. Every measured modebar control is now 24 by 24
CSS pixels in the 27-case responsive route matrix.

### S16 — Low — Negative lookup arguments disable privacy/storage bounds

The CLI accepts negative `--posting-lookup-limit` and
`--posting-lookup-recent-months`; downstream code treats non-positive values as
unlimited/all-history. A simple operator typo can materialize the full private
corpus including descriptions.

**Remediation status.** Fixed. CLI parsing and defensive programmatic validation
reject negatives; zero remains the documented explicit unbounded value.

### S17 — Medium — Private posting descriptions contain mojibake

The settled 390 px Browser detail sheet for posting `65561073` rendered common
double-decoding artifacts including `multiâ€‘phase` and `ambition â€”`. The
surrounding sheet, scrolling, and semantics are sound; the stored lookup text is
not. This directly weakens the private verification purpose and is not a visual
animation artifact.

**Remediation status.** Fixed. Lookup materialization repairs recognized
UTF-8/Windows-1252 damage and decodes literal HTML character entities in all
displayed private text fields. Regression fixtures preserve already-valid
French/Unicode. The Browser-discovered `&#201;cole` case was added to the same
boundary and the current private lookup was rebuilt before the final journey.

### S18 — Medium — Standalone lookup rebuild truncates the live index

During the fresh candidate rebuild, `posting_lookup.parquet` became a visible
0-byte file while DuckDB was still scanning/materializing the new 100,000-row
index. The standalone command writes directly to the live path, so Explore can
fail or an API restart can reject the lookup for the duration of a normal
operator refresh.

**Remediation status.** Fixed. The command writes a unique sibling staging file,
forces a DuckDB read, atomically replaces the live path, and cleans up on error.
A fault-injection test preserves the last-known-good file and leaves no residue.

### S19 — High — The production lockfile installs high-severity web dependencies

`npm audit --omit=dev` against the candidate lockfile reports four high-severity
advisory groups: Next 16.2.9, its bundled PostCSS and Sharp versions, and the
locked Nano ID version. Several individual Next advisories concern features
this app does not expose (for example Server Actions), but the deployed public
runtime still installs the affected framework and image/proxy code. The
registry's non-breaking patched release is Next 16.3.0; leaving a known affected
public framework pinned is not release-ready.

**Remediation status.** Fixed. Next and its paired lint config are pinned to
16.3.0, the lockfile was refreshed, both complete and production-only audits
report zero vulnerabilities, and lint, typecheck, production build, package
render, and browser compatibility checks pass on the upgraded runtime.

### S20 — Medium — The installed public LaunchAgent omits the proxy hardening

The isolated candidate and repository Docker entrypoint launch Uvicorn with
`--no-proxy-headers`, but the actual external production owner at
`/Users/brucenguyen/Library/LaunchAgents/com.aclmr.jobads-dashboard-public.plist`
still starts `api.main:app` without that flag. Deploying the code and merely
restarting this current service definition would therefore re-enable Uvicorn's
pre-FastAPI trust of client-forged forwarding headers and recreate S05.

**Refutation attempted.** The repository command and regression test correctly
protect Docker-shaped publication, but they cannot alter or prove the installed
Mac service definition. The user explicitly forbids modifying production during
this groundwork audit. Admitted as a cutover configuration blocker rather than
a candidate-code defect.

**Remediation status.** Fixed during the authorized 2026-08-12 cutover. The
external plist was backed up, updated with `--no-proxy-headers`, validated, and
used to restart only the public dashboard service. The public-tunnel regression
probe sent ten wrong passwords with ten rotating forged forwarding headers and
received eight `401` responses followed by two `429` responses. Current
deployment evidence is in `evidence/deployment-2026-08-12.md`.

## Final verification

- Full Python suite: 362 passed; one pre-existing Starlette deprecation warning.
- Fresh adversarial focused recheck: 118 passed.
- ESLint, TypeScript, Next 16.3.0 webpack production build, shell syntax, and
  `git diff --check`: passed.
- Complete and production-only npm audits: zero vulnerabilities.
- Derived data validation: 25,356,735 postings reconciled; source window and
  schemas valid. Private lookup: 100,000 rows, staged atomic publication, known
  encoding-pattern scan clean, and live `École`/`multi‑phase` rendering verified.
- Live QA: 27/27 route/viewport cases passed at 390, 768, and 1440 pixels with
  no page overflow, unavailable chart, missing heading, non-abort request error,
  or console error. Real public, French, authenticated, no-results, paging,
  drawer, builder, logout-failure, expiry, and API-down journeys passed.
- Security runtime: anonymous and forged `full=1` remained at 8 categories;
  verified team returned 11 with private no-store responses. Forged forwarding
  headers reached the eight-failure limit and then returned 429.
- Portable package: 16/16 previews rendered; direct contact-sheet inspection
  confirmed the official logo, navy summary card, and Figure composition.
- Canonical `463d919a` was already incorporated; no refresh merge was needed and
  canonical `8522`/`8530` remained healthy throughout.

## Rejected candidates

- Next speculative RSC prefetches produced 147 `ERR_ABORTED` events across the
  27-case route matrix. All were browser cancellations; there were no non-abort
  request failures or console errors.
- Public Pulse remains useful when the API is unavailable because its build-time
  public data is already present. Explore shows a clear protected-service error.
- Footer inline links and the skip link are not discrete target-size failures;
  the Plotly toolbar buttons are.
- Health endpoints intentionally express process liveness, not data readiness.
- The categorical-cap scan found no anonymous chart above the public ten-item
  boundary; time axes and treemap roots are exempt.
- Missing private lookup data intentionally produces a controlled 503.
- The existing request-key guards refute stale Explore rows and chart races;
  Plotly disposal and resize cleanup are present.
- The absence of a committed browser suite is a regression-risk gap, not a
  separate user-visible defect; this audit retains repeatable black-box evidence
  and will add only proportionate permanent coverage.
