# redesign2 deep audit — defects

**Branch:** `redesign2` (worktree `.claude/worktrees/redesign2`) · **Date:** 2026-06-22 · **Status:** OPEN (audit only — no code changed)

## Scope & method
Greenfield rebuild audited end to end: **FastAPI** backend (`api/`), the **Python Plotly figure factories** (`src/jobads_dashboard/viz/`), and the **Next.js 16 + TypeScript** frontend (`web/`). Live app rendered (FastAPI on :8530, Next dev on :3000) and walked across all 9 pages in light/dark + mobile; the 41-chart static review page and the figure-factory source were reviewed for chart craft. Audit ran as an 11-agent Sonnet fan-out (8 code + 3 UI/UX auditors) with one adversarial refuter per candidate; the orchestrator independently hand-read the highest-risk files (`queries.py`, `core.py`, `auth.py`, `compute.py`, the Explore components, `KpiTile`/`Sparkline`, `globals.css`) and made the final severity/dedup calls. Evidence in `evidence/`.

## Verification note
78 candidates → **58 confirmed, 20 refuted** (refuted recorded in `rejected.md`). Items marked **[hand-verified]** were checked directly by the orchestrator (the HIGH was reproduced by running `review.py`). Craft items live in `ux-audit.md`; fixes for every item in `fix-spec.md`.

## Baseline (audit-time state — recorded, not fixed)
| Check | Result |
|---|---|
| `pytest` (api + viz) | **155 passed**, 1 deprecation warning |
| `tsc --noEmit` (web) | **clean** |
| `next build` | **success** |
| `eslint .` (web) | **6 errors + 1 warning** (see `evidence/eslint-baseline.txt`) |
| live runtime (9 pages) | browser console + network **clean** |

## Severity tally (defects only; craft `U##` in `ux-audit.md`)
| | HIGH | MEDIUM | LOW |
|---|---|---|---|
| Static `S##` (code/data/security/build) | 1 | 19 | 17 |
| Live `L##` (rendered UI) | 0 | 1 | 1 |

(37 `S##` + 2 `L##` = 39 distinct defects, after deduping the 58 confirmed candidates; craft `U01–U09` in `ux-audit.md`.)

Highest-value clusters: **(1)** the bilingual/i18n layer is half-wired (FR shows English months, doubled `$`, English hero) · **(2)** production security/deploy defaults (cookie `Secure` off, `metadataBase`/`/docs` localhost) · **(3)** accessibility of interactive components (drawer focus trap, mobile-nav focusability, table semantics) · **(4)** the `review.py` spec tool is broken.

---

## Data & API correctness (`api/`)

### S01 · 🟨 MEDIUM · YoY KPI uses positional `series[-13]`, wrong for sparse scopes · `api/queries.py:383` · **[hand-verified]**
`_kpis()` takes `yoy_ref = series[-13]`, assuming one contiguous row per month. For narrow geo+occ+ind scopes the cube has month gaps, so `series[-13]` can be years off — the KPI labelled "year over year" then compares the wrong months. `_rank_dim`/`geography` correctly key off the explicit `year_ago` date.
**Root cause:** positional indexing instead of a date-keyed lookup; `_series_frame` doesn't gap-fill. **Verdict:** confirmed; default national scope unaffected (dense), narrow scopes silently wrong.

### S02 · 🟨 MEDIUM · `requirements` silently substitutes national data with no flag · `api/queries.py:908-918` · **[hand-verified]**
When a scoped conditions/requirements/language query returns no rows, `_long_shares` silently re-queries the **national** scope and returns it; `RequirementsResponse` echoes the user's original scope and carries no fallback indicator. Each of the four dimensions falls back independently (partial mixes possible). Cuts directly against the product's honesty-first design.
**Root cause:** fallback branch records nothing for the caller; response model has no `national_fallback`/`scope_effective` field.

