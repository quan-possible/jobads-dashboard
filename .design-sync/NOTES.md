# design-sync notes — ACLMR dashboard

Repo-specific gotchas for `/design-sync`. Read this before any re-sync.

## What this repo is (and why the setup looks unusual)

`web/` is a **Next.js application**, not a published component package. There is
no `dist/`, no package `exports`, no Storybook. Everything below exists to give
the converter the two things it normally gets for free from a library build: a
module that names the design system's public surface, and a `.d.ts` tree to
extract prop contracts from.

Three files under `web/` are design-sync inputs. They are committed, dot-prefixed,
and nothing in the app imports them:

- **`web/.ds-entry.tsx`** — the bundle entry. Re-exports the 16 synced components
  plus `I18nProvider` / `AuthProvider`, and defines `DsPreviewProvider`, the
  app-root stand-in that previews render inside (`cfg.provider`).
- **`web/.ds-process-shim.ts`** — imported FIRST by the entry. `web/lib/api.ts`
  reads `process.env.NEXT_PUBLIC_API_BASE` at module scope; Next inlines that at
  build time, but the DS bundle is plain browser JS, so without the shim the
  whole bundle throws `ReferenceError: process is not defined` on evaluation and
  every card comes up empty. Keep it as the entry's first import.
- **`web/.ds-tailwind-entry.css`** — the stylesheet entry. See "Tailwind" below.

Plus `web/tsconfig.ds.json` (declaration-only tsc project) and one line in
`web/package.json`: `"types": ".ds-types/.ds-entry.d.ts"`. The `types` field is
what points `findTypesRoot` at the generated declarations. **Next does not read
it** — removing it silently degrades every emitted `.d.ts` to an empty props
body, which is worse than a loud failure. Leave it.

## Entry imports must be RELATIVE, not `@/`

`web/.ds-entry.tsx` uses `./components/...`, not `@/components/...`, and this is
load-bearing. esbuild resolves the `@/` alias fine (via `cfg.tsconfig`), but the
ts-morph project that reads the emitted `.d.ts` has no path mapping — aliased
re-exports resolve to nothing, `exportedNames` returns 1 symbol, and the build
dies with `[ZERO_MATCH] no component exports`. If you ever see that error, check
this first.

## Rebuild order

`cfg.buildCmd` (run from `web/`) regenerates both derived inputs:

```
npx tsc -p tsconfig.ds.json && npx @tailwindcss/cli -i .ds-tailwind-entry.css -o .ds-tailwind.css
```

Both outputs (`web/.ds-types/`, `web/.ds-tailwind.css`) are gitignored — a fresh
clone MUST run this before `package-build.mjs` or the build has no types and no CSS.

## Tailwind v4: the shipped CSS is a deliberate superset

The app's real stylesheet is `web/app/globals.css`. Compiled Tailwind contains
only the utilities the scanned source already uses — but the design agent on
claude.ai/design writes NEW markup, so a bare compile would leave every
agent-authored layout unstyled. `web/.ds-tailwind-entry.css` imports
`app/globals.css` and adds `@source inline(...)` blocks that force the common
layout / spacing / type / colour utilities into the output (45 KB → 155 KB).

Two consequences:
- The vocabulary in the shipped CSS is intentionally WIDER than the app's. That
  is correct, not drift.
- If a design comes back unstyled for a class that exists in Tailwind, the fix is
  to widen the `@source inline` list in that file, not to change the app.

## Fonts

PT Sans reaches the app via `next/font/google`, so no font files exist in the
repo. They are vendored for the DS under `.design-sync/fonts/` (SIL OFL, latin +
latin-ext only — EN/FR) and wired via `cfg.extraFonts`. That file also defines
`--font-pt-sans`, which the app normally gets from `next/font`; without it every
card falls back to a system sans.

## Official logo asset

`Brand` imports `ACLMR_LOGO_DATA_URI` from `web/components/aclmrLogo.ts`. That
constant is the exact base64 encoding of `web/public/aclmr-logo-white.svg`
(SHA-256 `bd308c4d221076e515bad78093e68b460967180b96c5765855d9ea3a691a8217`).
Keep the self-contained source: a host-relative `/aclmr-logo-white.svg` works in
Next but renders broken inside the portable design bundle, which has no public
asset server.

