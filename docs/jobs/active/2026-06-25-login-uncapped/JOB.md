# Job: Team login unlocks uncapped charts (+ Pulse text-block relabel)

- **Created:** 2026-06-25
- **Branch:** `feat/login-uncapped` (based on `redesign2`)
- **Status:** IMPLEMENTED, VERIFIED, COMMITTED, AND PUBLISHED on `origin/feat/login-uncapped`. Commits `4ac896f7` and `c15cc6e3` have not been promoted to `main`. See "Implementation outcome" at the end.
- **Depends on:** [2026-06-25-ten-category-cap](../../done/2026-06-25-ten-category-cap/JOB.md) (this job makes that completed cap conditional on auth)

## Goal

Today every chart is capped at 10 categories for everyone, and the Explore tab is
behind the team password. Change the model so that **logging in with the existing
team password removes the 10-category cap on every chart, site-wide** — the public
sees the capped view, the logged-in team sees full detail. The login must be
reachable from anywhere (the top nav), not only buried inside Explore.

Second, smaller ask: relabel one text block on the Pulse page (see Workstream B).

The cap itself stays correct and stays the public default. Auth only *relaxes* it.

## Decisions

- **D1 — Auth source: reuse the existing team password.** No new login tier, no new
  credential. The same session that already unlocks Explore
  ([api/auth.py](../../../../api/auth.py), `verify_session`, httpOnly cookie) is the
  single switch: valid session ⇒ uncapped everywhere, including Explore. *(Confirmed
  with user.)*
- **D2 — Explore becomes always-uncapped.** Explore already requires a session to be
  seen at all, so under the new model its charts are always shown to an authenticated
  viewer. Drop the Explore-specific cap (`_cap_bar` in [api/explore.py](../../../../api/explore.py))
  rather than gate it — it can never legitimately render to a capped (public) viewer.
- **D3 — Provinces show individually when uncapped.** The Atlantic→"Atlantic Canada"
  fold and all "Other"/top-N reductions are public-only. Authenticated maps/bars show
  every province and the full long tail.
