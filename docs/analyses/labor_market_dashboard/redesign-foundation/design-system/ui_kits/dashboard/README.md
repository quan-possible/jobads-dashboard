# UI kit — Canadian Labour Market Pulse (dashboard)

A click-through comparison with the dashboard structure and behavior at the
2026-08-11 export point (`web/` in `quan-possible/jobads-dashboard`). It is a
prior-product reference, not the redesign target. It uses `TopNav
tone="source"` deliberately; the portable component defaults to the selected
navy redesign. Open `index.html`; the nav is live — switch between the three
screens.

## Screens

| File | Recreates | Source |
|---|---|---|
| `PulseScreen.jsx` | Pulse home: hero, 4-up KPI strip, demand ribbon + automated summary, YoY / occupational mix, seasonality heatmap, Going-deeper divider, occupation small-multiples, momentum + diffusion | `web/app/page.tsx`, `web/lib/i18n/dict/page-pulse.ts` |
| `GeographyScreen.jsx` | Regional snapshot: KPI strip, province bars behind the measure switcher, field-coverage rail | `web/app/geography/`, `web/components/MapToggle.tsx`, `web/components/CoverageBar.tsx` |
| `ExploreScreen.jsx` | Team-gated Explore: password gate → filter spine → posting lookup table with detail panel | `web/app/explore/page.tsx`, `web/components/FilterSpine.tsx`, `web/components/explore/*` |

## What is faked

Charts are hand-drawn SVG standing in for Plotly figures served by the FastAPI
figure bridge (`api/figures.py` → `src/jobads_dashboard/viz/`). Structure,
interaction, and the broad palette support comparison, but this is not a
pixel-exact archive: the shell uses the package's official logo and explicit
source-tone treatment. The numbers are plausible, not real. The Explore
password accepts anything — the real gate is enforced by the API
(`api/auth.py`).

Copy is lifted verbatim from the product's i18n dictionary where it exists.
