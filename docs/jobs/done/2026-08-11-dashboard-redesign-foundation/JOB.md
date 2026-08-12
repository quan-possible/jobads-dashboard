# Job: Establish the dashboard redesign foundation

## Goal

Give the contents of `Dashboard design exploration 2` a durable, intelligible
home in this repository and make the package a trustworthy ACLMR-branded
foundation for the next dashboard redesign.

## Scope

- preserve the source design directions, high-fidelity prototypes, exported
  tokens/components/guidelines, and click-through reference UI kit;
- separate approved redesign direction from current-product recreation and
  reusable design-system material;
- audit the rendered desktop surfaces and responsive scope against the current
  ACLMR.ca visual language and the dashboard's product constraints;
- correct material design-language, portability, or organization defects in
  the preserved package while retaining the supplied editorial content;
- do not implement the redesign in the production Next.js app in this job.

## Final state

- Complete on 2026-08-11.
- The permanent package is
  `docs/analyses/labor_market_dashboard/redesign-foundation/`.
- Its top-level README separates the high-fidelity visual targets, earlier
  directions, portable design system, source-state UI kit, provenance, and
  brand audit.
- The ACLMR design contract now distinguishes square analytical controls from
  rounded primary navigation/access CTAs, matching the live site without
  flattening the dashboard-specific data-control grammar.
- Prototypes use the vendored PT Sans files and carry stable page titles and
  language metadata. Supplied editorial content is unchanged.
- The source download remains intact for recovery.
- No file under `web/`, `api/`, or `src/` changed; no service or deployment was
  restarted or rebuilt.

## Evidence

- Source package manifest:
  `docs/analyses/labor_market_dashboard/redesign-foundation/SOURCE.md`.
- Current product/design-sync operating source: `.design-sync/NOTES.md`.
- Canonical product and metric contract:
  `docs/analyses/labor_market_dashboard_spec/report.md`.
- Final render evidence is preserved under
  `docs/analyses/labor_market_dashboard/redesign-foundation/evidence/screenshots/`.

## Verification

- Inspected the live ACLMR site and its primary CTA geometry at desktop size.
- Rendered the durable Pulse target, Explore target, revised controls specimen,
  and source-state UI kit through a local server.
- Confirmed the prototypes load PT Sans locally and no longer depend on Google
  Fonts; the design-document renderer itself still loads its runtime from
  `unpkg.com`.
- Confirmed the Pulse and Explore desktop compositions remain visually intact
  after relocation.
- Confirmed the high-fidelity prototypes are fixed-width desktop targets. The
  production redesign still needs project-specific mobile targets before
  implementation; this is recorded in `BRAND_AUDIT.md` and is not treated as a
  completed responsive design.

## Remaining work

- When implementation begins, create and approve mobile Pulse and Explore
  targets, then map the current production behavior onto the desktop and mobile
  designs.
