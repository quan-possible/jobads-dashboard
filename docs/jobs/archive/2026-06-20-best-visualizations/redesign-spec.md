# Redesign spec — present the data the best way (Plotly)

Detailed how-to for redesigning every chart/visual on the dashboard. Engine: **Plotly**. Look: **Economist chart grammar in our warm skin**. Anchor of quality: the existing **KPI tiles** (kept). Companion to [job.md](job.md); supersedes its "engine open" question.

---

## 0. Decisions & principles

- **Engine = Plotly** (`plotly.js`, partial custom bundle, client-only). Charts are Plotly; the *frame* around every chart (eyebrow, headline, subtitle, source, controls) is our own HTML so we keep full editorial type control. Tiny "data rows" (KPI tiles, sparkline-in-table) stay lightweight HTML/inline-SVG — Plotly is the wrong tool for a 20-row table and would bloat it.
- **Let the visuals speak — delete text.** Every chart = a *headline that states the finding* + the chart + a one-line source/coverage note. No lede paragraphs, no "what this measures" prose next to a chart. Move any explanation into ≤2 on-chart annotations.
- **Economist palette discipline.** The brand accent (**orange `#cf7730`**) is reserved — it marks the *one* signature/primary series and brand chrome, never generic categories. Multi-series data uses the **cool data colorway** below. Growth/decline use semantic green/red. (This is the single biggest visual upgrade.)
- **Integrate time.** No more single-month snapshots where a series exists. Default to time-aware charts; the **Explorer** (line/bar/table + play + scrub) is the centerpiece pattern, reused across pages.
- **Direct labels, horizontal gridlines only, bars from zero, minimal ink.** No legends where end-labels work; no chart frame, no y-axis line, no vertical grid.
- **Researcher weighting.** Distributions over point estimates; indexed comparisons; concentration metrics; coverage/confidence always shown; CSV on every chart.

---

## 1. The house theme — "Economist grammar, warm skin"

One Plotly template applied to every figure (`Plotly.newPlot(el, data, layout, config)` with `layout.template = aclmrWarm`).

```
DATA colorway (cool, CVD-aware, distinct from the orange brand):
  ['#345961' teal, '#6f93a0' steel, '#3f7a5c' green,
   '#8a5f86' plum, '#9a6a3c' brown, '#c2a23f' gold, '#485b66' slate]
SEMANTIC:  growth #2c765c · decline #b54e33 · primary/brand #cf7730 · baseline navy #041c2c (dashed)
SEQUENTIAL (maps/heatmaps): ['#efe2d2','#e3bd92','#d59257','#cf7730','#a4531b']
GROUND cream #fbf8f5 (from the card) · gridline #e6e0da · ink #16242f · faint #616a71
```

```js
// lib/plotly/theme.ts  — the template
export const aclmrWarm = {
  layout: {
    font: { family: 'PT Sans, ui-sans-serif, system-ui, sans-serif', size: 13, color: '#16242f' },
    colorway: ['#345961','#6f93a0','#3f7a5c','#8a5f86','#9a6a3c','#c2a23f','#485b66'],
    paper_bgcolor: 'rgba(0,0,0,0)',        // card supplies the cream
    plot_bgcolor: 'rgba(0,0,0,0)',
    margin: { l: 44, r: 16, t: 8, b: 28 }, // title is HTML, so top margin is tiny
    hovermode: 'x unified',
    hoverlabel: { bgcolor: '#ffffff', bordercolor: '#e6e0da',
                  font: { family: 'PT Sans, system-ui', color: '#16242f' } },
    showlegend: false,                      // prefer direct end-labels
    xaxis: { showgrid: false, zeroline: false, showline: false,
             ticks: 'outside', ticklen: 4, tickcolor: '#e6e0da',
             tickfont: { color: '#616a71', size: 11 } },
    yaxis: { showgrid: true, gridcolor: '#e6e0da', zeroline: false,
             showline: false, ticks: '', tickfont: { color: '#616a71', size: 11 } },
  },
}
export const baseConfig = {
  displaylogo: false, responsive: true,
  modeBarButtonsToRemove: ['lasso2d','select2d','autoScale2d','zoomIn2d','zoomOut2d','pan2d'],
  // download handled by our own button → CSV + PNG; keep toImage off-page if desired
}
```

