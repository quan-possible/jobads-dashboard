# Live capture — 2026-06-23 deep-audit-2 (HEAD c4c6d201)

Rendered end-to-end against **c4c6d201** (the commit that applied this-morning's 23 defects + 9 craft).
Stack: **FastAPI** restarted fresh on `:8530` + **Next dev** fresh on `:3000` (caches cleared: `.next/cache`, `node_modules/.vite`).
Walked all 9 pages in EN + FR, desktop (1280) + mobile (375). Charts render through the Plotly figure bridge (JSON, client-side).

**Screenshot tool note:** `preview_screenshot` returns inline (cannot write to evidence/), so the orchestrator viewed every screen and encoded the visual observations here; the fan-out agents read this file + DOM facts + component source. Console clean across pages (only React DevTools notice + HMR/Fast-Refresh).

## Runtime health
- Browser console: clean (no errors/warnings beyond dev-tooling).
- Baselines: `pytest` **325 passed** (1 warning); web `tsc --noEmit` **clean (exit 0)**. `next build` recorded separately.
- API gates probed (direct + via Next proxy):
  - `/api/explore/figure?dim=occupation&measure=postings&start_year=2016&end_year=2025` → 200 (renders the occupation bar).
  - Province-axis gate, sample gate (n<100), bad `measure`/`dim`/non-int year → 422; unknown figure id → 404; private unauthenticated → 401 (from prior run, unchanged code).

## ★ NEW candidate observed live
- **Cold-start latency on the FIRST `/api/explore/figure` request.** Measured **124.8 s** for the very first explore figure after a fresh API boot (occupation/postings/2016–2025). A *second, different* combo (industry/wage) right after was **0.26 s**, and the same combo via proxy was **0.33 s** — so it is a **one-time warm-up** (lazy global init / first cube load + DuckDB warm), not a per-combo cost. Impact: the **Explore page auto-fires this exact default query on load**, so the *first visitor after every server (re)start* sees the chart stuck on the bare "Loading…" placeholder for up to ~2 min with no progress affordance. In production (single long-running container, restarts on deploy/crash) this hits the first request post-deploy. NOTE: the 124 s was measured under dev-time contention (Next Fast-Refresh compiling concurrently); a clean re-measure is warranted, but the warm-up cost and the unbounded "Loading…" UX are real. → hand to perf + explore-UX auditors to characterize from source (what does the first explore request initialize? is there eager warm-up at startup? does the UI bound the wait / show a skeleton?).

## Prior-audit fixes CONFIRMED holding (do NOT re-file — these belong in rejected.md if re-surfaced)
- **CMA duplicate labels** → fixed: `geography.cma_demand` bars now province-suffixed — "Rural area not in a CMA/CA (AB)/(ON)/(QC)", and "Unknown market (ON)/(QC)". No more identical-label collisions.
- **FR i18n leak — filter sentinels** → fixed: FR shows "Tout le Canada", "Toutes les professions", "Toutes les industries".
- **FR i18n leak — breakdown category labels** → fixed: Explore bar categories render FR ("Gestion", "Affaires et finance", "Sciences et tech.", "Ressources et agriculture"); occupation/industry option labels localized.
- **FR i18n — dim/measure options** → localized ("Province/Profession/Industrie/Au fil du temps"; "Offres/Part du total/Variation sur un an %/Variation sur deux ans/Salaire médian").
- **TunableFigure year-pickers a11y** → fixed: the 11 selects expose accessible names "Base year"/"Start year"/"End year" (aria-label present); confirmed via AX snapshot on /occupations.
- **Explore builder + filter selects a11y** → all have `label[for]` associations (Select.tsx wraps `<label htmlFor>` + `<span>` + `<select>`); AX names clean.
- **Share-denominator honesty (S02)** → fixed in `api/explore.py`: `_scope_total()` uses the All-dimension marginal as denominator "so shown shares match the treemaps instead of overstating"; `share_caveat` = "share of all postings (excludes uncategorized)".
- **two_year honesty (S03/S16)** → gated: `two_year_needs_breakdown` ("switch to a category") + `two_year_same_year` ("pick two different years") messages present in `api/explore.py`.
- **Treemap "Unknown" prominence** → captioned: occupations treemap caption explains '"Unknown" = postings without an assigned NOC code, not an occupation group.'
- **Home hero FR**, **per-figure degradation**, **mobile nav `inert`**, **distinct landmarks**, **mobile KPI sparkline stacking**, **coverage/per-capita caveats** — all present.

## Per-page craft observations (orchestrator, from screenshots)
- **Pulse/home (EN+FR):** strong. Eyebrow · headline · lede, 4 KPI tiles (sparklines), trend with COVID + provisional bands, KeyPoints, YoY, occ-composition, seasonality heatmap, "Go deeper" multiples + diffusion. Clean type hierarchy. FR headline localized.
- **Occupations:** treemap + year slider + **▶ Play**; INDEXED GROWTH with **BASE YEAR** picker. "Unknown" tile is 2nd-largest (18%) but captioned. Treemap small tiles ("Arts, culture & sport 1%") have tight text.
- **Geography:** choropleth + Share/Count/Per-capita/**Posting LQ** segmented toggle + year slider; ranked provinces; CMA bars; momentum; AI exposure (Eloundou β); shift-share. Per-capita caveat present. "Unknown market" bars still compete with real CMAs (craft — judge prominence).
- **Wages:** dual-axis median + P25–P75 band + coverage line; province spread dots. Justified dual axis. Honest caveats.
- **Skills:** most-requested trend (base-year picker, COVID/provisional bands) — **many overlapping orange lines, only 3 in legend** (legibility/craft); the "2019=" baseline annotation looks **clipped at the right plot edge**. AI-skills diffusion below.
- **Industries:** leads with NAICS-coverage caveat chart, then 19-sector mix stacked area (inherently busy, muted palette).
- **Method:** exemplary — measures / does-not-measure columns, field-coverage bars (Occupation 83% / Industry 47% / Wage 28% / Remote 3%), caveats.
- **Developers:** clean Public Data API reference (scope-param table, endpoint cards with GET badges, /api/docs link).
- **Explore:** FilterSpine sits ABOVE the hero (diverges from the other pages' eyebrow-first template — deliberate since filters drive both tabs; re-judge). BUILD A CHART / FIND POSTINGS tabs. Builder: Break-down-by / Measure / From-To. DOWNLOAD CSV.
- **Mobile:** hamburger → full-width nav panel (active marker, close X) works; KPI tiles 2-col with sparklines; explore filter spine stacks; selects truncate long values ("Tout le Canada" → "Tout le") — acceptable.

## Coverage gaps
- **Find Postings (private lookup):** auth secret not configured locally → AuthGate shows graceful "Access control isn't configured" message; reviewed from source only.
- App is **light-only by design** (documented in globals.css; no `aclmr_dark` template) — not a dark-mode gap.
- Cold-start 124 s measured under dev contention; clean prod re-measure recommended.
