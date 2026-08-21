# MEMORY

Last condensed: 2026-08-21

<!-- Bounded historical index. Read STATUS.md for live state. -->
<!-- Oldest to newest; inspect dated files within a section's range for detail. -->
<!-- Target: 80 lines / 6 KiB. Maximum: 100 lines / 8 KiB. -->

## 2026-03-24 to 2026-03-29 | Standalone foundation

- `jobads-dashboard` became the independent implementation home, with canonical
  upstream parquet inputs and runtime data under `data/derived/`. The initial UI
  established the aggregate, validation, filtering, and deployment contracts
  later carried into the current product.

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
  helpers. Only an authenticated session can request uncapped private,
  no-store figures. [Cap job.](docs/jobs/done/2026-06-25-ten-category-cap/JOB.md)
- Audit remediation hardened escaping, Markdown, schema validation,
  partial-bundle behavior, denominators, localization, and visual craft.

## 2026-06-29 to 2026-07-06 | Tunnel recovery

- The Cloudflare LaunchAgent uses `--config /dev/null`; quick-tunnel hostnames
  rotate and must be recovered from the live log rather than memory.
- Keychain lookup failures blocked password-bearing outreach; plaintext
  passwords and password hashes remain forbidden from project records.

## 2026-08-11 to 2026-08-12 | Canonical design and production release

- The project adopted the current STATUS/MEMORY/dated-record/job split and made
  the Next.js/FastAPI product the canonical `main` line.
- The nine routes moved to the official navy/cream ACLMR system, responsive
  Plotly language, and dark authenticated Explore workspace. The durable visual
  reference lives under
  `docs/analyses/labor_market_dashboard/redesign-foundation/`.
- Whole-system convergence repaired product, responsive, localization, auth,
  accessibility, privacy/cache/rate-limit, atomic-publication, lookup, and
  portable-package defects. Verification covered Python tests, Next build,
  EN/FR routes, auth, cap, cache, throttle, responsive, data, and security paths.
- The deployed copy/palette pass made page and chart language concise and
  posting-accurate, localized Plotly chrome, and cleared only Next's public fetch
  cache before production builds. [Release record.](memory/2026-08-12.md)

## 2026-08-13 to 2026-08-18 | Public takedown

- At Bruce's request, the local production service and public tunnels were
  disabled and unloaded. The old Render service was suspended and returns
  `503`; all known public endpoints remain offline. [Initial takedown.](memory/2026-08-13.md)
  [Completion.](memory/2026-08-18.md)

## 2026-08-20 to 2026-08-21 | Discoverability and single-version cleanup

- Explore became visible in public navigation while retaining its page gate;
  private APIs and uncapped figures remain session-protected. The local stack
  was relaunched without public tunnels. [Discovery record.](memory/2026-08-20.md)
- Bruce authorized publication and removal of obsolete dashboard versions. The
  canonical specification and private runbook now describe only Next.js/FastAPI;
  stale UI captures and launch configuration were removed; completed or
  superseded jobs left the active tree; obsolete local and remote branches plus
  the redesign worktree were removed. Git history remains the recovery path.
  [Cleanup record.](memory/2026-08-21.md)

## Rebuild rule

- Rebuild from dated records and owning evidence. Condense oldest adjacent spans
  first and retain exact claims with direct links when they aid verification.
