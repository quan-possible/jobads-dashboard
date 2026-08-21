# Shell / Pulse worker handoff

## Scope completed

- Added the approved white ACLMR wordmark at `web/public/aclmr-logo-white.svg`
  and made `Brand` use it instead of the decorative pixel mark.
- Reworked the shared `TopNav`, `TopNavAuth`, `LocaleToggle`, and `Footer` to
  use the dark institutional masthead, gradient transition rail, official
  identity, ACLMR access-pill family, and a deliberately compact mobile menu.
  Explore remains hidden until the real authenticated session is present.
- Fixed `PixelTiles`' upper clamp so all four brand stops can be selected.
- Added shared shell/Pulse tokens and responsive rules in `globals.css`,
  including cream reading field, dark hero, numbered section rhythm, dark
  summary panel, focus treatment, reduced motion, and page overflow clipping.
- Migrated Pulse's real dynamic hero, KPI, figure, key-point, and deep-chart
  data flow onto the approved dark-hero / cream-field composition. KPI values,
  figures, copy, i18n, auth, and cap behavior remain production-owned.
- Added a `tone` option to `KeyPoints`, a shared figure hook class, and the
  overlapping KPI treatment used by Pulse.

## Checks

- `npx tsc -p web/tsconfig.json --noEmit` — passed.
- `npm --prefix web run build` — passed (Next 16.2.9 / Turbopack; all routes
  compiled and generated successfully).
- `npm --prefix web run lint` — blocked by pre-existing/current-tree errors in
  `ErrorCard`, `RemoteFigure`, Explore components, auth provider, and the
  existing `LocaleToggle` cookie write rule; one unrelated Method warning also
  remains. The new TopNav direct state effect was removed to avoid introducing
  an additional lint error.
- Preview port `8520` was already occupied by the shared preview process; a
  direct `curl` to `/` and `/healthz` returned the redesigned route and
  `{"status":"ok","service":"web"}`. No canonical 8522/8530 service was
  restarted or deployed.

## Coordination notes

- `FilterSpine` still uses its existing `top-16` sticky offset. The shell keeps
  its layout height at 64 px and positions the gradient rail inside that height
  so Explore's existing toolbar does not jump; verify the assembled Explore
  surface after integration.
- Complete-surface visual inspection at 390 px and desktop remains for the
  parent/integration pass; the approved target images and Mobbin mobile
  references were inspected directly before implementation.
- The worktree contains unrelated concurrent edits in other route/component
  owners. Do not revert them while integrating this shell/Pulse work.
