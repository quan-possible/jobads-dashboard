# Deep audit 2026-06-23 — design craft & UX

**Branch:** `redesign2` · **HEAD:** `653edd01` · **Status:** OPEN (audit only)

Craft/standards judgments (is it *good?*), distinct from the defects in `findings.md` (is it *broken?*). Each names the standard it misses + the screen/element. The design system remains strong (coherent warm-cream/navy/teal/orange tokens, named heading scale, CVD-safe sequence, visible focus, reduced-motion, the editorial all-caps hero applied consistently); these are polish/consistency calls. Fixes in `fix-spec.md`.

## Standards applied
Typography · spacing/layout · colour & contrast · hierarchy & emphasis · consistency · states · affordance & feedback · motion · content & microcopy · responsiveness.

## Priority tally
| P1 | P2 | P3 |
|---|---|---|
| 0 | 5 | 4 |

(No P1: nothing here blocks comprehension or use. The TunableFigure year-picker a11y — which one auditor rated P1 — is filed as a defect, `S13`.)

---

### U01 · P2 · Typography — small-text sizes still bypass the scale (persists from prior `U01`) · `web/app/globals.css:152-193` + components throughout
The named scale (`eyebrow`/`h-display`/`h-section`/`h-card`/`lede`) is clean, but body/label/caption text is still set with **~21 distinct arbitrary `text-[0.xx rem]` values** across `KpiTile`, `Figure`, `Brand`, `CoverageBar`, the explore components, etc. — many within a hair of each other. **Why off:** near-duplicate sizes create unsystematic rhythm and make changes error-prone. **Fix:** collapse to ~3 tokenized small-text steps (`--text-caption`, `--text-body-sm`, `--text-body`) and replace the arbitrary values. (The HEAD redesign added more one-offs — `TunableFigure` uses `text-[0.7rem]`/`text-[0.72rem]`, `ExploreBuilder` `text-[0.62rem]`/`0.78`/`0.86`/`0.9rem`.)

### U02 · P2 · KPI strip — delta convention still inconsistent across the four tiles (persists from prior `U03`, partially improved) · `web/app/page.tsx:97-130` + `web/components/KpiTile.tsx:64-76`
Postings Index and Active Postings show ▲/▼ + % chips; "Vs Last Year" shows a bare big ▼7.6% as the value itself (no chip); Median Wage shows no delta at all. **Why off:** the eye expects one "number + trend chip" grammar across a KPI row. **Fix:** pick one convention (give the YoY tile the same chip treatment, or drop chips and rely uniformly on colour+sign).

### U03 · P2 · Charts — axis/legend font falls back to system-ui (persists from prior `U04`) · `src/jobads_dashboard/viz/theme.py:117`
The figure theme requests a font the web app doesn't load, so every Plotly axis/label/legend renders in the browser's `system-ui` fallback — visibly different from the surrounding PT Sans UI. **Fix:** set the figure font family to the app's `--font-sans` stack so chart text matches its card.

### U04 · P2 · Explore — FilterSpine labelled "across the dashboard" but only drives Explore · `web/lib/i18n/dict/filter.ts:5` + `web/components/FilterSpine.tsx:16`
The sticky filter bar reads "FILTER ACROSS THE DASHBOARD," but after the editorial redesign the curated pages carry **no** global scope — the spine only feeds the Explore builder + Find-postings. **Why off:** the label over-promises and misleads about what the control affects (content accuracy / progressive disclosure). **Fix:** reword to "Filter the Explore views" / "Filtrer les vues Explorer" (or similar) so it describes its real reach.

### U05 · P2 · Explore — "Download CSV" can silently export stale data while the chart reloads · `web/components/explore/ExploreBuilder.tsx:56-58,106,157-164`
The CSV button stays enabled during a refetch (it's gated on `hasTrace`, not on `loading`), so clicking it mid-update downloads the **previous** figure's data while the chart visibly changes. **Why off:** visibility-of-system-status + data honesty — the file silently disagrees with the chart in flight. **Fix:** disable the button while `loading`, or name the file with the active (dim, measure, window) so a stale download is at least self-labelling.

### U06 · P3 · Brand tagline below comfortable legibility (persists from prior `U08`, partially improved) · `web/components/Brand.tsx:15`
The "LABOUR MARKET" tagline is still near the practical minimum for sustained legibility on the cream canvas. **Fix:** raise the size slightly or increase tracking/weight.

### U07 · P3 · Geography CMA bar chart encodes province as categorical colour — visual noise · `src/jobads_dashboard/viz/figures/geography.py:129-138`
The "biggest metropolitan labour markets" ranked bars use a multi-hue province-coded palette (green/red/orange/tan/navy/purple) for what is a single-measure ranking. **Why off:** data-viz honesty/perceptual clarity — colour should encode a dimension the reader needs, not decorate a one-measure bar; the rainbow implies a grouping that isn't being asked about. **Fix:** use one brand hue (or a sequential ramp on the measure), and if province grouping matters, sort/segment by it explicitly.

### U08 · P3 · Explore builder chart uses `<figure>` with no `<figcaption>` · `web/components/explore/ExploreBuilder.tsx:155-169`
The builder wraps its chart in a semantic `<figure>` but provides no `<figcaption>` (the curated charts always pair the two via `Figure.tsx`). **Why off:** HTML semantics / consistency — a captionless `<figure>` is a loose end, and the builder chart has no visible title/caption naming what it shows. **Fix:** add a `<figcaption>` echoing the current (breakdown × measure × window), which also gives the chart an accessible name.

### U09 · P3 · AuthGate "checking" / "error" phases lack the card structure of the open state · `web/components/explore/AuthGate.tsx:58-63,97`
The unlocked gate renders a designed card; the loading ("checking…") and error phases are comparatively unstructured text. **Why off:** consistency / visibility-of-system-status — the non-open phases read as unfinished next to the polished locked/open cards. **Fix:** wrap all phases in the same card shell with consistent spacing.