## Render check without downloading Chromium

No `~/.cache/ms-playwright` on this machine, but Google Chrome is installed.
Install playwright without its browsers and point the check at Chrome:

```
cd .ds-sync && PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm i playwright
export DS_CHROMIUM_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

`DS_CHROMIUM_PATH` must be exported for `package-validate.mjs` and
`package-capture.mjs`. Without it they fail `[RENDER_SKIPPED]`.

## Authoring previews here

- **Unit conventions are per-component, not per-repo — read every source.**
  `KpiTile`'s `delta` / `valueTrend` are **percentage points** (`delta={18}` →
  "18%", `delta={0.18}` → "0.2%"; the app passes `demand_index - 100` straight
  through). `CoverageBar`'s `share` is a **0–1 proportion**. Same folder, opposite
  conventions. There is no house rule to lean on.
- A comment sitting between two `export const`s in a preview file bleeds into the
  PREVIOUS example block in the generated `.prompt.md`. Keep explanatory comments
  in one block at the top of the file.
- Preview cells import from `"web"` (the package name). The story-imports policy
  rewrites that to the bundle global before esbuild ever resolves it.
- **The sizing wrapper is not neutral.** Too tight a `maxWidth` manufactures
  defects that do not exist in the product (mid-phrase wraps that read as layout
  faults), and a grader reading only the sheet cannot tell the difference.
- **Decorative components need their context ported.** `Sparkline` and `PixelTiles`
  are `aria-hidden` and carry no text, so a bare cell has nothing for the "fonts
  and tokens applied" criterion to bind to. Reproduce a real surrounding
  composition (the `KpiTile` eyebrow+value pairing or `KeyPoints` heading) or the
  cell reads as an unstyled fragment.
- **A downscaled sheet is weak evidence for small or dense components.** 7–9px
  pixel tiles resolve to ~4px on the sheet; the historical PixelTiles colour bug
  was invisible there. For dense output, read the sheet and then verify out of band —
  crop to full resolution, or evaluate the component's own helper in node.

## Component behaviours worth knowing (found while authoring)

- **`CoverageBar` flips at `share < 0.4`** — bar and figure go from teal to orange
  to mark a field too sparse to read honestly. Its primary variant axis, and
  invisible from the prop names. Straddle the threshold in any preview.
- **`Sparkline` min-max normalises**, so a near-flat series is amplified to fill
  the height rather than drawn flat. Looks like a bug the first time.
- **`fmtCompact` has three branches** (<10k grouped integer, ≥10k "412.8k",
  ≥1M "1.3M"). Pass raw integers, never pre-formatted strings.
- **`ErrorCard` renders its own `container-x py-24`** — tall cells with a lot of
  vertical air is its real page-level layout, not a preview defect.
- **`ErrorCard` reads the locale cookie after mount** and `DsPreviewProvider` pins
  EN, so its FR half is unreachable from a static capture.
- **Only six Plotly trace types are registered** (`web/lib/plotly/index.ts`: bar,
  scatter, choropleth, heatmap, treemap, waterfall). Nothing else renders.
  `layout.height` wins over the `height` prop — set both or the card jumps.
  Avoid `yaxis.automargin` on horizontal bars in a narrow card; it shrinks the
  left margin until category labels sit on top of the bars.

## Historical PixelTiles defect — resolved in the redesign candidate

The original component clamped its gradient index at `Math.min(0.999, …)`, so
every tile resolved to the first navy stop. `web/components/PixelTiles.tsx` now
clamps at `STOPS.length - 0.001`; the decorative mosaic uses all four live ACLMR
stops. The component remains decoration, never the ACLMR identity mark. `Brand`
uses the official vendored wordmark, while `KeyPoints` and the Explore auth gate
are the real product contexts for `PixelTiles`.

## Scope

16 presentational components are synced, including the shared redesign grammar
in `RouteMasthead` and `SectionLead`. Deliberately excluded (see
`cfg.componentSrcMap` and `web/.ds-entry.tsx`): `RemoteFigure`, `TunableFigure`,
`FilterSpine`, `TopNavAuth`, `PostingDrawer`, and the whole `components/explore/`
suite. They fetch live API data or depend on auth/router state that has no
meaning in a design tool. `RemoteFigure` is still reachable *inside* the bundle
(MapToggle renders through it); it just has no card of its own.

## Card layout overrides

Three components need `cfg.overrides` to present correctly in the product's grid:

- **`TopNav`** — `cardMode: "single"`, `viewport: "1280x420"`. At the default
  900x700 the navigation and auth controls run out of horizontal room. That is a
  real responsive squeeze, not a preview artifact, but it
  is not the state worth showing. One export only: pathname, locale and auth all
  come from the pinned provider, so a second export would be byte-identical.
- **`Footer`** — `cardMode: "column"`. Renders whole at 900px; column is purely
  for the product grid card.
- **`MapToggle`** — `cardMode: "column"`. This one only appeared AFTER the
  `global` shim landed: while Plotly was silently failing, the cells were narrow
  failure notices and fit fine. A real chart is wider than a grid cell.

## Known render warns

<!-- Warn lines triaged as legitimate. A warn NOT listed here on a re-sync is new
     — look at it, then fix it or add it. -->

- None outstanding in the last published package. A redesign re-sync must reach
  a clean 16/16 after the two shared route components are added.
- Historical, resolved — do not re-chase: `[RENDER_THIN]` / `[RENDER_BLANK]` on
  unauthored components before previews existed, and `[GRID_OVERFLOW]` on
  MapToggle before its `column` override.

## Re-sync risks

- **The three `web/.ds-*` inputs are hand-maintained.** They enumerate components
  explicitly, so a component added to `web/components/` does NOT appear in the DS
  until someone adds it to `web/.ds-entry.tsx`. This is the single most likely
  way this sync goes stale.
- **`DsPreviewProvider` mocks Next internals** — it imports `AppRouterContext` and
  `PathnameContext` from `next/dist/shared/lib/*.shared-runtime`, which are
  private paths. A Next major upgrade can move or rename them, and the failure
  mode is every nav component rendering blank. Verified against Next 16.2.9.
  `web/AGENTS.md` warns that this Next version differs from training data —
  re-read the installed source, do not assume.
- **`AuthProvider` makes a real `authStatus()` fetch on mount.** In previews it
  fails and lands in the error state, which is a fine default look but means
  auth-dependent affordances render "locked". If the API base ever becomes
  reachable from the render environment, cards could start varying run to run.
- **The Tailwind safelist is a judgement call**, not a derived artifact. It will
  drift from what designs actually need. Revisit if agent output comes back
  unstyled.
- Only latin + latin-ext PT Sans subsets ship. Cyrillic content would fall back.
- **Silent-failure class: bare Node/webpack globals.** Two shipped so far
  (`process`, `global`), both found only by looking at rendered output. `global`
  was especially quiet — `RemoteFigure`'s defensive `.catch` converts the
  ReferenceError into a calm "chart temporarily unavailable" notice with an empty
  `pageErrs`, so it reads as missing data, not a bundler gap. **If a preview shows
  "chart unavailable", the bundle threw — it is not a data problem.** To diagnose:
  patch the two `.catch(() => setFailed(true))` sites in a *copy* of
  `_ds_bundle.js` to log, and serve that copy. Any new dependency can add another
  such identifier.
- **Everything is captured under a frozen clock and a dead API.** `Footer` renders
  `© 2024` against a real date of 2026, and `AuthProvider` always lands in its
  error state. Date- and auth-derived cards are therefore pinned to states the
  live site does not show. If either becomes reachable from the render
  environment, cards will start varying run to run.
- **Unreachable under static capture**, so never covered: FR locale for anything
  reading the locale cookie after mount (`ErrorCard`), `TopNav`'s authenticated
  state, mobile/hamburger layouts (Tailwind `md:` tracks viewport, not container,
  so a narrow wrapper crops instead of switching layout), hover/focus/drag states.
