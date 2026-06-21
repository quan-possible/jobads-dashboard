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
- [ ] **G0 Scaffold** — monorepo (`api/`,`web/`), Tailwind+tokens, PT Sans, `/api/meta`, both boot.
- [ ] **G1 API** — all read endpoints + DuckDB queries + Pydantic + pytest; values parity vs parquet.
- [ ] **G2 Design system + shell** — tokens(warm), GradientBar, PixelTiles, TopNav, sticky FilterSpine (URL-synced), footer, Figure.
- [ ] **G3 Pulse** — KpiStrip+sparklines, demand index, KeyPoints (causation-guarded), DemandChart, RankedBars.
- [ ] **G4 Explorers** — Occupations/Industries/Geography(choropleth)/Wages(range bars)/Skills; cross-filter + compare.
- [ ] **G5 Trust + private** — Method page, Explore behind AuthGate, n everywhere, sample gates.
- [ ] **G6 Citability + polish** — shareable URLs, CSV/PNG export, embeddable widget, OG, EN/FR i18n, API docs, Lighthouse/axe.

## Log
- 2026-06-20: worktree created, data ground-truth verified, ledger started. Beginning G0.
