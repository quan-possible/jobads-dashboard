# Implementation spec — researcher viz redesign

Companion to [`job.md`](job.md). File-level how-to for the remove/modify/add set.
**No code yet** — this is the build map. Pairs every plot with the exact files,
functions, and data path. Code skeletons match the real patterns in the repo.

## How a plot is wired (the four seams)

A chart flows through four layers; adding/replacing one touches the same four:

1. **compute** — `src/jobads_dashboard/viz/compute.py`: pure pandas→pandas/series
   metric functions (`index_to_base`, `yoy_pct`, `diffusion_index`, `robust_z`,
   `location_quotient`, `shift_share`, `hhi`, …). Add a function here only when a
   metric doesn't exist.
2. **datasource** — `viz/datasource.py`: `DataSource` exposes typed, cached frames
   (`noc_broad`, `naics_broad`, `province`, `market`, `wage_by_noc`,
   `requirements(dim)`, `skill_lift(...)`, `province_occupation`, `noc_by_naics`,
   `coverage_overall`, `geojson`). Add an accessor only for a new table/cut.
3. **factory** — `viz/figures/<page>.py`: `def name(ds: DataSource, ...) -> go.Figure`.
   Uses theme constants (`BRAND, CONTEXT, MUTED, SEQUENTIAL, DIVERGING, COLORWAY`),
   helpers (`titled`, `add_time_slider`, `add_covid_band`, `add_reference_line`),
   and returns a figure with `titled(fig, headline, subtitle)`. Animation pattern:
   build one `go.Frame(name=str(period), data=[trace(period)])` per period,
   `go.Figure(data=frames[-1].data, frames=frames)`, then `add_time_slider(fig,
   periods, **chrome)`.
4. **bridge + web** — register in `api/figures.py::REGISTRY` as
   `"<page>.<id>": lambda ds, **k: <module>.<fn>(ds, ...)`; the endpoint
   `/api/figure/{id}` already serves it. On the web side add it to the page's
   `Promise.all([... api.figure("<page>.<id>", locale) ...])` and render inside a
   `<Figure eyebrow title asOf note><RemoteFigure fig height ariaLabel/></Figure>`;
   add the `charts.<id>` chrome (eyebrow/title/note/aria) to
   `web/lib/i18n/dict/page-<page>.ts` in **both** `en` and `fr`.

`build()` already strips the factory title (the web `<Figure>` frame owns the
headline), inlines the `aclmr_light` template, forces transparent bg, and for
`locale=fr` exact-match translates chrome via `_FR_CHROME` — so **new factory
chrome strings (axis titles, legend names, colorbar titles) must get an `_FR_CHROME`
entry** in `api/figures.py` or they'll stay English in FR.

### The 6-step checklist to add/replace one plot
1. (if needed) add a compute fn + a datasource accessor.
2. write/modify the factory in `viz/figures/<page>.py`.
3. add the `REGISTRY` entry in `api/figures.py` (+ `_FR_CHROME` for new chrome).
4. add a build test in `api/tests/test_figures.py` (it auto-covers every REGISTRY id;
   add specific assertions for frames/sliders/measures).
5. wire the web page (`Promise.all` + `<Figure>`/`<RemoteFigure>`).
6. add en+fr chrome to `page-<page>.ts`.

### Pre-reads / gotchas (carry over from prior waves)
- **Web: read `web/node_modules/next/dist/docs/` before editing any `web/` code**
  (`web/AGENTS.md`: "This is NOT the Next.js you know"). The docs dir is present.
- After a factory/registry change, **`rm -rf web/.next`** to clear the dev fetch
  cache or the browser keeps the old figure JSON.
- Tests run under `../greenfield-aclmr/.venv/bin/python -m pytest api/tests/`.
- Partial plotly bundle: `treemap`, `waterfall`, `choropleth`, `heatmap`, `bar`,
  `scatter` are registered (`web/lib/plotly/index.ts`). A genuinely new trace type
  would need registering there + in `plotly-core.d.ts` — none below require it.

