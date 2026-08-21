# Explore workspace slice

Owner: Explore route and authenticated workspace worker. Updated 2026-08-11.

## Scope completed

- Reframed `web/app/explore/page.tsx` as a dark institutional team workspace
  while keeping the real server-rendered metadata bounds, `AuthGate`, shared
  `FilterSpine`, and bilingual copy unchanged.
- Added the scoped `web/components/explore/explore.module.css` module for the
  Explore-only hero, gate, builder/results treatment, responsive result rows,
  and desktop drawer/mobile bottom sheet. It is intentionally limited to
  Explore-specific layout and tone rules and reuses global ACLMR tokens.
- Kept `ExploreTabs` accessible (tab roles, keyboard arrows/Home/End) while
  making the bounded posting lookup the initial task view, matching the
  results-first mobile target.
- Preserved credentialed, `no-store` calls and mid-session relock behavior in
  `ExploreBuilder`, `ExploreView`, and `PostingDrawer`. Loading is derived from
  request keys so React's set-state-in-effect lint rule is not bypassed; stale
  data is cleared before an error is resolved.
- Replaced the desktop-only posting table on small screens with touch-sized
  result rows; the existing focus-trapped posting detail is a side drawer on
  desktop and a rounded bottom sheet on mobile. Escape, backdrop dismissal,
  focus restore, body-scroll locking, loading, empty, error, retry, and no-
  description states remain available.
- Deferred the initial auth status refresh in `web/lib/auth/provider.tsx` to
  preserve the loading transition without a synchronous effect state update.
- Wrapped `web/app/explore/error.tsx` in the dark Explore surface.

## Verification

- `npm --prefix web run lint` — pass.
- `npx tsc --noEmit` from `web/` — pass.
- `npm run build` from `web/` — pass; `/explore` remains dynamic.
- Canonical `8522`/`8530` services and the Cloudflare tunnel were not restarted,
  rebuilt, or deployed.

## Integration notes

- The parent owns the preview/browser visual pass and should compare the
  assembled authenticated route at desktop and 390 px against the approved
  Explore targets. This worker could not use the bundled Playwright CLI because
  the `@playwright/mcp` executable is unavailable in the current environment.
- `FilterSpine` remains cross-owned; its existing dark/responsive implementation
  is integrated visually but was not edited here.