- **D4 — RESOLVED (2026-06-25): relabel to "Automated summary" (option B1).** The block
  ("What stands out") is **deterministic template text**, not AI/LLM output (see
  [queries.py](../../../../api/queries.py) `_key_points`: "Descriptive only. No causal
  verbs"), so "AI-generated summaries" would be false. User chose the honest label.
  Change: `keyPointsTitle` → "Automated summary" (EN) / "Résumé automatisé" (FR); keep the
  bullets and structure. See Workstream B.

## Background — current architecture (verified)

### Where the caps live (the full inventory to relax)

| # | Chart / site | File:line | Cap mechanism | How it relaxes when uncapped |
|---|---|---|---|---|
| 1 | occupations.treemap (static + animated frames) | [occupations.py:51,64](../../../../src/jobads_dashboard/viz/figures/occupations.py#L51) | `cap_other(...)` | contextvar: `cap_other` returns df untouched |
| 2 | occupations.noc_naics_heatmap | [occupations.py:200](../../../../src/jobads_dashboard/viz/figures/occupations.py#L200) | `cap_columns(...)` | contextvar: `cap_columns` returns piv untouched |
| 3 | occupations.skill_churn | [occupations.py:224](../../../../src/jobads_dashboard/viz/figures/occupations.py#L224) | `ds.skill_churn(top=5)` → 5+5 bars | `category_cap`: top→full (datasource default 12, or all) |
| 4 | industries.treemap (static + frames) | [industries.py:50,63](../../../../src/jobads_dashboard/viz/figures/industries.py#L50) | `cap_other(...)` | contextvar |
| 5 | industries.contribution_bars | [industries.py:105](../../../../src/jobads_dashboard/viz/figures/industries.py#L105) | `cap_other(rank_abs=True)` | contextvar |
| 6 | geography.demand_map (all 4 measures) | [geography.py:85](../../../../src/jobads_dashboard/viz/figures/geography.py#L85) | `province_region_code` fold | contextvar: helper becomes identity ⇒ every province its own region |
| 7 | geography.ranked_provinces | [geography.py:131](../../../../src/jobads_dashboard/viz/figures/geography.py#L131) | `province_region_name` fold | contextvar (identity) |
| 8 | geography.cma_demand | [geography.py:152](../../../../src/jobads_dashboard/viz/figures/geography.py#L152) | `.head(top=10)` | `category_cap`: top→full |
| 9 | geography.shift_share_bars | [geography.py:187](../../../../src/jobads_dashboard/viz/figures/geography.py#L187) | `province_region_name` fold | contextvar (identity) |
| 10 | geography.yoy_choropleth | [geography.py:217-218](../../../../src/jobads_dashboard/viz/figures/geography.py#L217) | `province_region_code` fold | contextvar (identity) |
| 11 | geography.ai_exposure_map | [geography.py:282](../../../../src/jobads_dashboard/viz/figures/geography.py#L282) | `province_region_code` fold | contextvar (identity) |
| 12 | skills.skill_occupation_heatmap | [skills.py:125](../../../../src/jobads_dashboard/viz/figures/skills.py#L125) | `ds.skill_by_occupation(top=10)` | `category_cap`: top→full (default 16, or all) |
| 13 | skills.skill_lift_bars | [skills.py:108](../../../../src/jobads_dashboard/viz/figures/skills.py#L108) + [datasource.py:233](../../../../src/jobads_dashboard/viz/datasource.py#L233) | `ds.skill_lift(top=10)` default | `category_cap`: top→full |
| 14 | quality.coverage_latest_bars | [quality.py:48-51](../../../../src/jobads_dashboard/viz/figures/quality.py#L48) | bespoke "keep 6 key + sparsest to 10" | guard the block on `not uncapped` |
| 15 | Explore bars (all dim×measure) | [explore.py:290,475](../../../../api/explore.py#L290) | `_cap_bar(...)` | D2: drop entirely (Explore is login-only) |

Not caps (leave alone): occupations `indexed_lines` / `contribution_bars` / `waterfall`
/ `dumbbell` (NOC-broad is naturally ≤10 groups); `skills.top_skills_trend` (top=8 is a
design choice, only 4 highlighted — not a 10-cap reduction; can stay as-is or optionally
relax, low priority); time axes (seasonality) — exempt by rule.

### How a figure is built and served

- Registry maps `chart_id` → factory in [figures.py:63+](../../../../api/figures.py#L63);
  every lambda is `lambda ds, **k: <factory>(ds, ..., locale=k.get("locale","en"))` so
  extra kwargs already pass through.
- `figures.build(chart_id, *, locale, **params)` ([figures.py:308](../../../../api/figures.py#L308))
  calls the factory then `apply_house_style`. **Not** `lru_cache`d (runs per request);
  only `_ds()` and `_year_window()` are cached (data only). Safe to add per-request state.
- Route [routers/figures.py](../../../../api/routers/figures.py): `GET /api/figure/{chart_id}`
  — currently **public, no auth**. Returns the Plotly JSON string verbatim.
- Explore route [routers/explore.py](../../../../api/routers/explore.py): already
  `dependencies=[Depends(require_session)]` ([private.py:154](../../../../api/routers/private.py#L154)).

### Auth (already built — reuse, don't rebuild)

- [api/auth.py](../../../../api/auth.py): password via env hash / plain / macOS Keychain;
  `verify_password`, `create_session`, `verify_session`; httpOnly signed cookie (`COOKIE_NAME`).
- [api/routers/private.py](../../../../api/routers/private.py): `GET/POST /api/auth`
  (`AuthStatus{authenticated, configured}`), `POST /api/auth/logout`, `require_session`.
- Web: [lib/explore.ts](../../../../web/lib/explore.ts) `authStatus()/login()/logout()`
  (relative `/api`, `credentials:"same-origin"`, `cache:"no-store"`).
- [components/explore/AuthGate.tsx](../../../../web/components/explore/AuthGate.tsx) holds
  the login UI + state — **scoped to the Explore page only** today.

### How the web fetches figures (the crux)

- **Server (SSR), public charts:** pages call `api.figureSafe(id, locale, extra)`
  ([lib/api.ts:45](../../../../web/lib/api.ts#L45)) → `fetch(\`${API_BASE}${path}\`, {next:{revalidate:3600}})`.
  `API_BASE` defaults to `http://127.0.0.1:8530`. **No cookie is forwarded**, so SSR
  always gets the capped figure. **Every page is `export const dynamic = "force-dynamic"`**
  (verified for all 8 pages) — so reading the request cookie server-side costs nothing
  extra (no static optimization to lose).
- **Client re-fetch, year-anchored charts:** [TunableFigure.tsx](../../../../web/components/TunableFigure.tsx)
  re-fetches via the same `api.figureSafe` (absolute `API_BASE`, no credentials) when the
  year picker changes.
- **Client, Explore:** [ExploreBuilder.tsx] via `fetchExploreFigure` — relative `/api`,
  credentialed, `cache:"no-store"`.
- **Baked base:** the Dockerfile sets `NEXT_PUBLIC_API_BASE=http://127.0.0.1:8530` at build
  time (used by `lib/api.ts` for SSR *and* client). The absolute base is fine server-side
  but is the wrong path for the browser (no cookie, and not reachable behind ngrok) — another
  reason client fetches must move to the relative proxied path.
- **Proxy:** [next.config.ts](../../../../web/next.config.ts) rewrites `/api/:path*` →
  `JOBADS_API_ORIGIN` (default `:8530`). So the **relative `/api` path is same-origin**
  in the browser and the httpOnly cookie rides along first-party. The absolute `API_BASE`
  path does **not** carry the cookie. CORS ([main.py:64](../../../../api/main.py#L64))
  allows credentials but only for configured origins — the robust path for the browser is
  the relative proxied one, which is what Explore already uses.

**Implication:** the cookie-friendly fetch is the **relative `/api` path** (client) and a
**cookie-forwarded server fetch** (SSR). Design around those two, not the absolute base.

## Implementation plan

### Part 1 — viz core: one per-request "uncapped" switch (contextvars)

Goal: relax all 14 viz caps with the fewest edits, and zero factory-signature churn for
the `cap_other`/`cap_columns`/province-fold sites.

1. In [viz/_common.py](../../../../src/jobads_dashboard/viz/figures/_common.py) (or a tiny
   new `viz/figures/_capctx.py`), add a `ContextVar[bool]` `UNCAPPED` (default False) and:
   - `cap_other(...)`: `if UNCAPPED.get(): return df.copy()` at the top.
   - `cap_columns(...)`: same early return.
   - `category_cap(n: int) -> int | None`: returns `None` when `UNCAPPED.get()` else `n`.
     Helper for the `top`/`head` sites; `None` means "all".
2. In [viz/datasource.py](../../../../src/jobads_dashboard/viz/datasource.py) make the two
   region helpers identity when uncapped:
   - `province_region_code(code)`: `return code if UNCAPPED.get() else ("ATL" if … )`.
   - `province_region_name(name)`: likewise. (Import the contextvar; keep `REGION_NAMES`
     working since each real province code still maps to its own name.)
   - Verify `demand_map._z` / `_yoy_by_month` / `ai_exposure_map` still broadcast correctly
     when region==code (each province becomes its own one-member region — they do, the
     groupby+merge is a no-op grouping). Confirm the choropleth then shows all provinces
     (Canada has 13 province/territory codes; uncapped is allowed to exceed 10).
3. Relax the `top`/`head`/bespoke sites to read `category_cap`:
   - `occupations.skill_churn`: `top = category_cap(5) or <full>` → pass a larger `top`
     to `ds.skill_churn` (or `top=None` and let the datasource return all gainers/losers).
   - `geography.cma_demand`: `top = category_cap(10)`; `.head(top)` with `top=None` → guard
     to skip `.head` when None.
   - `skills.skill_occupation_heatmap`: `ds.skill_by_occupation(top=category_cap(10) or 16)`.
   - `skills.skill_lift_bars` → `ds.skill_lift(scope, top=category_cap(10))`; thread a
     `top=None` "all" path in `datasource.skill_lift` (currently `.head(top)`).
   - `quality.coverage_latest_bars`: wrap the `if len(latest) > 10:` reduction in
     `if not UNCAPPED.get() and len(latest) > 10:`.
4. `figures.build(chart_id, *, locale, uncapped=False, **params)`: set the contextvar for
   the duration of the factory call and reset after (use a token / try-finally). Because
   `build` is synchronous and not cached, this is request-safe.
   ```python
   tok = UNCAPPED.set(uncapped)
   try: fig = REGISTRY[chart_id](_ds(), locale=locale, **params)
   finally: UNCAPPED.reset(tok)
   ```

### Part 2 — API routes: serve uncapped only to a valid session

1. New dependency in [private.py](../../../../api/routers/private.py):
   `def optional_session(request) -> bool: return auth.verify_session(request.cookies.get(auth.COOKIE_NAME))`
   — no 401, just a bool.
2. [routers/figures.py](../../../../api/routers/figures.py): add `full: bool = Query(False)`
   and `authed: bool = Depends(optional_session)`. Compute `uncapped = full and authed`
   (so `full=1` alone can never bypass the gate; the server verifies). Pass
   `uncapped=uncapped` into `figures.build`. When `uncapped`, set
   `Response(headers={"Cache-Control": "private, no-store"})`; otherwise leave cacheable.
   The `full=1` query param also gives public vs authed responses **distinct URLs** so the
   Next Data Cache never mixes them.
3. Explore (D2): in [api/explore.py](../../../../api/explore.py) `build_explore_figure`,
   stop calling `_cap_bar` (or call with an always-uncapped path). Remove now-dead
   `_cap_bar`/`MAX_CATEGORIES`/`_OTHER` if nothing else uses them. The route already
   requires a session, so this only ever serves authenticated viewers.

### Part 3 — web: global auth + auth-aware figure fetch

> ⚠️ Per [web/AGENTS.md](../../../../web/AGENTS.md), **read the bundled Next docs under
> `node_modules/next/dist/docs/` before writing any web code** — App Router cookie reads,
> `next/headers`, and fetch-cache semantics in this Next version may differ from training data.

1. **Global auth context.** New `AuthProvider` (client) mounted in
   [app/layout.tsx](../../../../web/app/layout.tsx): on mount calls `authStatus()`, exposes
   `{authenticated, configured, login, logout, refresh}`. After `login`/`logout`, call
   `router.refresh()` so server components re-render and SSR figures re-fetch with/without
   the cookie. Refactor [AuthGate.tsx](../../../../web/components/explore/AuthGate.tsx) to
   consume this context instead of owning the state (keep its card UI).
2. **Login affordance in the top nav.** Add a small "Team view" / "Log in" button +
   logged-in/sign-out state to [TopNav.tsx](../../../../web/components/TopNav.tsx) (right
   cluster, beside `LocaleToggle`), reusing the password form from AuthGate (extract it to
   a shared `LoginForm`/popover). Add i18n keys (EN+FR) for the new labels.
3. **SSR figure fetch forwards the cookie.** Add a **server-only** figure fetcher (e.g.
   `lib/api.server.ts`) that reads the request cookie via `next/headers` `cookies()`,
   and when the session cookie is present fetches the API with `headers:{cookie}` +
   `&full=1` + `cache:"no-store"`; otherwise current public cached behavior. Point the page
   components ([app/page.tsx](../../../../web/app/page.tsx) and the other 7 pages) at this
   server fetcher. This gives uncapped initial render for logged-in users with no per-figure
   client wrapper (pages are already `force-dynamic`).
4. **Client re-fetch honors auth.** Change [TunableFigure.tsx](../../../../web/components/TunableFigure.tsx)
   to fetch via the **relative proxied** `/api/figure/...` path with `credentials:"same-origin"`,
   `cache:"no-store"`, appending `full=1` when the auth context says authenticated. (Add a
   client `fetchFigure` to `lib/explore.ts`-style client lib; the absolute-base `api.figure`
   client path can't carry the cookie.) Re-fetch when `authenticated` flips, not just on
   year change.
5. Explore client (`ExploreBuilder`) needs no change — already credentialed; with D2 it now
   returns uncapped data automatically.

### Part 4 — standing rule (AGENTS.md)

Amend Scope Guardrail #5 in [AGENTS.md](../../../../AGENTS.md) so the cap is explicitly the
**public** contract and the authenticated team view is exempt (shows full detail). This is a
long-lived instruction edit ⇒ **must use `$instructions`** and
take a timestamped backup in `tmp/` first (per global contract).

## Workstream B — Pulse text-block relabel (small, but D4 is open)

The block is `KeyPoints` ([components/KeyPoints.tsx](../../../../web/components/KeyPoints.tsx)),
fed `title={t.keyPointsTitle}` / `note={t.keyPointsNote}` from
[lib/i18n/dict/page-pulse.ts:34-35 (EN), 144-145 (FR)](../../../../web/lib/i18n/dict/page-pulse.ts#L34),
points from the deterministic [queries.py `_key_points`](../../../../api/queries.py#L418).

**Decision (D4): option B1 — "Automated summary".** Change the two i18n keys:
`keyPointsTitle` "What stands out" → **"Automated summary"** (EN, line 34) and
"Ce qui ressort" → **"Résumé automatisé"** (FR, line 144). Keep the bullets, the
`keyPointsNote` ("Descriptive signals only…"), and the `KeyPoints` structure as-is —
"keep it as it is" = only the heading changes. No `app/page.tsx` change needed.
Keep `test_no_causal_language` green.

## Verification plan

- `pytest` (full suite incl. golden) — golden corpus is small (≈3 provinces/few skills) so
  most caps are no-ops there; **add tests** for: (a) `/api/figure/{id}?full=1` with a valid
  session returns more categories than without; (b) `full=1` without a session stays capped;
  (c) uncapped response carries `Cache-Control: private, no-store`; (d) Explore returns
  uncapped (D2). Keep `test_no_causal_language` green for Workstream B.
- `tsc` + `next build` for the web changes.
- Live check on the canonical deploy (launchd :8530 API + :8522 web; use the current
  tunnel topology in `AGENTS.md`): public view capped; after team login, a known >10-category
  chart (e.g. industries treemap, ranked provinces showing all provinces incl. split
  Atlantic, skill churn) renders uncapped; EN **and** FR. Confirm the public tunnel still 403s
  unauthenticated for Explore.
- Invoke the `verification` skill; read `references/instruction-verification.md` before the
  AGENTS.md edit.

## Risks / watch-list

- **Cache bleed:** the single most likely bug — an uncapped figure cached and served to the
  public, or vice versa. Mitigations: distinct `full=1` URL + `private, no-store` on authed
  responses + server enforcement (`full and authed`). Verify the Next Data Cache and any
  browser cache honor this (the deploy-topology memory documents a prior fetch-cache trap).
- **Cross-origin cookie:** client fetches MUST use the relative proxied `/api` path, not the
  absolute `API_BASE`, or the cookie won't flow. (Root cause of why TunableFigure needs the
  path change.)
- **Province broadcast when uncapped:** confirm the choropleth `_z`/`_yoy_by_month`/
  `ai_exposure_map` still produce one value per province when region==code.
- **`force-dynamic` already set** on all pages, so SSR cookie reads add no static-render cost.
- Golden tests mostly can't catch cap regressions (small corpus) — rely on the new auth tests
  + live check.

## Out of scope

- Any new auth tier, user accounts, or per-user permissions (D1: reuse the one team password).
- Genuinely LLM-generated Pulse summaries (only relevant if user picks B2's second half).
- Re-architecting the figure registry or the SSR/data-cache strategy beyond what's above.

## Implementation outcome (2026-06-25, branch `feat/login-uncapped`)

Built, verified, and committed locally as `4ac896f7` and `c15cc6e3`. Plus one addition the user asked for during
implementation: a **Vicinity Jobs API terms-of-service disclosure** of the 10-category
public cap (footer line, EN+FR; a method-page "Category limit" section, EN+FR).

**Viz core**
- New `src/jobads_dashboard/viz/_capctx.py`: `UNCAPPED` contextvar + `category_cap(n, full=None)`.
- `_common.cap_other` / `cap_columns` no-op when `UNCAPPED`; `datasource.province_region_code/name` become identity.
- Long-tail top-k charts bounded for the team view rather than literally-all (the skill
  universe is thousands of sparse codes): skill_churn 5→12/side, skill_lift 10→25,
  skill_occupation_heatmap 10→25, cma_demand 10→30. Bounded-universe charts (provinces,
  sectors, contribution, coverage fields) show the complete set.

**API**
- `figures.build(..., uncapped=False)` sets/resets the contextvar (try/finally).
- `routers/private.optional_session` (bool, no 401). `routers/figures` gains `full` + `Depends(optional_session)`,
  computes `uncapped = full and authed`, sets `Cache-Control: private, no-store` when uncapped.
- D2: dropped `_cap_bar`/`MAX_CATEGORIES`/`_OTHER` from `api/explore.py` (Explore is login-only → always uncapped).
- New tests in `api/tests/test_figures.py` (anon full stays capped+cacheable; authed full uncapped+private; build uncapped > capped).

**Web**
- New `lib/auth/provider.tsx` (`AuthProvider`/`useAuth`), mounted in `app/layout.tsx`; `router.refresh()` on login/logout.
- New `lib/api.server.ts` `figureServer` (reads `jobads_session` via `next/headers`, forwards cookie + `full=1` + `no-store` when present, else cached public). All 8 pages switched from `api.figureSafe` → `figureServer`.
- New client `fetchFigure` in `lib/explore.ts` (relative `/api`, credentialed, `full` from auth). `TunableFigure` uses it + re-fetches when `authenticated` flips.
- New `components/TopNavAuth.tsx` (login popover / team-view chip + sign-out) in `TopNav`. `AuthGate` refactored to consume `useAuth`.
- Removed now-dead `api.figure`/`figureSafe` from `lib/api.ts`.
- i18n: Pulse `keyPointsTitle` → "Automated summary" / "Résumé automatisé"; `nav.auth.*`, `footer.categoryCap`, method `cap*` (all EN+FR).

**Standing rule:** AGENTS.md Scope Guardrail #5 amended (public-only cap + TOS rationale + team exemption via `UNCAPPED` and `full AND authed`). Backup in `tmp/AGENTS.md.bak-*`.

**Verification:** pytest 348 (incl. 3 new), `tsc` clean, `next build` clean; live HTTP/SSR against an
isolated stack (API :8531 + `next dev`) — capped/uncapped counts, `private,no-store`, Explore 401 vs
uncapped, cookie through the Next proxy, disclosure + relabel render EN/FR. Public launchd 8530/8522/ngrok
left untouched. Known: one pre-existing-class lint error in `provider.tsx` (`set-state-in-effect`).

**Remaining:** integrate the 10 `origin/main`-only commits and decide whether to merge
`feat/login-uncapped`; re-run current verification before promotion; set `JOBADS_DASHBOARD_PASSWORD(_HASH)` and
`JOBADS_API_SESSION_SECRET` through the deployment's secret owner; then rebuild/restart
the deployed stack as required. Current service health alone does not prove that its
compiled web bundle matches these commits.
