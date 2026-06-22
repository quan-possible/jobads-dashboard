# Design: researcher-tier plots — descriptive, structure-revealing

Status: DESIGN / decision converged. No code changed yet.
Date: 2026-06-21. Worktree: `redesign2`. Scope: researcher plots only.

## Scope and goal (settled with Bruce)

- **Public Core is good enough — untouched.** This work is the **researcher tier** only.
- **Goal:** show descriptive content that **reveals the structure of the data as
  much as possible**. Within that scope, the more **beautiful, intuitive, rich,
  animated** the better. Animation/time-scrubbing is a feature, not a gimmick — it
  reveals the time dimension.
- **Depth ceiling: AI-exposure.** Nothing deeper. Specifically **out of scope**:
  external StatCan/CPI joins (Beveridge curve, V/U tightness, wage-Phillips, real
  wages, JVWS benchmark) and employer-level monopsony — all judged too deep / too
  much for this pass.
- **The filter for every plot:** descriptive structure that informs a researcher
  generally (keep) vs. a niche/over-clever concept or a one-question hypothesis
  test (cut or reframe). Most current plots are descriptive and pass; the cut list
  is short.

Note on earlier framing: an earlier version of this doc proposed an external-data
"anchor layer" (Beveridge/tightness/JVWS). That was over-built and is dropped.
LQ is established (regional economics — BLS/StatCan/cluster analysis use it), just
specialist and less intuitive than a raw measure, so it gets demoted, not killed.

## Decision: remove / reframe / add / keep

### Remove
- `anomaly_flags` — jargon ("robust z of remainder"), low marginal info (COVID is
  already obvious in the raw series).
- `sa_vs_nsa` — the SA and NSA lines coincide; a footnote, not a panel.
- `stl_panel` — a third decomposition of the same headline number.
- `cycle_plot` — redundant with the seasonality heatmap.
- `concentration_trio` (Lorenz / Gini / **HHI**) — abstract indices the composition
  treemap already shows more intuitively.
- `horizon_wall` — blocked on a fine-NOC rollup the pipeline does not produce.
- Redundant geography maps — collapse `bubble_map` and `province_tile_grid` into a
  single distribution map.

From the whole time-series-decomposition family, only **`diffusion_index`
(breadth of growth)** and **one seasonal view (`seasonality_heatmap`)** survive.
The section was over-invested in dissecting the single national headline number —
the least differentiated thing (StatCan/Indeed do aggregate demand better). Put the
richness into the content dimensions instead.

### Reframe (keep the form, change what it shows)
- **Location quotient** (`lq_choropleth`, `lq_heatmap`) → demote LQ to **one option
  in a measure toggle** (count / share / per-capita / LQ) on the main geography
  map. Keep the animated heatmap form, but show a **plain descriptive measure**
  (demand share / intensity over time), not LQ as the headline.
- **Skill lift** (`skill_lift_bars`) → drop the "vs national lift" framing →
  **"most-demanded skills and how they're trending."**

### Add
- **AI-exposure** (the one deep, differentiating layer) — occupations scored by
  AI/automation exposure from their skill content, against how demand for them is
  actually moving. Needs a **skill/occupation → exposure crosswalk** (AIOE /
  Eloundou → NOC), i.e. one new derived table — the only real data dependency.
- **Wage / requirement premium** — does demanding a given skill, degree, or
  experience level come with higher posted pay? Ties skills ↔ wages; a real
  research question; fully descriptive; builds on existing wage + skills tables.
- **(Later, only if employer identifiers become recoverable)** the **monopsony
  concentration map** — the *important* HHI (employer shares within CMA × occupation
  markets). Not buildable on current derived data (only an `advertised_by` coverage
  count survives); flagged as the single best future add.

### Keep and enrich (the spine — six descriptive dimensions)
1. **Occupations** — animated treemap (composition over time), relative trend lines
   (`indexed_lines`), growth contribution (`waterfall` / `contribution_bars`),
   then-vs-now `dumbbell`, occupation × industry heatmap (`noc_naics_heatmap`).
2. **Industries** — animated treemap, `share_over_time`, contribution bars.
3. **Geography** — one distribution map with the measure toggle, `ranked_provinces`,
   the animated over-time map (`yoy_choropleth`), the reframed occ × province
   heatmap, and `shift_share_bars` (a descriptive decomposition — kept).
4. **Wages** — distribution bands p25/median/p75 (`wage_band`), `wage_dumbbell`,
   wage-vs-demand scatter (`wage_demand_quadrant` — bivariate structure, kept).
5. **Skills & requirements** — reframed skill demand+trend, `education_composition`,
   `experience_mix`, remote/hybrid (`conditions_mix`).
6. **Pulse (deep)** — `diffusion_index` (breadth) + `seasonality_heatmap` only.

Methods/coverage (`coverage_*`) → a methods appendix, not headline.

## Net effect

Remove ~9, reframe 2, add 2 (+1 later). The researcher tier goes from a chart
*showcase* (~38) to ~18 descriptive, structure-revealing views across six
dimensions, animation and richness encouraged, with **AI-exposure** as the one
deep layer.

## Data feasibility

- **On existing derived parquet (most of the spine):** all six dimensions' keep
  list, the LQ→measure reframe (share/per-capita need a labour-force/pop
  denominator — confirm what's bundled), and the wage/requirement premium.
- **One new derived table needed:** the AI-exposure crosswalk (skill/NOC →
  AIOE/Eloundou score). The upstream data repo is off-limits for dashboard logic,
  so this needs a sanctioned derived-data add or an owner.
- **Not feasible now:** employer-level monopsony HHI (no employer field in derived
  data).

## Open questions

- Who owns / can sanction the **AI-exposure derived table**?
- Is there a **denominator** (labour force / population by province, and ideally by
  CMA) already in the bundle for the per-capita measure?
- Any **coverage break** in the 2016–2026 series to mark before long trends ship?

## Provenance

Converged over a design discussion on 2026-06-21, grounded in three research briefs
(reference dashboards; economics canon; Canadian data) — see the conversation. Key
anchors retained at this scope: Autor–Levy–Murnane & Deming (task/skill content),
Felten–Raj–Seamans / Eloundou et al. (AI exposure). Deeper canon (Pissarides,
Hazell–Taska, Azar–Marinescu–Steinbaum) noted but deliberately out of scope.
