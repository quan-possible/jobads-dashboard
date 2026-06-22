# Orchestrator independent code read (hand-verified)

Files I read in full myself to ground the final severity calls (not delegated):
`api/queries.py`, `api/core.py`, `api/auth.py`, `src/jobads_dashboard/viz/compute.py`,
`web/components/explore/ExploreView.tsx`, `web/components/explore/PostingDrawer.tsx`,
`web/components/KpiTile.tsx`, `web/components/Sparkline.tsx`, `web/app/globals.css`.

## Confirmed by hand (carry into findings/ux-audit)
- **Silent national fallback** — `api/queries.py` `_long_shares` (lines ~908-918): when a scoped requirements/conditions/language query returns no rows, it silently re-queries the NATIONAL scope and returns those numbers with no `fallback`/`gated` flag in `RequirementsResponse`. A user who filtered to a small province sees national figures presented as their scope. Cuts against the app's honesty-first design. **MEDIUM** (correctness/honesty).
- **Positional YoY vs explicit year-ago month** — `_series_frame` uses `postings_total.shift(12)` (line 281) and `_kpis` uses `series[-13]` (line 383) — both assume 12 contiguous monthly rows. `_rank_dim`/`geography` correctly query the explicit `year_ago` month instead. Only correct if the filter_cube is dense (one row per month per scope). **LOW–MEDIUM**, confidence medium — verify cube density.
- **Geography LQ denominator skew** — `geography()` (lines 507-520): `total_post` sums only provinces present in `df`, but `total_lf` sums ALL provinces in `province_labour_force.csv`. With two territories reporting no postings, `lf_share` denominators are inflated → province LQ values biased low. **LOW**.
- **`month_floor` crashes on malformed date param** — `api/core.py` line 166-173: `int(parts[0]), int(parts[1])` with no guard; `resolve_scope` calls it on raw `start`/`end` query params. `?end=garbage` → `ValueError` → unhandled 500 instead of a 400. **MEDIUM** (input validation / error handling) — confirm router doesn't pre-validate.
- **PostingDrawer has no focus management** — `web/components/explore/PostingDrawer.tsx`: correct `role="dialog"`/`aria-modal`/Escape/scroll-lock, but focus is never moved into the dialog on open, not trapped (Tab leaks to background), and not restored to the trigger row on close. **MEDIUM** a11y (dialog pattern / WCAG 2.4.3). Note: this private flow could NOT be exercised live (auth not configured), so source review is the only evidence.
- **KPI mobile sparkline crowding** — `web/components/KpiTile.tsx` lines 45-64: the delta chip and the sparkline share one flex row; the sparkline is `flex-1 width:100%`. On a ~165px mobile tile a long `deltaLabel` ("vs baseline"/"MoM") consumes the row and squeezes the sparkline to near-zero (Demand Index appears to lose its sparkline; Active Postings is cramped). **P2** responsive craft. Fix: stack the sparkline on its own row below the delta at narrow widths.
- **Untokenized small-text scale** — `globals.css` defines a clean heading scale, but components use ~12 ad-hoc `text-[0.62–0.9rem]` arbitrary sizes for labels/captions/body that bypass it. **P2** typography consistency.
- **No dark theme in the web app** — body stays cream under `prefers-color-scheme: dark`; `src/jobads_dashboard/viz/theme.py` ships an unused `aclmr_dark`. **P3** (light-only may be intentional; design-system loose end).
- **KPI delta indicator inconsistency** — 2 of 4 tiles render ▲/▼ chips; the YoY tile shows a bare "−7.6%" as its value, Median Wage has no delta. **P3** consistency.

## Likely lint-noise / to REFUTE (hand-judged)
- eslint `react-hooks/set-state-in-effect` in `ExploreView.tsx:47,52` and `PostingDrawer.tsx:39`: standard "reset state + setLoading at start of a guarded fetch effect" pattern; both effects use a `cancelled` flag for race safety. Not a real cascading-render/double-render bug. (Minor: ExploreView does a small redundant fetch when scope changes while `offset>0`, harmless — last-write-wins via `cancelled`.)
- eslint `react-hooks/immutability` on `LocaleToggle.tsx:13` (`document.cookie = …` in an event handler) — false positive of the Next-16 rule; writing a cookie in a click handler is correct.
- "SQL injection" via scope params: NOT reachable — `core.query_df` parameterizes every query with `?`. The only value-interpolation is the `unknown` **server constant** in `wages()` (`where_extra`), not user input. Refute injection claims unless user input reaches an f-string.

## Confirmed solid (no finding)
- `api/auth.py`: PBKDF2 + `hmac.compare_digest` (constant-time) on both hash and plain paths; HMAC-signed session verifies signature before parsing payload, checks `exp`; iteration bounds validated. (Only caveat: module-level random `_SESSION_SECRET` if `JOBADS_API_SESSION_SECRET` unset would break sessions across multiple uvicorn workers — container runs a single process, so a LOW deploy note at most.)
- `compute.py` math is mostly sound; one edge: `shift_share` `(e_rg_b * (g_grp - g_nat))` yields `0*NaN = NaN` when a group has zero national base (new/vanished group between base and end), breaking the NS+IM+RS identity. **LOW** edge (won't trigger with a fixed group set present in the base period).
