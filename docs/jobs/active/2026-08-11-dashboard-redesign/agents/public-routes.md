# Public routes worker handoff

## Scope completed

Migrated the seven non-Pulse public routes to the shared ACLMR redesign grammar:

- dark navy masthead with a restrained gradient rail and cream reading field;
- numbered editorial section leads with route-specific analytical group labels;
- dense Geography layout with responsive map/ranking pairs and decomposition sections;
- long-form Method and technical Developers layouts without a generic card wall;
- square analytical controls and preserved figure bridge, copy, i18n, cap, and failure/loading paths.

Shared owned components now live in `web/components/RouteMasthead.tsx` and
`web/components/SectionLead.tsx`. Existing route and component interfaces remain
compatible; the only optional extension is `Select`'s `tone="dark"` prop for the
Explore filter spine.

## Owned control changes

- `MapToggle`: selected labels use dark navy on a light/dark control treatment so
  compact selected text remains legible; tablist wraps without page overflow.
- `FilterSpine` / `Select`: dark institutional filter surface with square controls;
  `Select` keeps its light default for existing consumers.
- `TunableFigure`: compact square year controls with wrapping on narrow widths.
- `RemoteFigure`: figure containers clip internal chart overflow; failed state is
  tracked per figure identity so a later successful fetch can recover without a
  synchronous effect state reset.
- `CoverageBar`: clamps invalid share values and prevents fill overflow.
- `ErrorCard`: dark editorial fallback and hydration-safe locale snapshot.

## Checks

- Targeted ESLint over all changed routes/components: PASS.
- `npm --prefix web run build` (Next 16.2.9): PASS.
- Browser screenshots were attempted against an isolated-looking `8520` command,
  but the port was owned by the canonical `/Volumes/ACLMR/jobads-dashboard` process
  rather than this worktree. Do not treat those images as evidence for this pass;
  parent verification must use the true isolated preview on `8521`.

## Residuals for parent integration

- Run complete-surface desktop/mobile visual verification against the true `8521`
  preview, including French strings, API-down/loading/error states, and page-level
  horizontal overflow.
- Reconcile the two new shared components with any shell/global token changes;
  they intentionally use existing token names and do not modify `globals.css`.
- Full repository lint still reports pre-existing React hook findings in Explore
  and auth-provider owners; targeted changed-file lint is clean.
