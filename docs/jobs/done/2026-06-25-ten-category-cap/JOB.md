# Cap every dashboard asset at 10 categories

**Status:** COMPLETED — IMPLEMENTED, VERIFIED (EN + FR), COMMITTED, AND PUSHED TO
`origin/redesign2` through commits `a184c1b1`, `b97921e5`, and `2434787b`. The work is
also part of the local `feat/login-uncapped` branch but has not been promoted to `main`.
The four design questions below remain as the decision record.

**Branch:** `redesign2`. **Date:** 2026-06-25.

## Goal

Limit every visual asset in the dashboard (plots, bars, treemaps, heatmaps, maps,
the Explore "Build a chart" output) to **at most 10 distinct categories / items**.

User direction that shapes the design:

1. **Group, don't drop.** Maintain correctness — when an asset has more than 10
   categories, *aggregate the surplus into a residual group* so the totals still add
   up, rather than silently truncating the tail.
2. **Everything except time.** Apply the cap to every asset, including geographic
   maps (group provinces). The only exemption is a **time axis** — e.g. the 12 months
   of the seasonality heatmap stay as they are.

## What "category" means here

A category is a discrete item the asset breaks data into: a bar, a treemap tile, a
pie slice, a heatmap row or column, a legend line series, a labelled scatter point, or
a distinct fill value on a choropleth. It is **not** a point on a continuous time axis.
A waterfall's start/end totals are structural bookends, not categories.

## Scope (from `inventory.md`)

16 registered charts plus the Explore `province` and `industry` breakdowns exceed 10.
`pulse.seasonality` exceeds 10 only on its month axis → exempt. Everything else is
already ≤10. The full evidence table is in [`inventory.md`](inventory.md).

## Design decisions

Three capping strategies, chosen per asset by what keeps the numbers honest:

### A. Residual "Other" fold — for decompositions of a whole

When the asset shows how a total splits across categories (treemaps of "all X",
contribution bars that sum to a headline, a column-normalised heatmap), keep the **9
largest** and fold the rest into one **"Other"** group whose value is the *sum* of the
dropped categories. Totals are preserved; the long tail becomes one honest bucket.

- `industries.treemap` → top 9 sectors + **"Other sectors"** (every animation frame too).
- `industries.contribution_bars` → top 9 by |contribution| + **"Other sectors"** (the
  folded contribution sums, so bars still reconcile to the net change).
- `occupations.treemap` → top 9 + **"Other"** (this also absorbs the `Unknown` tile
  that currently makes it 11; the root total stays = all postings).
- `occupations.noc_naics_heatmap` → keep 9 NAICS **columns** + an **"Other"** column
  (sum the tail), then re-normalise per column.
- Explore bars, **additive measures only** (`postings`, `share`) → top 9 + **"Other"**
  (localized "Autres" in FR).

### B. Lower the top-N — for inherently ranked "top/most" charts

These never claimed to show everything (they are "the top N …"), so reducing N to ≤10
keeps the same meaning with no "Other" needed:

- `geography.cma_demand` — default `top=18` → **`top=10`** (title updates to "top 10").
- `skills.skill_lift` (datasource `skill_lift` default) — `top=15` → **`top=10`**.
- `skills.skill_occupation_heatmap` — `skill_by_occupation(top=16)` → **`top=10`** rows.
- `occupations.skill_churn` — `skill_churn(top=11)` per side → **`top=5`** (5 risers +
  5 fallers = 10 total).
- Explore bars, **rate measures** (`yoy`, `two_year`, `wage`) → keep the **10 largest
  by magnitude** (a rate cannot be averaged into an "Other", so folding is dishonest).

### C. Regional fold — for provinces (11 → 8)

Canada has 11 provinces in the data, one over the cap. Fold the four contiguous
**Atlantic provinces (NB · NS · PE · NL) into one "Atlantic Canada" region** — a
standard, meaningful Canadian grouping — leaving 8 regions (AB BC MB ON QC SK NT +
Atlantic). This applies to **bars and maps alike**:

- **Bar / decomposition charts** (`ranked_provinces`, `shift_share_bars`): fold on the
  province name and sum the members. For shift-share, sum the four provinces *per
  occupation per month before* the annual mean, so the regional series is a true total.
- **Choropleths** (`demand_map` ×4 measures, `yoy_choropleth`, `ai_exposure_map`):
  compute the measure at the **region** level (sum postings; sum labour force for
  per-capita; pool postings for the weighted AI-β; regional YoY from summed counts),
  then **broadcast the regional value back onto each member province shape** so the four
  Atlantic provinces render as one coloured block and hover reads "Atlantic Canada".
  Distinct fill values drop to ≤8.
- **`pay.wage_dumbbell` is the deliberate exception:** it already shows exactly 10
  provinces (NT is filtered by the ≥200-wage gate), and advertised wage *quantiles*
  (P25/median/P75) cannot be correctly summed or averaged across provinces from the
  cube — so it is left at 10 separate provinces. Noted as an accepted inconsistency.

Mechanism lives in `datasource.py` as shared helpers (`ATLANTIC_CODES`,
`REGION_NAMES`, `province_region_code`, `province_region_name`) so every province asset
uses one definition.

## Shared helpers (build once)

In `viz/figures/_common.py`:

- `MAX_CATEGORIES = 10` — the single constant.
- `cap_other(df, value_col, label_col, *, n=10, other_label="Other", rank_abs=False)`
  — keep the `n-1` largest, fold the rest into one summed residual row; frames already
  ≤ n pass through untouched. (Strategy A for bars/treemaps.)
- `cap_columns(piv, *, n=10, other_label="Other")` — same idea on a pivot's columns,
  for the column-normalised heatmaps.