Rules baked in: **no Plotly title** (HTML renders eyebrow + headline + source); **legend off by default** (use `annotations` at line ends); **bars anchored at 0**; **`categoryorder:'total ascending/descending'`** for ranked bars.

---

## 2. Shared building blocks

Each block = ASCII intent + Plotly recipe + data source. Build once, reuse everywhere.

### 2.1 KPI tile  *(KEEP — the quality anchor; HTML, not Plotly)*

```
┌ DEMAND INDEX            2019=100 ┐   big number, delta chip (▲/▼ semantic colour),
│ 92   ▼ 8.3% vs baseline          │   inline sparkline (orange = the ONE signature
│ ∿∿∿∿∿∿∿∿∿∿∿  (orange)            │   metric; teal for the rest), tiny context label.
└──────────────────────────────────┘
```
Keep as-is — Bruce likes them. **Bug fixed (2026-06-21):** in the accent card the delta label ("vs baseline") wrapped to 3 lines and occluded the sparkline; the delta is now one line (`whitespace-nowrap shrink-0`) and the sparkline shrinks responsively to the remaining width (no overflow / no clipping). Optional later: a sparkline on all four tiles. Inline SVG, no Plotly.

### 2.2 The Explorer  *(CENTERPIECE — Plotly)*

```
POSTING DEMAND OVER TIME                         [Line] [Bar] [Table]   ⤓ CSV
Demand relative to the pre-pandemic norm
  150┤                         ╭╮
  100┤·······╭──╮····╭────╮··╱  ╲····· 2019 = 100        ← Ontario (orange, labelled)
   50┤ ╱╲╱╲╱     ╲╱╲╱      ╲╱     ╲__                       (others gray, labelled at end)
     └┬────┬────┬────┬────┬────┬──
     2016 2018 2020 2022 2024 2026
  ▶ ──●──────────────────────────────●   2016 ─────────────── Mar 2026
```
- **Views**: Line / Bar / Area / Table. Line+Area+Bar are Plotly trace swaps (HTML tabs set `figure.data`); **Table** is an HTML `<table>` (a11y + exact values + CSV).
- **Time**: native Plotly **`frames` + `sliders` + `updatemenus` play button** (the gapminder mechanism). Dragging the slider animates; Bar view re-sorts per month.
- **Style**: gray-the-rest + orange/teal accents, direct end-label annotations, `ruleY` baseline at 100.
- Data: `overview.series` (indexed) for Pulse; per-entity monthly series elsewhere.

### 2.3 Diverging movers  *(Plotly — replaces the twin +/− cards)*

```
BIGGEST MOVERS · YEAR OVER YEAR
Nursing leads; arts & culture keep cooling
  Registered nurses     ████████████ +31%
  Transport drivers     ██████ +18%
  Cooks                 ███ +12%
 ─────────────────────┼──── 0
  Business & finance ███ −16%
  Arts & culture   █████ −22%
```
One `go.Bar(orientation='h')`, `x` = YoY %, growth `#2c765c` / decline `#b54e33`, `categoryorder:'total ascending'`, zero line on. One shared scale → honest. (Optional: a tiny sparkline column in a paired HTML table.)

### 2.4 Sparkline-in-table  *(HTML/SVG — replaces every "bar-below-label" list)*

```
#  OCCUPATION GROUP        POSTINGS   10-YEAR TREND        YoY
1  Sales & service           1.93M    ∿∿∿╱              ▲ +6%
2  Trades & transport        1.44M    ∿∿∿╱              ▲ +9%
3  Business & finance        1.21M    ‾╲__              ▼ −3%
```
Rank · label · value · inline-SVG sparkline (orange end-dot) · semantic Δ. Rows are cross-filter `<Link>`s (keep the current cross-filter). Four readings per line; dozens fit a screen.

