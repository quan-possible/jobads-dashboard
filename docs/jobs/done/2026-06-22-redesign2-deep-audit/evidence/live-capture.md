# Live capture — redesign2 deep audit (2026-06-22)

Captured by the orchestrator before the fan-out. The orchestrator holds the visual/UX
judgment (per the deep-audit skill); subagents read source + this file.

## Environment
- Worktree: `/Volumes/ACLMR/jobads-dashboard/.claude/worktrees/redesign2`
- FastAPI backend: `uvicorn api.main:app` on `127.0.0.1:8530` (serving real derived aggregates — 25,356,735 postings, window 2016-01..2026-03).
- Next.js 16.2.9 dev: `:3000`, `NEXT_PUBLIC_API_BASE=http://127.0.0.1:8530`.
- Static chart-review page: `tmp/review/index.html` served on `:8533`.

## Baseline checks (audit-time state — recorded, NOT fixed)
- `pytest` (api/tests + tests): **155 passed**, 1 warning (StarletteDeprecationWarning: httpx/starlette testclient). exit 0.
- `tsc --noEmit` (web): **clean**, exit 0.
- `eslint .` (web): **6 errors + 1 warning** — see `eslint-baseline.txt`. Errors:
  - `app/developers/error.tsx:8` react/no-unescaped-entities (apostrophe)
  - `components/LocaleToggle.tsx:13` react-hooks/immutability (document.cookie write in handler) — likely a Next-16 rule false-positive
  - `components/TopNav.tsx:23` react-hooks/set-state-in-effect (close menu on route change)
  - `components/explore/ExploreView.tsx:47` and `:52` set-state-in-effect
  - `components/explore/PostingDrawer.tsx:39` set-state-in-effect
  - warning: `app/method/page.tsx:4` unused `fmtCompact`
- `next build`: **deferred to end** (shares `.next` with the running dev server; running both corrupts the cache). To be recorded after dev server stop.

## Runtime health (whole walk)
- Browser console across all 9 pages: **no warnings, no errors**.
- Network: **no failed (4xx/5xx) requests**.
- Static review page (41 charts): **no console errors**; 41/41 `.js-plotly-plot` painted (svg confirmed via DOM).

## Per-page observations (live, desktop light unless noted)

### / (Pulse) — home
Editorial layout. Sticky top nav: brand (ACLMR / LABOUR MARKET), Pulse·Occupations·Industries·Geography·Wages·Skills·Method·Explore, EN/FR toggle, mobile hamburger. Active link = orange underline.
Hero: "LABOUR MARKET PULSE · MAR 2026" + headline "CANADA'S POSTING DEMAND IS 8% BELOW ITS 2019 BASELINE." + caveat paragraph (demand ≠ employment).
4 KPI tiles w/ sparklines: DEMAND INDEX 92 (▼8.3% vs baseline, rust sparkline), ACTIVE POSTINGS 217.4k (▲11.7% MoM), VS LAST YEAR −7.6%, MEDIAN WAGE $29.3/hr (n=43.3k).
Charts: "POSTING DEMAND OVER TIME" (raw + 3-mo avg + dotted provisional tail), "WHAT STANDS OUT" key-points list, "YEAR OVER YEAR" bars, "OCCUPATIONAL MIX" stacked area.

### /occupations
Hero "WHAT WORK CANADA IS HIRING FOR…". Treemap "occupation groups by volume": Sales & service 172,707 (28%), **Unknown 110,651 (18%)** = 2nd-largest block, Business & finance 100,058 (16%), Trades & transport 75,212 (12%), Education/law/gov 39,097 (6%), Sciences & engineering 31,524.

### /geography
Hero "WHERE IN CANADA IS DEMAND CONCENTRATED?". Note: "Two territories report no postings."
Left: MapToggle [Share|Count|Per-capita|Demand LQ] over a choropleth (% of national colorbar). Right: ranked province bars — Ontario 922,895, Quebec 527,773, BC 404,796, Alberta 338,010, Saskatchewan 155,959, Nova Scotia 97,007…

### /wages
Hero "WHAT JOB ADS SAY ABOUT PAY." Strong coverage caveat. Left: median + P25–P75 band over time with a coverage overlay (dual y-axis: $ left, % right) + provisional marker. Right: per-province advertised-wage spread (dumbbell/range dot plot).

### /skills
Hero "WHAT EMPLOYERS ARE ASKING FOR". Indexed multi-line skills trend (2019=100 dashed baseline, COVID shaded band, orange-highlighted vs grey-muted lines). Dense but legible.

### /industries
Hero "POSTED HIRING DEMAND BY INDUSTRY SECTOR." Leads with the coverage caveat. Left: "NAICS coverage over time" line (COVID band, provisional). Right: industry-mix 100% stacked area among coded postings.

### /method
"HOW TO READ THIS DASHBOARD." Two columns: WHAT THIS MEASURES (4) vs WHAT IT DOES NOT MEASURE (5, orange: not employment/unemployment/JVWS vacancies/hires/1-ad≠1-job). Field-coverage section ("Built from 25,356,735 postings spanning Jan 2016 – Mar 2026").

### /explore
Sticky FilterSpine (Region / Occupation / Industry / Reset). Hero "THE POSTINGS BEHIND THE NUMBERS". AuthGate card "PROTECTED — Posting-level lookup — Access control isn't configured on this server, so the private lookup is unavailable here. On the deployed dashboard this view is unlocked with the team password."

### /developers
"PUBLIC DATA API". Base URL `/api`, links to `/docs` (OpenAPI at the API origin). Scope-params table (geo/occ/ind/…).

## Candidate findings spotted by the orchestrator (to be verified in the fan-out)
1. **No dark theme in the web app.** `prefers-color-scheme: dark` matches but body stays cream (`bg-canvas` = rgb(251,248,245), text rgb(22,36,47)). The Python viz layer ships `aclmr_dark` (theme.py) that the product never uses — design-system parity gap. (Light-only may be intentional; confirm.)
2. **KPI tile layout inconsistent at mobile (375px).** ACTIVE POSTINGS sparkline is cramped inline beside "MoM"; DEMAND INDEX sparkline appears absent/clipped; bottom two tiles use clean full-width sparklines. Check `KpiTile.tsx` + `Sparkline.tsx`.
3. **KPI delta indicators inconsistent.** DEMAND INDEX ▼8.3%, ACTIVE POSTINGS ▲11.7% (arrow+%), but VS LAST YEAR shows bare "−7.6%" (no arrow) and MEDIAN WAGE shows no delta. Decide one convention.
4. **`/docs` link reachability.** Developers page advertises OpenAPI at `/docs`, but `docker-entrypoint.sh` says FastAPI is internal-only (127.0.0.1) and Next only proxies `/api/*`. On the deployed container `/docs` is likely unreachable — confirm next.config rewrites.
5. **"Unknown" occupation block prominence.** Unknown = 18% (2nd-largest treemap tile). Honest, but visually competes with real categories — consider de-emphasis/last-position.
6. eslint set-state-in-effect cluster in explore + TopNav (see baseline) — code auditor to judge real vs lint-noise.

## Coverage gaps / deferred
- **Explore private flow (search → PostingDrawer) not exercised live** — auth secret not configured locally; AuthGate blocks gracefully. Reviewed from source only.
- **Static review-page scroll screenshots blank** below the first viewport (headless capture/scroll-sync quirk; charts confirmed painted via DOM). Chart-craft judged from figure-factory source + the verified top section.
- **Dark mode + mobile** captured on home; spot-checked, not exhaustively per page.