In `datasource.py`: the province→region constants and two helper functions above.

In `api/explore.py`: `MAX_CATEGORIES = 10`, `_OTHER` sentinel, `_cap_bar(agg, measure)`
(additive → fold; rate → keep 10 largest), an `other` i18n key (EN "Other" / FR
"Autres"), and an early return in `_pretty` for the sentinel.

## File-by-file change list

| File | Change |
| --- | --- |
| `src/jobads_dashboard/viz/datasource.py` | Add Atlantic/region constants + `province_region_code/name`. Lower `skill_lift` default `top` 15→10. |
| `src/jobads_dashboard/viz/figures/_common.py` | Add `MAX_CATEGORIES`, `cap_other`, `cap_columns`. |
| `…/figures/geography.py` | Region-fold the 3 choropleths (`demand_map`, `yoy_choropleth`, `ai_exposure_map`), `ranked_provinces`, `shift_share_bars`. `cma_demand` `top` 18→10. Drop now-unused `PROVINCE_NAMES` import. |
| `…/figures/industries.py` | `cap_other` on `treemap` (static + animated frames) and `contribution_bars`. |
| `…/figures/occupations.py` | `cap_other` on `treemap` (static + frames); `cap_columns` on `noc_naics_heatmap`; `skill_churn` `top` 11→5. |
| `…/figures/skills.py` | `skill_occupation_heatmap` `skill_by_occupation(top=16→10)`. |
| `…/figures/quality.py` | `coverage_latest_bars`: keep 6 key fields + 4 sparsest others = 10. |
| `api/explore.py` | `_cap_bar` + wiring (constant, `_OTHER`, `other` i18n EN/FR, `_pretty` guard, call in `_build_bar`). |

No web/TypeScript changes: the Explore "Other"/"Autres" label is produced server-side;
registered charts are server-rendered figure JSON. The cap is entirely in the Python
viz + API layers.

## Verification plan

1. **Build sweep** — build every `REGISTRY` factory (and animation frames) + every
   Explore (dim, measure); assert max category count ≤ 10 for all, with `seasonality`
   the only allowed >10 (time axis). Script lives in this job's `evidence/`.
2. **Counts spot-check** — print per-chart counts to confirm the *intended* number
   (e.g. demand_map 8 regions, cma_demand 10, skill_churn 10, heatmaps 10×10).
3. **Golden + unit tests** — `pytest` incl. `tests/golden/`. The golden corpus is tiny
   (3 provinces, few skills) so most caps are no-ops there; review any diffs.
4. **Live render pass** — at planning time this meant port 8520 / ngrok; current deployment
   verification must follow the topology in `AGENTS.md`. In either case,
   eyeball the riskiest changes in **EN and FR**: the choropleths (Atlantic colours as
   one block, hover says "Atlantic Canada"), the two treemaps ("Other"/"Other sectors"
   tile), `skill_churn` (5+5), the NOC×NAICS heatmap ("Other" column), and an Explore
   industry breakdown ("Other"/"Autres" bar).

## Resolved decisions and retained tradeoffs

- **Atlantic fold on maps** loses province-level detail for NB/NS/PE/NL and is a
  visible editorial change, but it is the accepted public grouping; authenticated team
  view restores province detail.
- **`wage_dumbbell` inconsistency** (10 separate provinces while other province charts
  show "Atlantic Canada") is accepted because wage quantiles cannot be folded honestly.
- **`coverage_latest_bars`** drops 3 well-covered fields to fit 10; the trust page's
  key-fields-plus-sparsest selection is the accepted public presentation.
- **`Unknown` buckets** fold into "Other" on the public occupation treemap; this is the
  accepted reading rather than displacing a real occupation group.
- **Golden review:** completed without a material regression; diffs reflected the intended cap.

## Reference implementation (verified and now on `origin/redesign2`)

This plan was validated end-to-end before being written down. The 8 files above were
edited and checked:

- Build sweep: **42/43 registered charts ≤10**; the 1 over (`pulse.seasonality`, 12
  months) is the time-axis exemption. **All 15 Explore (dim × measure) bars = 10**.
- Intended counts confirmed: demand maps = 8 regions, ranked/shift-share = 8 bars,
  cma_demand = 10, both treemaps = 10 tiles, both heatmaps = 10×10, skill_churn = 10,
  skill_lift = 10, coverage_latest = 10.
- `pytest`: **345 passed** (incl. `tests/golden/`).
- **Live render pass DONE** (EN + FR), via static PNG export of the actual figure JSON
  (kaleido), images in `evidence/`:
  - `demand_map_share_{en,fr}` — Atlantic provinces render as one block; 8 distinct fills.
  - `ranked_provinces_en` — 8 bars; "Atlantic Canada" = 213,378 (folded sum), ranked 5th.
  - `ind_treemap_en` / `occ_treemap_en` — 10 tiles, "Other sectors" / "Other" folds the tail.
  - `noc_naics_heatmap_en` — 10×10, trailing "Other" NAICS column.
  - `skill_churn_en` — 5 risers + 5 fallers = 10.
  - `skill_lift_en` — 10 bars.
  - `explore_industry_{en,fr}` — 10 bars; folded bar localized "Other" / "Autres".
- **Checkpoint limit:** the original 2026-06-25 evidence did not include a commit or
  ngrok/8520 deployment; the detached services on :8531/:3100 were intentionally left
  untouched. The changes were later committed and pushed to `origin/redesign2`, but that
  historical render pass does not establish the current deployed version.

Files edited (all clean before this session, so reverting is isolated): `datasource.py`,
`figures/_common.py`, `figures/{geography,industries,occupations,skills,quality}.py`,
`api/explore.py`.
