# redesign2 deep audit — fix spec

How to fix every confirmed item (`S##`/`L##` from `findings.md`, `U##` from `ux-audit.md`). Each: location, the change, ordered steps, regression risk, and how to verify. Re-confirm the cited code is still present before applying. Verifier reasoning + exact line context for each item is in `evidence/fanout-confirmed.md`. **Apply on a branch off `redesign2`; do not bundle unrelated changes.**

## Shared/systemic fixes (resolve many items at once)
- **FIX-I18N (S16–S21):** the FR locale is half-wired. One pass: (a) make `fmtMonth`/`fmtWage` locale-aware via `Intl.DateTimeFormat`/`Intl.NumberFormat` keyed on the active locale; (b) move the Pulse hero sentence and the Developers copy into the i18n dicts; (c) localize the drawer `/hr` unit; (d) extend `_FR_CHROME` + restructure `_localize_chrome` to translate the `<extra>` substrings (and add `3-mo avg`). Add a unit test asserting no English month/`$` artifacts under `locale="fr"`.
- **FIX-A11Y (S30–S37):** an accessibility pass on the interactive components — drawer focus trap, table semantics, mobile-nav focusability, MapToggle keyboard, skip link, single figcaption, landmark labels.
- **FIX-PROD-DEFAULTS (S11, S22, S24, S25):** production env/deploy hardening — secure cookies, real `metadataBase`, reachable docs link, consistent API port.

---

## Static defects

### S01 — YoY positional index → date-keyed lookup · `api/queries.py:383`
**Change:** replace `yoy_ref = series[-13] if len(series) >= 13 else None` with an explicit month match:
`yoy_ref = next((p for p in series if p.month == _iso(date(as_of.year-1, as_of.month, 1))), None)`.
**Steps:** edit `_kpis`; `date` is already imported. **Risk:** none — falls back to `None` (already handled at `:404`), national scope output unchanged. **Verify:** add a unit test with a gapped series asserting `active_yoy_pct` is `None` (or the right month); confirm national KPI unchanged.

### S02 — surface the national fallback · `api/queries.py:908-918` + `api/models.py` (`RequirementsResponse`) + `web/lib/types.ts`
**Change:** have `_long_shares` return `(shares, total, fell_back: bool)`; in `requirements()` OR the per-dimension flags into a `national_fallback: bool` (or `scope_effective: Scope`) on `RequirementsResponse`. Frontend shows a caveat ("Showing national figures — scope too narrow") when set. **Steps:** widen the tuple → thread through `requirements()` → add the model field → add the TS type → render the caveat. **Risk:** additive field; update the figures/requirements test fixtures. **Verify:** request a too-narrow scope; assert the flag is true and the caveat renders.

### S03 — graceful missing posting-lookup · `api/private.py:23` (+ resolver `api/core.py`)
**Change:** detect a missing/empty `POSTING_LOOKUP` and raise `HTTPException(503, "Posting lookup unavailable")` (or return an empty, flagged result). **Steps:** guard before the DuckDB read. **Risk:** low. **Verify:** point `JOBADS_POSTING_LOOKUP` at a non-existent path; hit `/api/postings` → expect 503, not 500.

### S04 — validate date params · `api/core.py:166-173` (+ `resolve_scope`)
**Change:** wrap `month_floor` parsing in try/except → on bad input return `None`/raise `HTTPException(400)`; `resolve_scope` then treats an invalid `start`/`end` as "use default." **Steps:** add a `_safe_month(value)` helper; use it in `resolve_scope`. **Risk:** low. **Verify:** `GET /api/overview?end=xyz` → 400 or sane default, not 500.

### S05 — fix `review.py` (12 missing factories) · `src/jobads_dashboard/viz/review.py:53-108`
**Change:** reconcile `_pages()` against the current public API of `figures/*.py`. Missing: `pulse.{stl_panel,anomaly_flags,cycle_plot,sa_vs_nsa}`, `geography.{bubble_map,lq_choropleth,lq_heatmap,province_tile_grid,share_choropleth}`, `occupations.{bump_chart,concentration_trio,horizon_wall}`. For each, either point to the renamed function or drop the entry. **Steps:** `grep -oE '(pulse|geography|...)\.[a-z_]+' review.py` vs `dir()` of each module (script in `evidence/`); update each `Item(...)`; rerun `python -m jobads_dashboard.viz.review --out tmp/review/index.html`. **Risk:** medium — verify each replacement is the intended chart, not just any function that exists. **Verify:** review.py runs to completion and regenerates the 41-chart page; consider a smoke test that imports every factory `review.py` names. **Also add a test** that asserts every name in `_pages()` resolves, so this can't silently regress again.