---

## WAVE 1 — existing data only (no dependencies, buildable now)

### Pulse page — swap 4 decompositions for 2 grounded views

Remove from `REGISTRY` + page + dict: `pulse.anomaly`, `pulse.sa_vs_nsa`,
`pulse.stl`, `pulse.cycle`. Delete the factories `anomaly_flags`, `sa_vs_nsa`,
`stl_panel`, `cycle_plot` in `pulse.py` (keep `diffusion_index`, smoothing its step
rendering with `compute.moving_average` on the share series).

**NEW `pulse.occupation_smallmultiples`** — sparkline grid, one mini-trend per broad
occupation group. Rich descriptive overview replacing the anomaly panel.
- data: `ds.noc_broad` (existing).
- factory `pulse.occupation_trends_grid(ds)`: `make_subplots(rows, cols,
  shared_xaxes=False, subplot_titles=names)`; one `go.Scatter(line BRAND, width 1.5)`
  per group on its own cell; hide axis labels, keep a thin baseline; `height ≈ 60×rows`.
  ```python
  nb = _real_groups(ds.noc_broad); groups = sorted(nb["noc_name"].unique())
  cols = 4; rows = math.ceil(len(groups)/cols)
  fig = make_subplots(rows, cols, subplot_titles=[noc_short(g) for g in groups],
                      vertical_spacing=0.08, horizontal_spacing=0.04)
  for i, g in enumerate(groups):
      r, c = divmod(i, cols); s = nb[nb.noc_name==g].sort_values("month")
      fig.add_trace(go.Scatter(x=s.month, y=s.postings_total, mode="lines",
          line=dict(color=BRAND, width=1.4), showlegend=False,
          hovertemplate="%{x|%b %Y}: %{y:,.0f}<extra></extra>"), r+1, c+1)
      fig.update_xaxes(visible=False, row=r+1, col=c+1)
      fig.update_yaxes(visible=False, rangemode="tozero", row=r+1, col=c+1)
  ```
- registry: `"pulse.occupation_trends": lambda ds, **k: pulse.occupation_trends_grid(ds)`.

**NEW `pulse.momentum`** — is demand accelerating or decelerating? Replaces SA-vs-NSA.
- data: `ds.overall` (existing).
- metric: 3-month MA minus 12-month MA (or MoM of the 3-mo MA), via
  `compute.moving_average`. A diverging bar/area around 0: orange accelerating, teal
  cooling. `add_reference_line(fig, 0)`, `add_covid_band(fig)`.
  ```python
  o = ds.overall.copy(); s = o.set_index("month")["postings_total"]
  fast, slow = C.moving_average(s,3), C.moving_average(s,12)
  mom = (fast - slow); colors = np.where(mom>=0, UP, DOWN)
  go.Bar(x=mom.index, y=mom.values, marker_color=colors, ...)
  ```
- registry: `"pulse.momentum": lambda ds, **k: pulse.momentum(ds)`.

Keep: `demand_ribbon`, `yoy_bars`, `seasonality`, `composition`, `diffusion` (smoothed).

### Occupations page — drop bump + concentration-trio, add skill-churn

Remove `occupations.bump`, `occupations.concentration` (+ `bump_chart`,
`concentration_trio`, and the blocked `horizon_wall`). Keep treemap (animated),
indexed_lines, contribution_bars, waterfall, dumbbell, noc_naics_heatmap.

**NEW `occupations.skill_churn`** — which skills are rising vs falling (demand
growth of top skills). General "what's entering/leaving demand."
- data: `ds.table("monthly_skills_topk")` (national rows = `occupation_scope==ALL`).
  Add a thin accessor `DataSource.skills_national(top, base_year, end_year)` that
  sums postings by `skill_code` for a base vs recent year and returns growth.
- metric: reuse `compute.index_to_base` or a simple `(end/base - 1)`.
- factory: diverging horizontal bars, top risers (UP) and top fallers (DOWN),
  `add_reference_line(fig,0)`. Skill codes are taxonomy IDs (no label table in v1 —
  keep the existing caveat text).
