# Deep audit 2026-06-23 — fix spec

How to fix every confirmed item, keyed by the `findings.md` (`S##`) and `ux-audit.md` (`U##`) IDs. Cited code re-read at write time. **Golden-test note:** any factory/figure edit (S03, S04, S18, S19) breaks `tests/golden/` — regenerate and **review the diff as a finding, not a rubber-stamp** (the golden suite is how the H1 8× bug was caught). Run `pytest` + `tsc --noEmit` + a FR live pass after each unit.

---

## Explore data-correctness (highest value)

### S01 — YoY positional shift on sparse cube · `api/explore.py:459`
Current: `s = df.set_index("month")["postings_total"]` then `yoy = (s / s.shift(12) - 1) * 100`.
Fix: shift by calendar month, not row position. Reindex to a contiguous monthly index first so gaps become NaN (and YoY at a gap is NaN, dropped):
```python
s = df.set_index("month")["postings_total"].sort_index()
s = s.reindex(pd.date_range(s.index.min(), s.index.max(), freq="MS"))
yoy = (s / s.shift(12) - 1) * 100
yoy = yoy.dropna().round(1)
```
Verify: a narrow scope cell with a missing interior month now yields NaN at the affected pairs instead of a mis-aligned ratio. Risk: low; the `<13` guard still applies.

### S02 — `_bar_share` denominator excludes dropped categories · `api/explore.py:266-273`
Current: filters `>= MIN_SAMPLE`, then `total = g["postings_total"].sum()` over survivors.
Fix (pick one):
- **(a) honest denominator** — compute `total` from the **pre-filter** sum (before dropping sub-sample and after the `_DIM_DROP` decision), so shares are of the full shown cross-section; or
- **(b) keep Unknown in the denominator** — query the All-total for the pinned scope and divide by it, matching the treemap (28%, not 35%).
Recommended: (b) for cross-surface consistency, plus a one-line axis/footnote caveat ("share of postings in shown categories" if Unknown stays excluded). Verify: `dim=occupation,measure=share` Sales & service ≈ 28% (matches treemap). Regenerate goldens.

### S03 — `two_year` + time mislabel + unformatted placeholder · `api/explore.py:464-467, 481-484`
Fix: do not let "Two-year change" mean "raw postings line." Either
- gate it: when `dim=="time" and measure=="two_year"` return `_message_figure(_t(locale,"two_year_needs_breakdown"))` ("Two-year change needs a breakdown — switch to a category"), or
- render an honest series (e.g. rolling 24-month change) with a matching label.
And harden `_measure_axis`: when `start_year`/`end_year` are missing, fall back to a generic `_t(locale, "two_year_generic")` ("two-year change") instead of the literal `change {a}→{b}`. Verify: no unfilled `{a}`/`{b}` ever reaches the chart; the axis label always matches the data drawn.

