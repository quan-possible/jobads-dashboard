# Findings — deep-audit-2 (2026-06-23)

**App:** jobads-dashboard ("ACLMR Labour Market") — FastAPI `api/` + Plotly factories `src/jobads_dashboard/viz/` + Next.js 16 `web/`.
**Branch / HEAD:** `redesign2` @ `c4c6d201` (the commit that applied this-morning's 23 defects + 9 craft).
**Scope:** second full audit on two fronts — defects (broken/wrong across UI, backend, data, code) and design-craft (is it *good?*). Emphasis on regressions introduced by the 1,833-line fix diff and on surfaces the prior run skimmed.

## Method
- **Phase 1 (live, serial):** restarted FastAPI (`:8530`) + Next dev (`:3000`) clean (caches cleared); walked all 9 pages EN+FR, desktop+mobile; probed API gates. Evidence in `evidence/live-capture.md`. Console clean; baselines green (**pytest 325 · tsc clean · next build clean** — `evidence/*-baseline.txt`).
- **Phase 2 (fan-out):** 7 Opus auditors (6 code slices + 1 design-craft) over `api/`, `src/jobads_dashboard/viz/`, `src/jobads_dashboard/dashboard/`, `web/` — full dumps in `evidence/fanout-confirmed.md`.
- **Phase 3 (verify):** each finder piped to an independent Opus skeptic. **Note:** the verifiers confirmed all 37 candidates (0 refuted) — too lenient — so the **orchestrator re-checked every headline claim by re-reading source** and applied the real skeptical filter. This caught 2 over-claims (rejected, see `rejected.md`) and corrected ~6 severities.
- **Phase 4 (synthesis):** orchestrator deduped across slices (KPI-a11y, "Open…" aria-label, CSV headers, the indexed-line colour cluster, XFF, cold-start were each reported by 2+ agents), made final severity calls, and owns the craft judgments. Items marked **hand-verified** were re-read by the orchestrator.

> **Model note:** per the explicit request, all subagents ran on **Opus** (overriding the skill's standing Sonnet default). The orchestrator kept the final design/severity calls.

## Verification of prior fixes
The prior audit's HIGH/MED items are **fixed and holding** (hand-verified live + source): CMA labels province-suffixed (no dup labels); FR i18n clean for filter sentinels + breakdown categories + dim/measure options; share-denominator honesty (`_scope_total` All-marginal); `two_year` gates; treemap "Unknown" captioned; year-picker accessible *names*; per-figure degradation; mobile nav `inert`; distinct landmarks; coverage/per-capita caveats. Details in `rejected.md` §A. **No HIGH this run** — the app is mature.

## Severity tally

| Severity | Static (S) | Live (L) | Total |
|---|---|---|---|
| 🟧 HIGH | 0 | 0 | **0** |
| 🟨 MEDIUM | 9 | 0 | **9** |
| ⬜ LOW | 13 | 0 | **13** |
| **Total** | **22** | **0** | **22** |

(All defects are static/code-level; no purely-visual `L##` glitches survived — the rendered UI is clean. Design-craft items are in `ux-audit.md`.)

Dominant clusters: **chart data-honesty** (inverted legend, June→December seasonal confound, undisclosed frozen cross-sections), **accessibility of the new interactive controls** (KPI delta direction; year-picker focus), **security hardening of the login throttle** (XFF), and a **first-request cold-start**.

---

## MEDIUM

### S01 · Login brute-force throttle bypassable via client-spoofable `X-Forwarded-For` · 🟨 security · `api/routers/private.py:59-71` · hand-verified
`_client_ip()` honours `X-Forwarded-For` whenever the socket peer is a trusted proxy and keys the rate-limit on `xff.split(",")[0]` (leftmost). In production the only peer is the Next.js rewrite proxy (loopback → always trusted), and Next forwards a client-supplied XFF **verbatim** — `web/node_modules/next/dist/server/base-server.js` sets `req.headers['x-forwarded-for'] ??= …remoteAddress`, i.e. only when absent. **Root cause:** the S06 trust model assumed the proxy overwrites XFF; the Next rewrite does not. A browser sending its own `X-Forwarded-For` on each `POST /api/auth` controls the limiter key, rotates it per attempt, and brute-forces the single shared Explore password past `_AUTH_MAX_FAILURES=8`. **Verdict:** confirmed (orchestrator independently found this as ORCH-1; the fan-out sharpened the Next `??=` mechanism).

### S02 · KPI delta direction conveyed only by colour + `aria-hidden` arrow · 🟨 a11y · `web/components/KpiTile.tsx` (delta render)
The up/down delta uses a coloured, `aria-hidden` arrow glyph + red/green text; the accessible name carries the number but not the direction. **Root cause:** direction is purely visual. Screen-reader users hear "8.3%" with no "down". Reported by both `web-logic` and `web-components`. **Verdict:** confirmed.

### S03 · TunableFigure year-pickers have no visible focus indicator · 🟨 a11y · `web/components/TunableFigure.tsx:82-83` · hand-verified
`selectCls` sets `outline-none focus:border-brand`, but **`border-brand` is not a defined token** (no `brand` colour in `globals.css`), so the focus style is a no-op — the year-picker `<select>`s (11 across occupations/skills/geography/industries) show **no focus ring** for keyboard users (WCAG 2.4.7). **Root cause:** this morning's a11y fix added the accessible *name* + `outline-none` but a broken focus replacement; it also diverges from `Select.tsx`, which correctly uses `focus-visible:outline-2 outline-orange`. **New regression introduced by the fix.** **Verdict:** confirmed (hand-verified the token is undefined and the element is the select).

### S04 · `momentum()` colour legend is inverted vs the encoding · 🟨 data-honesty · `src/jobads_dashboard/viz/figures/pulse.py:160,168` · hand-verified
Bars: `colors = np.where(mom >= 0, UP, DOWN)` with `UP=#2f6f77` (teal), `DOWN=#b5523a` (orange) — so **accelerating months render teal, cooling render orange**. The subtitle states "orange = accelerating, teal = cooling" — the exact opposite. **Root cause:** subtitle text not updated to match the `UP/DOWN` constants. Every bar is misread by a reader who follows the legend. **Verdict:** confirmed (hand-verified `UP/DOWN` in `theme.py:38-39`).

### S05 · Decomposition charts compare June(base)→December(end), baking ~30% seasonality into "change" · 🟨 data-correctness · `src/jobads_dashboard/viz/figures/occupations.py:18-21` (+ industries.py, geography.py `_window`/`shift_share_bars`) · hand-verified
`_window(base, end)` returns `(June-of-base, December-of-end)`. `contribution_bars`, `waterfall`, `dumbbell`, industries `contribution_bars`, and geography `shift_share_bars` snapshot a seasonally-high June against a seasonally-low December (measured Dec/Jun ≈ 0.69–0.78). **Root cause:** the "established convention" mixes two different calendar months, so every "what drove the change, base→end" chart attributes a large seasonal swing to trend/mix/competitive components; with base=end it is *pure* seasonality labelled as structure. **Verdict:** confirmed (hand-verified `_window`). The headline data-honesty item this run.

### S06 · Wage quadrant + education-proxy silently frozen to Dec 2024 (data runs to Mar 2026) · 🟨 data-honesty · `src/jobads_dashboard/viz/figures/pay.py:23,81-113,123-150` · hand-verified
`_STABLE_END = 2024-12-01` pins the cross-section. `wage_demand_quadrant` and `education_wage_proxy` present a >15-month-stale snapshot, but unlike `wage_dumbbell` (title prints "(Dec 2024)") **neither chart nor its page caption discloses the date** (`page-wages.ts:74,80` carry only titles). Readers see "Pay vs momentum" / "Do credential-heavy occupations pay more?" as current. **Verdict:** confirmed (hand-verified titles + page captions).

### S07 · `experience_band` substring matching misclassifies multi-digit year strings · 🟨 data-correctness · `src/jobads_dashboard/dashboard/prepare.py:106-113` · hand-verified surfaced
Bare `LIKE '%1 year%'`/`'%2 year%'`… buckets: `'12 years'` → "1-3 years" (matches "2 year"); `'10 years'`/`'6-9 years'` → "Other specified" instead of "5+ years". **Root cause:** substring match with no word boundary / numeric parse. The band feeds `monthly_requirements` and is **displayed** — the skills page renders `skills.experience` (`web/app/skills/page.tsx:117-118`), so the experience-band distribution shown to users is skewed. **Verdict:** confirmed (verified the chart is surfaced). Edge-frequency (most postings say 1-5 years) but clearly wrong logic with a trivial fix.

### S08 · Skill names render in English under the French locale · 🟨 i18n · `src/jobads_dashboard/viz/figures/skills.py` + `labels.py` (no FR skill-name map)
The top-skills trend legend, skill-lift, and AI-skill labels have no FR translation table, so FR users see English skill names ("English language", "Teamwork", "Flexibility"). **Root cause:** the prior FR pass localized occupation/industry/province names but not the skill taxonomy. **Verdict:** confirmed (source — no FR skill map). Pragmatic scope: translate the handful of *displayed* top skills + soft-skill/AI labels, not the full taxonomy.

### S09 · Explore default query cold-starts (~124 s first request) behind an unbounded "Loading…" · 🟨 perf/UX · `api/core.py:125-136` + `web/components/explore/ExploreView.tsx` · hand-verified
First `/api/explore/figure` after a fresh boot measured **124.8 s**; a second different combo = 0.26 s (one-time warm-up). **Root cause:** the DuckDB `:memory:` connection + cubes are built lazily on first query (`read_parquet()` literals, no startup warm-up); the Explore page **auto-fires** the heaviest default occupation/postings query on mount and renders only a bare "Loading…" — no skeleton, timeout, or progress. The first visitor after every (re)start — in prod, the first request post-deploy — can hang ~2 min and read as broken. (124 s measured under dev contention; clean prod re-measure warranted; the warm-up + unbounded-Loading UX are real regardless.) **Verdict:** confirmed (orchestrator ORCH-2 + fan-out api-5).

---

## LOW

### S10 · `_AUTH_FAILURES` dict has no global eviction / size cap · ⬜ security · `api/routers/private.py:41-93`
Keys are pruned only when the same key returns; no global sweep or cap. Chained with S01 (attacker-controlled key), one failed login per forged XFF inflates the dict unboundedly within the 15-min window. **Fix:** periodic sweep of stale keys + size cap + a global login-failure ceiling.

### S11 · `auth_configured()` forks a `security` subprocess on every `/api/auth` poll (dev-only) · ⬜ perf/async · `api/auth.py:99-105`
When only the Keychain source is configured (dev), each status poll runs `subprocess.run(['security',…], timeout=5)` synchronously, uncached, blocking the request thread up to 5 s. Production short-circuits on the env hash. **Fix:** memoize the keychain-presence result.

### S12 · Explore search treats user-typed `%`/`_` as SQL LIKE wildcards · ⬜ data-integrity · `api/routers/private.py` (`_scope_filters`)/`api/private.py:62`
The free-text posting search interpolates the query into a LIKE pattern without escaping `%`/`_`, so a literal `%` matches everything. Private surface, low stakes. **Fix:** escape LIKE metacharacters (or use `ESCAPE`).

### S13 · `split_provisional` draws the first provisional month as a solid line · ⬜ data-honesty · `src/jobads_dashboard/viz/theme.py:252-257`
The `solid` and `prov` frames both include the boundary month (`PROVISIONAL_FROM=2025-01`), so the solid trace runs one month into the shaded provisional zone. Minor visual honesty (the band still shades it). **Fix:** make `solid` strictly `< frm` for line styling while keeping a one-point bridge for continuity.

### S14 · `yoy_choropleth` animation labels the latest partial-year frame "December" when it is March · ⬜ data-honesty · `src/jobads_dashboard/viz/figures/geography.py`
The animated year frame for the incomplete latest year reads "December" though the data ends in March. **Fix:** label the frame with the actual latest month of that year.

### S15 · Empty / all-null-`dateFound` source → metadata `max_date='None'`, later crashes parsing · ⬜ data-integrity · `src/jobads_dashboard/dashboard/prepare.py`
An empty or null-date input writes the literal string `'None'` for `max_date`, which downstream `month_floor`/parse chokes on. Edge (degenerate input). **Fix:** guard for empty/all-null and emit a typed null + a clear error.

### S16 · Schema validation omits several produced count-cube columns · ⬜ data-integrity · `src/jobads_dashboard/dashboard/prepare.py`
The validation list doesn't cover all produced columns, so a dropped/renamed cube column would pass silently. **Fix:** assert the full produced schema.

### S17 · `monthly_by_market` writes a redundant `province_scope` partition no consumer reads · ⬜ data-integrity/waste · `src/jobads_dashboard/dashboard/prepare.py`
A full duplicate partition is materialised but unused — wasted build time + disk + a stale-divergence risk. **Fix:** drop the unread partition (confirm no consumer first).

### S18 · French percentages render without the required space before "%" · ⬜ i18n/typography · `web/lib/format.ts`
FR convention is a (narrow no-break) space before `%`: "12,3 %", not "12,3%". **Fix:** insert ` ` before `%` when `locale==='fr'`.

### S19 · Posting-row "Open …" `aria-label` is hardcoded English in FR · ⬜ i18n · `web/components/explore/PostingDrawer.tsx` (+ row) — reported by `web-logic` & `web-components`
**Fix:** route the label through the i18n dict.

### S20 · Explore CSV export uses raw "x"/"y" headers + English-only filename · ⬜ i18n/microcopy · `web/lib/explore.ts` / `web/components/explore/ExploreBuilder.tsx`
Downloaded CSV columns are "x"/"y" rather than the chosen breakdown/measure, and the filename is English regardless of locale. **Fix:** use the localized dimension/measure labels for headers + filename.

### S21 · `ExploreView` re-creates its fetch effect on every parent render · ⬜ react/perf · `web/components/explore/ExploreView.tsx`
`onSessionExpired` (and similar) is an unstable dependency, so the effect re-runs more than needed (extra fetches / fl. **Fix:** wrap the callback in `useCallback` or move it out of the dep array.

### S22 · `CoverageBar` fill width is unclamped · ⬜ robustness · `web/components/CoverageBar.tsx:~40`
`width: ${share*100}%` overflows the track if `share > 1`. Not reachable with valid coverage data (always ≤1) — defensive only. **Fix:** `Math.min(1, share)`.

---

See `ux-audit.md` for the 9 design-craft items, `fix-spec.md` for the exact change per ID, `remediation-plan.md` for batching/order, and `rejected.md` for refuted candidates (incl. the 2 over-claims this run caught).
