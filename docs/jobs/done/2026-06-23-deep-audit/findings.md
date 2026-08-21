# Deep audit 2026-06-23 — defects

**Branch:** `redesign2` · **HEAD:** `653edd01` (Editorial redesign + Explore "Build a chart") · **Status:** OPEN (audit only — no code changed)

## Scope & method
Fresh end-to-end audit of the jobads-dashboard ("ACLMR Labour Market") — **FastAPI** (`api/`), **Python Plotly factories** (`src/jobads_dashboard/viz/`), **Next.js 16 + TS** (`web/`) — with emphasis on the surface added in HEAD: the new `/api/explore/figure` builder (`api/explore.py`), the year-anchored "make charts general" plumbing (`api/figures.py` + factories + `TunableFigure.tsx`), the `ExploreBuilder`/`ExploreTabs` components, the `skill_churn` rework, and the de-"demand" i18n retitling.

Live app rendered (FastAPI `:8530` + Next dev `:3000`), walked across all pages in **EN + FR**, desktop + mobile, light + dark; API gates/error paths probed directly. Audit ran as an **8-agent Sonnet fan-out** (6 code + 2 UI/UX) with **one adversarial refuter per candidate** (65 agents total). The orchestrator hand-read the highest-risk new files (`explore.py` in full, `figures.py` param plumbing, `TunableFigure.tsx`) and made the final severity/dedup calls. Evidence in `evidence/` (`live-capture.md`, `fanout-confirmed.md`, `fanout-refuted.md`, baselines).

## Verification note
**57 candidates → 48 confirmed, 8 refuted, 1 uncertain.** After deduping the overlaps (the `two_year`+time mislabel was reported 4×; the TunableFigure a11y 4×; several i18n leaks), the distinct defect set below is **23 (15 MEDIUM · 8 LOW · 0 HIGH)**, plus **9 craft items** in `ux-audit.md`. Items marked **[hand-verified]** were checked directly by the orchestrator. Refuted candidates are in `rejected.md`.

## Baseline (audit-time state — recorded, not fixed)
| Check | Result |
|---|---|
| `pytest` (api + viz + golden) | **321 passed**, 1 deprecation warning (Starlette/httpx) |
| `tsc --noEmit` (web) | **clean** |
| `next build` | **success** |
| `eslint .` (web) | **6 errors + 1 warning** — all `react-hooks/set-state-in-effect` + `immutability`; documented Next-16 lint-noise (see `rejected.md`) |
| live runtime (all pages, EN+FR) | browser console + network **clean** |

## Prior-audit fixes confirmed holding (do NOT re-file)
H1 `cma_demand` 8× (Toronto now **439,050**, hand-verified) · S04 malformed `start/end` → 200 not 500 · S07 provisional band on skills trend · S18 FR hero localized · S23 per-figure degradation (`figureSafe`) · S32 mobile nav `inert`-when-closed · S36 distinct nav landmarks · U02 mobile KPI sparkline stacks · U09 skills hero period · M7 per-capita caveat · M4/M6 coverage disclosure.

## Severity tally
| | HIGH | MEDIUM | LOW |
|---|---|---|---|
| Static `S##` | 0 | 15 | 8 |

**Dominant clusters:** **(1) i18n — the FR locale still leaks English in ~9 places** (filter sentinels, breakdown category labels, key-points narrative, error boundaries, auth error, number separators, scope summary, seasonality months); **(2) the new Explore builder has 4 data-honesty/correctness edges** (`two_year`+time mislabel, `share` denominator, sparse-cube YoY shift, equal-year zero chart); **(3) a11y of the new interactive controls** (TunableFigure year-pickers unlabeled, ExploreTabs incomplete tab pattern).

---

## Explore "Build a chart" — data correctness (`api/explore.py`)