### S06 — show P75 in `wage_band` hover · `src/jobads_dashboard/viz/figures/pay.py:36-37`
**Change:** include the P75 value in the band trace's `hovertemplate`/`customdata` (or add an explicit P75 hover trace). **Verify:** hover the band in the regenerated review page (after S05) / the live `/wages` chart shows P25·median·P75.

### S07 — add provisional tail to the three trend charts · `figures/skills.py:25-69`, `figures/pulse.py:128-149`
**Change:** apply the same provisional-tail split/styling helper the other time-series factories use, to `top_skills_trend`, `ai_skill_diffusion`, `composition_area`. **Verify:** the most-recent months render with the provisional treatment on `/skills` and the Pulse composition chart.

### S08 — `classical_decompose` centring · `src/jobads_dashboard/viz/compute.py:195`
**Change:** correct the even-period 2×12 centred MA alignment so the trend isn't shifted a month early (standard centred MA: trailing 13-term with half-weights at the ends, centred on the period). **Risk:** changes Deep seasonality/anomaly outputs — add a unit test on a synthetic seasonal series with a known trend. **Verify:** decomposition of a known series matches statsmodels' `seasonal_decompose` within tolerance.

### S09 — `index_to_base` zero guard · `src/jobads_dashboard/viz/compute.py:43`
**Change:** `if base is None or (isinstance(base, float) and np.isnan(base)):` instead of `if not base or np.isnan(base):`. **Verify:** a series whose base-year mean is 0 no longer silently uses the first observation.

### S10 — `noc_naics_heatmap` label split · `src/jobads_dashboard/viz/figures/occupations.py:34,98,143`
**Change:** when there's no ` | `, keep the original string instead of blanking it (mirror `_split_label`'s fallback). **Verify:** axis labels populated for codes lacking a pipe.

### S11 — secure cookies · `api/routers/private.py:22,78`
**Change:** default `JOBADS_API_COOKIE_SECURE` to **true** (allow opt-out for local HTTP dev), and pass the same `secure=`/`samesite=`/`httponly=` to both `set_cookie` and `delete_cookie`. **Risk:** local dev over HTTP must set the opt-out, or use `samesite=lax`. **Verify:** inspect `Set-Cookie` on `/api/auth` and logout in prod config → `Secure; HttpOnly; SameSite`.

### S12 — rate-limit `POST /api/auth` · `api/routers/private.py:60-73`
**Change:** add per-IP attempt throttling + exponential backoff (in-process counter or a small dependency). **Verify:** repeated bad logins get 429 after N attempts.

### S13 — raise PBKDF2 minimum · `api/auth.py:35-36`
**Change:** `PASSWORD_HASH_MIN_ITERATIONS = 240_000` (match the default) or higher. **Risk:** an existing hash below the floor would be rejected — confirm the configured hash uses ≥ the new floor. **Verify:** a hash with 100k iterations is refused.

### S14 — guard plaintext password in prod · `api/auth.py:109-114`
**Change:** when a production flag is set, refuse `JOBADS_DASHBOARD_PASSWORD` (require the hash) or log a prominent warning. **Verify:** prod config + plaintext env logs the warning / refuses.

### S15 — session secret minimum length · `api/auth.py:125`
**Change:** if `JOBADS_API_SESSION_SECRET` is set but `< 32` chars, raise at startup; document that unset ⇒ per-process random. **Verify:** a 4-char secret fails fast.

### S16 — locale-aware `fmtMonth` · `web/lib/format.ts:40-46` (FIX-I18N)
**Change:** `new Intl.DateTimeFormat(locale, {month:"short", year:"numeric"})`. **Verify:** FR shows "juin 2026".

### S17 — FR wage `$` · `web/lib/format.ts:32` (FIX-I18N)
**Change:** build the wage string with `Intl.NumberFormat(locale, {style:"currency", currency:"CAD"})` (or drop the leading `$` when the FR suffix supplies it). **Verify:** FR shows `25,50 $/h`, not `$25.50 $/h`.

