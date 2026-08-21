# Shared redesign implementation context

## Goal

Implement the approved ACLMR redesign across the existing nine-route
Next.js/FastAPI dashboard in this worktree, preserving product behaviour and
keeping the current public deployment untouched.

## Authoritative inputs

1. `PLAN.md` — implementation and release boundaries.
2. `../../../analyses/labor_market_dashboard/redesign-foundation/prototypes/Pulse Hifi.dc.html`
   and `Explore Hifi.dc.html` — desktop visual targets.
3. `../../../analyses/labor_market_dashboard/redesign-foundation/BRAND_AUDIT.md`
   and `design-system/` — ACLMR design reference.
4. `../../../analyses/labor_market_dashboard_spec/report.md` — product and
   metric contract, interpreted with the current Next.js/FastAPI implementation
   and later project owners where the original v1 architecture is obsolete.

## Settled cross-scope decisions

- Keep the current app and data flow; do not build a replacement frontend.
- Keep the current dynamic hero copy and production values. Prototype content
  is illustrative.
- Preserve public 10-category caps and authenticated uncapped figures through
  existing server-side helpers and session verification.
- Preserve real Explore auth, bounded posting lookup, private no-store
  responses, i18n, filters, error states, and accessibility.
- Use PT Sans, the official ACLMR wordmark, dark navy structural anchors,
  restrained warm gradient rails, a cream public reading field, and a dark
  institutional Explore workspace.
- Pixel tiles are decorative, not identity. Fix the existing colour-selection
  bug, then keep the motif sparse.
- Analytical controls remain compact and square; meaningful navigation/access
  actions use the ACLMR pill families.
- No worker may edit `STATUS.md`, `MEMORY.md`, dated memory, `JOB.md`, or this
  file. The parent is their single writer.
- No worker may restart, rebuild, or deploy the canonical `8522`/`8530`
  services or touch the tunnel.
- Workers are not alone in the codebase. Do not revert others' edits; adapt to
  changes already present and escalate cross-owned interface changes.

## Approved responsive direction

- Mobile targets are preserved at `evidence/mobile-targets/`. They govern
  composition only; their generated values and wording are not production copy.
- `evidence/mobile-references/` preserves the Mobbin-only interaction evidence:
  compact dashboard module rhythm, narrow chart/breakdown alignment,
  search/filter/results hierarchy, and selected-record detail structure. Those
  screens teach mechanics only; do not copy their consumer branding, imagery,
  promotional treatments, or invented actions.
- Mobile Pulse keeps a compact dark masthead, readable hero, two-column KPI
  grid at 390 px, single-column numbered analytical sections, a full-width
  chart followed by the summary, and reflowing chart annotations/legends with
  no page-level horizontal scroll.
- Mobile Explore replaces the desktop split pane with a results-first list and
  a selected-posting bottom sheet. Filters collapse to a clear summary/action,
  search remains full-width, tabs stay visible, and list rows expose title,
  location, wage, and date as touch-sized targets.
- Tablet must be a deliberate intermediate composition, not a squeezed desktop.

## Verification expectations

- Focused checks within each worker scope.
- Full Python suite, lint, production build, and browser journeys after
  integration.
- Complete-surface desktop/mobile reference comparison and fresh Sol
  adversarial review before readiness.
