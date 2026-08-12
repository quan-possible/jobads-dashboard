# MEMORY

Last condensed: 2026-08-11

<!-- Bounded historical index. Read STATUS.md for live state. -->
<!-- Oldest to newest; inspect dated files within a section's range for detail. -->
<!-- Target: 80 lines / 6 KiB. Maximum: 100 lines / 8 KiB. -->

## 2026-03-24 to 2026-03-29 | Standalone dashboard foundation

- `jobads-dashboard` became the independent implementation home, with `../jobads-data/main/data/processed/<year>/processed_*.parquet` retained as the upstream source and `data/derived/labor_market_dashboard_v1/` as the local runtime-data boundary.
- The first Streamlit implementation established the aggregate refresh and validation contracts, fixed denominator and filtering errors, added operator-friendly failure states, and completed several responsive UI polish loops.
- Render deployment support was added, but the early service and health-route details belong to this historical Streamlit era rather than the current runtime.

## 2026-06-02 to 2026-06-11 | Explore, refreshed data, and Mac Mini hosting

- Explore added curated aggregate questions and a bounded posting lookup without arbitrary SQL, bulk raw-text export, or a runtime dependency on `ai_labor`.
- The local aggregate package was rebuilt from 164 canonical parquet files covering `2016-01-01` through `2026-03-31`, reconciling 25,356,735 postings. [See the refresh record.](memory/2026-06-02.md)
- Mac Mini hosting, password gating, a selected-posting full-description view, and persistent tunnel services were established. Secrets remain outside the repository; rotating tunnel URLs must be verified live rather than copied from history.

## 2026-06-20 to 2026-06-23 | Audit, redesign, and current runtime architecture

- Deep-audit remediation hardened query escaping, Markdown handling, schema validation, partial-bundle behavior, denominators, and visual craft; the detailed evidence remains in `docs/jobs/done/` and the dated records.
- The product moved from Streamlit to the current Next.js web app plus FastAPI service, while keeping the precomputed local aggregate boundary and Python Plotly figure layer.
- The persistent public topology became FastAPI on `127.0.0.1:8530`, Next.js on `127.0.0.1:8522`, and a Cloudflare quick tunnel to the web service. The former `/_stcore/health` route is obsolete; the web health route is `/healthz`.

## 2026-06-25 | Public category cap and authenticated team detail

- The public dashboard adopted the Vicinity Jobs 10-category presentation limit, using shared capping helpers and honest residual or regional grouping rather than per-chart hard-coding. The authenticated team view can request uncapped detail only through a verified session. [See the completed cap job.](docs/jobs/done/2026-06-25-ten-category-cap/JOB.md)
- Team login, uncapped server/client figure fetching, private no-store responses, Explore gating, bilingual disclosure, and the public-nav restriction were implemented and verified on `feat/login-uncapped`. [See the login job.](docs/jobs/active/2026-06-25-login-uncapped/JOB.md)

## 2026-06-29 to 2026-07-06 | Quick-tunnel recovery

- The Cloudflare LaunchAgent was changed to pass `--config /dev/null` so an unrelated named-tunnel configuration could not hijack this project's quick tunnel.
- Repeated checks confirmed that quick-tunnel hostnames rotate. The durable recovery path is the cloudflared LaunchAgent log plus live health checks, not any hostname preserved in memory.
- Password-bearing outreach remained blocked when the documented Keychain lookup failed; no plaintext password or hash belongs in project records.

## 2026-08-11 | Harness migration

- The repository adopted the current project-memory split: `STATUS.md` for live orientation, this bounded file for progressively condensed history, dated memory for chronological reconstruction, and jobs for detailed task continuity.
- The root `AGENTS.md` now keeps only project-specific hard boundaries and required product routing. The global memory contract and `README.md` retain generic startup, history, commands, and documentation ownership. The pre-migration `MEMORY.md` was preserved under `archive/memory/versions/` before condensation.
- The migration was committed as `f2a11741` and published with the new design line. On 2026-08-11, `main` was moved directly to that line at `65661304`; the obsolete 10-commit Streamlit/worktree-only line was deliberately not merged.

## 2026-08-11 | Components published as a design system

- The 14 presentational `web/components/` were imported into Claude Design so design work starts from the real shipped components. Because `web/` is an application rather than a package, the import needs hand-maintained inputs (`.design-sync/`, four dot-prefixed files in `web/`); `.design-sync/NOTES.md` owns that detail.
- The import surfaced a long-standing product bug: `PixelTiles` renders the brand mark solid navy, so the signature mosaic has never appeared anywhere in the product.

## 2026-08-11 | Dashboard redesign groundwork preserved

- The downloaded design exploration became the durable `docs/analyses/labor_market_dashboard/redesign-foundation/` package, separating the Pulse and Explore desktop targets, earlier directions, portable design system, source-state UI kit, provenance, and ACLMR brand audit.
- A repair pass made the package safe as redesign guidance: it vendors the exact live ACLMR logo with checksum provenance, keeps pixel tiles decorative, uses PT Sans throughout the selected targets, aligns the reusable navy navigation and both live CTA families, restores accessible trend and contrast cues, and removes unsupported colour-vision-safety claims.
- Fresh-context adversarial verification passed the combined desktop package. The current application and deployment remained unchanged; separate mobile Pulse and Explore targets are still required before implementation.
- The production implementation plan chose an in-place, component-first migration of the current nine-route Next.js/FastAPI app rather than a parallel replacement. Work remains gated on a trustworthy deployment baseline, approved mobile Pulse and Explore targets, and restored production-auth verification; the public site stays unchanged until one complete release candidate passes full visual, behavioural, and adversarial review.

## 2026-08-11 | Complete redesign candidate assembled

- The isolated `codex/dashboard-redesign-production` worktree now contains the complete nine-route ACLMR redesign: official brand shell, cream editorial public routes, responsive Plotly language, and a dark authenticated Explore workspace with mobile posting detail.
- Parent verification passed Python, lint, type, production-build, data-reconciliation, EN/FR route matrix, public/team cap, and authenticated Explore journeys. The canonical public services and tunnel were not changed.
- Production release remains a separate decision: fresh adversarial acceptance, the unavailable Keychain credential, and the ambiguous Render publication boundary must be resolved before integration or cutover.

## Rebuild rule

- Rebuild from dated records and owning evidence. When over budget, condense the oldest adjacent spans first and preserve exact claims with direct links where they materially aid verification.
