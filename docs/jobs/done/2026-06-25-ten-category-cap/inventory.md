# Asset inventory — category counts (research / evidence)

Date: 2026-06-25. Branch: `redesign2`. Data: the derived bundle the live app reads
(`DataSource` / cubes), counted on the real data, not the synthetic golden corpus.

## Dimension cardinalities in the real data

| Dimension | Distinct values | Notes |
| --- | --- | --- |
| Provinces (`province_scope`) | **11** | AB BC MB NB NL NS NT ON PE QC SK · NU & YT absent |
| NOC broad groups (`noc_name`) | **10** real, **11** with `Unknown` | |
| NAICS broad sectors (`naics_name`) | **20** real | |
| NAICS in `noc_by_naics` | **20** | |
| Coverage fields | **13** | |
| CMAs available (last 12 mo) | **160** | `cma_demand` default keeps top 18 |
| Provinces with ≥200 wage postings (Dec-2024) | **10** | NT filtered out |

## Per-asset count (registered charts + Explore)

`✅` already ≤10 · `⛔` exceeds 10, needs a cap · `🕒` time axis, exempt by the rule.

| Asset (registry id / Explore) | Category axis | Count now | Verdict |
| --- | --- | --- | --- |
| `pulse.demand_ribbon` / `yoy_bars` / `momentum` / `diffusion` | single time series | 1 | ✅ |
| `pulse.seasonality` | **months × years** | 12 × N | 🕒 exempt (both axes time) |
| `pulse.composition` | NOC + Other | 6 + Other = 7 | ✅ (already top-N + Other) |
| `pulse.occupation_trends` | NOC panels (real) | 10 | ✅ |
| `geography.demand_map_{share,count,percap,lq}` | provinces (choropleth) | 11 | ⛔ |
| `geography.ranked_provinces` | provinces (bars) | 11 | ⛔ |
| `geography.cma_demand` | CMAs (bars) | 18 | ⛔ |
| `geography.shift_share` | provinces (bars) | 11 | ⛔ |
| `geography.yoy_choropleth` | provinces (choropleth) | 11 | ⛔ |
| `geography.ai_exposure` | provinces (choropleth) | 11 | ⛔ |
| `occupations.treemap` | NOC tiles (incl. Unknown) | 11 | ⛔ |
| `occupations.indexed_lines` | NOC line series (real) | 10 | ✅ |
| `occupations.contribution_bars` | NOC bars (real) | 10 | ✅ |
| `occupations.waterfall` | NOC deltas + 2 totals | 10 (+2 totals) | ✅ (10 categories; totals are structural bookends) |
| `occupations.dumbbell` | NOC (real) | 10 | ✅ |
| `occupations.skill_churn` | skills (risers + fallers) | 11 + 11 = 22 | ⛔ |
| `occupations.ai_exposure` (scatter) | NOC bubbles (real) | 10 | ✅ |
| `occupations.noc_naics_heatmap` | NOC rows × **NAICS cols** | 10 × 20 | ⛔ (columns) |
| `industries.coverage_line` | single time series | 1 | ✅ |
| `industries.treemap` | NAICS tiles | 20 | ⛔ |
| `industries.share_over_time` | NAICS + Other | 7 + Other = 8 | ✅ (already top-N + Other) |
| `industries.contribution_bars` | NAICS bars | 20 | ⛔ |
| `pay.wage_band` | P25/median/P75 band | 3 | ✅ |
| `pay.wage_dumbbell` | provinces (≥200 wage) | 10 | ✅ (NT already filtered; wages can't be folded) |
| `pay.wage_demand_quadrant` | NOC bubbles (real) | 10 | ✅ |
| `pay.education_wage_proxy` | NOC bubbles (real) | 10 | ✅ |
| `pay.wage_by_education` | education levels | ~6 | ✅ |
| `pay.conditions_mix` | employment types | 4 | ✅ |
| `pay.language_gap` | EN vs FR mandatory | 2 | ✅ |
| `skills.top_skills_trend` | skill line series | 8 | ✅ |
| `skills.ai_skill_diffusion` | single time series | 1 | ✅ |
| `skills.skill_lift` | skills (bars) | 15 | ⛔ |
| `skills.skill_occupation_heatmap` | **skill rows** × NOC cols | 16 × 10 | ⛔ (rows) |
| `skills.education` | education categories | ~7 | ✅ |
| `skills.experience` | experience bands | 6 | ✅ |
| `quality.coverage_lines` | 6 key fields | 6 | ✅ |
| `quality.coverage_latest` | all coverage fields (bars) | 13 | ⛔ |
| Explore bar — `province` (any measure) | provinces | 11 | ⛔ |
| Explore bar — `industry` (any measure) | NAICS | 20 | ⛔ |
| Explore bar — `occupation` (any measure) | NOC (real) | 10 | ✅ |
| Explore line — `time` (any measure) | single time series | 1 | ✅ |

**Net:** 16 registered charts + 2 Explore breakdown dims (province, industry across 5
measures) exceed 10. One asset — `pulse.seasonality` — exceeds 10 only on its month
axis and is exempt because both axes are time.

## How counts were measured

Built each `api.figures.REGISTRY` factory (and its animation frames) plus
`api.explore.build_explore_figure` over every (dim, measure), then counted, per trace:
horizontal-bar `y` values (non-date), treemap tiles (`labels − root`), heatmap
`max(rows, cols)`, choropleth distinct `z`, marker-scatter points, and legend line
series. Datetime axes were treated as 0 (time, not categories).