### S01 · 🟨 MEDIUM · YoY time-series uses positional `shift(12)` on a sparse cube · `api/explore.py:459`
`_build_time` does `yoy = (s / s.shift(12) - 1) * 100` — a 12-**row** shift, not 12 **calendar months**. `monthly_filter_cube` is built with `GROUP BY GROUPING SETS` and is **not** zero-filled, so a narrow scope cell (e.g. one province pinned to a narrow industry) can skip zero-activity months. The `<13`-distinct-months guard (`:456`) checks count, not contiguity, so a gappy series silently mis-pairs every year-ago point. The bar path `_bar_yoy` (`:288`) is gap-safe (explicit `date(year-1, month, 1)` lookup) — the time path inherited the dense-series pattern. **Verdict:** confirmed; silent wrong numbers on narrow three-way intersections (broad scopes are dense). Fix: `s.shift(12, freq="MS")` or reindex to a contiguous monthly index first.

### S02 · 🟨 MEDIUM · `_bar_share` denominator excludes dropped + sub-sample categories → shares overstated · `api/explore.py:266-273` · **[hand-verified]**
`_bar_share` drops categories below `MIN_SAMPLE` *first* (`:268`), then computes `total = g[...].sum()` from the **survivors only** (`:269`). The `_DIM_DROP` set already removed the "All" total **and Unknown**. For `dim=occupation, measure=share` over 2016→2025 the live endpoint reports **Sales & service = 35.1%** and shares sum to ~100% over survivors — while the occupations **treemap shows 28%** for the same group (it includes Unknown ≈18%). Same metric, two surfaces, ~25% relative gap, and the axis label "share of postings" doesn't disclose that Unknown/sub-sample categories are excluded. The time-series share path (`:452`) correctly divides by the full window total. Cuts against the honesty-first design.

### S03 · 🟨 MEDIUM · `two_year` + `dim=time` shows a raw postings line under a "change a→b" axis (and an unformatted placeholder) · `api/explore.py:464-467, 481-484`
When `dim=time, measure=two_year`, `_build_time` falls to the `else` branch and plots `df["postings_total"]` — an ordinary postings series — while `_measure_axis` labels the y-axis "change {a}→{b}". So the user picks "Two-year change," sees a postings level line, and the axis claims it's a change. Worse, `_measure_axis` only interpolates `{a}/{b}` when **both** `start_year` and `end_year` are set; a valid call with one missing renders the literal string `change {a}→{b}` (unfilled Python placeholders) verbatim in the chart. (Reported 4× by the fan-out: explore-endpoint, figure-factories, figures-bridge, frontend-pages.) Fix: either gate `two_year` off the time dim, or render the actual 12-month-rolling/level with an honest label.

### S16 · ⬜ LOW · `two_year` with `start_year == end_year` → every bar is 0%, no gate · `api/explore.py:299-311` (+ `ExploreBuilder.tsx:134-145` allows equal years)
`_bar_two_year` computes `(end - base)/base` with `base` and `end` both the same year → 0% for every category, drawn as a valid (empty-looking) chart. The builder's clamps allow `startYear === endYear`. Add an equal-year guard → "pick two different years" message.

### S17 · ⬜ LOW · `_bar_two_year` dead column rename · `api/explore.py:310`
`.reset_index().rename(columns={"index": "category"})` renames a column that is already named `category` (the groupby key). Harmless, but misleading. Drop the rename.

---

## Figure factories / bridge (`src/jobads_dashboard/viz/`, `api/figures.py`)

### S04 · 🟨 MEDIUM · `_FR_CHROME` missing `Oct`/`Nov` → seasonality heatmap Y-axis stays English in FR · `api/figures.py:189-190`
`_FR_CHROME` maps month abbreviations for the seasonality heatmap but omits **Oct** and **Nov**, so those two axis ticks render in English under FR while the rest are translated. Concrete, visible. Add the two keys.

