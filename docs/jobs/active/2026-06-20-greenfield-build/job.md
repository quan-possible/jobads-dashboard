# Job — ACLMR dashboard greenfield build (G0–G6)

**Status:** in progress · **Started:** 2026-06-20 · **Worktree:** `.claude/worktrees/greenfield-aclmr` (branch `worktree-greenfield-aclmr`)

**Goal:** build the flagship ACLMR labour-market dashboard as a new Next.js + FastAPI app over the existing DuckDB aggregates, to a beautiful, intuitive, polished, bug-free state. Full scope G0–G6 (chosen by Bruce 2026-06-20). Spec = `../2026-06-20-aclmr-redesign-vision/job.md` (Parts A/C/D).

## Decisions locked
- **Stack:** Next.js 15 (App Router, TS, React 19) + Tailwind v4 + Observable Plot + D3-geo; FastAPI + DuckDB (reuse `src/jobads_dashboard`). Filters in URL.
- **Canvas:** WARM signature kept — `--canvas:#fbf8f5`, sand accents, pixel-tile mark + ACLMR brand bones (PT Sans, navy→teal→sand→orange gradient, orange accent). CVD-safe categorical chart palette + cool gridlines only carry over from the "white" recommendation.
- **Repo boundary:** monorepo extends THIS repo (`api/`, `web/`). Nothing folds into jobads-data.

## Data ground-truth (verified 2026-06-20, real schemas)
- All monthly tables carry scope quartet (`province_scope, occupation_scope, industry_scope`) + `postings_total` + coverage counts (`wage_postings, noc_postings, naics_postings, remote_*`, etc.). Scope sentinels: `All Canada / All occupations / All industries`.
- `monthly_filter_cube` (238,930 rows) = postings by full scope combo. `monthly_wage_cube` same scope, only **p25/median/p75** (NO p10/p90). `monthly_by_{noc,naics}_broad`, `monthly_by_province`, `monthly_wage_by_{noc_broad,province}`.
- `monthly_skills_topk` = `skill_code` + `postings_total` (NO labels → join `../jobads-data/main/config/skills.csv` cols `code,leaf_label,group_label,sub_group_label`).
- `monthly_{conditions,language,requirements}` = long format (`dimension, category, postings_total`).
- `geography_top_markets`, `monthly_by_market` (market_province, market, market_label).
- `metadata.json`: window **2016-01 → 2026-03**, headline `postings_total=25,356,735`, `wage=7,012,606`, `noc=21,064,188`, `naics=11,848,662`, `remote=735,850`. Caveats present.
- **Absent (Phase-5, defer + hide tiles):** `postings_unique` (dedup), `postings_new` (first-seen), `wage_p10/p90`.
- Private `posting_lookup.parquet` is gitignored (absent in worktree) → G5 reads it from the main checkout / configured path.

## Phase tracker
- [x] **G0 Scaffold** — Next 16 + Tailwind v4 + FastAPI; `/api/meta`; both boot. (commit c3381a2)
- [x] **G1 API** — all read endpoints + DuckDB + Pydantic; **63 parity tests pass**. (c3381a2)
- [x] **G2 Design system + shell** — warm tokens, GradientBar/PixelTiles, TopNav, URL-synced FilterSpine, Footer, Figure. (c3381a2)
- [x] **G3 Pulse** — KPI strip+sparklines, demand index chart, causation-guarded KeyPoints, ranked movers, regional snapshot. (c3381a2)
- [x] **G4 Explorers** — Occupations/Industries (ExplorerView + ClickableRanks cross-filter), Geography (D3 choropleth + measure toggle), Wages (range bars), Skills (top+distinctive+requirements). Real cross-filter via URL works across pages. (de34a95)
- [~] **G5 Trust + private** — Method/trust page DONE (de34a95). REMAINING: private Explore posting lookup behind PBKDF2 auth cookie (needs new `/api/auth` + `/api/postings` endpoints + AuthGate page; posting_lookup.parquet is absent in worktree — read from main checkout / configured path).
- [ ] **G6 Citability + polish** — shareable URLs already work (filters-in-URL). REMAINING: CSV/PNG export, embeddable widget, OG images, EN/FR i18n, API docs page, Lighthouse/axe pass, mobile nav polish.

## Servers (dev)
- API: detached uvicorn on 127.0.0.1:8530 (PID may change; `pgrep -fl "uvicorn api.main"`). Start: `PYTHONPATH=src .venv/bin/python -m uvicorn api.main:app --port 8530`.
- Web: preview "web" config in MAIN repo `.claude/launch.json` → next dev on :3000 (abs --prefix to worktree). `NEXT_PUBLIC_API_BASE` defaults to 127.0.0.1:8530.

## Verified (visual, 1280px)
Pulse, Occupations(+cross-filter Health profile), Geography(choropleth), Wages(range bars), Skills(scoped distinctive), Method — all render beautifully, on-brand, no console errors. tsc clean; all 12 routes 200.

## Known follow-ups / polish backlog
- Choropleth: Canada projection a touch small; NWT per-10k outlier dominates colour scale (honest, quantile-binned). Consider a "median wage" sparkline on the Pulse wage tile. Colour the YoY KPI value by sign. Mobile nav is horizontal-scroll (fine, could become a menu).

## Log
- 2026-06-20: worktree created, data ground-truth verified, ledger started.
- 2026-06-20: G0–G3 built + committed (c3381a2). API 63 tests pass. Pulse verified beautiful.
- 2026-06-20: G4 + Method built (3 Sonnet agents in parallel for Wages/Skills/Method; I built choropleth + explorer/cross-filter). Fixed Choropleth width-seed bug. All pages verified. Committed de34a95.