### S03 · 🟨 MEDIUM · Missing posting-lookup file → unhandled 500 · `api/private.py:23` (+ `api/core.py` resolver)
If `posting_lookup.parquet` is absent (it is gitignored / not bundled), the first private query raises a raw DuckDB error → 500, instead of a clean 503 "posting lookup unavailable." 

### S04 · 🟨 MEDIUM · Malformed `start`/`end` query param → unhandled 500 · `api/core.py:166-173` · **[hand-verified]**
`month_floor` does `int(parts[0]); int(parts[1])` with no guard; `resolve_scope` passes raw query params straight in. `?end=garbage` raises `ValueError` → 500 rather than a 400/graceful default.

---

## Analytical / figure layer (`src/jobads_dashboard/viz/`)

### S05 · 🟧 HIGH · `review.py` is broken — calls 12 figure functions that no longer exist · `src/jobads_dashboard/viz/review.py:53-108` · **[hand-verified — reproduced]**
Running `python -m jobads_dashboard.viz.review` crashes immediately: `AttributeError: module '…figures.pulse' has no attribute 'stl_panel'`. 12 referenced factories were removed/renamed in the researcher-viz-redesign waves but `review.py` wasn't updated: `pulse.{stl_panel,anomaly_flags,cycle_plot,sa_vs_nsa}`, `geography.{bubble_map,lq_choropleth,lq_heatmap,province_tile_grid,share_choropleth}`, `occupations.{bump_chart,concentration_trio,horizon_wall}`. The served `tmp/review/index.html` is therefore **stale** (last good build 2026-06-21) and can't be regenerated.
**Blast radius:** the internal review/spec tool only — the production figure path is `api/figures.py`, which is healthy (pytest `test_figures` passes; live pages render charts). Severity HIGH because the module is fully non-functional.

### S06 · 🟨 MEDIUM · `wage_band` P75 value invisible in hover tooltip · `src/jobads_dashboard/viz/figures/pay.py:36-37`
The unified hover shows median + P25 but the P75 trace's value is dropped from the tooltip, so the band's upper bound can't be read on hover.

### S07 · 🟨 MEDIUM · Trend charts missing the provisional-tail band · `figures/skills.py:25-69`, `figures/pulse.py:128-149`
`top_skills_trend`, `ai_skill_diffusion`, and `composition_area` omit the provisional-tail styling that the other time-series charts use, so the most-recent (incomplete) months read as final — inconsistent with the honesty chrome elsewhere.

### S08 · ⬜ LOW · `classical_decompose` centred MA off by one month · `src/jobads_dashboard/viz/compute.py:195`
For even `period` the 2×12 centring is applied such that the trend is shifted ~1 month early. Small, but it propagates into the seasonal/remainder split. (Refined severity LOW: the decomposition is a "descriptive stand-in" and only feeds Deep charts.)

### S09 · ⬜ LOW · `index_to_base` treats a genuine zero as missing · `src/jobads_dashboard/viz/compute.py:43` · **[hand-corroborated]**
`if not base` fires on a legitimate base value of 0 and falls back to the first observation, producing a misleading index. Guard with `if base is None or np.isnan(base)` instead.

### S10 · ⬜ LOW · `noc_naics_heatmap` strips labels with no pipe separator · `src/jobads_dashboard/viz/figures/occupations.py:34,98,143`
The `code | label` split silently drops the whole string when there's no ` | `, blanking some axis labels.

---

## Security & auth (`api/auth.py`, `api/routers/private.py`)
Auth core is sound (PBKDF2 + constant-time compare, HMAC-signed sessions — see `evidence/orchestrator-code-read.md`). These are hardening gaps for the public deploy.

### S11 · 🟨 MEDIUM · Session cookie lacks `Secure` in production · `api/routers/private.py:22` (set) & `:78` (logout)
`JOBADS_API_COOKIE_SECURE` defaults to **false**, so the auth session cookie is set without `Secure` and can be sent over plain HTTP; logout's `delete_cookie` likewise omits `secure=`, so a `Secure` cookie may not clear in some browsers. Default to secure in production.