### 2.5 Distribution band over time  *(Plotly — the top wage re-add)*

```
ADVERTISED HOURLY PAY — DISTRIBUTION OVER TIME
Risen, and spread out
  $35┤                                    ╭─ P75
  $30┤              ░░░░▒▒▒▒▓▓▓▓ band ────╮├─ Median (navy, bold)
  $25┤  ░░▒▒▓▓                            ╰─ P25
     └┬────┬────┬────┬────┬────┬
     2016 2018 2020 2022 2024 2026
```
Two `scatter` lines (p25, p75) with `fill:'tonexty'` (teal, low opacity) + median line (navy, 2.5px). Honesty: only p25/median/p75 exist → band, **never** a box plot. Coverage caption.

### 2.6 Range / dumbbell bars  *(Plotly — latest-month wages by occ / province)*

```
Registered nurses   $26 ●━━━━━━━●  $41   median $34
Cooks               $16 ●━━━●     $23   median $19
                    └ p25      p75 ┘  (sortable by median or by spread)
```
`scatter` markers at p25 & p75 + a connecting line + median marker; `categoryorder` by median or IQR. Dense (4 numbers/row), sortable.

### 2.7 Composition stacked-area  *(Plotly — mix over time)*

```
OCCUPATION MIX OVER TIME · % of coded postings
100%┤▓▓▓▓▓▓▓▓▓▓ Sales & service
    │▒▒▒▒▒▒▒▒▒▒ Trades & transport
 50%│░░░░░░░░░░ Business & finance
    │▚▚▚▚▚▚▚▚▚▚ Health …                ← direct labels at right edge
  0%└┬────┬────┬────┬────┬
   2016 2018 2020 2022 2026
```
`scatter` with `stackgroup:'one'`, `groupnorm:'percent'`; ≤6 bands + "Other"; right-edge annotations; no legend. Same component for province & industry mix.

### 2.8 Time-scrubbed choropleth  *(Plotly — Geography)*

```
POSTED DEMAND BY PROVINCE        [Per 10k] [Concentration] [Count]
March 2026 — Ontario & Québec lead
        ┌────────────┐
        │   🍁 map    │   warm sequential ramp, hover = value + n
        └────────────┘
  ▶ ──●─────────────────●  2016 ──────── Mar 2026   ← time scrubber (Plotly frames)
```
`go.Choropleth` with our provinces GeoJSON + **`frames` per month → a real time slider** (big win Plotly gives nearly free); measure toggle via `updatemenus`. Pair with the province sparkline-table.

### 2.9 Seasonality heatmap  *(Plotly — month × year)*

```
     Jan Feb Mar Apr May Jun … Dec
2016  ░   ░   ▒   ▓   ▓   ▒  …  ░     warm sequential; spring stripe + 2020 break
2020  ░   ░   ░   ░   ▒   ░  …  ░
2025  ▒   ▓   ▓   █   █   ▓  …  ▒
```
`go.Heatmap`, `colorscale` = warm sequential, `hovertemplate` exact value. 120 values, one glance.

### 2.10 Wage-vs-demand quadrant scatter  *(Plotly — researcher re-add)*

```
$/hr│        · nurses        median-wage ref ─┄┄┄┄┄
    │  · admin       · welders
    │·············●·············  ← median-demand ref
    │  low pay/low demand   high demand →
```
`go.Scatter` markers sized by postings, colored by NOC group; dashed median reference lines split four quadrants; hover = occupation detail. Latest month (or scrub).

---

## 3. Page-by-page redesign

