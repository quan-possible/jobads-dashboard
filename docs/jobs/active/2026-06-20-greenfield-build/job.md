# Job — ACLMR dashboard greenfield build (G0–G6)

**Status:** DONE (G0–G6 complete + verified) · **Started:** 2026-06-20 · **Worktree:** `.claude/worktrees/greenfield-aclmr` (branch `worktree-greenfield-aclmr`) · **Last commit:** 5534e7d · Deploy not done (see backlog).

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
- [x] **G5 Trust + private** — Method/trust page (de34a95). Private Explore DONE (bd3b588): `api/auth.py` (PBKDF2 verify reusing the Streamlit scheme; password from env hash → env plain → macOS Keychain; HMAC-signed httpOnly session cookie), `api/private.py` + `api/routers/private.py` (gated `/api/postings` over the gitignored lookup read from the main checkout; scope-filtered, searchable, paginated, recency+hash-interleaved; language label mapped). Web `/explore`: AuthGate + ExploreView (table) + PostingDrawer (full detail). Next `/api/*` rewrite makes the cookie first-party. **15 new tests**; **78 API tests pass**. Verified in-browser EN+FR: lock → table → drawer.
- [x] **G6 Citability + polish** — CSV export (lib/csv + DownloadCSV on wages/skills/geography/explorers); per-page + brand metadata, pixel favicon, 1200×630 OG image, public `/developers` API ref (bd3b588); responsive mobile nav + choropleth fitExtent (de34a95-era agent). **WCAG AA pass** (ink-faint/neg/pos/orange-deep tokens, eyebrow→orange-deep, heading order — ffe2118). **EN/FR i18n** complete (46c9d87, 5534e7d): cookie locale + per-area + per-page dicts, dynamic `<html lang>`, EN|FR toggle (hard-reload), chrome + all 7 pages + Explore + choropleth legend translated; data-derived strings (occ/ind/skill labels, generated headline, key_points, province names, filter option labels) stay EN by design. DEFERRED: PNG export + embeddable widget (not requested critical); `/developers` ref kept EN; Lighthouse can't run headless here (perf fundamentals met: next/font, SSR, optimized prod build). **French ships; flag native-FR review of statistical terminology + filter option labels before public launch.**

## Servers (dev)
- API: detached uvicorn on 127.0.0.1:8530 (PID may change; `pgrep -fl "uvicorn api.main"`). Start: `PYTHONPATH=src .venv/bin/python -m uvicorn api.main:app --port 8530`.
- Web: preview "web" config in MAIN repo `.claude/launch.json` → next dev on :3000 (abs --prefix to worktree). `NEXT_PUBLIC_API_BASE` defaults to 127.0.0.1:8530.

## Verified (final, EN + FR)
- **Production build** `next build`: compiled + TypeScript + page generation clean (all routes ƒ dynamic; icon/OG static).
- **API**: 78 tests pass (incl. 15 auth/private: PBKDF2, session expiry/tamper, gating, scope/search/pagination, detail, language mapping).
- **All 9 routes 200 in EN and FR**; French content + `<html lang>` confirmed per page; English preserved.
- **Visual (1280px)**: Pulse, Geography (choropleth legend FR), Explore (lock → table → drawer) all render beautifully in FR with no layout breakage; toggle segmented control fits.
- **WCAG AA**: every body text ≥4.5:1 on cream/white/panels; single h1/page; no heading jumps; landmarks, labels, names, alt all present; choropleth labelled.
- **Explore auth flow** re-verified post-i18n: login → httpOnly cookie → scope-filtered table → full detail drawer.

## Known follow-ups / polish backlog
- **Native-FR review** of statistical terminology + translate filter option labels (All Canada / All occupations / All industries, province short names) — currently EN (data/options layer).
- Lighthouse score not measured (no headless runner here).
- Central `lib/i18n/dict/pages.ts` retains inert (unused) analytics areas — harmless, could be pruned to explore-only.
- Deploy (port 8520 via ngrok per AGENTS.md) + set `JOBADS_DASHBOARD_PASSWORD_HASH` / `JOBADS_POSTING_LOOKUP` / `JOBADS_API_SESSION_SECRET` on the host — not done this session.

## Log
- 2026-06-20: worktree created, data ground-truth verified, ledger started.
- 2026-06-20: G0–G3 built + committed (c3381a2). API 63 tests pass. Pulse verified beautiful.
- 2026-06-20: G4 + Method built (3 Sonnet agents in parallel for Wages/Skills/Method; I built choropleth + explorer/cross-filter). Fixed Choropleth width-seed bug. All pages verified. Committed de34a95.
- 2026-06-20: G5 private Explore (auth+postings API, 15 tests, web AuthGate/table/drawer) + G6 polish (3 parallel Sonnet: CSV/metadata, OG/developers, mobile-nav/choropleth) + WCAG AA pass. Commits bd3b588, ffe2118. Fixed: `pick` function passed server→client in DownloadCSV (SSR 500 on explorers — latent since CSV work).
- 2026-06-20: EN/FR i18n. Foundation + chrome + Explore by me; 6 parallel Sonnet agents translated the analytics pages (per-page self-contained dicts). **INCIDENT**: concurrent agents ran `git stash`/`git reset` in the shared worktree, reverting my uncommitted chrome+explore migration + early page edits. Recovered all lost work from `stash@{0}` (selective `git checkout stash -- <12 files>`), kept agents' final page versions, fixed `as const` literal-type clashes (method/skills) and the DownloadCSV `pick` SSR bug. Re-verified both locales end-to-end + prod build. Committed 46c9d87, 5534e7d. **Lesson: never let parallel subagents run git stash/reset in a shared worktree; commit before fan-out.**
