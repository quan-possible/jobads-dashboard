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

## Current state

- Completed on 2026-08-11 after repairing the portable package and passing a
  fresh-context adversarial verification of the combined candidate.
- The official live ACLMR logo is now vendored with provenance and an exact
  source checksum; pixel tiles are decorative only.
- The portable navigation, CTA, typography, and accessibility guidance now
  agree with the selected desktop direction and the live ACLMR language.
- The current app and public deployment were not modified.

## Prior completed state

- Initially completed on 2026-08-11.
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
- Rendered and directly inspected the durable Pulse target, Explore target, and
  revised controls specimen through a local server; refreshed their evidence
  and removed the stale source-kit screenshot that showed the retired lockup.
- Confirmed the prototypes load PT Sans locally and no longer depend on Google
  Fonts; the design-document renderer itself still loads its runtime from
  `unpkg.com`.
- Confirmed the live and vendored official logo assets have the same SHA-256:
  `bd308c4d221076e515bad78093e68b460967180b96c5765855d9ea3a691a8217`.
- Parsed all 18 JSX files, resolved every local HTML reference and CSS token,
  ran `git diff --check`, and confirmed no change under `web/`, `api/`, or
  `src/jobads_dashboard/`.
- Rechecked CTA contrast (3.32:1 at 20 px bold; 7.06:1 on hover), MapToggle
  active contrast (5.25:1), KPI direction text, and the absence of unsupported
  colour-vision-safety claims.
- Confirmed the high-fidelity prototypes are fixed-width desktop targets. The
  production redesign still needs project-specific mobile targets before
  implementation; this is recorded in `BRAND_AUDIT.md` and is not treated as a
  completed responsive design.
- Fresh-context adversarial verification concluded the frozen package is ready
  as durable desktop redesign groundwork. It rejected the supplied Pulse hero
  wording as a task finding because the user explicitly excluded that copy from
  revision, and confirmed that no other readiness defect remained.

## Remaining work

- When implementation begins, create and approve mobile Pulse and Explore
  targets, then map the current production behavior onto the desktop and mobile
  designs.