### 3.1 Pulse (flagship)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ACLMR · LABOUR MARKET        PULSE OCC IND GEO WAGES SKILLS METHOD EXPLORE EN│FR│
│ REGION ▾ All Canada    OCCUPATION ▾ All    INDUSTRY ▾ All            [reset]   │
├─────────────────────────────────────────────────────────────────────────────┤
│ LABOUR MARKET PULSE · ALL CANADA · MAR 2026                                   │
│ Canada's posting demand is 8% below its 2019 baseline.                        │ ← headline only, no lede
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌DEMAND INDEX┐ ┌ACTIVE POSTINGS┐ ┌VS LAST YEAR┐ ┌MEDIAN WAGE┐                 │ ← KPI strip (kept)
│ │92 ▼8.3% ∿∿ │ │217.4k ▲11.7% ∿│ │−7.6% ∿     │ │$29.3/hr ∿ │                 │
│ └────────────┘ └───────────────┘ └────────────┘ └───────────┘                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ THE EXPLORER  — posting demand over time      [Line][Bar][Table]  ⤓           │ ← 2.2  (centerpiece)
│  (indexed line, scrub + play, 1–2 on-chart annotations replace "what stands out")│
├─────────────────────────────────────────────────────────────────────────────┤
│ BIGGEST MOVERS · YoY  (one diverging chart)   2.3                             │
├──────────────────────────────────┬──────────────────────────────────────────┤
│ OCCUPATION MIX OVER TIME  2.7     │ BY PROVINCE — sparkline table  2.4  FULL MAP→│
└──────────────────────────────────┴──────────────────────────────────────────┘
```
Kills: twin movers cards, the wordy "What stands out" panel, the bar-below-label regional list. Adds: Explorer, diverging movers, composition strip, province sparkline-table.

### 3.2 Occupations / Industries (shared template)

```
HEADLINE (conclusion for the slice)
KPI: [ Total postings ] [ Concentration (HHI) ] [ Top-5 share ]      ← HHI re-add
THE EXPLORER — demand for {occupation/industry}, indexed   [Line][Bar][Table]
COMPOSITION MIX OVER TIME (2.7)        |   RANKED — sparkline table (2.4, cross-filter)
[Occupations only] OCCUPATION × PROVINCE HEATMAP (2.9-style)
TOP SKILLS for this slice — sparkline table
```
Industries adds the **coverage-stability line** (share of postings with usable NAICS over time) beneath the mix, as the honesty companion.

### 3.3 Geography

```
HEADLINE — where demand concentrates
TIME-SCRUBBED CHOROPLETH (2.8)  [Per 10k][Concentration][Count]   |   PROVINCE sparkline table (2.4)
CUMULATIVE MARKET CONCENTRATION  — "N markets = X% of demand" (Plotly line)   ← re-add
TOP LOCAL MARKETS — sparkline table
```
Default measure = **Location Quotient** (researcher-first). Map gets the time slider.

### 3.4 Wages

```
HEADLINE — pay has risen and spread out
WAGE BAND OVER TIME (2.5)   ← marquee re-add, full width, top
BY OCCUPATION — range/dumbbell (2.6)   |   BY PROVINCE — range/dumbbell (2.6)
WAGE vs DEMAND — quadrant scatter (2.10)            ← researcher re-add
coverage caption: "n advertised-wage postings = X% of all postings"  (always shown)
```

### 3.5 Skills

```
HEADLINE — what employers ask for
TOP SKILLS — sparkline table (2.4, trend per skill)   |   DISTINCTIVE SKILLS (lift) — diverging bar
REQUIREMENTS — education / experience  (compact Plotly bars or 100% stack)
LANGUAGE / BILINGUAL DEMAND  — EN vs FR requirement share (over time)   ← re-add (charted nowhere today)
```

### 3.6 Method / Explore / Developers
Mostly unchanged. Method: keep coverage bars (apply the theme). Explore (private posting table): unchanged. Developers: unchanged. Apply the headline/grid/label rules everywhere.

---

## 4. Plotly engineering

- **Bundle**: do *not* ship full `plotly.js` (~3.5 MB). Build a **partial bundle** from `plotly.js/lib/core` registering only `scatter, bar, heatmap, choropleth` (+ `choroplethmapbox` if we go mapbox) → ~1 MB, gzip ~300–350 KB. One shared `lib/plotly/index.ts` exports the configured `Plotly`.
- **SSR**: Plotly is client-only. Render the **HTML frame** (eyebrow, headline, source, a fixed-height skeleton box) server-side; **`dynamic(() => import(...), { ssr:false })`** the plotting area; hydrate on mount. No layout shift, SEO-safe titles.
- **Theming**: every `newPlot` merges `aclmrWarm` template + `baseConfig`. Titles/subtitles/source stay HTML.
- **i18n**: axis/legend/annotation strings come from the per-page dictionaries (existing pattern); data-derived labels stay EN by the existing decision.
- **a11y**: every chart ships a **Table view / `<table>` fallback** and `aria-label`; never colour-only (semantic Δ has ▲/▼; series have direct labels). Honor `prefers-reduced-motion` (scrubber doesn't autoplay; values readable without animation).
- **Per-chart CSV/PNG** via our own button (consistent with current `DownloadCSV`).

---

## 5. Build sequence

| Phase | Ship | Notes |
|---|---|---|
| **V1 ✅ BUILT (2026-06-21)** | Plotly partial bundle + `aclmrWarm` theme + `PlotlyFigure` host; KPI sparklines on all 4; **diverging movers** (labels-above); **sparkline-table** (real per-province trends); re-skin demand chart; backend trend fields (`RankItem.trend`, `GeoItem.trend`, `Kpis.median_wage_trend`) | Done on Pulse. 63 API tests pass; tsc clean; live-render verified. Diverging-bar overlap fixed via labels-above. |
| **V2 ✅ BUILT (2026-06-21)** | **The Explorer** (`ExplorerChart.tsx`) — Line/Bar/Table × Index/Postings/YoY toggle; reused on Pulse + Occ/Ind (old `DemandChart` deleted) | Built without the scrub/play frames — single-series line/bar/table + metric toggle covers the read; frames deferred to the time-scrubbed choropleth |
| **V3 ✅ PARTIAL (2026-06-21)** | **Wage band over time** (`WageBand.tsx` + new `/api/wages/trend`); **Plotly choropleth** (`Choropleth.tsx`, replaces d3 — removes the last non-Plotly engine); **Plotly dumbbell** (`WageRangeBars.tsx`); **Plotly skill bars** (`BarList.tsx`/`SkillBars.tsx`, lift gets a 1× ref) | Composition stacked-area + **time-scrubbed** choropleth (frames) still to do |
| **+ Seasonality heatmap ✅ BUILT (2026-06-21)** | `SeasonalityHeatmap.tsx` on Pulse — month×year, per-year-normalised | Heatmap trace registered; pulled forward from V4 (no backend needed) |
| **V4 ✅ BUILT (2026-06-21) — redesign COMPLETE** | HHI/top-5/Groups KPIs (`concentration`); occ×province LQ heatmap (`MatrixHeatmap` + `matrix/occ-province`); coverage-stability line (`CoverageTrend` + `coverage/trend`); cumulative-market curve (`CumulativeCurve`, client-side); wage-vs-demand scatter (`WageDemandScatter`, client-side join); composition stacked-area (`CompositionArea` + `composition/{dim}`); time-scrubbed choropleth (`ChoroplethTime` + `geography/trend`, Plotly frames/slider/play) | **Language-over-time panel DROPPED** — the cube's EN/FR requirement columns are degenerate (both == language-coverage count over time), so the chart would mislead; the honest latest-month language composition already lives on Skills. Every other V4 item shipped. |

## 6. Current → redesign (what changes)

| Today | Becomes |
|---|---|
| Twin +/− movers cards (2 scales) | One diverging movers bar (2.3) |
| Bar-below-label lists (ranks, regional) | Sparkline-in-table (2.4) |
| Static demand area chart (zero-baselined) | The Explorer (2.2) |
| Latest-month wage range bars only | Wage band over time (2.5) + range bars (2.6) |
| Static 460px choropleth | Time-scrubbed choropleth (2.8) |
| Latest-month skill/req bars | Skill trends + **language panel** (3.5) |
| Wordy panels / ledes / "what measures" | Headline + chart + 1-line source; ≤2 on-chart annotations |
| Orange used for brand *and* data | Orange reserved (brand/primary); cool data colorway |
```
