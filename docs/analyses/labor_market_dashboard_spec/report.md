# Labor Market Dashboard Specification

## Purpose

This document specifies how to build a general, economics-driven dashboard of the labor market in the standalone `jobads-dashboard` project.

This is a planning artifact only. It does **not** implement the dashboard. It is written so a software worker can build the dashboard without rediscovering the upstream data sources, scope boundaries, metric definitions, or architecture.

The dashboard should help a user answer simple macro-style questions such as:

- How strong or weak is labor demand right now?
- How has labor demand changed over time?
- Which provinces, cities, occupations, and industries are growing or weakening?
- What do advertised wages and job conditions look like, given data coverage limits?
- Which parts of the labor market are stable, shifting, concentrated, or becoming more fragmented?

## Executive Recommendation

Build the dashboard as a **single descriptive labor-market product** in this project, using upstream processed job-ads data from:

- `../jobads-data/main/data/processed/<year>/processed_*.parquet`

Do **not** build the dashboard directly from:

- `../jobads-data/main/data/raw/`
- `../jobads-data/main/data/exported/`
- notebook code as the main executable surface
- cross-repo research outputs

Instead:

1. Read the upstream processed data from `jobads-data/main`.
2. Materialize a new local pre-aggregated dashboard data package in this repo.
3. Build the dashboard app on top of those local aggregates.

## Project Boundary

### What this project owns

- The dashboard specification.
- The dashboard aggregate pipeline.
- The dashboard app.
- Dashboard-local docs, screenshots, and operator notes.

### What this project does not own

- Upstream raw or processed job-ads ingestion.
- Upstream canonicals generation.
- `ai_labor` research outputs.

### What the dashboard is

- A durable interactive summary of labor-market conditions in the Vicinity postings data.
- A descriptive economic monitoring tool.
- A historical and current overview of labor demand as measured through job ads.
- A place to build intuition, not a place to make causal claims.

### What the dashboard is not

- Not an AI dashboard.
- Not a cross-repo research viewer.
- Not a raw-data browser over posting text.
- Not a notebook export.
- Not an employment or unemployment dashboard in the official-statistics sense.
- Not a causal inference surface.

## Upstream Source of Truth

| Layer | Canonical source | Use for | Do not use for |
|---|---|---|---|
| Descriptive labor-market data | `../jobads-data/main/data/processed/<year>/processed_*.parquet` | Counts, composition, wages, geography, occupations, industry, language, work conditions | Raw API provenance, live dashboard scans over the full corpus |
| Dictionaries / labels | `../jobads-data/main/data/processed/canonicals_codes.json` | Label decoding and clean display names | Primary metric generation |
| Schema / pipeline contract | `../jobads-data/main/docs/metadata.md`, `../jobads-data/main/config/config.yaml`, `../jobads-data/main/docs/README.md`, `../jobads-data/main/docs/plans/README.md` | Field definitions, pipeline behavior, caveats | User-facing charts |
| Existing descriptive dashboard precedent | `../jobads-data/main/docs/analyses/analysis_dashboard/analysis_dashboard.ipynb`, `../jobads-data/main/docs/analyses/analysis_dashboard/outputs/analysis_dashboard.html` | Information architecture, chart ideas, coverage framing | Main implementation surface |

## Data Coverage And Scale

Current upstream processed job-ads coverage is `2016-01-01` through `2025-07-31`.

Processed row counts by year:

| Year | Rows | Parquet chunks |
|---|---:|---:|
| 2016 | 930,973 | 4 |
| 2017 | 1,316,641 | 8 |
| 2018 | 2,635,139 | 14 |
| 2019 | 2,757,830 | 14 |
| 2020 | 2,038,614 | 10 |
| 2021 | 2,808,399 | 10 |
| 2022 | 3,660,890 | 27 |
| 2023 | 3,078,987 | 23 |
| 2024 | 2,769,644 | 18 |
| 2025 | 1,621,776 | 7 |

Important caveat:

- `2025` raw fetch provenance is not fully trustworthy yet. The upstream manifest records an API empty-data error after retries even though the job is marked completed.
- The dashboard should therefore treat `2025-07-31` as the current observed endpoint, but expose freshness and provenance notes in the data-quality section.

## Economic Framing

The dashboard should interpret job ads as a measure of **labor demand and hiring conditions**, not as a direct measure of:

- employment
- unemployment
- vacancies in the full economy
- wages paid

Every section should keep that framing visible. The core interpretation should be:

- counts measure posting activity
- shares measure composition within posting activity
- wage fields measure advertised compensation only where available
- changes over time indicate shifts in posted labor demand, subject to platform and coverage caveats

