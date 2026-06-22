# redesign2 deep audit — design craft & UX

**Branch:** `redesign2` · **Date:** 2026-06-22 · **Status:** OPEN (audit only)

These are craft/standards judgments (is it *good?*), distinct from the defects in `findings.md` (is it *broken?*). Each names the standard it misses and the screen/element. The design system itself is strong — `globals.css` defines a coherent token set (warm cream canvas, navy/teal/orange brand, named heading scale, CVD-safe categorical sequence, AA-annotated colours, visible focus rings, reduced-motion honored) and the editorial all-caps hero treatment is applied consistently. Fixes in `fix-spec.md`.

## Standards applied
Typography · spacing/layout · colour & contrast · hierarchy & emphasis · consistency · states · affordance & feedback · motion · content & microcopy · responsiveness — per the deep-audit rubric.

## Priority tally
| P1 | P2 | P3 |
|---|---|---|
| 0 | 5 | 4 |

(No P1: nothing here blocks comprehension or use; these are polish/consistency calls.)

---

### U01 · P2 · Typography — small-text sizes bypass the scale · `web/app/globals.css:145-188` + components throughout
**Standard:** one consistent type scale, not many ad-hoc sizes. The named scale (`eyebrow`/`h-display`/`h-section`/`h-card`/`lede`) is clean, but body/label/caption text is set with ~12 one-off arbitrary values across components — `text-[0.62rem]`, `0.68`, `0.7`, `0.72`, `0.74`, `0.76`, `0.78`, `0.82`, `0.85`, `0.86`, `0.88`, `0.9rem` — many within a hair of each other. **Why it reads off:** near-duplicate sizes create subtle, unsystematic rhythm and make future changes error-prone. **Fix:** collapse to ~3 tokenized small-text steps (e.g. `--text-caption`, `--text-body-sm`, `--text-body`) and replace the arbitrary values.

### U02 · P2 · KPI tile — sparkline crushed at mobile · `web/components/KpiTile.tsx:45-64` · **[hand-verified]**
**Standard:** responsiveness + consistency of a repeated component. The delta chip and the sparkline share one flex row (`sparkline = flex-1, width:100%`). On a ~165px mobile tile (2-col grid) a long `deltaLabel` ("vs baseline", "MoM") consumes the row and squeezes the sparkline to near-zero — live, the Demand-Index sparkline effectively vanishes and Active-Postings' is cramped against "MoM", while the bottom two tiles (no long label) show clean full-width sparklines. **Fix:** at narrow widths stack the sparkline on its own row beneath the delta (or give it a min-width and wrap).

### U03 · P2 · KPI strip — inconsistent delta convention across the four tiles · `web/app/page.tsx:94-127` (+ `KpiTile`)
**Standard:** consistency / hierarchy. Two tiles show ▲/▼ + % chips (Demand Index, Active Postings); the third (VS Last Year) shows a bare sign-prefixed value `−7.6%` with no arrow/colour chip; Median Wage shows no delta at all. **Why it reads off:** the eye expects the same "number + trend chip" grammar across a KPI row. **Fix:** pick one convention — either give the YoY tile the same ▲/▼ colour chip, or drop chips and rely on colour+sign uniformly.

### U04 · P2 · Charts — axis/label font falls back to system-ui in the browser · `src/jobads_dashboard/viz/theme.py:121`
**Standard:** consistency (type system end to end). The figure theme requests **Inter** for chart text, but the web app loads only **PT Sans**, so every Plotly axis/label/legend renders in the browser's `system-ui` fallback — visibly different from the surrounding UI type. **Fix:** set the figure font family to the app font (PT Sans / the CSS `--font-sans` stack) so charts match their cards.

### U05 · P2 · Explore hero uses a different layout template from every other page · `web/app/explore/page.tsx:14-19`
**Standard:** consistency of the page template. Every data page shares one hero pattern (eyebrow · big headline · lede); Explore diverges (filter spine above the hero, different heading rhythm), so it reads as a different product surface. **Fix:** align Explore's hero to the shared template, keeping the filter spine as a sticky sub-bar.

### U06 · P3 · Occupations treemap — the 18% "Unknown" block is unexplained · `web/lib/i18n/dict/page-occupations.ts:28` (treemap copy) · **[matches live capture]**
**Standard:** content/microcopy + hierarchy. "Unknown" is the 2nd-largest tile (110,651 / 18%) and visually competes with real occupation groups, with no caption explaining it's uncoded postings. **Why it reads off:** a reader can mistake "Unknown" for a category. **Fix:** add a one-line note ("Unknown = postings without an NOC code") and/or de-emphasize its colour and pin it last.

### U07 · P3 · No dark mode despite a dark token set existing · `web/app/globals.css:10-75` · **[hand-verified]**
**Standard:** states / light-dark parity. Under `prefers-color-scheme: dark` the app stays cream/white; meanwhile `viz/theme.py` ships an `aclmr_dark` template that's never used. **Why it reads off:** a partial dark system signals an unfinished feature. **Fix:** either add a dark token block + chart template wiring, or explicitly scope the product as light-only and drop/park `aclmr_dark` to remove the loose end. (Light-only is a legitimate choice — just make it intentional.)

### U08 · P3 · Brand tagline is below a comfortable readable size · `web/components/Brand.tsx:15`
**Standard:** typography / legibility. "LABOUR MARKET" tagline at `0.62rem` (~9.9px) is under the practical minimum for sustained legibility, especially on the cream canvas. **Fix:** raise to ≥0.7rem or increase tracking/weight.

### U09 · P3 · Skills hero title missing its terminal period · `web/lib/i18n/dict/page-skills.ts:11`
**Standard:** consistency of microcopy. Every other data-page hero ends in a period ("…BASELINE.", "…ABOUT PAY."); Skills ("WHAT EMPLOYERS ARE ASKING FOR") omits it. Trivial, but it's a visible inconsistency in the headline system. **Fix:** add the period (and mirror in FR).
