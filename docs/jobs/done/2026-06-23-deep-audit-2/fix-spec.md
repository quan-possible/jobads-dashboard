# Fix spec — deep-audit-2 (2026-06-23)

How to fix/refine every confirmed item, keyed by the IDs in `findings.md` (S##) and `ux-audit.md` (U##). Re-read the cited `file:line` before applying — the tree may have moved. Audit only: **nothing here is applied.** Per-item: current code → proposed change → steps → risk → verify.

---

## MEDIUM defects

### S01 — XFF-spoofable login throttle · `api/routers/private.py:59-71`
**Current:** `_client_ip()` trusts loopback peer, returns `xff.split(",")[0].strip()`. Next proxies `/api/*` and forwards a client-supplied XFF verbatim.
**Change:** with exactly one trusted hop, key on the **rightmost** XFF entry (the IP Next observed): `return xff.split(",")[-1].strip()`. Better still, walk XFF right-to-left skipping known-trusted proxy IPs. **Add a global login-failure ceiling** for `POST /api/auth` so per-key rotation can't bypass the lockout regardless.
**Steps:** (1) change element selection in `_client_ip`; (2) add a module-level global failure counter checked in `_auth_rate_check`; (3) optionally have Next strip incoming `x-forwarded-for` before proxying (custom proxy/middleware).
**Risk:** if a real multi-proxy topology is introduced later, rightmost-of-one assumption breaks — document the single-hop assumption. **Verify:** unit test: a request with a forged leftmost XFF does **not** get a fresh bucket; 8 failed logins → 429 even with rotating XFF.

### S02 — KPI delta direction not exposed to AT · `web/components/KpiTile.tsx`
**Current:** delta shown via `aria-hidden` arrow + colour; accessible name carries only the number.
**Change:** add a visually-hidden text direction to the accessible name, e.g. `` `${pct} ${dir==='up' ? t.up : t.down} ${t.vsBaseline}` `` (localized), or `aria-label` on the delta wrapper.
**Steps:** add `up`/`down` keys to the common dict (FR + EN); compose into the tile's accessible text. **Risk:** none. **Verify:** AX snapshot announces "down 8.3% vs baseline".

### S03 — Year-picker selects have no visible focus · `web/components/TunableFigure.tsx:82-83`
**Current:** `selectCls = "… outline-none focus:border-brand"`; `border-brand` is undefined.
**Change:** match `Select.tsx`: replace `outline-none focus:border-brand` with `focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange` (or define a real `brand` token if intended).
**Steps:** edit the one class string. **Risk:** none. **Verify:** keyboard-tab to a year picker shows a visible orange focus ring; re-check all four pages.

### S04 — Inverted momentum legend · `src/jobads_dashboard/viz/figures/pulse.py:168`
**Current:** subtitle "orange = accelerating, teal = cooling"; encoding is teal=accelerating (`UP`), orange=cooling (`DOWN`).
**Change:** swap the subtitle words to "teal = accelerating, orange = cooling" (EN + the FR string in the dict). Don't change colours — `UP=teal` is consistent with `yoy_bars` and the up-is-positive convention.
**Steps:** edit subtitle in `pulse.py:168` and the FR equivalent. **Risk:** none. **Verify:** legend text matches bar colours for a known accelerating month.

### S05 — June→December seasonal confound · `src/jobads_dashboard/viz/figures/occupations.py:18-21` (+ industries.py, geography.py)
**Current:** `_window` returns `(June-of-base, December-of-end)`.
**Change:** compare like-with-like. Best: use the **same calendar month** for base and end (e.g. both the latest *complete* month, or both December, or both June). Alternative: compare **full-year averages** of base vs end year. Apply consistently across the three `_window` users + `shift_share_bars`.
**Steps:** (1) redefine `_window` to return same-month endpoints (or add an `_annual_window`); (2) update callers `contribution_bars`/`waterfall`/`dumbbell` (occupations + industries) and `shift_share_bars`; (3) update golden fixtures.
**Risk:** **changes chart values** — this is a methodology fix; regenerate golden files and sanity-check the new decompositions. **Verify:** with base=end the "change" is ~0 (not the ~30% seasonal drop); golden tests updated and reviewed.

### S06 — Undisclosed frozen wage cross-sections · `src/jobads_dashboard/viz/figures/pay.py:112,149`
**Current:** `wage_demand_quadrant`/`education_wage_proxy` use `_STABLE_END=2024-12-01` but titles omit the date (`wage_dumbbell:77` shows it).
**Change:** append `` f" ({_STABLE_END:%b %Y})" `` to both titles (mirror `wage_dumbbell`), or add an `asOf`/note on the page. Prefer advancing `_STABLE_END` to the latest complete pre-provisional month if the freeze is no longer needed.
**Steps:** edit the two `titled(...)` calls (+ FR titles in `page-wages.ts`). **Risk:** none (label-only). **Verify:** both charts show "(Dec 2024)".

### S07 — `experience_band` multi-digit misclassification · `src/jobads_dashboard/dashboard/prepare.py:106-113`
**Current:** bare `LIKE '%1 year%'`… substring buckets.
**Change:** extract the leading integer (regex `regexp_extract(lower(experienceDetails), '(\d+)\s*year', 1)`), then bucket numerically (1-2→"1-3", 3-4→"3-5", ≥5→"5+", "more than N"→by N). Handle "10/12/6-9 years" correctly.
**Steps:** rewrite the CASE as numeric extraction; re-run `jobads-dashboard-refresh`; regenerate the requirements cube. **Risk:** changes the experience distribution — review before/after; regenerate goldens for `skills.experience`. **Verify:** unit test "12 years"→"5+ years", "10 years"→"5+ years", "6 years"→"5+ years".

### S08 — FR skill names · `src/jobads_dashboard/viz/figures/skills.py` + `labels.py`
**Current:** no FR skill-name map.
**Change:** add a small FR table for the **displayed** skills only (top-N trend lines + soft-skill/AI labels); leave proper nouns (Python, SQL) as-is. Look up by locale in the skills factories like occupation/industry names already do.
**Steps:** add `SKILL_NAMES_FR` (or extend `labels.py`); apply in `top_skills_trend`, `skill_lift`, AI-skill labels. **Risk:** partial coverage — pick the displayed set deliberately. **Verify:** render skills page in FR; top-skill legend reads French.

### S09 — Explore cold-start + unbounded Loading · `api/core.py:125-136` + `web/components/explore/ExploreView.tsx`
**Current:** lazy `:memory:` connection + `read_parquet()` per query, no warm-up; client shows bare "Loading…".
**Change:** (a) **startup warm-up** — a FastAPI startup hook that runs the default explore aggregation + `latest_month()`/`earliest_month()` once, off the request path; optionally `CREATE TABLE … AS read_parquet(...)` to persist the cube in-DB; (b) **bound the client** — skeleton + a "still loading…" affordance, and an error fallback after N seconds.
**Steps:** add `@app.on_event("startup")` warm-up in `api/main.py`; add skeleton/timeout to `ExploreView`/`RemoteFigure`. **Risk:** warm-up adds boot time (acceptable, off request path). **Verify:** first explore request after boot is fast; UI shows a skeleton, never an indefinite bare "Loading…".

---

## LOW defects

- **S10** `api/routers/private.py:41-93` — add a periodic stale-key sweep + size cap to `_AUTH_FAILURES`, and a global failure ceiling (pairs with S01). *Verify:* dict size bounded under key rotation.
- **S11** `api/auth.py:99-105` — memoize keychain presence (`functools.lru_cache` or a module flag computed once). *Verify:* repeated `GET /api/auth` forks `security` at most once.
- **S12** `api/private.py:62` `_scope_filters` — escape LIKE metacharacters in the search term (`replace % → \%`, `_ → \_`, add `ESCAPE '\'`). *Verify:* searching "50%" matches the literal.
- **S13** `src/jobads_dashboard/viz/theme.py:252-257` — style the solid trace with `< frm` (strict) while keeping one bridge point for line continuity. *Verify:* the line goes dotted exactly at `PROVISIONAL_FROM`.
- **S14** `geography.py` yoy_choropleth — label the partial-latest-year frame with its real last month. *Verify:* frame reads "March 2026".
- **S15** `prepare.py` — guard empty/all-null-`dateFound`; emit typed null + clear error instead of the string "None". *Verify:* empty-input test raises a clear message, not a parse crash.
- **S16** `prepare.py` — assert the full produced count-cube schema. *Verify:* dropping a column fails validation.
- **S17** `prepare.py` `monthly_by_market` — remove the unread `province_scope` partition after confirming no consumer reads it (`grep` api/ + web/). *Verify:* build still green; consumers unaffected.
- **S18** `web/lib/format.ts` — insert a narrow no-break space before `%` when `locale==='fr'`. *Verify:* FR renders "12,3 %".
- **S19** `web/components/explore/PostingDrawer.tsx` — route the "Open …" `aria-label` through the i18n dict. *Verify:* FR AX label is French.
- **S20** `web/lib/explore.ts` / `ExploreBuilder.tsx` — CSV headers from the localized breakdown/measure labels; localize the filename. *Verify:* FR CSV has French headers.
- **S21** `web/components/explore/ExploreView.tsx` — `useCallback` the `onSessionExpired`/callbacks (or drop from deps). *Verify:* the fetch effect doesn't re-run on unrelated parent renders.
- **S22** `web/components/CoverageBar.tsx:~40` — `width: ${Math.min(1, share)*100}%`. *Verify:* a >1 share clamps to full track.

---

## Craft (U)

- **U01** `pulse.py:88` COLORWAY + `indexed_lines`/`top_skills_trend` — distinct hues for risers vs fallers (teal/orange), direct end-labels for highlighted lines, cap emphasized series. *Verify:* skills trend legible at a glance; risers ≠ fallers by colour.
- **U02** geography CMA ranking — drop or visually segregate "Unknown market"/"Rural…" buckets from the metro ranking. *Verify:* title "biggest metropolitan markets" matches the bars shown.
- **U03** `add_reference_line` annotation — anchor inside the plot (inset) so "2019=100" isn't clipped. *Verify:* annotation fully visible at desktop + mobile widths.
- **U04** treemap factories — label-only on sub-threshold tiles (value/pct on hover). *Verify:* smallest tiles no longer overflow.
- **U05** `globals.css` + Figure/KpiTile — collapse the 1.02/1.08/1.1rem title sizes into one `--t-figure-title` token. *Verify:* all figure/card titles share one size.
- **U06** explore page — move `FilterSpine` below the hero **or** give it a distinct toolbar treatment; apply consistently. *Verify:* explore reads as same template family.
- **U07** `web/lib/format.ts` wage path — fixed decimal places across tables + ranges. *Verify:* no "$25" beside "$25.50".
- **U08** `src/jobads_dashboard/viz/review.py` — inject `--font-pt-sans` into the review HTML head (internal tool). *Verify:* review charts use the brand font.
- **U09** `prepare.py` provenance string — derive the year from the data window (or move to a dated changelog). *Verify:* caveat year tracks the data.