### S18 — localize Pulse hero · `web/app/page.tsx:72-76` (FIX-I18N)
**Change:** move the hero sentence into `page-pulse.ts` (EN/FR) and render `t.pulse.heroHeadline`. **Verify:** FR home headline is French.

### S19 — i18n the Developers page · `web/app/developers/page.tsx:164-238` (FIX-I18N)
**Change:** extract copy into a `page-developers.ts` dict (EN/FR). **Verify:** FR developers page is French.

### S20 — localize drawer unit · `web/components/explore/PostingDrawer.tsx:20` (FIX-I18N)
**Change:** use `t.explore.perHour` instead of literal `/hr`. **Verify:** FR drawer shows the FR unit.

### S21 — translate figure `<extra>` chrome · `api/figures.py:188-191` (FIX-I18N)
**Change:** add `3-mo avg`/`provisional` etc. to `_FR_CHROME`; make `_localize_chrome` do targeted substring replacement inside `hovertemplate` strings (or have factories emit chrome via tokens the localizer can swap). **Verify:** FR figure tooltips are French.

### S22 — real `metadataBase` · `web/app/layout.tsx:21`
**Change:** read a `NEXT_PUBLIC_SITE_URL` env with the production origin; only fall back to localhost in dev. **Verify:** built OG/canonical URLs use the prod origin.

### S23 — per-figure degradation · `web/app/page.tsx:45-58` + `web/components/RemoteFigure.tsx`
**Change:** wrap each figure fetch so a single failure renders a small "chart unavailable" fallback instead of throwing the route; catch in `RemoteFigure` (and/or a per-figure error boundary). **Risk:** ensure server-component errors are caught (use a client error boundary or `try/catch` around each fetch). **Verify:** force one `/api/figure/:id` to 500 → page still renders the other charts.

### S24 — fix/remove `/docs` link · `web/app/developers/page.tsx:172`
**Change:** either add a `next.config.ts` rewrite exposing `/docs` (and `/openapi.json`) through the public surface, or change the link to a reachable target / remove it. **Verify:** the link resolves on the deployed container (or is gone).

### S25 — align dev API port · `web/.env.local:1`
**Change:** set `NEXT_PUBLIC_API_BASE=http://127.0.0.1:8530` to match `next.config.ts` and the backend. **Verify:** local rewrite + client fetches hit 8530.

### S26 — avoid stale-offset fetch · `web/components/explore/ExploreView.tsx:46-68`
**Change:** combine the reset + fetch so offset resets in the same pass (e.g. include the reset in the fetch effect, or derive `offset` from `scopeKey` so a scope change always fetches page 0). **Risk:** keep the `cancelled` race guard. **Verify:** change scope while on page 3 → exactly one request, at offset 0.

### S27 — re-login path on expiry · `web/components/explore/ExploreView.tsx:62-63`
**Change:** on a 401/expired error, render the `AuthGate` (or a "session expired — sign in" action) instead of a static string. **Verify:** expire the session → a re-auth control appears.

### S28 — guard empty `Select` · `web/components/Select.tsx:18-19`
**Change:** guard `options.length` before indexing; render a disabled placeholder when empty. **Verify:** pass `options={[]}` → no crash.

### S29 — clear `DownloadCSV` timer · `web/components/DownloadCSV.tsx:60`
**Change:** store the timeout id and clear it in a cleanup/`useEffect` return. (Moot until the component is used — see U06.) **Verify:** unmount mid-delay → no state-update-after-unmount warning.

### S30 — drawer focus management · `web/components/explore/PostingDrawer.tsx:69`
**Change:** on open, move focus to the dialog (or close button); trap Tab within the dialog; on close, restore focus to the element that opened it; name the dialog via `aria-labelledby` to the `<h2>`. **Risk:** test with keyboard + screen reader. **Verify:** keyboard-only open/close keeps focus inside and restores it; SR announces the title.

### S31 — table semantics · `web/components/explore/ExploreView.tsx:155-168`
**Change:** drop `role="button"` from `<tr>`; make the row activatable via a real control (e.g. a button in the first cell, or `onClick` on the row with the title cell as a `<button>`), preserving keyboard activation without overriding row/cell roles. **Verify:** AT reads it as a table; rows still open via keyboard.

### S32 — hide closed mobile nav from tab order · `web/components/TopNav.tsx:110-148`
**Change:** when closed, unmount the panel or apply `hidden`/`inert` (not just visual hiding) so links leave the tab + AT order. **Verify:** with the menu closed, Tab does not reach the mobile links.

