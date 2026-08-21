# MEMORY

Last condensed: 2026-08-20

<!-- Bounded historical index. Read STATUS.md for live state. -->
<!-- Oldest to newest; inspect dated files within a section's range for detail. -->
<!-- Target: 80 lines / 6 KiB. Maximum: 100 lines / 8 KiB. -->

## 2026-03-24 to 2026-03-29 | Standalone foundation

- `jobads-dashboard` became the independent implementation home, with canonical
  upstream parquet inputs and runtime data under `data/derived/`. Streamlit first
  established the aggregate, validation, filtering, and deployment contracts.

## 2026-06-02 to 2026-06-11 | Explore, data, and hosting

- Explore added curated aggregate questions and bounded posting lookup without
  arbitrary SQL, bulk raw-text export, or a dependency on `ai_labor`.
- The aggregate package reconciled 25,356,735 postings from 164 files covering
  `2016-01-01` through `2026-03-31`. [Refresh record.](memory/2026-06-02.md)
- Mac Mini hosting, password gating, posting detail, and persistent tunnelling
  were established. Secrets stay outside Git; tunnel URLs require live checks.

## 2026-06-20 to 2026-06-25 | Current architecture and access contracts

- The product moved to Next.js plus FastAPI while preserving precomputed
  aggregates and the Python Plotly layer. The public topology became FastAPI
  `8530`, Next `8522`, and a Cloudflare quick tunnel; `/healthz` is web health.
- Public charts adopted the Vicinity Jobs 10-category limit through shared cap
  helpers. Only a verified session can request uncapped, private, no-store
  figures. [Cap job.](docs/jobs/done/2026-06-25-ten-category-cap/JOB.md)
- Audit remediation hardened escaping, Markdown, schema validation,
  partial-bundle behavior, denominators, and visual craft.

## 2026-06-29 to 2026-07-06 | Tunnel recovery

- The Cloudflare LaunchAgent uses `--config /dev/null`; quick-tunnel hostnames
  rotate and must be recovered from the live log rather than memory.
- Keychain lookup failures blocked password-bearing outreach; plaintext
  passwords and password hashes remain forbidden from project records.

## 2026-08-11 | Canonical design line and operating system

- The project adopted the current STATUS/MEMORY/dated-record/job split. The
  migration was committed as `f2a11741`; `main` then moved to the Next/FastAPI
  design line with the retired Streamlit history preserved by a backup ref.
- Fourteen real presentational components were published to Claude Design using
  the hand-maintained `.design-sync/` boundary. The later local package expanded
  to 16; the remote package still awaits separately authorized republication.
- The downloaded exploration gained a durable, ACLMR-aligned home under
  `docs/analyses/labor_market_dashboard/redesign-foundation/`: official logo,
  PT Sans, verified desktop targets, brand audit, and explicit mobile gates.

## 2026-08-11 to 2026-08-12 | Redesign, audit, and production release

- The isolated `codex/dashboard-redesign-production` branch migrated all nine
  routes to the official navy/cream ACLMR system, responsive Plotly language,
  and dark authenticated Explore workspace. Mobile targets and downloaded
  Mobbin references are preserved with the job.
- Whole-system convergence repaired 19 product/code defects across mobile
  figures, localization/auth states, accessibility, privacy/cache/rate limits,
  atomic data publication, lookup freshness/text integrity, dependencies, and
  portable-package fidelity. The candidate passed 362 Python tests, Next 16.3
  lint/type/build, zero-vulnerability audits, 27/27 live checks, data/security
  probes, and 16/16 package renders; fresh adversarial review found no blocker.
- Authorized cutover fast-forwarded local `main` to `b7bebe5b`, preserved
  `backup/main-pre-dashboard-redesign-20260812-463d919a`, backed up and hardened
  the LaunchAgent with `--no-proxy-headers`, rebuilt Next, and restarted only the
  dashboard service. The existing tunnel remained live and the deployed release
  passed EN/FR, auth, cap, cache, throttle, responsive, and visual checks.
- `origin/main` was not pushed because Render authority is expired and its
  reachable hostname appears to serve an older Streamlit build. The missing
  Keychain entry remains a credential-ownership hardening follow-up.
- A deployed copy/palette pass shortened all EN/FR route and chart language,
  restored posting-accurate terminology, reduced dates to one per analytical
  page, and aligned primary navy-surface text with live ACLMR white. Live QA
  also found persistent Next public fetch data, so production builds now clear
  only `.next/cache/fetch-cache` before building. [Release record.](memory/2026-08-12.md)

## 2026-08-13 to 2026-08-18 | Public takedown

- At Bruce's request, the local Next/FastAPI service and both public tunnels
  were disabled and unloaded. Their former Cloudflare and ngrok URLs now fail.
- The historical Streamlit service was then suspended through the authorized
  Render dashboard; its public URL returns `503`. All known dashboard endpoints
  are offline. No indexed result was found for the tunnel hostnames, and
  available local tunnel records do not establish any external dashboard page
  view. [Initial takedown.](memory/2026-08-13.md)
  [Completion.](memory/2026-08-18.md)

## 2026-08-20 | Explore discoverability

- Explore is visible in public navigation but opens the existing team sign-in
  gate; private APIs and uncapped figures remain session-protected. The local
  stack was relaunched without enabling public tunnels. [Record.](memory/2026-08-20.md)

## Rebuild rule

- Rebuild from dated records and owning evidence. Condense oldest adjacent spans
  first and retain exact claims with direct links when they aid verification.