- registry: `"occupations.skill_churn": lambda ds, **k: occupations.skill_churn(ds)`.

### Geography page — one authoritative map with a measure toggle

Remove standalone `geography.lq_choropleth`, `geography.lq_heatmap`,
`geography.province_tiles`. Demote LQ to a **measure** of the main map.

**MODIFY into `geography.demand_map(ds, measure="share", animate="by-year")`** — a
single animated choropleth whose `measure ∈ {count, share, per10k?, lq}` selects
`z`/colorbar. (`per10k` needs a labour-force denominator we don't have internally;
ship `count | share | lq` now, leave a `per10k` hook.)
- data: `ds.province` for count/share; `ds.province_occupation` + `C.location_quotient`
  for lq (national, all-occupation LQ across provinces, or keep LQ at the occupation
  level behind a secondary control).
- **Toggle mechanism — pick one:**
  - **(A) React-driven (recommended):** register one chart_id per measure
    (`geography.demand_map_share`, `_count`, `_lq`) and add a client segmented control
    on the page that swaps which `fig` is rendered. A `Select.tsx` already exists;
    a small `SegmentToggle` client component swapping a `RemoteFigure fig={...}` is the
    clean path and keeps each figure a plain server fetch. The geography i18n already
    has `measurePer10k/measureLq/measureCount` + explainer strings to reuse.
  - **(B) Plotly `updatemenus`:** one figure, buttons rewrite `z`+`colorbar` via
    `args=[{"z":[...]}, {"colorbar.title.text": ...}]`. Single fetch, but mixing a
    measure toggle with the year slider crowds the chart chrome. Prefer (A).
- Keep `share_choropleth`→folded into the map's default; keep `ranked_provinces`,
  `yoy_choropleth` (animated momentum), `shift_share_bars` (relabel "secondary").

**NEW `geography.cma_demand`** — city/CMA-level demand (finer than province).
- data: `ds.market` (existing `monthly_by_market`; `market_label` like
  "AB | Calgary (CMA)"). Top-N CMAs by volume, ranked bars or a small-multiple
  trend; optionally a bubble map using CMA centroids (no centroid table yet → start
  with ranked bars + trend, no new asset needed).
- registry: `"geography.cma_demand": lambda ds, **k: geography.cma_demand(ds)`.

### Skills page — reframe lift, add skill×occupation heatmap

**MODIFY `skills.skill_lift_bars`** → the page's default becomes "most-demanded
skills & their trend": a NEW `skills.top_skills_trend(ds)` (top-k skills nationally
by volume, each as a small indexed line) as the headline; keep `skill_lift_bars` as
a secondary "distinctive skills for occupation X" view.

