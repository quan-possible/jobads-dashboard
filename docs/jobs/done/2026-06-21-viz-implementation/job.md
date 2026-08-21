# Job — implement the from-scratch visualization suite (review build)

- **Slug:** 2026-06-21-viz-implementation
- **Opened:** 2026-06-21
- **Status:** COMPLETE — the verified figure catalogue was integrated into the
  current Next.js/FastAPI app; no standalone review application remains.
- **Owner ask (verbatim intent):** "Implement all these plots on a page so I can review them (not on the website yet)… build everything as if for the final website — even on a demo page it cannot be ad-hoc… so we can port directly inside the website."

## What this produced

A production-grade, framework-agnostic viz core under `src/jobads_dashboard/viz/`
(see its `README.md`) plus a static review page rendering all **41 charts**.

- `theme.py` — `aclmr_light`/`aclmr_dark` Plotly templates + honesty chrome helpers.
- `compute.py` — analytical transforms (contribution-to-growth, shift-share, LQ, HHI/Lorenz/top-k, classical decomposition, robust-z, diffusion).
- `datasource.py` — `DataSource` cached accessors over the derived bundle.
- `figures/{pulse,geography,occupations,industries,pay,skills,quality}.py` — every primitive from the plan as a `go.Figure` factory.
- `review.py` — `python -m jobads_dashboard.viz.review --out tmp/review/index.html`.
- `data/geo/canada_provinces.geojson` — net-new geo asset (code-keyed, rounded).

## Coverage vs the plan

All 7 topic surfaces, Core→Deep. Implemented primitives: KPI+sparklines, demand
ribbon, YoY bars, seasonality heatmap, composition area, classical
decomposition, anomaly flags, SA/NSA, diffusion index, cycle plot; bubble map,
ranked list, share choropleth, LQ choropleth + LQ wall, shift-share, YoY
choropleth, province tile-grid; treemap, indexed lines, contribution bars,
waterfall, dumbbell, bump, NOC×NAICS heatmap, concentration trio, horizon wall;
NAICS coverage line/treemap/share/contribution; wage band, wage dumbbell,
wage×demand quadrant, employment-type mix, EN/FR language gap; skill lift,
education & experience mix; coverage lines + completeness bars.

Deliberately deferred (need a server — Dash, per the plan's open decision #1):
live cross-filtering / linked views and the sortable sparkline table. Static
forms of everything else are present.

## Verification

- Foundation unit-smoke: shift-share identity residual = 0; contribution sums to
  the headline; LQ/decomposition/diffusion/HHI sane.
- Visual: ~24 figures inspected via kaleido PNG; fixed real bugs found this way —
  treemap blank (`branchvalues='total'` with zero root), "new text" ghost
  annotations (band/reference helpers), KPI `+.1f` format rejected by plotly.js,
  legend↔subtitle collisions (moved legend to bottom), NOC×NAICS axis labels,
  LQ colorbar dipping below 0, quadrant label clutter.
- In-browser: 41/41 charts drawn, 4 geo layers, 2 treemaps, 0 ghost annotations,
  no console errors.

## Historical decisions before integration
1. **Dash vs Streamlit** for the live build (cross-filter + sparkline table need a server). The current site is Streamlit; the plan recommends Dash.
2. Confirm index base (2019=100), LQ/shift-share geography level (province now; ER/CMA needs new rollups + finer geojson), sparkline-table tech.
3. Whether to add finer rollups (fine-NOC for a true 500-series horizon wall; ER/CMA for LQ) — current horizon wall uses the 10 broad groups.

## Historical next actions
- Get Bruce's review of the page; fold feedback into the factories.
- On go-ahead, pick Dash-vs-Streamlit and wire the factories into the chosen shell (they port as-is).
- Build the finer rollups + ER/CMA geojson for the deeper geography/horizon views.