### S12 · ⬜ LOW · No rate limiting on `POST /api/auth` · `api/routers/private.py:60-73`
Unbounded password attempts allow brute force against the single shared password. Add per-IP throttling / backoff.

### S13 · ⬜ LOW · PBKDF2 minimum iterations (10,000) below OWASP guidance · `api/auth.py:35-36`
`PASSWORD_HASH_MIN_ITERATIONS = 10_000` would accept a weak hash. Raise the floor (≥600k for PBKDF2-SHA256, or at least keep the 240k default as the minimum).

### S14 · ⬜ LOW · Plain-text password env accepted silently in production · `api/auth.py:109-114`
`JOBADS_DASHBOARD_PASSWORD` (intended for local dev) is honored in any environment with no warning; a deploy could ship a plaintext password unknowingly. Log a warning, or refuse it when a production flag is set.

### S15 · ⬜ LOW · No minimum length on `JOBADS_API_SESSION_SECRET` · `api/auth.py:125`
A short/empty configured secret is accepted, weakening session HMAC. Enforce a minimum length (and document that an unset secret means per-process random — sessions drop on restart and across workers).

---

## Frontend — i18n / locale (the bilingual layer is half-wired)

### S16 · 🟨 MEDIUM · `fmtMonth` returns English month names in every locale · `web/lib/format.ts:40-46` (also surfaces on every page eyebrow date)
Hardcoded English month abbreviations, so FR mode still shows "Jun 2026" on KPI captions, table rows, the drawer, and all page eyebrow date stamps.

### S17 · 🟨 MEDIUM · FR wage formatting produces a doubled dollar sign · `web/lib/format.ts:32`
In FR locale the wage tile renders e.g. `$25.50 $/h` (leading `$` plus the FR `$/h` suffix). Wrong currency formatting for the bilingual product.

### S18 · 🟨 MEDIUM · Pulse hero headline always renders in English · `web/app/page.tsx:72-76`
The home hero sentence is not localized, so the most prominent line on the site stays English in FR mode.

### S19 · ⬜ LOW · Developers page is hardcoded English · `web/app/developers/page.tsx:164-238`
No i18n on a bilingual product; all copy is English regardless of locale.

### S20 · ⬜ LOW · `PostingDrawer` hardcodes the `/hr` wage suffix · `web/components/explore/PostingDrawer.tsx:20`
English unit string in the drawer regardless of locale.

### S21 · ⬜ LOW · FR figure `<extra>` hover content not translated · `api/figures.py:188-191`
`_localize_chrome` translates standalone chrome strings but can't substring-replace inside Plotly `hovertemplate`s, and the factories use `3-mo avg` (absent from `_FR_CHROME`), so tooltips stay English while legends are translated.

---

## Frontend — deploy / config / resilience

### S22 · 🟨 MEDIUM · `metadataBase` falls back to `localhost:3000` in production · `web/app/layout.tsx:21`
OpenGraph/Twitter image and canonical URLs resolve against localhost when the env var is unset → broken social cards on the deployed site.

### S23 · 🟨 MEDIUM · One failed figure factory takes down the whole page · `web/app/page.tsx:45-58` (and sibling pages via `RemoteFigure`)
A single `/api/figure/:id` error throws in the server component and fails the entire route instead of degrading per-figure (the other charts and the page chrome are lost). Add a per-figure error boundary / fallback.

### S24 · 🟨 MEDIUM · Developers page links an unreachable `/docs` in production · `web/app/developers/page.tsx:172` · **[matches live capture]**
Hardcoded `http://127.0.0.1:8530/docs`. FastAPI is internal-only in the container and Next only proxies `/api/*`, so the advertised OpenAPI docs 404 for real users.

### S25 · ⬜ LOW · Dev `NEXT_PUBLIC_API_BASE` port mismatch · `web/.env.local:1`
`.env.local` points at port **8531** while `next.config.ts` rewrite and the documented backend use **8530** — config drift that breaks the rewrite path locally.

---

## Frontend — React / interaction logic