## Field Quality Tiers

### Tier 1: Safe headline dimensions

Use as primary dashboard dimensions:

- `dateFound`
- `province`
- `location`
- `district`
- `devRegion`
- `cma-ca`
- `noc`
- `5noc`
- `nocSkillLevel`
- posting counts

### Tier 2: Safe with explicit coverage overlays

Use as secondary panels with denominator warnings:

- `remunerationHrly`
- `remunerationMin`
- `remunerationMax`
- `type`
- `duration`
- `education`
- `experience`
- `experienceDetails`
- `advertisedBy`
- `naics`

### Tier 3: Newer / sparse / unstable fields

Do not use as headline series across the full `2016` to `2025` window:

- `remoteWorkOptions`
- `primaryPostingLanguage`
- `englishLanguageRequirement`
- `frenchLanguageRequirement`
- `certs`
- `cips`

These can appear as:

- post-2021 overlays
- drill-down panels
- conditional composition views

### Tier 4: Offline-only / not for main UI computation

- `description`
- exploded free-text / NLP summaries
- high-cardinality skill text without pre-aggregation

If text-derived insights are added later, they must be computed offline into dashboard tables first.

## Reusable Upstream Assets

Best structural precedent:

- `../jobads-data/main/docs/analyses/analysis_dashboard/analysis_dashboard.ipynb`
- `../jobads-data/main/docs/analyses/analysis_dashboard/outputs/analysis_dashboard.html`

What to reuse:

- information architecture
- KPI choices
- coverage and missingness framing
- simple descriptive chart patterns

What **not** to reuse directly:

- old notebook-era execution logic
- hardcoded legacy paths
- the notebook as the implementation surface

The broader `../jobads-data/main/docs/analyses/eda_framework/` is useful as an idea bank for:

- province specialization
- sectoral dashboards
- dynamics panels
- task / RSA views

But it should not be the first implementation target.

## Product Structure

Recommended dashboard sections:

1. Overview
2. Geography
3. Occupations
4. Industries
5. Compensation And Conditions
6. Skills, Education, And Requirements
7. Data Quality And Freshness

### 1. Overview

Purpose:

- Give a fast read of market size, trend direction, composition, and data completeness.

Required cards:

- total postings in selected window
- latest month postings
- 12-month change in postings
- 3-month moving average versus prior year
- wage-posting coverage share
- occupation coverage share
- province count covered
- latest refresh month

Required charts:

- monthly postings line chart
- month-over-month and year-over-year growth panel
- province-share stacked area or small multiples
- broad occupation mix over time
- coverage mini-panel for wages, occupation, remote, and language

Default filters:

- date range
- province
- occupation level
- industry level

### 2. Geography

Purpose:

- Show where posting activity is concentrated and how regional composition changes.

Required views:

- postings by province over time
- province share of national postings
- top CMA/CA markets
- optional dev region / district breakdown
- market concentration table for the top local areas in the selected window

Required caveat:

- geography counts are descriptive posting measures, not direct employment counts.

### 3. Occupations

Purpose:

- Show how occupational demand composition changes over time.

Required views:

- top broad NOC groups by level and growth
- occupation share over time
- occupation mix by province
- top rising and falling broad occupation groups over a selected comparison window
- occupational concentration or dispersion indicators in the selected period

Implementation note:

- precompute both fine and broad rollups
- preserve leading zeros when parsing occupation codes

### 4. Industries

Purpose:

- Show where employer demand is shifting by sector, while respecting incomplete industry coding.

Required views:

- industry mix over time for postings with usable industry codes
- industry share by province
- top rising and falling broad industries over a selected comparison window
- coverage panel showing the share of postings with usable industry information

Required rule:

- every industry chart must display the share of postings represented by the industry-coded denominator.

### 5. Compensation And Conditions

Purpose:

- Summarize pay disclosure and job conditions without overstating sparse fields.

Required views:

- hourly wage median, p25, and p75 over time
- wage distribution by province
- wage distribution by broad occupation
- employment type mix
- duration mix
- student-job flag mix
- advertised-by mix

Required rule:

- every wage chart must display the share of postings with wage data in the same filtered denominator.

### 6. Skills, Education, And Requirements

Purpose:

- Offer drill-down views of requirements and skill composition.

Required views:

- top skills among postings with skills present
- education mix
- experience category mix
- experienceDetails coverage and simple bins
- optional certification / CIP drill-down

Scope rule:

- these should be drill-down panels, not homepage headline metrics.