### S18 · ⬜ LOW · `cma_demand` ambiguous/duplicate tick labels · `src/jobads_dashboard/viz/figures/geography.py:129-135` · **[hand-verified]**
The y-axis uses the bare market name, and the data contains **two distinct catch-all buckets both displayed as "Rural area not in a CMA/CA"** (decoded values 40,667 and 54,266) plus an "Unknown market" (60,349). Two bars with identical labels read as a glitch; counts are correct per bucket but undistinguishable on the axis. Disambiguate the catch-all labels (or merge the buckets).

### S19 · ⬜ LOW · `dumbbell` / year-anchored factories silently render empty for out-of-window years · `src/jobads_dashboard/viz/figures/occupations.py:138-155`
`dumbbell` keys on the exact `June(base_year)` / `Dec(end_year)` month in `noc_broad`; if that month is absent it returns zero points (blank chart, no message). Reachable only via a crafted API call — the UI dropdown is bounded to the real window — but the bridge does **not** clamp: e.g. `/api/figure/occupations.indexed_lines?base_year=1990` returns **0 traces** silently (orchestrator-verified). LOW (edge / direct-URL only). Clamp year params to the data window in `_year_kw`, or return a friendly message.

---

## Backend — i18n / security (`api/`)

### S05 · 🟨 MEDIUM · Home "key points" narrative generated English-only → FR homepage shows English sentences · `api/queries.py:384-403`
`key_points` builds the "What stands out" bullet sentences as English string templates with no FR branch, so the only narrative prose on the FR homepage is English. Localize the templates (or move the sentence assembly into the i18n dicts).

### S06 · 🟨 MEDIUM · `X-Forwarded-For` trusted unconditionally → login rate-limit bypass · `api/routers/private.py:46-49`
The per-IP login throttle keys on the client-supplied `X-Forwarded-For` header without verifying it came from a trusted proxy, so an attacker rotates the header to defeat the backoff and brute-force the single shared password. Trust `X-Forwarded-For` only from the known proxy hop (or use the socket peer when not behind a configured proxy).

---

## Frontend — i18n (FR leaks)

### S07 · 🟨 MEDIUM · Filter sentinel values + breakdown category labels hardcoded English (shown in FR) · `web/lib/options.ts:3-5,11-67` (+ `api/explore.py:_pretty`) · **[hand-verified]**
`ALL_GEO/ALL_OCC/ALL_IND` and the dropdown option labels are hardcoded English ("All Canada / All occupations / All industries"), shown verbatim in the FR FilterSpine. Separately, breakdown **category labels** (occupation/industry NOC/NAICS group names) come from `_pretty` (splits `code | label`) and the factory label fields — English in FR across the Explore bars **and** the curated treemaps (provinces *are* localized via `core.PROVINCE_NAMES`; occupations/industries are not). Systemic. Needs a code→FR-label map for occupation/industry groups + localized sentinels.

### S08 · 🟨 MEDIUM · `ExploreView` scope summary falls back to hardcoded "All Canada" in FR · `web/components/explore/ExploreView.tsx:88-94`
The posting-lookup scope summary string hardcodes "All Canada" (and the other sentinels) rather than the localized label — visible to any FR user with no active scope filter (the default state).

### S09 · 🟨 MEDIUM · `fmtInt`/`fmtCompact`/`fmtPct` always format with `en-CA` → wrong FR separators · `web/lib/format.ts:5-27`
All numeric formatters hardcode `en-CA`, so FR renders `1,234.5` instead of the French `1 234,5` (space thousands, comma decimal). Wrong across every KPI, axis caption, and table in FR. Thread the active locale into the `Intl.NumberFormat` calls.

### S10 · 🟨 MEDIUM · `KeyPoints` footer note hardcoded English · `web/components/KeyPoints.tsx:22-24`
The disclaimer note under the "What stands out" panel is a hardcoded English literal — leaks into FR. Move to the i18n dict.