### S33 — MapToggle keyboard + tabpanel · `web/components/MapToggle.tsx:26-49`
**Change:** implement roving-tabindex arrow-key navigation across tabs and add `role="tabpanel"` (+ `aria-labelledby`) to the controlled chart region; or simplify to a radiogroup. **Verify:** arrow keys move between measures; SR announces the panel.

### S34 — skip link · `web/app/layout.tsx:56-68`
**Change:** add a visually-hidden-until-focus "Skip to main content" link targeting `#main`; give `<main>` `id="main"`. **Verify:** first Tab on any page focuses the skip link and jumps to content.

### S35 — single figcaption · `web/components/Figure.tsx:29,41`
**Change:** keep one `<figcaption>`; render the secondary footnote as a `<p>`/`<div>` outside the `figcaption` (or merge), or associate via `aria-describedby`. **Verify:** HTML validates; AT reads one caption.

### S36 — distinct landmark labels · `web/components/TopNav.tsx:45,113`
**Change:** label the two `<nav>`s distinctly (e.g. "Primary" vs "Mobile primary"), or render only the active one. **Verify:** AT lists one or distinctly-named navigation landmarks.

### S37 — stable drawer effect deps · `web/components/explore/PostingDrawer.tsx:51-62`
**Change:** wrap `onClose` in `useCallback` at the parent, or split the scroll-lock effect to depend on `[id]` only and read `onClose` via a ref. **Verify:** the keydown listener/overflow toggle don't churn on parent re-render.

### L01 — footer eyebrow colour · `web/components/Footer.tsx:24,36`
**Change:** drop the conflicting `.eyebrow` class or raise the `text-orange-soft` specificity (apply the colour via the token, not a class that loses to `.eyebrow`). **Verify:** footer eyebrows match the intended colour in the live render.

---

## Craft (`U##`)

### U01 — tokenize small text · `web/app/globals.css` + components
**Change:** define `--text-caption/-body-sm/-body` (or Tailwind text-size tokens) and replace the ~12 arbitrary `text-[…rem]` values. **Risk:** broad but mechanical; screenshot-diff key pages. **Verify:** no `text-[0.…rem]` arbitrary values remain; visual rhythm unchanged.

### U02 — KPI sparkline at mobile · `web/components/KpiTile.tsx:45-64`
**Change:** at narrow widths put the sparkline on its own row under the delta (e.g. `flex-col` below `sm`, or give the sparkline a `min-w` and let the delta wrap). **Verify:** at 375px all four tiles show a full, uncramped sparkline (re-shoot mobile home).

### U03 — unify KPI delta convention · `web/app/page.tsx:94-127` + `KpiTile`
**Change:** give the YoY tile the same ▲/▼ colour-chip treatment (or remove chips everywhere and rely on signed colour). **Verify:** all four tiles share one delta grammar.

### U04 — chart font matches app · `src/jobads_dashboard/viz/theme.py:121`
**Change:** set the figure font family to the app stack (PT Sans / `--font-sans`) instead of Inter. **Verify:** live chart axis text matches card text.

### U05 — align Explore hero · `web/app/explore/page.tsx:14-19`
**Change:** use the shared hero template (eyebrow/headline/lede), keeping the filter spine as a sticky sub-bar. **Verify:** Explore hero matches the other pages.

### U06 — resolve `DownloadCSV` · component-wide
**Change:** either wire `DownloadCSV` into the chart/table cards (its intended use — adds CSV export) or remove the dead component (and then S28/S29 are moot). Decide with product intent. **Verify:** component is used, or deleted with no dangling imports.

### U07 — dark mode decision · `web/app/globals.css` + `viz/theme.py`
**Change:** either add a dark token block + wire `aclmr_dark` for charts, or declare light-only and remove/park `aclmr_dark`. **Verify:** dark `prefers-color-scheme` is handled intentionally (themed or explicitly light).

### U08 — brand tagline size · `web/components/Brand.tsx:15`
**Change:** raise to ≥0.7rem (or bump weight/tracking). **Verify:** tagline legible at desktop + mobile.

### U09 — Skills hero period · `web/lib/i18n/dict/page-skills.ts:11`
**Change:** add the terminal period (EN + FR). **Verify:** Skills hero matches the other heroes.