**NEW `skills.skill_occupation_heatmap`** — what each occupation demands.
- data: needs skills × occupation. `monthly_skills_topk` has `occupation_scope`, so
  add `DataSource.skill_by_occupation(top_skills, month)` → pivot skill_code × NOC
  broad, column-normalised (mirror `noc_naics_heatmap`'s structure).
- factory: `go.Heatmap(colorscale=SEQUENTIAL, colorbar="% of occupation")`, same
  shape as `occupations.noc_naics_heatmap`.

### Pay page — keep, plus optional wage-by-geography

Keep `wage_band`, `wage_dumbbell`, `conditions_mix`, `language_gap`. `wage_demand_
quadrant` may stay (bivariate structure is descriptive) or be replaced by the Wave-2
premium. Optional **NEW `pay.wage_by_geography`** from `ds.wage_by_province` (ranked
median + p25/p75 whiskers) — pure existing data.

---

## WAVE 2 — AI-exposure (Eloundou) + the conditioned wage premium

Two kinds of dependency here, and they are NOT the same:
- **AI-exposure** needs a *static occupation→score reference asset* built once from
  **public** data (Eloundou + concordances). It does **not** touch the corpus or the
  off-limits upstream pipeline — it's a committed asset like
  `data/geo/canada_provinces.geojson`. We build it ourselves.
- **The conditioned wage premium** needs a *corpus-derived* table (wage percentiles
  cut by the education field). That genuinely requires the upstream aggregation
  pipeline → a real owner dependency.

### 2A. AI-exposure asset — full build pipeline (Eloundou β, NOC-broad)

We use **Eloundou et al. "GPTs are GPTs"** exposure, not AIOE. There is **no
published Eloundou-on-NOC table** (Canadian AIOE products exist — StatCan 11F0019M
2024005, Dais/FSC — but they use Felten AIOE, mostly NOC 2016, and ship no clean
occupation CSV), so we build the crosswalk. Aggregating to **NOC broad (10
single-digit groups)** is the defensible resolution: the broad axis is stable across
NOC 2016/2021 (sidesteps TEER churn) and averages out the many-to-many crosswalk
noise. Our postings occupation cut is NOC-broad anyway.

**Build inputs (all public, download once):**
- Eloundou exposure: `openai/GPTs-are-GPTs` repo (MIT), file
  [`data/occ_level.csv`](https://raw.githubusercontent.com/openai/GPTs-are-GPTs/main/data/occ_level.csv)
  — columns `O*NET-SOC Code, Title, dv_rating_alpha, dv_rating_beta, dv_rating_gamma,
  human_rating_alpha, human_rating_beta, human_rating_gamma`. **Headline = β**
  (`human_rating_beta` primary, `dv_rating_beta` fallback for occs missing a human
  rating); carry α and γ(=ζ) as bounds. Keyed at **O*NET-SOC 8-digit** (~650 rows).
- Canadian employment weights for the broad roll-up: 2021 Census / LFS employment by
  NOC 2021 (StatCan).
- **Crosswalk — reuse the one StatCan's C-AIOE paper and Dais already use; no long
  chains.** Mapping and metric are separable (AIOE and Eloundou are both SOC-keyed),
  so we pour **Eloundou β** through a published SOC→NOC crosswalk. Primary = the
  **official StatCan `soc2018us-noc2016v1_3` concordance** (Open Licence,
  `soc2018us-noc2016v1_3-eng.csv`) — the exact mapping StatCan's C-AIOE paper cites in
  its methodology. Only two trivial steps:
  - **O*NET-SOC → SOC 2018 6-digit:** truncate the `.xx` (`11-1011.00` → `11-1011`).
  - **SOC 2018 → NOC:** join the StatCan concordance → NOC 2016, take the **first digit
    = NOC broad**. NOC broad is identical in 2016 and 2021, so for our broad join no
    2016→2021 step is needed. Split one-to-many matches by Canadian employment
    (Census/LFS by NOC) when averaging up to broad.
  - **Alternatives, same short idea:** Dais/Brookfield's `NOC_ONet_Crosswalk` maps
    O*NET→NOC directly (one step, but mixed-vintage/messier); `bcgov/onet-noc2021-
    crosswalk` pre-packages the StatCan concordance as clean **NOC 2021 5-digit with
    weights** — use it only if we ever want finer than broad. All three are the same
    mapping; pick by how clean/current you want it.
- **Cross-check (not a substitute):** StatCan 11F0019M 2024005 and Dais/FSC publish
  AIOE-on-NOC (Felten, not Eloundou; PDF-only numbers) — sanity-check our broad β
  against them.

**Builder script** — `tools/build_ai_exposure.py` in THIS repo (dashboard-side
reference-data tooling, not the corpus pipeline). Reads `occ_level.csv` + the StatCan
`soc2018us-noc2016v1_3` concordance + Canadian employment weights, truncates O*NET-SOC
to SOC 2018, joins to NOC, rolls Eloundou β up to the 10 broad groups, writes the
asset. Run once / on classification updates; output is committed so nothing recomputes
at request time.

**Output asset** — `data/ai/occupation_ai_exposure.parquet`:
`noc_code` (str "0".."9"), `noc_name`, `exposure_beta`, `exposure_alpha`,
`exposure_gamma`, `exposure_beta_dv`, `n_occupations` (how many detailed occs rolled
in), `method` (provenance string). 10 rows.

**DataSource accessor** (mirror `geojson`, a cached read of a static asset):
```python
_AI_PATH = Path(__file__).resolve().parents[3] / "data" / "ai" / "occupation_ai_exposure.parquet"

@functools.cached_property
def ai_exposure(self) -> pd.DataFrame:
    df = pd.read_parquet(_AI_PATH)
    df["noc_code"] = df["noc_code"].astype(str)
    return df
```

**Factories:**
- **`occupations.ai_exposure_scatter(ds)`** — join `ds.ai_exposure` to recent demand
  change per broad NOC. x = `exposure_beta`, y = demand change % over the stable
  window (reuse `C.index_to_base`/`C.yoy_pct` on `ds.noc_broad`, summed to broad),
  bubble size = last-12-mo postings volume, text = `noc_name`. `add_reference_line`
  at median exposure (vertical) and 0% (horizontal) to make four quadrants; label
  off-diagonal groups (high-exposure-rising = augmentation; high-exposure-falling =
  displacement). 10 points — sparse but canonical. Registered `scatter` trace.
  ```python
  ex = ds.ai_exposure.set_index("noc_code")
  nb = _real_groups(ds.noc_broad)            # has noc_code (1-digit) + noc_name
  chg = recent_change_by_broad(nb)           # % vs stable base, summed to broad
  vol = last12_volume_by_broad(nb)
  df = ex.join(chg).join(vol).dropna()
  go.Scatter(x=df.exposure_beta, y=df.change_pct, mode="markers+text",
             marker=dict(size=scaled(df.vol), color=BRAND), text=df.noc_name, ...)
  ```
- **`geography.ai_exposure_map(ds)`** — province mean exposure = demand-weighted
  average of broad-NOC β using `ds.province_occupation` (province × NOC demand) ×
  `ds.ai_exposure`. Choropleth, `SEQUENTIAL`, colorbar "mean AI exposure (β)".
  ```python
  po = _last12(ds.province_occupation)       # province × noc_code demand
  ex = ds.ai_exposure.set_index("noc_code")["exposure_beta"]
  po = po.assign(beta=po.noc_code.map(ex))
  prov = po.groupby("province_scope").apply(
      lambda d: np.average(d.beta, weights=d.postings_total))
  # → go.Choropleth(geojson=ds.geojson, locations=..., z=prov, ...)
  ```
- **`skills.ai_skill_diffusion(ds)`** — share of postings mentioning AI-related
  skills over time. **BLOCKED on a separate dependency**: v1 has no public skill-label
  table (see `skill_lift` caveat), so we cannot flag `skill_code → is_ai`. Needs
  either a skill-taxonomy label table or a curated AI skill_code list. Defer until one
  exists; do NOT fake it. (The scatter + map above do NOT need skill labels.)

**Wiring (each new chart):** REGISTRY entry (`"occupations.ai_exposure": lambda ds,
**k: occupations.ai_exposure_scatter(ds)`, `"geography.ai_exposure": ...`); page
`Promise.all` + `<Figure>`/`<RemoteFigure>`; en+fr chrome in the page dicts;
`_FR_CHROME` entries for "mean AI exposure (β)", "AI exposure (β)", "demand change vs
2019", etc.; test asserts the chart builds and (scatter) has ≥8 points.

**Required UI caveat** (note text, both locales): exposure is US-task-based
(Eloundou), mapped to Canadian occupations via StatCan's SOC↔NOC concordance and
aggregated to the 10 broad NOC categories — a *potential-exposure* signal, not realized
automation, and deliberately not shown below the broad level. No causal language.

### 2B. Conditioned wage premium — corpus-derived table (real upstream dependency)

**`pay.wage_premium`** — does demanding a degree (or a skill) come with higher posted
pay. The wage cube is **not** cut by requirement today, so the clean version needs a
NEW corpus-derived table from the upstream pipeline:

`monthly_wage_by_education.parquet`:
`month, province_scope, occupation_scope, industry_scope, education_category,
wage_postings, wage_p25, wage_median, wage_p75` — i.e. `monthly_wage_cube` with an
added `education_category` dimension. (A skill-conditioned variant is far heavier;
education first.)

- Accessor `DataSource.wage_by_education` (mirror `wage_overall`).
- Factory `pay.wage_premium(ds)`: median posted wage by education category over time
  (lines), or a premium ratio = median(degree-required) ÷ median(no-degree) as a
  single line with `add_reference_line(fig, 1)`.
- **Owner dependency:** whoever builds the derived bundle must add this cut; flag it.

**Wave-1 proxy (ships now, no new data):** `pay.education_wage_proxy(ds)` — an
occupation-level scatter: x = degree-requirement share per broad NOC
(`ds.requirements("Education")` collapsed to "degree vs not", joined on NOC), y =
median posted wage per broad NOC (`ds.wage_by_noc`), bubble = volume. A legitimate
descriptive "do credential-heavy occupations pay more" view, fully on existing data.
Ship this in Wave 1; replace/augment with the conditioned premium when 2B lands.

---

## New compute / datasource helpers to add

- `compute`: none strictly required (momentum uses `moving_average`; churn uses
  `index_to_base`). Optionally `def dissimilarity_index(wide, base, end)` for a
  reallocation line if we want it later.
- `datasource`: `skills_national(...)`, `skill_by_occupation(...)`,
  `ai_exposure` (W2), `wage_by_education` (W2). Each is a ~10-line cached accessor
  mirroring the existing ones.

## Pre-build checks (do first)

1. **Coverage break:** plot `ds.overall["postings_total"]` and
   `ds.coverage_overall` across 2016–2026; if there's a vendor/scrape discontinuity,
   add a break marker (a vertical `add_reference_line` + note) on every long trend.
   One afternoon; gates credibility.
2. **Confirm `monthly_skills_topk` national rows** exist (`occupation_scope ==
   ALL_OCCUPATIONS`) for the skill-churn/trend factories; if only per-occupation rows
   exist, sum across occupations in the accessor.
3. **AI-exposure asset** — we build it ourselves via `tools/build_ai_exposure.py`
   (§2A); not owner-blocked. The only true owner dependency is the conditioned wage
   table (§2B). The AI-skill-diffusion plot is separately blocked on a skill-label
   table.

## Tests & verification

- `api/tests/test_figures.py` already builds **every** REGISTRY id and asserts
  template/title-strip/transparent-bg + no causal language. New ids inherit that.
  Add: frame/slider assertions for any animated additions; a measure-set assertion
  for the geography map ids; an FR-chrome assertion for new axis/legend strings.
- Web: `npm run -s tsc`/`eslint` clean; `rm -rf web/.next`; load each touched page,
  check console clean and the figure draws (the prior wave's verification routine).
- Run the `verification` skill (UI/render route) before sign-off.

## Sequencing

- **W1a (pure swaps, no new data):** delete the 4 Pulse decompositions + bump +
  concentration + tiles + standalone LQ; add momentum, occupation small-multiples,
  skill-churn, skill×occupation heatmap, CMA demand, geography measure-toggle,
  wage-by-geography, education-premium proxy. All existing data.
- **W1b:** the coverage-break marker pass across long trends.
- **W2a (we build, no owner needed):** run `tools/build_ai_exposure.py` to produce
  the Eloundou NOC-broad asset, then the AI-exposure scatter + map.
- **W2b (waits on the corpus team):** the `monthly_wage_by_education` table → the
  conditioned wage premium. AI-skill-diffusion waits on a skill-label table.

Net effect: same ~38-slot rich grid, same layout, every slot economics-grounded.
