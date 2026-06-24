# Rejected / refuted candidates — 2026-06-23 deep-audit-2

Load-bearing: stops the next run from re-reporting these. Two groups: (A) prior-audit items confirmed FIXED in HEAD c4c6d201 (do not re-file), and (B) candidates this run's adversarial pass refuted.

## A. Prior-audit findings confirmed FIXED & holding (hand-verified live + source)

| Prior ID(s) | Item | Evidence it is fixed |
|---|---|---|
| H1 | `geography.cma_demand` 8× inflation | Toronto CMA ≈ 439k (not ~3.5M) — held from earlier audit |
| CMA dup-labels | Two identical "Rural area not in a CMA/CA" bars | Now province-suffixed: "(AB)/(ON)/(QC)" — verified via DOM y-tick labels |
| S07 + breakdown leak | FR filter sentinels + breakdown category labels English | FR shows "Tout le Canada"/"Toutes les professions"/"Gestion"/"Affaires et finance"/"Ressources et agriculture" — verified live in FR |
| S13 a11y | TunableFigure year-pickers unlabelled | 11 selects expose aria-label "Base year"/"Start year"/"End year" — verified via AX snapshot on /occupations |
| S02 | Explore "share" denominator overstates (35% vs 28%) | `api/explore.py` `_scope_total()` uses All-dimension marginal; `share_caveat` present — source-verified |
| S03/S16 | two_year + time mislabel / equal-year all-0% | `two_year_needs_breakdown` + `two_year_same_year` gates in `api/explore.py` — source-verified |
| U06 | Treemap "Unknown" prominence uncaptioned | Caption: '"Unknown" = postings without an assigned NOC code, not an occupation group' |
| S18 | Home hero not localized | FR: "L'EMBAUCHE AU CANADA EST 8 % EN DESSOUS…" — verified live |
| S23 | No per-figure degradation | `api.figureSafe` used by RemoteFigure — source-verified |
| S32 | Mobile nav not removed from tab order | `inert` on `#mobile-nav-panel`; panel toggles `aria-expanded` — verified |
| S36 | Non-distinct nav landmarks | Desktop nav "Primary"/"Principale"; mobile panel distinct — verified |
| U02 | Mobile KPI sparkline overlap | Stacks full-width at 375px — verified live |
| U09 | Skills hero missing period | (carried; not re-examined this run) |
| M4/M6/M7 | Missing coverage / per-capita caveats | Wages + skills ledes carry coverage; geography per-capita caveat present |

## B. Candidates refuted during this run

| Candidate | Why refuted |
|---|---|
| Select accessible name "polluted" by option text | Naive `label.textContent` JS read includes `<option>` text, but the AX layer computes a clean name from the `<span>` label — confirmed by the /occupations AX snapshot naming selects cleanly. `Select.tsx` uses `<label htmlFor>` + `<span>` + `<select>`. Not a finding. |
| No dark mode | App is light-only **by design** (documented in `globals.css`; no `aclmr_dark` template registered in `theme.py`). Intentional, not a gap. |
| Mobile select truncation ("Tout le Canada" → "Tout le") | Acceptable: the full value shows when the native dropdown opens; standard `<select>` behaviour at narrow width. Cosmetic at most. |

### Over-claims the orchestrator caught (the Opus verifiers confirmed all 37 candidates — too lenient — so these were refuted on orchestrator re-read)

| Candidate (slice) | Claim | Why refuted |
|---|---|---|
| fig-2 (viz-figures) | Occupations treemap "Unknown" tile (17.8%) is "presented as a real occupation group, **with no caveat**" | **False premise.** A clear, localized caveat sits directly under the chart: `web/lib/i18n/dict/page-occupations.ts:28` — '"Unknown" = postings without an assigned NOC code, not an occupation group.' The agent only read the Python factory, not the page caption. The residual ("should Unknown be a tile at all?") is the prior U06, already addressed with this caption. Not a defect. |
| fig-5 (viz-figures) | `seasonality_heatmap` normalizing each month by its own year's average "distorts the part/share" | **By design.** The chart's own caption states it shows each month *relative to its year's average* "revealing the seasonal shape beyond the trend" — within-year normalization is the documented intent of a seasonality view, not a distortion. Not a defect. |

> Process note: 0/37 refuted by the verifier agents is itself a finding — the adversarial Opus pass under-refuted. The real skeptical filter this run was the orchestrator re-reading each headline claim against source (which also corrected ~6 severities, e.g. web-1 FR-percent MEDIUM→LOW, fig-7/craft-5 reclassified). Future runs should prompt verifiers harder to default-refute.
