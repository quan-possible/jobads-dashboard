# Labor Market Dashboard Product Contract

## Authority

This document defines the current product, metric, data, and architecture
contract for `jobads-dashboard`. It is an implementation contract, not a plan
for another dashboard.

The repository supports one application:

- `web/` — the Next.js user interface;
- `api/` — the FastAPI data, figure, authentication, and private-query service;
- `src/jobads_dashboard/viz/` — the Python Plotly figure factories; and
- `src/jobads_dashboard/dashboard/` — the aggregate refresh and data-loading
  layer.

There is no supported Streamlit, Dash, notebook, or alternate worktree
application. Historical implementations are recoverable from Git history, but
they are not development or deployment sources.

`data/derived/labor_market_dashboard_v1/` is the current aggregate-schema name.
The `v1` suffix describes that data contract; it does not identify another app
version.

## Purpose

The dashboard helps users understand Canadian posted labour demand in the
Vicinity job-ads data. It should answer questions such as:

- How much posting activity is present, and how has it changed over time?
- Which provinces, markets, occupations, and industries account for that
  activity?
- What do advertised wages and job requirements look like where those fields
  are available?
- Where are composition, concentration, and field coverage changing?
- How fresh and complete is the evidence behind each view?

The product is descriptive. It is not a measure of employment, unemployment,
economy-wide vacancies, wages paid, or causal labour-market effects.

## Project Boundary

This repository owns:

- the dashboard product and API;
- the aggregate refresh and validation pipeline;
- dashboard-local derived data;
- metric, visualization, access, and disclosure rules; and
- current design references, operator documentation, and verification evidence.

The repository does not own:

- upstream ingestion or processed-data generation;
- `ai_labor` research outputs;
- live queries over raw or exported posting data;
- unrestricted SQL or bulk posting-text export; or
- causal or economy-wide labour-market claims.

## Source Of Truth And Runtime Boundary

The only canonical upstream input is:

```text
../jobads-data/main/data/processed/<year>/processed_*.parquet
```

Use the upstream metadata and configuration as the schema contract:

- `../jobads-data/main/docs/metadata.md`
- `../jobads-data/main/config/config.yaml`
- `../jobads-data/main/docs/README.md`
- `../jobads-data/main/docs/plans/README.md`

The refresh command reads those processed parquet files and materializes local
aggregates. The API and web app read only the local derived bundle; they must
not scan the full upstream corpus at request time or fall back to another
project.

The currently committed metadata records 164 source files, 25,356,735 postings,
and a source window from `2016-01-01` through `2026-03-31`. Treat those values as
a snapshot: `jobads-dashboard validate` must compare the bundle with the live
upstream source before any freshness claim.

## Supported Architecture

The production and local application use the same two-process topology:

```text
browser
  -> Next.js web server (127.0.0.1:8522 locally)
       -> /api/* proxy
            -> FastAPI (127.0.0.1:8530)
                 -> local aggregate parquet files
                 -> Python Plotly figure factories
```

Important ownership rules:

- Next.js owns page composition, navigation, localization, interaction, and the
  first-party API proxy.
- FastAPI owns typed data responses, figure JSON, authentication, rate limits,
  private posting lookup, and server enforcement of public limits.
- Python Plotly factories own analytical chart construction and chart-level
  data honesty.
- The CLI owns refresh, validation, and posting-lookup materialization.
- The runtime reads `data/derived/labor_market_dashboard_v1/`; it does not read
  upstream processed files.

## Product Surfaces

The supported routes form one product:

| Route | Purpose |
|---|---|
| `/` | Pulse: posting activity, change, seasonality, and headline context |
| `/geography` | Provincial and market distribution, change, and concentration |
| `/occupations` | Occupational composition, change, concentration, and cross-region structure |
| `/industries` | Industry composition and coverage-aware change |
| `/wages` | Advertised wage levels, ranges, trends, and wage-data coverage |
| `/skills` | Skills, education, experience, language, and requirement composition |
| `/method` | Methods, definitions, provenance, and evidence limits |
| `/developers` | Typed public API documentation |
| `/explore` | Team-gated curated aggregate queries and bounded posting lookup |

Pages must remain bilingual in English and French, responsive, accessible, and
explicit about material denominators and caveats. The current ACLMR visual
reference lives in
`docs/analyses/labor_market_dashboard/redesign-foundation/`.

## Interpretation Rules

Every page and API response must preserve these distinctions:

- posting counts measure activity on the observed job-ads source;
- shares measure composition within the stated posting denominator;
- advertised wages describe postings with usable wage fields, not wages paid;
- industry shares are conditional on usable industry coding;
- sparse or historically unstable fields require visible coverage context; and
- changes over time may reflect platform and field-coverage changes as well as
  changes in posted demand.

Avoid causal language and claims about employment, unemployment, labour-force
tightness, economy-wide vacancies, or real-time conditions beyond the processed
source window.

## Field Tiers

### Headline-safe dimensions

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

### Use with visible coverage context

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

### Historically sparse or unstable

- `remoteWorkOptions`
- `primaryPostingLanguage`
- `englishLanguageRequirement`
- `frenchLanguageRequirement`
- `certs`
- `cips`

Do not present historically sparse fields as full-window headline series.
Condition their interpretation on field availability and the observed period.

### Offline-only

- `description`
- free-text or NLP summaries
- high-cardinality skill text without pre-aggregation

Text-derived results must be computed offline into bounded dashboard tables.
Posting descriptions may appear only in the authenticated, bounded lookup.

## Metric Contract

| Metric | Definition | Required context |
|---|---|---|
| `postings_total` | Posting count in the current filter | all postings in the filter |
| `postings_latest_month` | Posting count in the latest observed month | latest month only |
| `postings_yoy_pct` | Change from the same month one year earlier | suppress when the comparison month is unavailable |
| `postings_ma3_yoy_pct` | Change in the three-month moving average from the same prior-year window | label as a smoothed comparison |
| `province_share` | Province postings divided by national postings | selected period or window |
| `occupation_share` | Occupation postings divided by postings in scope | state coverage where coding is incomplete |
| `industry_share_conditional` | Industry postings divided by postings with usable industry coding | show the coded denominator |
| `wage_posting_share` | Postings with usable hourly wage data divided by all postings in scope | show beside wage results |
| `remote_field_coverage` | Postings with a populated remote-work field divided by all postings in scope | this is coverage, not a remote-work share |
| `remote_share_conditional` | Remote or hybrid postings divided by postings with the field present | label as conditional |
| `top5_market_share` | Share held by the five largest markets in scope | concentration indicator |
| `top10_occ_share` | Share held by the ten largest broad occupation groups | concentration indicator |
| `top10_industry_share` | Share of industry-coded postings held by the ten largest broad industries | conditional concentration indicator |
| `coverage_<field>` | Non-null share for a field | use the same filtered denominator as the associated result |

Preserve leading zeros in occupation and industry codes. Calendar comparisons
must align by actual month, not row position in a sparse series.

## Aggregate Package

The runtime bundle lives at:

```text
data/derived/labor_market_dashboard_v1/
```

It contains the committed metadata and aggregate parquet tables used by the
current API, including overall, filter-cube, wage, geography, occupation,
industry, condition, language, requirement, skill, and coverage grains.
`posting_lookup.parquet` is private, local, and ignored by Git.

The aggregate layer must preserve:

- reconciliation to upstream posting totals;
- monthly source coverage and freshness metadata;
- explicit numerators and denominators for sparse fields;
- broad NOC and NAICS rollups with stable code parsing;
- enough geography detail for the supported public figures; and
- atomic publication so the API never observes a partial refresh.

## Public Limits And Team Access

Unauthenticated charts may show at most 10 distinct categorical items. Use the
shared cap helpers and preserve totals with an honest `Other` residual when the
chart shows a whole. A clearly labelled top-10 ranking may show only its
leaders.

The server must enforce:

```text
uncapped = full request AND authenticated team session
```

A request flag alone must never bypass the public cap. Uncapped responses and
posting-level results are private and must not be publicly cached. `/explore`
may be visible in navigation, but its workspace and private APIs remain gated.

## Refresh And Validation

Use one refresh path:

```bash
jobads-dashboard refresh
jobads-dashboard validate
```

The posting lookup has its own bounded materialization command:

```bash
jobads-dashboard posting-lookup
```

Before sign-off on implementation or deployment changes, verify:

1. `PYTHONPATH=src pytest -q`
2. `npm --prefix web run build`
3. `jobads-dashboard validate`
4. the actual Next.js/FastAPI experience on the affected English and French
   routes and relevant desktop/mobile widths
5. public category limits, authentication, private-cache behavior, and data
   caveats whenever those contracts are affected

Tests and metadata are supporting evidence. The user-visible app and its real
API path are the deliverable.