### S26 · ⬜ LOW · `ExploreView` fires a stale-offset fetch on scope change · `web/components/explore/ExploreView.tsx:46-68` · **[hand-verified]**
When the scope changes while `offset > 0`, the fetch effect runs once with the old offset before the reset effect sets `offset = 0`, producing a brief wasted/stale-page request (the `cancelled` guard means last-write-wins, so no data corruption — perf/flicker only).

### S27 · ⬜ LOW · Expired session in Explore is a dead end · `web/components/explore/ExploreView.tsx:62-63`
A 401 surfaces as a static error string with no re-login affordance; the user is stuck until a manual reload.

### S28 · ⬜ LOW · `Select` crashes on an empty `options` array · `web/components/Select.tsx:18-19`
Indexes `options[...]` without guarding length; an empty option set throws.

### S29 · ⬜ LOW · `DownloadCSV` error-reset `setTimeout` leaks on unmount · `web/components/DownloadCSV.tsx:60`
Timer isn't cleared on unmount (component is currently unused — see `U06`).

---

## Frontend — accessibility

### S30 · 🟨 MEDIUM · `PostingDrawer` modal has no focus management · `web/components/explore/PostingDrawer.tsx:69` · **[hand-verified]**
`role="dialog" aria-modal` is set, but focus is never moved into the dialog, isn't trapped (Tab leaks to the page behind), and isn't restored to the trigger row on close. Also named via `aria-label` rather than `aria-labelledby` to the visible title. (Private flow; verified from source — not exercisable live without the auth secret.)

### S31 · 🟨 MEDIUM · Explore table rows use `role="button"`, destroying table semantics · `web/components/explore/ExploreView.tsx:155-168`
Putting `role="button"` on `<tr>` strips the row/cell semantics for assistive tech, so the data table is no longer navigable as a table.

### S32 · 🟨 MEDIUM · Collapsed mobile nav stays keyboard-focusable · `web/components/TopNav.tsx:110-148`
The mobile menu is only visually hidden, so its links remain in the tab order and AT reading order when "closed."

### S33 · 🟨 MEDIUM · `MapToggle` tablist missing keyboard + `tabpanel` semantics · `web/components/MapToggle.tsx:26-49`
Uses a `tab`/`tablist` pattern without arrow-key navigation and with no `tabpanel` role on the controlled region.

### S34 · 🟨 MEDIUM · No skip-to-main-content link · `web/app/layout.tsx:56-68`
Keyboard users must tab through 11+ sticky-nav items on every page to reach content.

### S35 · 🟨 MEDIUM · Invalid HTML: two `<figcaption>` in one `<figure>` · `web/components/Figure.tsx:29,41`
Each chart card renders two `<figcaption>` elements inside one `<figure>` (title + footnote), which is invalid and can confuse AT. Use one `figcaption` + a separate element, or `aria-describedby`.

### S36 · ⬜ LOW · Duplicate navigation landmark label · `web/components/TopNav.tsx:45,113`
Desktop and mobile `<nav>` share the same `aria-label`, so AT lists two identical "Primary" landmarks (WCAG 2.4.1).

### S37 · ⬜ LOW · `PostingDrawer` scroll-lock effect re-runs each render · `web/components/explore/PostingDrawer.tsx:51-62`
The effect depends on a non-memoized `onClose`, so it tears down/re-adds the key listener and toggles `body` overflow on every parent render.

---

## Live UI defects (`L##`)

### L01 · 🟨 MEDIUM · Footer eyebrow renders the wrong colour · `web/components/Footer.tsx:24,36`
`text-orange-soft` overrides the `.eyebrow` colour but loses to `.eyebrow`'s specificity in places, so footer eyebrows render inconsistently with the rest of the site.

### L02 · ⬜ LOW · Demand-Index sparkline disappears / Active-Postings sparkline cramped at mobile · home, 375px · **[hand-verified — see U03]**
Observed live; root cause is the `KpiTile` bottom-row layout — tracked as craft finding **U02** with the fix.