### 7. Data Quality And Freshness

Purpose:

- Make limitations explicit so the dashboard stays trustworthy.

Required items:

- latest processed month
- source window
- per-field coverage table
- historically unstable field warnings
- `2025` provenance note
- wage coverage note
- remote and language historical-availability note
- explanation of what job-ad measures can and cannot say about the labor market

## Metric Specification

### Headline descriptive metrics

| Metric | Definition | Denominator | Notes |
|---|---|---|---|
| `postings_total` | Count of postings in current filter | all postings in filter | core KPI |
| `postings_latest_month` | Count in latest observed month | latest month only | use upstream processed data only |
| `postings_yoy_pct` | percent change vs same month prior year | same month prior year | suppress when prior year unavailable |
| `postings_ma3_yoy_pct` | percent change in 3-month moving average vs prior year | same 3-month window prior year | smoother headline trend metric |
| `province_share` | postings in province / national postings | selected month or window | show as share |
| `occupation_share` | postings in occupation group / all postings | selected filter | preserve coverage note |
| `industry_share_conditional` | postings in industry group / postings with usable industry code | industry-coded postings | label as conditional share |
| `wage_posting_share` | postings with non-null `remunerationHrly` / all postings | filtered postings | must appear next to wage charts |
| `remote_field_coverage` | postings with non-null `remoteWorkOptions` / all postings | filtered postings | not a remote share |
| `remote_share_conditional` | remote or hybrid postings / postings with remote field present | postings with non-null `remoteWorkOptions` | label clearly |

### Supporting structural metrics

| Metric | Definition | Notes |
|---|---|---|
| `top5_market_share` | share of postings accounted for by top 5 CMAs/CAs in filter | concentration indicator |
| `top10_occ_share` | share of postings accounted for by top 10 broad occupations | occupational concentration indicator |
| `top10_industry_share` | share of industry-coded postings accounted for by top 10 broad industries | industry concentration indicator |
| `coverage_<field>` | non-null share for a field in the selected filter | show with sparse fields |

## Metric Safety Rules

### Safe to headline

- posting counts
- growth rates in posting counts
- province shares
- broad occupation shares
- wage coverage share
- source window and latest observed month

### Safe only with warning text

- wages
- remote / hybrid
- language
- education
- experience details
- duration
- industry mix
- skill composition

### Do not headline as direct facts about the whole labor market

- employment levels
- unemployment changes
- average wages paid
- vacancy totals for the full economy
- post-2025 real-time conditions beyond the processed source window

## Data Model For The Dashboard

Create a new dashboard-ready package in this repo:

`data/derived/labor_market_dashboard_v1/`

Recommended contents:

```text
data/derived/labor_market_dashboard_v1/
  metadata.json
  monthly_overall.parquet
  monthly_by_province.parquet
  monthly_by_market.parquet
  monthly_by_noc_broad.parquet
  monthly_by_naics_broad.parquet
  monthly_wage_by_province.parquet
  monthly_wage_by_noc_broad.parquet
  monthly_conditions.parquet
  monthly_language.parquet
  monthly_requirements.parquet
  monthly_skills_topk.parquet
  coverage_by_field_monthly.parquet
  geography_top_markets.parquet
```

### Recommended aggregate grains

- monthly overall
- monthly by province
- monthly by major local market
- monthly by province and broad NOC
- monthly by province and broad NAICS
- monthly by selected categorical dimension
- monthly coverage tables by field

### Why precompute

- the upstream processed corpus is too large for repeated app-time scans
- sparse-field denominators must be handled consistently
- precomputed aggregates make the dashboard faster, simpler, and easier to verify

## Recommended Implementation Architecture

### Stack

Recommended default:

- Python
- pre-aggregation with DuckDB / PyArrow / Polars
- Streamlit app for the first implementation
- Altair or Plotly for charts

Why this is the best fit:

- the dashboard project can stay lean and Python-first
- there is no existing frontend app framework to preserve
- the dashboard is primarily analytical rather than product-marketing UI
- a software worker can ship an interactive result faster and more safely with Streamlit than with a custom JS stack

### Code placement

Recommended code homes:

- reusable data prep: `src/jobads_dashboard/dashboard/prepare.py`
- reusable metric definitions: `src/jobads_dashboard/dashboard/metrics.py`
- app entrypoint: `src/jobads_dashboard/dashboard/app.py`
- durable docs / screenshots / inspection: `docs/analyses/labor_market_dashboard/`

Do **not** implement the dashboard as:

- a notebook
- a direct extension of the upstream notebook dashboard
- a live app that queries upstream raw JSONL or export `.dta` files

## Filters And Interaction Model

Required global filters:

- date range
- geography level and geography selection
- occupation level
- industry level

Recommended section-specific filters:

- wage charts: coverage threshold toggle
- skills panel: top K selector
- geography panels: national vs selected-region normalization

Recommended interactions:

- hover tooltips
- filter-aware downloads of displayed aggregates
- quick reset
- notes panel for caveats

Avoid:

- free-text search over `description`
- row-level posting display
- heavy crossfiltering over unaggregated full-corpus tables

## Refresh Contract

The worker should implement one refresh pipeline:

### Upstream read + local aggregate refresh

Inputs:

- `../jobads-data/main/data/processed/<year>/processed_*.parquet`

Outputs:

- local dashboard aggregate tables under `data/derived/labor_market_dashboard_v1/`
- field-coverage tables
- metadata summary with source window and row counts

Important:

- do not depend on any other repo for version 1 besides the upstream jobads-data processed layer
- keep all dashboard-local outputs in this repo

## Validation Rules

The worker should verify all of the following before sign-off:

### Data checks

- aggregate totals match upstream processed-source totals for sampled spot checks
- time window in metadata matches source files
- wage denominators are explicitly stored and displayed
- occupation coverage share is computed and displayed
- industry-code coverage is computed and displayed
- leading-zero code parsing is preserved

### UI checks

- app loads without scanning full upstream processed parquet at runtime
- default view renders in a few seconds from precomputed aggregates
- empty states and low-coverage states display clear warnings

### Content checks

- no cross-repo implementation dependencies remain outside the upstream processed data contract
- no causal language appears anywhere in the dashboard
- all sparse-field panels explain denominator and coverage limits
- `2025` freshness / provenance caveat appears in the quality section

## Known Risks And Constraints

1. Upstream `../jobads-data/main/data/raw/2025` fetch provenance is still under audit.
2. `naics` is too incomplete for headline segmentation without visible denominator context.
3. wages are sparse enough that wage charts need visible denominator context.
4. remote and language fields are historically unstable and should not be shown as full-window long-run headline series.
5. the upstream notebook dashboard is polished as an artifact but stale as executable source.
6. job ads are not a complete measure of the labor market, so the dashboard must keep interpretation narrow and explicit.

## Non-Goals For Version 1

- no AI or research overlay
- no raw text browsing
- no embedding search
- no job-level record viewer
- no real-time recomputation from the full processed corpus
- no attempt to unify all legacy upstream EDA framework outputs into the first release
- no fusion with external macro series in version 1

## Software Worker Plan

### Phase 1: Build local dashboard aggregate layer

Deliverables:

- `data/derived/labor_market_dashboard_v1/*.parquet`
- `data/derived/labor_market_dashboard_v1/metadata.json`

Tasks:

- read processed parquet from `../jobads-data/main/data/processed`
- normalize monthly time grain
- define broad NOC and NAICS rollups
- define market rollups
- compute coverage tables

Acceptance criteria:

- totals reconcile with upstream source spot checks
- coverage tables exist for all sparse fields used in the UI
- no dashboard panel depends on reading upstream raw or exported files

### Phase 2: Build dashboard app shell

Deliverables:

- app entrypoint
- overview, geography, occupations, and industries pages

Tasks:

- implement global filters
- load only precomputed aggregates
- build overview cards and primary line / composition charts

Acceptance criteria:

- app opens successfully from local environment
- overview renders from aggregate files only
- filter state propagates correctly

### Phase 3: Add secondary descriptive panels

Deliverables:

- compensation and conditions section
- skills / education / requirements section
- data-quality section

Tasks:

- add wage panels with denominator badges
- add secondary categorical panels
- add field-coverage table and source freshness notes

Acceptance criteria:

- every sparse metric shows its denominator context
- historically unstable series are labeled as limited-coverage overlays

### Phase 4: Verification And Polish

Deliverables:

- screenshots or inspection artifacts
- short operator README

Tasks:

- validate totals and caveat text
- test default and edge filter states
- confirm performance on local precomputed aggregates

Acceptance criteria:

- no correctness-affecting issues remain
- paths and refresh steps are documented

## Final Build Recommendation

If the worker follows only one principle from this document, it should be this:

> Read upstream processed job-ads data, build a curated local aggregate layer, then build a simple Python dashboard on top of it.

That is the safest path given the current repo state, the data volume, the field sparsity patterns, and the goal of giving users a clear, economics-driven picture of labor-market conditions from job ads.