### S11 · 🟨 MEDIUM · `error.tsx` boundaries hardcode English · `web/app/error.tsx:7-17` (+ `explore/error.tsx`)
The route error boundaries render hardcoded English copy, so a FR user hitting an error sees English. (`developers/error.tsx` uses generic text — less acute.) Localize via the dict, or a minimal bilingual fallback.

### S12 · 🟨 MEDIUM · `AuthGate` fallback login-error string hardcoded English · `web/components/explore/AuthGate.tsx:43`
The catch-all login error message is a hardcoded English string, untranslated in FR.

---

## Frontend — accessibility

### S13 · 🟨 MEDIUM · `TunableFigure` year-picker `<select>`s have no accessible name · `web/components/TunableFigure.tsx:88-119` · **[hand-verified]**
The 11 year-pickers on Occupations (+ Skills/Geography/Industries) render `<select>` with no `aria-label`; the visible "Base/From/To" `<span>`s are not associated (no `htmlFor`/`aria-labelledby`), and the `aria-label` sits on a roleless wrapping `<div>` (ignored by AT). A screen-reader user hears bare comboboxes; in `baseEnd` mode the two are indistinguishable. (The Explore builder's selects *are* labeled — this is TunableFigure-specific.) Rated P1 by one craft auditor; filed MEDIUM defect. Fix: associate each `<select>` with its label via `id`/`htmlFor` or `aria-label` (`${yc.base} year` / `${yc.from} year` / `${yc.to} year`), and wrap the pair in a `role="group"` with an accessible name.

### S14 · 🟨 MEDIUM · `ExploreTabs` is an incomplete ARIA tab pattern · `web/components/explore/ExploreTabs.tsx:21-44`
The tablist has `role="tab"` buttons but no `role="tabpanel"` on the controlled region, no `aria-controls`/`id` association, and no arrow-key navigation (APG Tabs pattern). AT users can't move between tabs with arrows and the panel isn't announced as the tab's controlled region. Add the panel role + id, `aria-controls`, and arrow-key handling — or downgrade to plain links/buttons without the tab role.

### S21 · ⬜ LOW · `LocaleToggle` group `aria-label` describes only one direction · `web/components/LocaleToggle.tsx:21-22`
The toggle group's `aria-label` names only one language, mislabelling the control (WCAG 1.3.1/4.1.2). Per-button state is still readable, so LOW. Use a neutral group name ("Language" / "Langue").

---

## Frontend — interaction / state

### S15 · 🟨 MEDIUM · `ExploreBuilder` shows an error-flavoured "chart unavailable" during normal initial load · `web/components/explore/ExploreBuilder.tsx:56-57,166-168` (+ `RemoteFigure.tsx`)
`fig` starts `null` with `loading=true`; while the first `/api/explore/figure` resolves, `RemoteFigure`'s null branch renders the "temporarily unavailable" message (softened only by `opacity-50`). For ~1s on every load the builder reads as *broken* rather than *loading*. Show a neutral loading state (skeleton/spinner) distinct from the error message; only show "unavailable" after a failed fetch.

### S20 · ⬜ LOW · `PostingDrawer` flashes stale content when reopened with a new id · `web/components/explore/PostingDrawer.tsx:44-57,137`
On reopen with a new posting id, the previous detail is shown for one render before the new fetch resets state. Window is practically imperceptible under React's synchronous flush. Reset `detail=null` synchronously when `id` changes.

---

## Frontend — type-safety / consistency (LOW)

### S22 · ⬜ LOW · `page-skills.ts` / `page-method.ts` dicts missing `as const` · `web/lib/i18n/dict/page-skills.ts:200` (+ page-method)
Unlike the sibling dicts, these two omit the `as const` assertion, weakening TS narrowing of the dict keys. No runtime/compile failure today; add `as const` for parity and stronger key checking.

### S23 · ⬜ LOW · `explore/page.tsx` metadata object not typed as `Metadata` · `web/app/explore/page.tsx:7`
The exported `metadata` isn't annotated `: Metadata`, so a typo'd field wouldn't be caught. Annotate it (other pages do).