### S16 — equal-year `two_year` → all-zero · `api/explore.py:299-311` + `web/components/explore/ExploreBuilder.tsx:134-145`
Fix: in `_bar_two_year` (and `_build_time`'s two_year path), if `lo_year == hi_year` return the low-sample/`"pick two different years"` message. Optionally also clamp the builder so the `to` select can't equal `from` for the two_year measure. Verify: From=2022,To=2022,measure=two_year → friendly message, not an all-0% chart.

### S17 — dead rename · `api/explore.py:310`
Delete `.rename(columns={"index": "category"})` — the `reset_index()` already yields a `category` column (it was the groupby key). Verify: output unchanged; `pytest` green.

---

## Figure factories / bridge

### S04 — `_FR_CHROME` missing Oct/Nov · `api/figures.py:189-190`
The month-tick block has Jan…Sep + Dec but not Oct/Nov. Add them:
```python
"Jun": "Juin", "Jul": "Juil", "Aug": "Août", "Sep": "Sept",
"Oct": "Oct", "Nov": "Nov", "Dec": "Déc",
```
Verify: `/api/figure/pulse.seasonality?locale=fr` — every Y-axis month tick is French. Regenerate the seasonality golden.

### S18 — duplicate "Rural area not in a CMA/CA" tick labels · `src/jobads_dashboard/viz/figures/geography.py:129-135`
Two distinct buckets share one display label (40,667 and 54,266 in shipped data). Either merge the two catch-all rows into one bucket before grouping, or disambiguate (e.g. suffix the province / "(other)"). Decide which is correct against the upstream `monthly_by_market` schema. Verify live: no two CMA bars share an identical label. Regenerate the cma golden.

### S19 — year-anchored factories silently empty out of window · `src/jobads_dashboard/viz/figures/occupations.py:138-155` (+ `api/figures.py:_year_kw`)
Clamp year params to the data window at the bridge so a crafted `base_year=1990` can't reach the factory:
```python
def _year_kw(k, *names):
    lo, hi = 2016, _ds().latest_complete_year()   # or pull from metadata
    return {n: max(lo, min(hi, int(k[n]))) for n in names if k.get(n) is not None}
```
(or have each factory return `_message_figure`-style empty-with-note when the keyed month is absent). Verify: `/api/figure/occupations.indexed_lines?base_year=1990` returns a clamped chart, not 0 traces. Low priority (UI dropdown already bounds it).

---

## Backend i18n / security

### S05 — key-points narrative English-only · `api/queries.py:384-403`
Move the sentence templates into locale-keyed strings (mirror the `_FR_CHROME`/dict pattern): build the numbers in Python, but pull the sentence frames from an `en`/`fr` table keyed by point type, formatting in the requested locale. Verify: FR homepage "What stands out" reads French.

### S06 — `X-Forwarded-For` trusted unconditionally · `api/routers/private.py:46-49`
Only honour `X-Forwarded-For` when the request arrives from a configured trusted proxy; otherwise key the rate-limit on the socket peer (`request.client.host`). Add a `JOBADS_API_TRUSTED_PROXY` allowlist (the Render/proxy hop). Verify: spoofing the header from an untrusted source no longer resets the per-IP backoff.

---

## Frontend i18n (FR leaks) — mostly mechanical dict moves

### S07 — sentinel + category labels English in FR · `web/lib/options.ts:3-67` + `api/explore.py:_pretty`
- Sentinels/dropdowns: make `ALL_GEO/ALL_OCC/ALL_IND` *values* stay the API keys, but render **localized labels** — add an `fr` label table (or thread `t.filter.allCanada` etc. into `geoOptions/occOptions/indOptions`).
- Category labels: add a `code → {en,fr}` map for the 10 NOC broad groups + 20 NAICS sectors (and province already localized). Use it in `explore._pretty(dim, category, locale)` **and** the curated treemap/bar factories so both surfaces match. Verify: FR Explore bars + treemaps show French group names; FR filter dropdowns show French sentinels.

### S08 — `ExploreView` scope summary "All Canada" · `web/components/explore/ExploreView.tsx:88-94`
Build the summary from the localized option labels (same source as S07), not the raw sentinel constants. Verify: FR posting-lookup summary reads "Tout le Canada / …".

### S09 — formatters hardcode `en-CA` · `web/lib/format.ts:5-27`
The file already has `intlLocale(locale)`. Thread `locale` into `fmtInt/fmtCompact/fmtPct` (add a `locale: Locale = "en"` param, build the `Intl.NumberFormat` per call with `intlLocale(locale)`), and pass the active locale from callers. Verify: FR renders `1 234,5` (space thousands, comma decimal) on KPIs/axes/tables.

### S10 — `KeyPoints` footer note English · `web/components/KeyPoints.tsx:22-24`
Move the literal to `t.<page>.keyPointsNote` (en+fr) and read it via `useI18n`. Verify: FR shows the French note.

### S11 — `error.tsx` boundaries English · `web/app/error.tsx:7-17` (+ `explore/error.tsx`)
Either read the locale cookie in the boundary and render a bilingual fallback, or hardcode a minimal EN+FR sentence pair ("Something went wrong. / Une erreur s'est produite."). Verify: FR error view is French.

### S12 — `AuthGate` fallback error English · `web/components/explore/AuthGate.tsx:43`
Replace the literal with `t.explore.<authError>` (en+fr). Verify: FR login failure shows French.

---

## Frontend a11y

### S13 — TunableFigure year-pickers unlabeled · `web/components/TunableFigure.tsx:88-119`
Give each `<select>` an explicit accessible name and group the pair:
```jsx
<div className="flex items-center gap-1.5" role="group" aria-label={yc.aria}>
  <span id={`${chartId}-base-lbl`} className={labelCls}>{yc.base}</span>
  <select aria-labelledby={`${chartId}-base-lbl`} ...>…</select>
</div>
```
For `baseEnd`, label the two selects distinctly (`${yc.from} year` / `${yc.to} year`). Verify: each picker reports a name in the a11y tree (preview snapshot / VoiceOver). Mirror in `aria` dict if a new string is needed.

### S14 — ExploreTabs incomplete tab pattern · `web/components/explore/ExploreTabs.tsx:18-46`
Add `id` + `aria-controls` to each tab, give the panel `role="tabpanel"` + matching `id` + `aria-labelledby`, and add arrow-key navigation on the tablist (Left/Right move focus + selection). Or, if a full APG widget is overkill, drop `role="tab"/"tablist"` and use plain buttons (simpler, still accessible). Verify: arrow keys move tabs; the panel is announced as controlled by its tab.

### S21 — LocaleToggle group label one-directional · `web/components/LocaleToggle.tsx:21-22`
Set the group `aria-label` to a neutral "Language" / "Langue" (read from the dict). Verify: AT announces a neutral group name.

---

## Frontend interaction / state

### S15 — ExploreBuilder error-flavoured initial load · `web/components/explore/ExploreBuilder.tsx:56-57,166-168` + `web/components/RemoteFigure.tsx`
Distinguish *loading* from *failed*: while `loading && fig === null` render a neutral skeleton/spinner; only render `RemoteFigure`'s "unavailable" message when a fetch resolved to `null` (failure). Pass an explicit `loading`/`error` prop to `RemoteFigure` rather than inferring from `fig === null`. Verify: first paint shows a loading state, never "temporarily unavailable," unless the API actually fails.

### S20 — PostingDrawer stale flash · `web/components/explore/PostingDrawer.tsx:44-57`
Reset `setDetail(null)` synchronously when `id` changes (in the same effect, before the fetch, or keyed on `id`). Verify: reopening with a new id never shows the previous posting.

---

## Frontend type-safety / consistency (LOW)

### S22 — missing `as const` · `web/lib/i18n/dict/page-skills.ts`, `page-method.ts`
Append `as const` to the exported dict objects, matching the sibling dicts. Verify: `tsc --noEmit` clean; key narrowing tightened.

### S23 — explore metadata not typed · `web/app/explore/page.tsx:7`
Annotate `export const metadata: Metadata = { … }` (import `Metadata` from `next`). Verify: `tsc` catches a bad field.

---

## Craft (`U##`)

### U01 — tokenize small-text scale · `web/app/globals.css:152-193` + components
Add `--text-caption/-body-sm/-body` tokens (or Tailwind `text-*` utilities), then sweep the ~21 `text-[0.xx rem]` literals onto the nearest token. Mechanical but wide; do as one pass with a grep checklist. Verify: visual diff negligible; one source of truth for small text.

### U02 — unify KPI delta convention · `web/app/page.tsx:97-130` + `web/components/KpiTile.tsx:64-76`
Give all four tiles the same delta grammar (recommended: ▲/▼ + % chip on Vs-Last-Year; decide whether Median Wage gets a MoM/YoY chip or stays deliberately delta-less with a caption). Verify: the four tiles read as one system.

### U03 — chart font matches UI · `src/jobads_dashboard/viz/theme.py:117`
Set the figure font family to the app stack (`"PT Sans", system-ui, …`). Verify: Plotly axis text matches card text in the browser. Regenerate goldens (font name in layout JSON).

### U04 — FilterSpine label honesty · `web/lib/i18n/dict/filter.ts:5` + `web/components/FilterSpine.tsx:16`
Reword "across the dashboard" → "Filter the Explore views" / "Filtrer les vues Explorer." Verify: label matches reach (en+fr).

### U05 — CSV stale-data guard · `web/components/explore/ExploreBuilder.tsx:56-58,157-164`
Disable the download button while `loading` (`disabled={!hasTrace || loading}`), and/or stamp the filename with the active dim/measure/window. Verify: cannot download mid-refetch; file matches chart.

### U06 — brand tagline size · `web/components/Brand.tsx:15`
Raise the tagline to ≥0.7rem or add tracking/weight. Verify: legible on cream at desktop + mobile.

### U07 — CMA bar colour · `src/jobads_dashboard/viz/figures/geography.py:129-138`
Use a single brand hue (or sequential ramp on the measure) instead of per-province categorical colour. Verify live: ranked bars read as one measure. Regenerate golden.

### U08 — ExploreBuilder figcaption · `web/components/explore/ExploreBuilder.tsx:155-169`
Add a `<figcaption>` echoing "{breakdown} · {measure} · {from}–{to}" (localized), giving the figure an accessible name. Verify: figure has a caption; a11y name present.

### U09 — AuthGate phase consistency · `web/components/explore/AuthGate.tsx:58-63,97`
Wrap "checking"/"error" phases in the same card shell + spacing as the locked/open states. Verify: all phases share the card treatment.
