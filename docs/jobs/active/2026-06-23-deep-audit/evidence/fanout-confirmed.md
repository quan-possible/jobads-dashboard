# Fan-out — confirmed candidates (full detail)

Totals: {"candidates": 57, "confirmed": 48, "refuted": 8, "uncertain": 1}

8 Sonnet auditors (6 code + 2 UI/UX) → one adversarial refuter per candidate.

## C1 · MEDIUM · data-correctness · YoY time-series uses row-based shift(12) on a sparse cube — misaligns year-ago for narrow scope cells
- source: explore-endpoint
- file: api/explore.py:459
- whatWrong: The line `yoy = (s / s.shift(12) - 1) * 100` shifts by 12 rows, not 12 calendar months. The monthly_filter_cube is built from GROUPING SETS with no zero-filling (sparse): if a scope cell — e.g. a small province filtered to a narrow industry — is missing any month's row, shift(12) pairs the wrong year-ago observation. For example, if 2020-03 is absent, shift(12) for 2021-03 lands on 2021-02, producing a silent ~1-month misalignment in the YoY ratio. By contrast, _bar_yoy (line 289) correctly uses explicit date arithmetic (`date(as_of.year - 1, as_of.month, 1)`) that is gap-safe.
- rootCause: The sparse parquet cube has no guarantee of one row per month per scope cell. The `_build_time` YoY branch inherited the same `pct_change(12)` pattern used in `compute.yoy_pct` (which operates on the denser `overall` table), but applied it to a potentially gap-ridden per-cell query result.
- evidence: api/explore.py:459 — `yoy = (s / s.shift(12) - 1) * 100`; prepare.py:170–194 — `build_monthly_filter_cube` uses `GROUP BY GROUPING SETS` with no zero-fill, confirming sparse rows for narrow cells.
- verdict: The defect is real and reachable. At line 459, `s = df.set_index("month")["postings_total"]` followed by `s.shift(12)` performs a positional 12-row shift, not a calendar-12-month shift. `pd.Series.shift(n)` with no `freq` argument always shifts by position on the index, regardless of whether the index is datetime-typed.

The cube (`monthly_filter_cube`) is built with `GROUP BY GROUPING SETS` and no zero-filling (confirmed in prepare.py lines 141-152 and 170-194). A specific (province, occupation, industry) triple only emits a row when at least one posting exists for that month. Narrow scope cells — e.g., a specific province pinned to a specific occupation and industry — can legitimately skip months with zero activity. The `< 13` distinct-month guard at line 456 only checks that 13 distinct months exist; it does not check for 12-month contiguity. A series with 13 non-consecutive months passes the guard and then mis-pairs every YoY observation.

The contrast with `_bar_yoy` (lines 276-296) is accurate: that function explicitly looks up the year-ago row by date arithmetic (`year_ago_m = pd.Timestamp(date(as_of.year - 1, as_of.month, 1))`) and skips the category if the prior row is missing, making it gap-safe. The `_build_time` YoY branch inherited a simpler positional-shift pattern that is only safe on a dense (no-gap) month series.
- severityAdjust: MEDIUM is appropriate. The bug is silent and produces wrong YoY numbers rather than an error, but it only bites on narrow three-way scope intersections (specific province + occupation + industry), which are less-used paths. Broad scopes (national, province-only, or All for two of the three dimensions) are dense enough in practice that the misalignment is unlikely. The fix is a one-liner: replace `s.shift(12)` with `s.shift(12, freq="MS")` or reindex to a contiguous monthly DatetimeIndex before shifting.

## C2 · MEDIUM · data-correctness · _bar_share computes share denominator from filtered categories only — overstates visible shares
- source: explore-endpoint
- file: api/explore.py:267-273
- whatWrong: In `_bar_share`, the MIN_SAMPLE filter is applied first (`g = g[g['postings_total'] >= MIN_SAMPLE]`), then `total = g['postings_total'].sum()` is computed from the surviving rows only. Categories below 100 postings are excluded from the denominator. A visible category with 500 postings in a window where 9 of 13 provinces are below 100 postings will show ~25% share instead of the true ~5%. The axis title says 'share of postings' with no caveat that dropped categories are excluded. This violates the product's honesty-first principle.
- rootCause: The MIN_SAMPLE guard was placed before the denominator computation to avoid showing per-category noise, but this has the side-effect of computing a partial-total denominator rather than the true cross-section total.
- evidence: api/explore.py:267–273 — `g = g[g['postings_total'] >= MIN_SAMPLE]` then `total = g['postings_total'].sum()`; the _build_time/share branch (line 452–454) correctly divides by the full window total instead.
- verdict: The code at /Volumes/ACLMR/jobads-dashboard/api/explore.py:266-273 does exactly what is claimed. Line 268 filters `g = g[g["postings_total"] >= MIN_SAMPLE]` before line 269 computes `total = g["postings_total"].sum()`. The denominator is the post-filter partial total, not the true cross-section total. Categories below MIN_SAMPLE (100) are excluded from both the numerator display and the denominator, which inflates the visible shares for surviving categories. The contrast with the time-series share path at lines 451-454 is accurate: there, `total = float(df["postings_total"].sum())` uses the unfiltered window total. The defect is present, reachable whenever a filtered breakdown has some categories below the sample threshold, and there is no axis label or annotation in `_bar_share` that warns users the shares are relative to a partial total.
- severityAdjust: MEDIUM is appropriate. The effect is real and misleading, but it only activates in sparse cross-sections where multiple categories fall below MIN_SAMPLE=100. In dense markets the bias is negligible. A label caveat or fixing the denominator to use the pre-filter total would be the correct fix.

## C3 · MEDIUM · data-correctness · dim=time + measure=two_year silently shows a raw postings line with a misleading or broken axis label
- source: explore-endpoint
- file: api/explore.py:464-465
- whatWrong: When `dim='time'` and `measure='two_year'`, `_build_time` falls through to `x, y = df['month'], df['postings_total']` (line 465), silently displaying raw monthly postings rather than any two-year change statistic. The user picked 'Two-year change' but sees an ordinary postings time series. Additionally, `_measure_axis` (line 481–484) only fills in `{a}` and `{b}` when BOTH `start_year` and `end_year` are non-None. If either is absent (valid API call), the axis title becomes the literal string `'change {a}→{b}'` or `'variation {a}→{b}'` with unfilled Python format placeholders, appearing verbatim in the chart.
- rootCause: Two-year change is undefined as a time series (it's a scalar per category), so the author fell back to raw postings but did not gate the combination or add a clarifying label. The `_measure_axis` guard `if measure == 'two_year' and start_year and end_year` leaves the partial-year case un-handled.
- evidence: api/explore.py:464–465 — `else:  # two_year on a line: show the level series over the window` / `x, y = df['month'], df['postings_total']`; explore.py:481–484 — `if measure == 'two_year' and start_year and end_year: return _t(locale, 'two_year', a=start_year, b=end_year)` / `return _t(locale, measure)` which returns `'change {a}→{b}'` unformatted.
- verdict: Both defects are present and reachable in the current code at /Volumes/ACLMR/jobads-dashboard/api/explore.py.

Part 1 (lines 464–465): When `dim='time'` and `measure='two_year'`, `_build_time` hits the `else` branch (no `yoy`, no `share`, no `wage`, no `postings` match) and silently assigns `x, y = df["month"], df["postings_total"]` — raw monthly postings counts. No gate blocks this combination, no label change signals it, and no transformation is applied. The user who picks "Two-year change" on the time dimension gets a plain postings time series.

Part 2 (lines 481–484 + 92–95): `_measure_axis` returns `_t(locale, "two_year")` when `start_year` or `end_year` is falsy. `_t` (line 95) only calls `text.format(**fmt)` when `fmt` is non-empty; called with no kwargs, it returns the raw translation string `"change {a}→{b}"` (EN) or `"variation {a}→{b}"` (FR) with literal `{a}` and `{b}` tokens unresolved, which then appear verbatim as the chart axis title. Both `start_year` and `end_year` are `int | None` query params with default `None`, so this path is reachable on any API call that omits either year.
- severityAdjust: MEDIUM is appropriate. The silent data mislabeling (raw postings shown as two-year change) is a data-correctness issue but requires the caller to pick an uncommon dim+measure combination; the broken axis label with literal `{a}`/`{b}` is a user-facing display bug visible any time years are omitted.

## C4 · LOW · edge-case · start_year == end_year with measure=two_year bar chart shows 0% for every category — no gate
- source: explore-endpoint
- file: api/explore.py:299-311
- whatWrong: When `start_year == end_year`, `_bar_two_year` computes `base` and `end` from the same calendar year, so `(end - base) / base * 100 = 0.0` for every category that meets the MIN_SAMPLE floor. The chart renders silently with every bar at 0%, labeled 'change YYYY→YYYY'. The frontend enforces `startYear <= endYear` (ExploreBuilder.tsx lines 134, 145) but not `startYear < endYear`, so users can reach this state legitimately through the year-picker controls.
- rootCause: No gate or early-return for the degenerate single-year window in the two_year measure. A single-year 'change' is undefined and the 0% result is arithmetically correct but semantically vacuous.
- evidence: api/explore.py:303–310 — `base = d[d['year'] == lo_year].groupby(...)...` / `end = d[d['year'] == hi_year]...` produces identical Series when lo_year==hi_year; ExploreBuilder.tsx:134 — `Math.min(+e.target.value, endYear)` allows equality.
- verdict: All cited evidence checks out in the current code. In `_bar_two_year` (api/explore.py:303-309), when `lo_year == hi_year`, `base` and `end` are identical grouped Series, so `(end - base) / base * 100` is exactly 0.0 for every category that clears the `MIN_SAMPLE` floor. The three gates in `build_explore_figure` / `_build_bar` do not fire: the raw frame is non-empty (real data exists), and the aggregated frame is also non-empty (the categories have 0.0 values, not missing rows). The chart renders silently with every bar at 0% and a title like "change 2023→2023". On the frontend, ExploreBuilder.tsx lines 134 and 145 enforce only `startYear <= endYear` (via `Math.min` and `Math.max` clamping), so equality is reachable through normal picker interaction. There is no guard anywhere — neither a backend early-return for `ly == hy` nor a frontend constraint requiring `startYear < endYear`.
- severityAdjust: LOW is appropriate. The state is only reachable when the user deliberately selects the same year for both pickers, and the result is misleading rather than crashing or data-corrupting. A simple early-return in `_bar_two_year` returning a message figure, or a frontend constraint (`startYear < endYear`) when measure is `two_year`, would fix it cleanly.

## C5 · LOW · consistency · _bar_two_year has dead rename of a column that is already correctly named
- source: explore-endpoint
- file: api/explore.py:310
- whatWrong: After `pd.DataFrame({'base': base, 'end': end}).reset_index()`, the resulting DataFrame already has a column named `'category'` (because the groupby index carries that name). The subsequent `.rename(columns={'index': 'category'})` is a no-op — there is no column named `'index'` to rename. The code is harmless but was clearly written under the mistaken assumption that `reset_index()` produces a column named `'index'` (it only does so when the index has no name; here it is named `'category'` from the groupby).
- rootCause: Copy-paste from a pattern that works on an unnamed integer index; not tested against a named groupby index.
- evidence: api/explore.py:310 — `out = out.reset_index().rename(columns={'index': 'category'})` following `out = pd.DataFrame({'base': base, 'end': end}).fillna(0.0)` where both `base` and `end` are produced by `.groupby('category')`.
- verdict: At /Volumes/ACLMR/jobads-dashboard/api/explore.py lines 303–310, `base` and `end` are both `.groupby("category")[...].sum()` Series, giving them a named index `"category"`. `pd.DataFrame({"base": base, "end": end})` inherits that named index. `reset_index()` at line 310 therefore promotes it to a column already named `"category"` — not `"index"`. The `.rename(columns={"index": "category"})` on the same line finds no column named `"index"` and is a no-op. The rename is dead code exactly as claimed. Output is still correct because the column is already named right, but the rename is written under the mistaken assumption that reset_index produces an `"index"` column, which only happens when the index is unnamed.
- severityAdjust: LOW is appropriate — the code is harmless and the output is correct; this is a readability/consistency issue only.

## C6 · MEDIUM · data-correctness · Explore two_year+time: y-axis claims 'change a→b' but shows raw posting levels
- source: figure-factories
- file: api/explore.py:464-465
- whatWrong: When dim=time and measure=two_year, _build_time falls through to `x, y = df['month'], df['postings_total']` — raw level counts. But _measure_axis (line 482-483) labels the y-axis 'change {a}→{b}' (e.g. 'change 2016→2024'). The axis label claims percent change; the data is a level series. No gate prevents this combination.
- rootCause: The two_year measure was designed for cross-category bar comparison. Its meaning is undefined on a time axis, so the code silently falls through to levels. The axis label is taken from the measure key without checking whether the data has been transformed to match.
- evidence: api/explore.py:464 `else:  # two_year on a line: show the level series over the window
    x, y = df['month'], df['postings_total']` plus line 482-483 `if measure == 'two_year' and start_year and end_year:
    return _t(locale, 'two_year', a=start_year, b=end_year)`
- verdict: All three parts of the claim hold up in the current code. (1) The frontend (ExploreBuilder.tsx lines 22-23) lists all five measures in a plain dropdown with no filtering on the selected dim — a user can pick dim=time + measure=two_year freely. (2) In api/explore.py _build_time, when measure is not wage/postings/share/yoy the else-branch at line 464 assigns x, y = df['month'], df['postings_total'] — raw posting level counts, with no transformation. (3) Line 467 then calls _measure_axis which, for two_year, returns the i18n string "change {a}→{b}" (e.g. "change 2016→2024"), and line 477 sets that string as the y-axis title on the scatter chart. The result is a line chart whose y-axis claims it shows a change between two years but actually plots raw monthly postings. The combination is reachable, the data is untransformed, and the label is wrong.
- severityAdjust: MEDIUM is appropriate. The mislabeling is data-correctness deception on a user-visible chart, but it requires a non-default measure+dim combination and the damage is limited to that one chart view. No data is corrupted; the misread is confined to the axis label vs. the actual series.

## C7 · LOW · data-correctness · cma_demand y-axis uses bare city name, enabling duplicate tick labels for non-CMA catch-all buckets
- source: figure-factories
- file: src/jobads_dashboard/viz/figures/geography.py:129-135
- whatWrong: market_label is constructed as 'province | city' (prepare.py:291). The cma_demand chart strips the province prefix and places only mk['city'] on the y-axis (line 135). If two provinces both have a non-CMA catch-all market such as 'Rural area not in a CMA/CA' that both rank in the top 18, the y-axis shows two bars with identical tick labels. The hover template does expose the province via customdata, and bar colour varies by province, but the tick label itself is ambiguous. The chart title says 'The biggest metropolitan labour markets' while catch-all buckets are not metropolitan markets.
- rootCause: The groupby is on full market_label (province|city), so data is correctly counted per province. The display strips the province prefix for readability but does not guard against identical city names across provinces.
- evidence: geography.py:129 `mk['prov'] = mk['market_label'].str.split('|').str[0].str.strip()` + line 130 `mk['city'] = mk['market_label'].str.split('|').str[1].str.strip()` + line 135 `y=mk['city']`
- verdict: The defect is real and confirmed in the current code and data. At geography.py:130-135, `mk['city']` strips the province prefix from `market_label`, then line 135 uses `y=mk['city']` as the Plotly y-axis. Replicating the exact cma_demand logic against the live parquet (monthly_by_market.parquet, All Canada / All occupations / All industries cell, last 12 months, top 18) produces three rows with city="Rural area not in a CMA/CA" (from AB, ON, QC) and two rows with city="Unknown market" (from ON, QC). Plotly renders these as duplicate tick labels on the y-axis. The hover template exposes the province via customdata and bar colour varies by province, but the axis tick itself is ambiguous. The chart title "The biggest metropolitan labour markets" is also misleading since catch-all buckets such as "Rural area not in a CMA/CA" and "Unknown market" are explicitly non-metropolitan. The groupby is correctly on full market_label (so data counts are not wrong), but the display strips the province prefix without guarding against collision.
- severityAdjust: LOW is appropriate. The data counts are correct per province; only the axis tick label is ambiguous. A user can distinguish bars by hover and by colour, so this is a craft/clarity issue, not a calculation error. LOW is fair.

## C8 · LOW · edge-case · dumbbell silently renders zero data points when exact June(base_year) or Dec(end_year) month absent from noc_broad
- source: figure-factories
- file: src/jobads_dashboard/viz/figures/occupations.py:138-155
- whatWrong: The dumbbell does exact-row lookups: `nb[nb['month'] == base]` and `nb[nb['month'] == end]` where base=June(base_year) and end=Dec(end_year). If either timestamp is not present (e.g. year out of data range, or called directly via API with an out-of-range year such as base_year=2090 which the router allows up to le=2100), the resulting Series is empty, df.dropna() leaves an empty DataFrame, and the figure renders with two orphan legend entries and zero dots or lines — a silent blank.
- rootCause: No guard checks whether the lookup months actually exist in the data before attempting the point-in-time join. The router only validates ge=2010, le=2100 — it does not clamp to the actual data window. The UI pickers are constrained to latestComplete, but a direct API call bypasses them.
- evidence: occupations.py:138-140 `b = nb[nb['month'] == base].set_index('noc_name')['postings_total']` / `e = nb[nb['month'] == end].set_index('noc_name')['postings_total']` / `df = pd.DataFrame({'base': b, 'end': e}).dropna()` with no empty-DataFrame guard before the iterrows loop at line 144.
- verdict: The cited code at occupations.py:138-140 exactly matches the claim. `b` and `e` use exact-timestamp equality against `noc_broad["month"]`; if either `Timestamp(f"{base_year}-06-01")` or `Timestamp(f"{end_year}-12-01")` is absent from the data, both Series are empty, `pd.DataFrame({'base': b, 'end': e}).dropna()` yields an empty DataFrame, the `iterrows` loop at line 144 runs zero times, and the two unconditional `fig.add_trace` calls at lines 149 and 151 still add two legend entries with empty x/y arrays — a visually blank but non-erroring figure. The router at api/routers/figures.py:22-23 confirms `ge=2010, le=2100`, making out-of-range years like 2090 valid API inputs. The UI at occupations/page.tsx:139 does clamp pickers to `minYear={FIRST_YEAR}` and `maxYear={latestComplete}`, so the bug is not reachable through the normal UI. It is reachable only through a direct API call — which the router accepts without further clamping to the actual data window. No empty-DataFrame guard exists before the loop.
- severityAdjust: LOW is appropriate. The UI constrains pickers to the real data window, so ordinary users cannot reach this path. Only a crafted direct API call triggers the silent blank. The fix (an early return or a guard before line 144) is trivial, but the real-world impact is narrow.

## C9 · MEDIUM · i18n · Oct and Nov missing from _FR_CHROME — seasonality heatmap Y-axis stays English in FR locale
- source: figures-bridge-queries
- file: api/figures.py:189-190
- whatWrong: The _FR_CHROME dict contains translations for Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, and Dec but has no entries for 'Oct' or 'Nov'. The pulse.seasonality_heatmap builds a full 12-element month list ['Jan','Feb',...,'Oct','Nov','Dec'] that becomes the Heatmap y-axis tick labels. _localize_chrome walks this list and calls _fr(v) on each element; because 'Oct' and 'Nov' have no mapping they pass through as-is. FR users of the seasonality heatmap see 'Oct' and 'Nov' in English while every other month is translated.
- rootCause: Two month abbreviations were omitted when _FR_CHROME was assembled. The list covers 10 of 12 months. The month list is defined at src/jobads_dashboard/viz/figures/pulse.py:67 and used as y-axis labels at line 69.
- evidence: "Jan": "Janv", "Feb": "Févr", "Mar": "Mars", "Apr": "Avr", "May": "Mai",
    "Jun": "Juin", "Jul": "Juil", "Aug": "Août", "Sep": "Sept", "Dec": "Déc",
- verdict: Lines 189-190 of /Volumes/ACLMR/jobads-dashboard/api/figures.py show _FR_CHROME has exactly 10 month entries: Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Dec — Oct and Nov are absent. pulse.py:67 builds the full 12-element list ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"] used as y-axis labels at line 69. _fr() at line 193-194 calls _FR_CHROME.get(s, s), so missing keys fall through unchanged. In FR locale, _localize_chrome walks the y-axis tick list and translates 10 months but leaves "Oct" and "Nov" as English. The defect is real, reachable in the current code, and the cited lines match exactly what the candidate claims.
- severityAdjust: 

## C10 · MEDIUM · i18n · key_points generated English-only — FR homepage shows English narrative sentences
- source: figures-bridge-queries
- file: api/queries.py:384-403
- whatWrong: _key_points() constructs f-string sentences in English with no locale parameter. The /api/overview endpoint (api/routers/read.py:24-25) does not accept a locale query param, and the frontend calls api.overview() without locale (web/lib/api.ts:34). FR users see the 'What stands out / Ce qui ressort' section filled with English sentences such as 'Posting demand is X% above its January 2019 baseline.' The web i18n dict itself notes these are 'API-derived strings' but the API never localises them.
- rootCause: _key_points() has no locale parameter and the /api/overview route was not updated when the editorial redesign added FR support to the rest of the API.
- evidence: def _key_points(scope: Scope, kpis: Kpis, growing: list[RankItem], cooling: list[RankItem], series: list[SeriesPoint]) -> list[str]:
    ...
    pts.append(f"Posting demand is {abs(round(delta))}% {direction} its January 2019 baseline.")
- verdict: The defect is real and reachable. _key_points() at queries.py:384-404 constructs all bullet sentences as English f-strings with no locale parameter. The /api/overview route (read.py:24-25) accepts no locale query param. api.overview() at web/lib/api.ts:34 and page.tsx:47 passes no locale. FR users see the "Ce qui ressort" panel (keyPointsTitle is correctly localised) filled with English sentences such as "Posting demand is X% above its January 2019 baseline." The page-pulse.ts dict (lines 2-4) explicitly documents this as a known limitation ("API-derived strings ... are NOT translated here"), but that comment does not fix the display — the English strings still render for FR users. Additionally, the KeyPoints.tsx footnote "Descriptive signals only — postings show posted demand, not causes." (line 23) is also hardcoded English with no localisation path, adding a second English-only surface visible to FR users in the same panel.
- severityAdjust: Severity is appropriate at MEDIUM. The strings are informational narrative bullets, not critical UI controls, but they are the only prose copy on the homepage that is deliberately not localised, making them conspicuous for FR users. A secondary note: the KeyPoints.tsx footer line is an additional missed string not mentioned in the candidate, but it is within the same component and worth grouping with this finding rather than raising separately.

## C11 · MEDIUM · data-correctness · Explore: two_year+time plots raw postings count but labels the Y-axis 'change X→Y'
- source: figures-bridge-queries
- file: api/explore.py:464-467
- whatWrong: When dim='time' and measure='two_year', _build_time() falls through to the else branch at line 464 and plots raw monthly postings totals (df['postings_total']). Then _measure_axis() at line 481-483 returns 'change {start_year}→{end_year}' (e.g. 'change 2020→2023') as the Y-axis title. The chart therefore shows a raw postings trend but labels the Y-axis as if it shows a percentage change, directly contradicting the 'Build a chart' product promise. When start_year or end_year is absent _measure_axis returns the unformatted template string 'change {a}→{b}' verbatim.
- rootCause: _build_time() does not implement two_year as a % change between the two calendar years on a time series (there is no well-defined single value to plot per month), but instead of gating with a message figure it silently falls back to the postings level series while keeping the misleading axis label.
- evidence:         else:  # two_year on a line: show the level series over the window
            x, y = df["month"], df["postings_total"]

    title = _measure_axis(measure, locale, start_year, end_year)
    fig.update_layout(xaxis_title=_t(locale, "month"), yaxis_title=title)
- verdict: The defect is real and reachable. At /Volumes/ACLMR/jobads-dashboard/api/explore.py line 464-465, when dim='time' and measure='two_year', the else branch executes and assigns x, y = df["month"], df["postings_total"] — raw monthly postings counts. Line 467 then calls _measure_axis(measure, locale, start_year, end_year). At lines 481-483, _measure_axis returns _t(locale, "two_year", a=start_year, b=end_year), which resolves to "change {start_year}→{end_year}" (e.g. "change 2020→2023") when both years are present. The chart therefore shows a raw postings trend while the Y-axis reads as if it shows a percentage change between two calendar years — a direct data-honesty contradiction. The secondary claim also holds: when start_year or end_year is None, the guard at line 482 (`start_year and end_year`) is False, so _measure_axis falls to `_t(locale, measure)` with no fmt kwargs, returning the raw unformatted template string "change {a}→{b}" verbatim as the axis label.
- severityAdjust: MEDIUM severity is appropriate. The bug is user-visible and misleading (wrong axis label for a real chart type), but it does not corrupt stored data or produce silent numeric errors — it produces a correctly-drawn level series with an incorrect axis title. A user selecting two_year+time will see confusing output but can infer the trend from the chart shape.

## C12 · MEDIUM · security · X-Forwarded-For trusted unconditionally — login rate limit bypassed by header spoofing
- source: figures-bridge-queries
- file: api/routers/private.py:46-49
- whatWrong: _client_ip() reads the first value from the X-Forwarded-For header without any trust validation. No ProxyHeadersMiddleware or trusted-proxy allowlist is configured in api/main.py. An unauthenticated caller can set 'X-Forwarded-For: <any IP>' on every login attempt and rotate IPs to stay below the 8-failure-per-15-minute window, rendering the brute-force protection ineffective against a single attacker.
- rootCause: Uvicorn/FastAPI's Request.client.host reflects the real TCP peer, but _client_ip() prefers the spoofable XFF header with no validation. Starlette's ProxyHeadersMiddleware or an explicit trusted-proxy list must gate which XFF values are believed.
- evidence: def _client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
- verdict: The code at /Volumes/ACLMR/jobads-dashboard/api/routers/private.py:46-49 is exactly as claimed. _client_ip() reads xff.split(",")[0].strip() — the leftmost XFF entry — with no trusted-proxy validation. The deployment path is: external client → Render.com CDN/load-balancer → Next.js (port $PORT) → http-proxy rewrite → FastAPI (127.0.0.1:8530). 

Two points of confirmation: (1) Next.js's proxy-request.js uses http-proxy with only x-forwarded-host added in the headers option — it does not strip or replace a client-supplied X-Forwarded-For. (2) Render.com appends the real client IP to any existing XFF chain rather than replacing it, so a request with "X-Forwarded-For: 1.2.3.4" from the attacker arrives at FastAPI as "X-Forwarded-For: 1.2.3.4, <render-peer-ip>". _client_ip() returns "1.2.3.4" (the leftmost spoofed value), which the attacker fully controls. No ProxyHeadersMiddleware and no trusted-proxy allowlist exist in api/main.py. The brute-force window is per-IP, so an attacker can rotate spoofed IPs across every attempt and bypass the 8-failure-per-15-minute lockout entirely. The vulnerability is real and reachable.
- severityAdjust: MEDIUM is appropriate. This is a brute-force protection bypass, not direct auth bypass. The protected resource is a single shared password for a research dashboard, not high-value credentials. However, the fix is straightforward: trust only the rightmost XFF value added by Render (i.e., use the last entry, or better, use request.client.host since FastAPI only accepts TCP connections from Next.js on 127.0.0.1). The rightmost-entry fix is robust for Render's append-only XFF behavior.

## C13 · MEDIUM · a11y · TunableFigure year-picker selects have no accessible name
- source: react-explore-tunable
- file: web/components/TunableFigure.tsx:88–119
- whatWrong: Both the 'base' and 'baseEnd' mode year pickers use a plain <div> with aria-label but no ARIA role. ARIA 1.2 prohibits aria-label on generic elements without a role — screen readers ignore it. The visible text labels ('Base year', 'From', 'to') are <span> elements with no htmlFor or aria-labelledby association to the adjacent <select> controls, so those selects are completely unnamed for AT.
- rootCause: The wrapper div needs role="group" for aria-label to be honoured, and each <select> needs either a wrapping <label htmlFor=...> or an aria-label attribute of its own. By contrast, ExploreBuilder's equivalent year selects already carry explicit aria-label props (ExploreBuilder.tsx lines 131, 142), so the pattern was known but not applied here.
- evidence: <div className="flex items-center gap-1.5" aria-label={yc.aria}>
  <span className={labelCls}>{yc.base}</span>
  <select className={selectCls} value={baseYear} onChange={...}>
- verdict: All three sub-claims are verified against the current code. In TunableFigure.tsx lines 88 and 97, `aria-label` is placed on a bare `<div>` (implicit ARIA role: generic). The generic role is not in ARIA 1.2's list of nameable roles, so conformant screen readers ignore that label. The `<select>` elements at lines 90, 100–106, and 109–116 carry no `aria-label`, no `id` paired with a `<label htmlFor=...>`, and no `aria-labelledby`; the adjacent `<span>` text labels have no programmatic association to them. ExploreBuilder.tsx lines 131 and 142 confirm the correct fix pattern (aria-label directly on the `<select>`) was already applied there but not here. The picker is rendered on all year-selectable chart tabs, so it is reachable by real AT users.
- severityAdjust: 

## C14 · MEDIUM · a11y · ExploreTabs missing aria-controls and tabpanel role — incomplete ARIA tab pattern
- source: react-explore-tunable
- file: web/components/explore/ExploreTabs.tsx:21–44
- whatWrong: The tab buttons have role="tab" and aria-selected, which is correct. But neither tab button has aria-controls, and the rendered panel content (ExploreBuilder or AuthGate) has no role="tabpanel", no id, and no aria-labelledby. The ARIA tab pattern requires tabs to be wired to their panel via aria-controls/id so AT users can jump directly from a tab to its panel. Without this, keyboard users must arrow through all page content to reach the panel after activating a tab.
- rootCause: Only the tablist/tab side of the ARIA tabs contract was implemented. The panel side (role, id, aria-labelledby, aria-controls on the button) was left out.
- evidence: <button role="tab" aria-selected={active} onClick={() => setTab(k)}>{t.explore.tabs[k]}</button>
...
{tab === "build" ? <ExploreBuilder minYear={minYear} maxYear={maxYear} /> : <AuthGate />}
- verdict: The full file at /Volumes/ACLMR/jobads-dashboard/web/components/explore/ExploreTabs.tsx confirms the defect exactly as described. Lines 25–39: tab buttons carry role="tab" and aria-selected but have no aria-controls attribute. Line 44: the active panel is rendered as a bare React component with no enclosing element holding role="tabpanel", id, or aria-labelledby. All three required wiring attributes (aria-controls on buttons, role="tabpanel" + id on the panel div, aria-labelledby on the panel div) are absent. This is a real, reachable ARIA tab-pattern violation on every render of the Explore page.
- severityAdjust: 

## C15 · MEDIUM · edge-case · ExploreBuilder shows 'temporarily unavailable' during normal initial load
- source: react-explore-tunable
- file: web/components/explore/ExploreBuilder.tsx:56–57, 166–168
- whatWrong: ExploreBuilder initialises fig=null and loading=true. RemoteFigure renders its error fallback — 'This chart is temporarily unavailable.' — whenever fig is null, regardless of whether a fetch is in progress. For roughly 1 second on first mount, the user sees an error-flavoured message when the chart is actually loading normally. This misleads users into thinking the feature is broken.
- rootCause: TunableFigure avoids this because it receives initialFig from the server (non-null). ExploreBuilder has no equivalent SSR seed, so it starts null. RemoteFigure has only two states (null=unavailable, non-null=chart) and no loading-specific render path. A loading prop from the parent, or a dedicated skeleton render inside RemoteFigure when fig===null and a loading flag is set, would fix this.
- evidence: const [fig, setFig] = useState<FigJSON | null>(null);
const [loading, setLoading] = useState(true);
// RemoteFigure line 76-85:
if (!fig || failed) {
  return <div ...>{t.common.chartUnavailable}</div>;
}
- verdict: Both cited files match the claim exactly. ExploreBuilder.tsx line 56–57 initialises fig=null and loading=true. RemoteFigure.tsx line 76–86 has a single guard `if (!fig || failed)` that renders the "chartUnavailable" text for both a real server error and the transient null-during-fetch case — no loading-specific branch exists. The parent (ExploreBuilder line 166) applies `opacity-50` when loading=true, so the message appears at half opacity, but the text and dashed-border "unavailable" styling are still rendered and visible. For the duration of the initial API call (~1 second on a normal connection), a user navigating to the Explore tab sees the error-flavoured notice rather than a neutral skeleton or spinner. The comment in RemoteFigure (line 74–75) even documents that this path is intended for "server fetch failed or render error", confirming the loading case reuses the wrong UI path. The defect is real and reachable.
- severityAdjust: MEDIUM is appropriate. The misleading UX lasts only ~1 second and is softened by opacity-50, but the text is genuinely error-flavoured ("temporarily unavailable") during a normal load. A low severity would undersell the user-confusion risk on slow connections where the delay is longer.

## C16 · MEDIUM · i18n · AuthGate fallback login-error string is hardcoded English, not translated
- source: react-explore-tunable
- file: web/components/explore/AuthGate.tsx:43
- whatWrong: When login() throws an error that is not an AuthError instance (network failure, unexpected exception), the catch block shows the hardcoded English literal 'Sign-in failed. Try again.' regardless of locale. In FR locale, this appears in English only. There is no i18n key for this fallback in either explore.ts or common.ts.
- rootCause: The AuthError path correctly surfaces the backend message (also English from the API, but that is a backend concern). The non-AuthError fallback string was added without a corresponding translation entry.
- evidence: setAuthError(err instanceof AuthError ? err.message : "Sign-in failed. Try again.");
- verdict: Line 43 of /Volumes/ACLMR/jobads-dashboard/web/components/explore/AuthGate.tsx contains `setAuthError(err instanceof AuthError ? err.message : "Sign-in failed. Try again.")`. The string "Sign-in failed. Try again." is rendered directly at line 115 as `{authError}`. A search of both translation dicts confirms there is no corresponding i18n key: explore.ts has no `signInFailed`, `loginError`, or equivalent entry in either the `en` or `fr` block, and common.ts similarly has none. All other user-visible strings in the component go through `t.explore.*` or `t.common.*`. The fallback is reachable whenever `login()` throws something that is not an `AuthError` (network failure, unexpected exception), which is a plausible runtime path. In FR locale the string would appear in English only.
- severityAdjust: 

## C17 · LOW · edge-case · PostingDrawer briefly flashes stale posting content when reopened with a new id
- source: react-explore-tunable
- file: web/components/explore/PostingDrawer.tsx:44–57, 137
- whatWrong: When a user clicks a second row while the drawer is already open, the component stays mounted but id changes. Between the re-render (which shows the new id) and the fetch effect firing (which clears detail and sets loading=true), the drawer header h2 still displays the previous job_title because detail has not yet been reset. The stale title is visible for one frame or until the microtask queue drains.
- rootCause: The data-fetch effect depends on [id]; React runs it after the paint. Resetting detail synchronously to null in a layout effect keyed on id, or deriving the displayed title from a separate variable that is cleared immediately when id changes, would eliminate the flash.
- evidence: <h2 id="drawer-title">
  {detail?.job_title ?? (loading ? t.common.loading : t.explore.drawerPosting)}
</h2>
// detail is only cleared inside useEffect([id]), after the next paint
- verdict: The code at lines 44–57 uses `useEffect` (not `useLayoutEffect`) to reset `detail` to `null`. In React's rendering model, `useEffect` fires after the browser has painted. When `id` changes: React re-renders with new `id` but old `detail` still in state, commits that DOM (paint #1, stale title visible), then runs the effect which calls `setDetail(null)` + `setLoading(true)`, triggering a second committed render (paint #2, shows "Loading…"). The stale `detail?.job_title` at line 137 is therefore present in the committed DOM between the two paints. The described mechanism is architecturally correct. The flash duration is sub-frame under React 18's batching in typical conditions, so it may be imperceptible in practice, but the stale-DOM window is real and the root cause is exactly as stated. Severity LOW is appropriate.
- severityAdjust: LOW is correct. The window is technically real but practically imperceptible under React 18's synchronous flush of effect-triggered state updates before the next browser frame in most scenarios. It is a genuine edge case with negligible UX impact.

## C18 · MEDIUM · i18n · options.ts filter labels are hardcoded English — shown verbatim in FR
- source: frontend-shared-i18n
- file: web/lib/options.ts:3-67
- whatWrong: ALL_GEO ("All Canada"), ALL_OCC ("All occupations"), ALL_IND ("All industries") and every Option label in GEO_OPTIONS, OCC_OPTIONS, and IND_OPTIONS are fixed English strings. FilterSpine passes these directly to the Select component, so French users see English labels in every filter dropdown. The DEFAULTS in useFilters.ts (line 9-12) also key off these English strings, so the active-count logic is locale-independent — not a bug, but the root problem sits in options.ts.
- rootCause: options.ts exports a single set of English labels with no locale parameter. The file was never designed to be locale-aware; translations for the option labels have never been added to any dict file.
- evidence: export const ALL_GEO = "All Canada"; ... { value: ALL_GEO, label: "All Canada" }, ... { value: "AB", label: "Alberta", code: "AB" }
- verdict: The defect is real and reachable. `/Volumes/ACLMR/jobads-dashboard/web/lib/options.ts` exports a single set of English-only `Option[]` arrays (GEO_OPTIONS, OCC_OPTIONS, IND_OPTIONS) with no locale parameter. `FilterSpine.tsx` (line 32/39/46) passes these arrays directly to the `Select` component, which renders `o.label` verbatim into `<option>` elements. The i18n dict at `web/lib/i18n/dict/filter.ts` translates the dropdown header labels (Region/Occupation/Industry) but has no entries for the option items inside the dropdowns — province names like "Alberta" / "British Columbia", NOC group labels like "Management" / "Business & finance", and NAICS sector labels like "Agriculture & forestry" all appear in English regardless of locale. The filter bar is only rendered on the `/explore` route (FilterSpine.tsx line 16 guards `pathname.startsWith("/explore")`), but that route is fully reachable, so a French user on `/explore` sees English labels in all three filter dropdowns. No interception layer (no locale-aware options factory, no translation wrapper) exists anywhere in the codebase.
- severityAdjust: MEDIUM is appropriate. The affected surface is limited to the /explore page filter dropdowns (three selects). The rest of the app (all curated data pages) is unaffected because FilterSpine returns null outside /explore. The defect is a genuine gap in FR coverage but not a data-correctness or security issue.

## C19 · MEDIUM · i18n · ExploreView scope summary falls back to hardcoded "All Canada" in FR
- source: frontend-shared-i18n
- file: web/components/explore/ExploreView.tsx:88-94
- whatWrong: The scopeSummary string is built from labelFor(GEO_OPTIONS, ...) etc. (all English labels) and falls back to the literal string "All Canada" when no filter is active. In FR mode this English string appears in the postings count line ("1,234 offres · All Canada").
- rootCause: labelFor draws from GEO_OPTIONS/OCC_OPTIONS/IND_OPTIONS (English-only) and the fallback string is a hardcoded English literal rather than t.explore (or a shared key).
- evidence: return parts.length ? parts.join(" · ") : "All Canada";
- verdict: The code at /Volumes/ACLMR/jobads-dashboard/web/components/explore/ExploreView.tsx line 93 literally returns the English string "All Canada" when no geo/occ/ind filter is active. This string is then interpolated at line 131 directly next to `t.explore.postings` (which correctly returns "offres" in FR), producing a mixed-language line like "1 234 offres · All Canada" in FR mode. The `GEO_OPTIONS`, `OCC_OPTIONS`, and `IND_OPTIONS` arrays in /Volumes/ACLMR/jobads-dashboard/web/lib/options.ts are English-only with no locale parameter; `labelFor` has no locale variant. There is no "All Canada" key in the FR explore dict (`explore.ts`) or filter dict (`filter.ts`). The bug is reachable: `ExploreView` is rendered inside `AuthGate` after successful login, which is a real user-visible screen for FR users.
- severityAdjust: MEDIUM is appropriate. The defect is visible to any authenticated FR user with no active scope filter, which is likely the default state on first opening the "Find postings" tab. Elevating to HIGH would be an overreach since it is limited to the gated private lookup, not the public site.

## C20 · MEDIUM · i18n · fmtInt, fmtCompact, and fmtPct always format with en-CA locale — wrong decimal/thousands separators in FR
- source: frontend-shared-i18n
- file: web/lib/format.ts:5-27
- whatWrong: Three module-scope formatters are created once at import time with hardcoded "en-CA": NF = new Intl.NumberFormat("en-CA") and NF1 = new Intl.NumberFormat("en-CA", ...). fmtInt, fmtCompact, and fmtPct all use these and accept no locale parameter. In FR mode numbers should use a space for thousands and a comma for decimals (e.g. "1 234" not "1,234"), and percentages should be formatted as "12,5 %" not "12.5%". fmtWage and fmtMonth do accept locale correctly. This inconsistency means KPI values, posting counts, and coverage percentages will be mis-formatted for FR users.
- rootCause: fmtInt/fmtCompact/fmtPct were never given a locale parameter; fmtWage and fmtMonth were. The three FR-incorrect functions are called in KpiTile contexts (app/page.tsx:99,108,127), CoverageBar, and ExploreView.
- evidence: const NF = new Intl.NumberFormat("en-CA");
const NF1 = new Intl.NumberFormat("en-CA", { maximumFractionDigits: 1 });
export function fmtCompact(n: number | null | undefined): string { ... return `${NF1.format(n / 1_000)}k`; }
- verdict: The code at /Volumes/ACLMR/jobads-dashboard/web/lib/format.ts lines 5-6 creates two module-scope Intl.NumberFormat instances hardcoded to "en-CA". fmtInt (line 10-13), fmtCompact (lines 15-20), and fmtPct (lines 22-27) all use these and accept no locale parameter — confirmed by reading the full file. The asymmetry with fmtWage and fmtMonth (lines 29-50) is explicit: those accept a Locale param and call intlLocale() to switch to "fr-CA". The three locale-blind functions are called in FR-visible contexts: page.tsx lines 99/108/117/127 (locale is available at line 35 but not passed), ExploreView.tsx lines 131/207 (locale available at line 29 via useI18n() but not passed), CoverageBar.tsx lines 26/38 (no locale param at all). In FR, "en-CA" formats "1,234" instead of "1 234" (space thousands separator) and "12.5%" instead of "12,5 %" — real user-facing mis-formatting. The defect is real and reachable.
- severityAdjust: MEDIUM is appropriate. The numbers are wrong in FR but not dangerously so — no data is hidden, just mis-formatted. The fix is mechanical (add locale param to three functions and thread it through callers).

## C21 · MEDIUM · i18n · KeyPoints footer note is hardcoded English — not translated in FR
- source: frontend-shared-i18n
- file: web/components/KeyPoints.tsx:22-24
- whatWrong: The disclaimer paragraph at the bottom of every KeyPoints card reads "Descriptive signals only — postings show posted demand, not causes." in all locales. The component accepts no i18n prop and does not call useI18n. French users on the Pulse page see this English-only disclaimer.
- rootCause: KeyPoints was built without i18n support; the footer note was never added to any dict and the component never imports from the provider.
- evidence: <p className="mt-auto pt-4 text-[0.72rem] leading-relaxed text-ink-faint">
  Descriptive signals only — postings show posted demand, not causes.
</p>
- verdict: The hardcoded English disclaimer at /Volumes/ACLMR/jobads-dashboard/web/components/KeyPoints.tsx lines 22-24 is exactly as cited. The component imports nothing from the i18n system and accepts no translation prop for this string. Searching all dict files (common.ts, page-pulse.ts, and 9 others) finds no translation key for "Descriptive signals only" or any equivalent French string. The `keyPointsTitle` is correctly wired through `pulseDict` in page.tsx (line 140: `title={t.keyPointsTitle}`), but the footer note is a raw JSX string literal with no escape hatch. Any French user on the Pulse page will see this English-only disclaimer on every KeyPoints card rendered.
- severityAdjust: 

## C22 · MEDIUM · a11y · TunableFigure year-picker <select> elements lack accessible labels
- source: frontend-shared-i18n
- file: web/components/TunableFigure.tsx:88-119
- whatWrong: In both "base" mode (line 90) and "baseEnd" mode (lines 99-116) the <select> elements for year picking have no <label> element and no aria-label / aria-labelledby attribute. The surrounding <div aria-label={yc.aria}> annotates the container div but browsers do not propagate a div's aria-label to child interactive controls. Screen readers will announce these as unlabelled selects. The visual hint ("Base year", "From", "to") is a plain <span> with no programmatic association.
- rootCause: The year-picker selects were added in the editorial redesign commit without wrapping each <select> in a <label> or giving each a unique aria-label. The parent div's aria-label is not sufficient for individual form controls.
- evidence: <div className="flex items-center gap-1.5" aria-label={yc.aria}>
  <span className={labelCls}>{yc.base}</span>
  <select className={selectCls} value={baseYear} onChange={(e) => setBaseYear(+e.target.value)}>
- verdict: The cited code is present and the defect is real. In TunableFigure.tsx lines 88–119, the three `<select>` elements (base year, from-year, to-year) have no `aria-label`, `aria-labelledby`, or `<label htmlFor>` association. The only annotation is `aria-label={yc.aria}` on the parent `<div>` (lines 88 and 97). Per the WAI-ARIA accessible name computation, a `div`'s `aria-label` is not inherited by descendant form controls — each `<select>` computes its own accessible name independently. The visual `<span>` labels ("Base year", "From", "to") have no programmatic link to the selects. Screen readers will announce these controls as unlabelled. The defect is live in the current code; no fix is present.
- severityAdjust: 

## C23 · LOW · a11y · LocaleToggle group aria-label describes only one direction of the toggle
- source: frontend-shared-i18n
- file: web/components/LocaleToggle.tsx:21-22
- whatWrong: The role="group" container's aria-label is t.common.switchLanguage, which resolves to "Switch to French" (in EN) or "Passer à l'anglais" (in FR). This describes what one button does, not the purpose of the two-button group ("Language toggle" / "Sélecteur de langue"). A screen-reader user in FR mode hears the group named "Passer à l'anglais", which is misleading since one of the two buttons (FR) is already the active choice.
- rootCause: switchLanguage was authored as a unidirectional action label and reused as the group's accessible name. The individual buttons have aria-pressed, so their state is readable, but the group label is semantically wrong.
- evidence: role="group"
aria-label={t.common.switchLanguage}
// common.en.switchLanguage = "Switch to French"
// common.fr.switchLanguage = "Passer à l'anglais"
- verdict: The code at /Volumes/ACLMR/jobads-dashboard/web/components/LocaleToggle.tsx:21-22 is exactly as described. The `role="group"` div carries `aria-label={t.common.switchLanguage}`, which resolves to "Switch to French" (EN) or "Passer à l'anglais" (FR) per /Volumes/ACLMR/jobads-dashboard/web/lib/i18n/dict/common.ts lines 16 and 38. These are unidirectional action phrases, not neutral group names. In FR mode, a screen-reader user hears the group labelled "Passer à l'anglais" even though one of the two contained buttons (FR) is already active (aria-pressed=true). The individual buttons do expose state via aria-pressed and their visible text ("EN"/"FR"), so the user can reconstruct reality, but the group's accessible name is semantically wrong — it names what one button does rather than the purpose of the group. The defect is real and reachable in the current code.
- severityAdjust: LOW is appropriate. The mislabelled group name is a genuine a11y error (WCAG 1.3.1 / 4.1.2), but individual button state remains readable via aria-pressed, so the impact is confusion rather than complete inaccessibility. A correct fix would be a static "Language / Langue" bilingual string or a dedicated languageSelector key used only on the group.

## C24 · LOW · consistency · page-skills.ts and page-method.ts dicts missing "as const" — weaker TypeScript narrowing
- source: frontend-shared-i18n
- file: web/lib/i18n/dict/page-skills.ts:200
- whatWrong: skillsDict (page-skills.ts) and methodDict (page-method.ts) are declared without "as const" at the closing brace, unlike every other dict in web/lib/i18n/dict/ (common, explore, filter, footer, nav, page-geography, page-industries, page-occupations, page-developers, page-pulse, page-wages — all end with "} as const;"). Without "as const", string values are typed as string rather than as their literal types, which removes the safety net that catches EN/FR key parity mismatches at compile time and weakens auto-complete in editors.
- rootCause: These two dicts were authored (or edited) without the "as const" suffix that all peer dicts carry.
- evidence: // page-skills.ts last line:
};
// page-method.ts last line:
};
// vs page-geography.ts:
} as const;
- verdict: Verified directly: `grep -L "as const" web/lib/i18n/dict/*.ts` returns exactly page-skills.ts and page-method.ts. All 11 other dict files end with `} as const;`. Both files use a bare `export const skillsDict = {` / `export const methodDict = {` declaration with no trailing `as const`. The omission is real and in the current code on branch redesign2. The "safety net for EN/FR parity" framing is somewhat overstated — parity checking depends on how consumers are typed — but the TypeScript narrowing difference is genuine: without `as const`, every string value is widened to `string` rather than its literal type, weakening editor autocomplete and any `typeof`-based inference downstream.
- severityAdjust: LOW is appropriate. The missing `as const` causes no runtime error and no compile-time failure in the current codebase (tsc passes clean per memory notes), but it is an inconsistency with every peer dict and a real, reachable gap in type precision.

## C25 · MEDIUM · i18n · All error.tsx boundaries hardcode English — FR users see English errors
- source: frontend-pages
- file: web/app/error.tsx:7-17
- whatWrong: The root error boundary and the two per-route error boundaries (developers/error.tsx, explore/error.tsx) hardcode English strings: "Something went wrong", "This view couldn't load", "Retry", and the dev-targeted note "Confirm the API is running on port 8530". A French-locale user who hits a client-side crash or hydration error sees entirely English text. The root and explore error.tsx also expose a local-dev instruction (port 8530) that is meaningless to end users in the Render-hosted production deployment.
- rootCause: The error.tsx components are "use client" and rendered within the root layout, so the I18nProvider from layout.tsx IS their parent and useI18n() would work — but the components never call it. The common dict already has FR translations for somethingWrong, apiDownTitle, apiDownBody, and retry (common.ts lines 40-44); they are simply not wired up.
- evidence: web/app/error.tsx:7 `<div className="eyebrow mb-2">Something went wrong</div>` | :8 `<h1>This view couldn't load</h1>` | :10 `Confirm the API is running on port 8530` | :17 `Retry` — identical pattern in web/app/explore/error.tsx and web/app/developers/error.tsx with no useI18n() call.
- verdict: All three error boundary files are verified to hardcode English strings with no useI18n() call. The root error.tsx (lines 7, 8, 10, 17) and explore/error.tsx (lines 7, 8, 10, 17) contain the exact hardcoded strings cited. developers/error.tsx also hardcodes English but its body text differs from the claim — it says "An unexpected error occurred. Please try again." not the port-8530 text. The FR translations for all needed keys (somethingWrong, apiDownTitle, apiDownBody, retry) exist in common.ts lines 40-44. The I18nProvider wraps root layout children (layout.tsx:64), so useI18n() is available to client components nested under it. The per-route error boundaries (explore, developers) are scoped inside the root layout and would have context available. The root error.tsx has a caveat: if a crash occurs during the I18nProvider's own render, the context would be absent — but that is an edge case and does not make the bug unreachable in the general case. The core defect (English hardcoded, translations exist but unwired) is real and reachable.
- severityAdjust: The port-8530 production-exposure sub-claim applies to root and explore error.tsx but not developers/error.tsx, which uses generic text. Otherwise severity MEDIUM is appropriate: affects FR users on client crashes, translations already exist in the dict, fix is straightforward.

## C26 · MEDIUM · a11y · ExploreTabs ARIA tabs pattern incomplete — tabpanel role and association missing
- source: frontend-pages
- file: web/components/explore/ExploreTabs.tsx:21-44
- whatWrong: The tablist container and button elements follow the WAI-ARIA tabs pattern (role="tablist", role="tab", aria-selected), but the content area rendered at line 44 — `{tab === "build" ? <ExploreBuilder .../> : <AuthGate />}` — has no role="tabpanel", no id, and no aria-labelledby linking it to the active tab button. The tab buttons themselves also have no id or aria-controls attributes. Keyboard users navigating with Tab or arrow keys cannot associate the content panel with the selected tab, and screen readers cannot announce the panel as a tabpanel.
- rootCause: New component added in HEAD commit (653edd01) did not implement the full WAI-ARIA tabs pattern. Only the tablist/tab half was wired; the tabpanel half was omitted.
- evidence: web/components/explore/ExploreTabs.tsx:21 `<div role="tablist" aria-label={t.explore.eyebrow} ...>` | :28 `role="tab"` on button | :44 `{tab === "build" ? <ExploreBuilder .../> : <AuthGate />}` — no role="tabpanel", no id, no aria-labelledby on the content wrapper. Confirmed: `grep -n 'id=|aria-controls|aria-labelledby' ExploreTabs.tsx` returns nothing.
- verdict: Read /Volumes/ACLMR/jobads-dashboard/web/components/explore/ExploreTabs.tsx in full (47 lines). The tablist and tab roles are present (lines 21, 28-29) with aria-selected, but there is no id on any button, no aria-controls, and the content at line 44 is a bare conditional expression with no wrapping element — no role="tabpanel", no id, no aria-labelledby. The WAI-ARIA tabs pattern requires all six of those attributes (id+aria-controls on each tab, role="tabpanel"+id+aria-labelledby on each panel). The current file has none of the panel-side attributes and none of the cross-linking attributes. The defect is real, reachable, and not fixed in the current HEAD of the file.
- severityAdjust: 

## C27 · MEDIUM · data-correctness · ExploreBuilder allows startYear == endYear: two_year measure silently shows all-zero chart
- source: frontend-pages
- file: web/components/explore/ExploreBuilder.tsx:134
- whatWrong: The From-year select uses `Math.min(+e.target.value, endYear)` (line 134), allowing startYear to equal endYear. When measure=two_year and startYear==endYear, the backend's _bar_two_year computes (end−base)/base * 100 where base and end are the same year's postings, giving 0.0% for every category. The resulting bar chart looks valid (all bars drawn) but is meaningless. There is no backend gate for lo_year==hi_year and no frontend constraint preventing this. By contrast, TunableFigure correctly enforces a minimum gap of 1 using `Math.min(endYear - 1)` / `Math.max(baseYear + 1)`.
- rootCause: ExploreBuilder year-range constraints were written with `Math.min(endYear)` / `Math.max(startYear)` rather than the `endYear−1` / `baseYear+1` guards used in TunableFigure, so equality is not prevented. The backend _bar_two_year (explore.py:299) computes a % change between lo_year and hi_year without guarding lo_year==hi_year.
- evidence: web/components/explore/ExploreBuilder.tsx:134 `onChange={(e) => setStartYear(Math.min(+e.target.value, endYear))}` (allows equality) vs web/components/TunableFigure.tsx:102 `onChange={(e) => setBaseYear(Math.min(+e.target.value, endYear - 1))}` (enforces gap). api/explore.py:309 `out["value"] = ((out["end"] - out["base"]) / out["base"] * 100).round(1)` — yields 0 when lo_year==hi_year.
- verdict: All three cited code points check out exactly as claimed.

Frontend (ExploreBuilder.tsx:134,145): the From select uses `Math.min(+e.target.value, endYear)` and the To select uses `Math.max(+e.target.value, startYear)`, so startYear == endYear is a reachable state — both selects can land on the same value simultaneously.

Contrast (TunableFigure.tsx:102,112): uses `Math.min(+e.target.value, endYear - 1)` / `Math.max(+e.target.value, baseYear + 1)`, which enforces a minimum gap of 1 and makes equality unreachable. The inconsistency is real and structural.

Backend (explore.py:299–311, _bar_two_year): when lo_year == hi_year, `base` and `end` both aggregate the same calendar year's postings for each category, so `(end - base) / base * 100` evaluates to exactly 0.0 for every row that survives the MIN_SAMPLE filter. The resulting DataFrame is non-empty (valid-looking) and returns a well-formed bar chart with all bars at 0%. There is no guard for lo_year == hi_year anywhere in build_explore_figure, _build_bar, or _bar_two_year itself.

The defect is reachable in the current code on any browser: a user who sets From and To to the same year and picks measure=two_year gets a silent all-zero chart with no warning.
- severityAdjust: MEDIUM is appropriate. The chart looks valid (no error, bars are drawn) but carries meaningless data, which is a data-honesty problem. It is not HIGH because it requires a specific user action (matching years) and only affects the two_year measure in the Explore builder.

## C28 · MEDIUM · data-correctness · Explore: dim=time + measure=two_year draws postings level but y-axis says "change A→B"
- source: frontend-pages
- file: api/explore.py:464-467
- whatWrong: When the Explore builder uses breakdown=Over time and measure=Two-year change, _build_time (line 464) falls into the `else` branch and assigns `x, y = df["month"], df["postings_total"]` — raw monthly posting counts. However, _measure_axis at line 467 then labels the y-axis "change {start_year}→{end_year}" (or the FR equivalent "variation {start_year}→{end_year}"). The chart title and y-axis claim to show a two-year change but the actual y-values are raw postings. This is a data honesty violation: the reader sees a label promising a change metric but gets an absolute level.
- rootCause: The time dim path does not implement a meaningful two-year change for a line (a point-to-point % change would be a single number, not a series). The code comment acknowledges this ("show the level series over the window") but the axis label from _measure_axis is still applied unconditionally, causing the mismatch.
- evidence: api/explore.py:464-465 `else:  # two_year on a line: show the level series over the window` / `x, y = df["month"], df["postings_total"]` followed by :467 `title = _measure_axis(measure, locale, start_year, end_year)` which at :482-483 returns `_t(locale, "two_year", a=start_year, b=end_year)` → "change {start}→{end}" label on a postings-level y-axis.
- verdict: The code at /Volumes/ACLMR/jobads-dashboard/api/explore.py confirms the defect exactly. Line 464-465: the `else` branch (reached when measure=="two_year" and dim=="time") assigns `x, y = df["month"], df["postings_total"]` — raw monthly posting counts. Line 467 then calls `_measure_axis(measure, locale, start_year, end_year)`, which at lines 482-483 returns `_t(locale, "two_year", a=start_year, b=end_year)`. The locale table at line 68 maps that to `"change {a}→{b}"` (EN) or `"variation {a}→{b}"` (FR). Line 477 sets this string as `yaxis_title`. The result is a chart whose y-axis label reads "change YYYY→YYYY" while the plotted values are raw postings levels — a genuine data-honesty mismatch that is reachable whenever a user picks dim=Over time + measure=Two-year change in the Explore builder.
- severityAdjust: 

## C29 · LOW · consistency · explore/page.tsx metadata not typed as Metadata — TypeScript cannot catch field errors
- source: frontend-pages
- file: web/app/explore/page.tsx:7
- whatWrong: The explore page exports `export const metadata = { title: "Explore", description: "..." }` without the `: Metadata` type annotation from next. Every other page (occupations, geography, skills, industries, wages, method, pulse) uses `export const metadata: Metadata = {...}` with the import. Without the type, TypeScript will not catch typos in field names (e.g. `openGraph` misspelled) or unknown fields silently dropped by Next.js. The explore page also does not import `Metadata` from next at all.
- rootCause: The explore page was written without the type annotation, likely because it was added quickly as a new route in the HEAD commit. The pattern `export const metadata: Metadata` is consistently used elsewhere.
- evidence: web/app/explore/page.tsx:7 `export const metadata = {` — no `: Metadata` annotation, no `import type { Metadata } from "next"`. Compare: web/app/occupations/page.tsx:13 `export const metadata: Metadata = {` with `import type { Metadata } from "next"` at line 9.
- verdict: Line 7 of /Volumes/ACLMR/jobads-dashboard/web/app/explore/page.tsx is exactly `export const metadata = {` with no `: Metadata` annotation and no `import type { Metadata } from "next"` anywhere in the file. The occupations page (and the other pages the candidate cites) all use `import type { Metadata } from "next"` plus `export const metadata: Metadata = {`. The inconsistency is real and reachable: any typo in a metadata field on the explore page (e.g. `tittle`, a misspelled `openGraph` key) would pass `tsc` silently instead of producing a type error.
- severityAdjust: LOW is appropriate — there is no runtime breakage, only reduced type-safety. The metadata object is small and has no complex fields currently, so the practical exposure is minimal.

## C30 · LOW · edge-case · ExploreBuilder shows "chart temporarily unavailable" during normal initial fetch
- source: frontend-pages
- file: web/components/explore/ExploreBuilder.tsx:56-57
- whatWrong: ExploreBuilder initialises with `fig=null` and `loading=true`. RemoteFigure at line 76 renders the "This chart is temporarily unavailable" placeholder whenever `fig` is null, regardless of whether a fetch is in-flight. On the Explore tab's first render, before the initial API call completes, the user sees the error placeholder (dimmed to 50% opacity) instead of a neutral loading state. The message "temporarily unavailable" implies a backend failure, which is false during normal first-load.
- rootCause: Unlike TunableFigure, which is always given a server-rendered initialFig, ExploreBuilder does its first fetch client-side. RemoteFigure has no concept of "loading" vs "failed" — it treats fig=null as a failure. No separate loading skeleton or spinner is shown during the initial fetch.
- evidence: web/components/explore/ExploreBuilder.tsx:56-57 `const [fig, setFig] = useState<FigJSON | null>(null)` / `const [loading, setLoading] = useState(true)`. web/components/RemoteFigure.tsx:76 `if (!fig || failed) { ... {t.common.chartUnavailable} ... }` — triggers on fig=null with no loading guard.
- verdict: Both cited files match the claim exactly. ExploreBuilder.tsx:56-57 initialises `fig=null` and `loading=true`. On first render, `RemoteFigure` receives `fig=null` and immediately hits the `if (!fig || failed)` branch at line 76, rendering the "This chart is temporarily unavailable" text. The parent wrapper at line 166 applies `opacity-50` while `loading` is true, but `loading` is never passed to `RemoteFigure` — the component has no loading prop and no concept of "in-flight vs failed". The unavailable message is real and visible (dimmed, but present) during every initial fetch. No spinner or neutral skeleton suppresses it. The label "temporarily unavailable" implies a backend failure, which is false during a normal first load. The defect is real and reachable on every page visit to the Explore tab.
- severityAdjust: LOW is defensible — the 50% opacity does partially signal loading and the window is short. However, the misleading error label makes this more of a LOW-MED issue, since a slow API response means users sit looking at what appears to be a failure message.

## C31 · CRAFT P2 · U01 (persists) — ad-hoc type scale: 21 distinct arbitrary rem sizes bypass the named scale
- source: ux-curated
- standard: Typography — one consistent type scale, not many ad-hoc arbitrary values
- screen: All pages and components (KpiTile, Figure, Brand, Footer, FilterSpine, ExploreBuilder, CoverageBar, method/page, etc.)
- file: web/components/KpiTile.tsx, web/components/Figure.tsx, web/components/Brand.tsx, web/components/CoverageBar.tsx, web/app/globals.css:152-193
- whyOff: The named semantic scale (eyebrow 0.72rem, h-display clamp, h-section clamp, h-card 0.95rem, lede clamp) is coherent, but every body/label/caption span uses its own arbitrary rem: 0.62, 0.68, 0.70, 0.72, 0.74, 0.76, 0.78, 0.80, 0.82, 0.85, 0.86, 0.88, 0.90, 0.92, 0.95, 1.02, 1.05, 1.08, 1.10, 1.50, 2.05 — 21 values total across web/components/ and web/app/ (verified by grep). Many pairs (0.85 vs 0.86, 0.7 vs 0.72) are indistinguishable at runtime and create unsystematic rhythm. This has not changed since U01 was first filed.
- fixHint: Collapse small-text body/label/caption to three tokenized steps in globals.css (e.g. --text-xs ~0.72rem, --text-sm ~0.82rem, --text-base ~0.95rem) exposed as Tailwind classes (text-xs/sm/base or via @theme). Replace all 21 arbitrary values with these tokens. The named heading scale already sets the right precedent.

## C32 · CRAFT P2 · U03 (persists, partially improved) — KPI strip delta convention still inconsistent across the four tiles
- source: ux-curated
- standard: Consistency / hierarchy — same grammar for the same concept in a repeated component row
- screen: Home page KPI strip — four tiles (Demand Index, Active Postings, YoY, Median Wage)
- file: web/app/page.tsx:97-130, web/components/KpiTile.tsx:64-76
- whyOff: Tile 1 (Demand Index) and Tile 2 (Postings MoM) render a bottom ▲/▼ delta chip in --pos/--neg color. Tile 3 (YoY) now uses valueTrend: the headline number itself is colored and prefixed with a large ▲/▼ glyph — a different grammar (inline colored value) with no secondary chip. Tile 4 (Wage) has no trend signal at all. Three different affordances for 'direction of change' in a four-column strip reads as unfinished. Additionally, Tile 1's delta chip renders baselineGap (index points, e.g. −8.3) with a hardcoded % suffix (KpiTile.tsx:73 `{Math.abs(delta).toFixed(1)}%`), which is misleading — it is 8.3 index points below 100, not a percentage change — though the deltaLabel 'vs baseline' partially mitigates this.
- fixHint: Standardize all four tiles to one grammar: either (a) keep the bottom chip for all tiles that have a direction signal and give Tile 3 a matching chip (not a colored headline), or (b) use the valueTrend (colored headline) pattern uniformly and drop the separate chip. For Tile 1's delta, either label the unit explicitly ('−8.3 pts') or rename deltaLabel to make index-point semantics clear.

## C33 · CRAFT P2 · U04 (persists) — chart axis/legend font still falls back to system-ui in the browser
- source: ux-curated
- standard: Consistency — end-to-end type system; chart text matching surrounding card text
- screen: All Plotly charts across every page (axis labels, tick labels, legends, hover labels)
- file: src/jobads_dashboard/viz/theme.py:117
- whyOff: The prior finding was 'theme.py requests Inter, but app loads only PT Sans.' theme.py now sets `_FONT = "var(--font-pt-sans), ui-sans-serif, system-ui, sans-serif"`, which is an improvement in intent. However, Plotly.js writes this string verbatim into SVG `font-family` attributes on rendered text elements. CSS custom properties (`var(--font-pt-sans)`) are not resolved by the SVG rendering engine — they are only resolved in CSS cascade context, not in SVG presentation attributes set via JavaScript. There is no JS-side resolution (no `getComputedStyle` call, no font-family substitution) anywhere in web/lib/plotly/. The browser therefore falls through to `ui-sans-serif` / `system-ui` (Inter on macOS, Roboto on Android), which is visually distinct from the surrounding PT Sans UI text. Charts and their cards still render in different typefaces.
- fixHint: Resolve the CSS variable to a real font-family string before it reaches Plotly. Two options: (1) read `getComputedStyle(document.body).fontFamily` in RemoteFigure.tsx after mount and patch `fig.layout.font.family` before calling `newPlot`; (2) expose a JS-side constant that mirrors the Python `_FONT` with the actual font name resolved (e.g. `export const CHART_FONT = "PT Sans, ui-sans-serif, system-ui, sans-serif"`), and use it in `baseConfig` or a layout patch in RemoteFigure.

## C34 · CRAFT P3 · U08 (partially improved) — brand tagline still at the edge of comfortable legibility
- source: ux-curated
- standard: Typography / legibility — minimum practical body text size ≥ 0.75rem (~12px)
- screen: Top navigation bar — 'LABOUR MARKET' tagline below the ACLMR wordmark in Brand.tsx
- file: web/components/Brand.tsx:15
- whyOff: The tagline was at 0.62rem in the prior audit. It has been bumped to 0.7rem (Brand.tsx:15 `text-[0.7rem]`). At 0.7rem (~11.2px at 16px base) on a cream canvas, the all-caps tracking helps but the size is still below the practical 12px legibility floor for body-weight text. It is especially strained on mid-range screens and with the ink-soft color (`--ink-soft: #5d6b74`). The prior fix improved it but did not reach the recommended threshold.
- fixHint: Raise to 0.75rem (12px) or 0.72rem minimum. At all-caps + bold + tracking-[0.04em] the optical weight is acceptable at 0.72rem with ink-soft — raise to that at minimum, or swap ink-soft for a slightly darker token on this small element.

## C35 · CRAFT P2 · NEW — TunableFigure year-picker selects have no programmatic label association for screen readers
- source: ux-curated
- standard: Accessibility — WCAG 2.1 SC 1.3.1 (Info and Relationships): form controls must have programmatically associated labels
- screen: Occupations, Skills, Geography, Industries pages — every TunableFigure year picker (11 select controls total across the app)
- file: web/components/TunableFigure.tsx:82-118
- whyOff: The year picker wraps the visible 'Base'/'From'/'To' span labels and select controls in a `<div aria-label={yc.aria}>` (a non-interactive element, so `aria-label` on it is not read as a group label by most AT). The visible `<span>` labels (labelCls) have no `id` and the `<select>` controls have no `aria-label` or `aria-labelledby` — they are bare comboboxes in the AT tree. A screen reader user hears an anonymous select with numeric options but no context. The ExploreBuilder year selects ARE correctly labeled (`aria-label={b.from}` / `aria-label={b.to}` on the select element itself at ExploreBuilder.tsx:132,142), making this a TunableFigure-specific gap.
- fixHint: Add `aria-label` directly on each `<select>` element in TunableFigure.tsx (mode='base': `aria-label={yc.base}`; mode='baseEnd': `aria-label={yc.from}` and `aria-label={yc.to}`). Alternatively convert `<span>` labels to `<label>` elements with `htmlFor` matching a generated id on the corresponding select, matching the pattern used in the Select.tsx component.

## C36 · CRAFT P2 · NEW — i18n leak: FilterSpine sentinel option values and occupations/industries option labels hardcoded in English
- source: ux-curated
- standard: Internationalisation — UI strings must be localised for all supported locales
- screen: Explore page (FilterSpine filter dropdowns + Explore builder chart labels) in FR locale
- file: web/lib/options.ts:3-5, 11-73 (ALL_GEO / ALL_OCC / ALL_IND constants and option labels)
- whyOff: options.ts exports `ALL_GEO = 'All Canada'`, `ALL_OCC = 'All occupations'`, `ALL_IND = 'All industries'` as hardcoded English strings. These are used both as API sentinel values (which must remain English to match the backend) and as display labels in FilterSpine's Select components. In FR, the FilterSpine shows 'All Canada / All occupations / All industries' in English. The OCC_OPTIONS and IND_OPTIONS labels ('Business & finance', 'Sales & service', etc.) are also English-only. This affects the Explore page FilterSpine and the occupations treemap short labels (which come from the same code|label split in the Python backend). The live capture confirms this: items 2 and 3 in the candidate findings.
- fixHint: Separate API sentinel values from display labels. Keep ALL_GEO/ALL_OCC/ALL_IND as the API-facing strings but add a localised display label lookup function (e.g. `geoDisplayLabel(locale)` → 'Tout le Canada'). Move option label arrays into the i18n dict or add a locale parameter to a factory function. For the backend category labels appearing in chart axes, the Python _pretty() function in explore.py needs a FR label map for NOC and NAICS groups.

## C37 · CRAFT P3 · NEW — CMA bar chart uses noisy province-coded categorical color instead of a single data dimension
- source: ux-curated
- standard: Data visualisation honesty + perceptual clarity — encode only what aids the reader's task; avoid color noise
- screen: Geography page — 'biggest metropolitan labour markets' CMA bar chart
- file: src/jobads_dashboard/viz/figures/geography.py:129-138
- whyOff: The CMA horizontal bar chart encodes province via bar color using a hardcoded 9-color mini palette derived from a sorted zip of province names (geography.py:131-133). The primary data task is comparing metropolitan market sizes (bar length). Province membership is secondary context. With up to 9 colors active simultaneously across 18 bars, the color encoding competes for attention and cannot be preattentively decoded without a legend. The palette is not the app's CVD-safe COLORWAY from theme.py; it mixes SEQUENTIAL midpoints, BRAND orange, and raw hex strings (#345961, #7b6b8d, etc.) creating visual noise. Additionally, two provinces can share the same stripped 'city' label ('Rural area not in a CMA/CA') making bars of identical color appear duplicated.
- fixHint: Use a single neutral bar color (e.g. CONTEXT or teal) and encode province as a secondary label suffix on the y-axis tick (e.g. 'Toronto · ON') rather than as color. If province grouping is desired, use a single categorical facet or a subtitle annotation. Remove the province-color palette and use the existing COLORWAY only when province IS the primary breakdown axis.

## C38 · CRAFT P3 · NEW — ExploreBuilder chart area uses semantic <figure> without a <figcaption>
- source: ux-curated
- standard: HTML semantics / accessibility — <figure> elements must have an associated <figcaption>
- screen: Explore page — 'Build a chart' tab chart output area
- file: web/components/explore/ExploreBuilder.tsx:155-169
- whyOff: ExploreBuilder wraps the output chart in `<figure className='card card-pad flex flex-col'>` (line 155) with no `<figcaption>`. The chart title comes from the Plotly figure JSON (rendered inside the SVG), which is not accessible to AT as a caption. The inner RemoteFigure receives an `ariaLabel` prop (b.aria, a generic 'Explore chart' string), so there is a basic accessible name, but no visible or programmatic caption connecting the figure to its meaning. Every curated Figure.tsx instance has a proper `<figcaption>` with the finding-first title; the Explore builder is the only exception.
- fixHint: Add a `<figcaption>` inside the ExploreBuilder figure element, rendered from the selected dim and measure labels (e.g. 'Postings by occupation, 2016–2025'). This can be built from `b.dims[effectiveDim]` and `b.measures[measure]` which are already available in scope.

## C39 · CRAFT P3 · NEW — KeyPoints panel has a hardcoded English disclaimer that leaks into FR
- source: ux-curated
- standard: Internationalisation — all visible user-facing strings must be localised
- screen: Home page — 'What stands out' key-points panel (beside demand ribbon chart)
- file: web/components/KeyPoints.tsx:23
- whyOff: KeyPoints.tsx line 23 renders the string 'Descriptive signals only — postings show posted demand, not causes.' as a hardcoded English literal with no i18n lookup. In FR, this disclaimer appears in English below the French key-points bullets, mixing languages in the same card.
- fixHint: Move this disclaimer into the i18n common dict (e.g. `t.common.descriptiveDisclaimer`) and pass it as a prop or read it from the i18n context in KeyPoints.tsx. Mirror the FR translation in the common dict.

## C40 · CRAFT P2 · FilterSpine label says 'Across the dashboard' but only drives Explore
- source: ux-explore-interactive
- standard: Content accuracy / progressive disclosure — controls must describe their actual scope, not a broader scope they do not have
- screen: Explore page — FilterSpine sticky bar, eyebrow + scope label
- file: web/lib/i18n/dict/filter.ts:5 + web/components/FilterSpine.tsx:16
- whyOff: FilterSpine only renders on /explore routes, and its three selects scope only the builder chart and the Find Postings table — they have zero effect on curated charts on other pages. The label 'Across the dashboard' / 'Sur tout le tableau de bord' is factually wrong and leads users to expect cross-page filter propagation that does not exist.
- fixHint: Change scope copy to something like 'Explore scope' / 'Portée de l'exploration' or 'Filters for this page' / 'Filtres pour cette page' in both en and fr blocks of filter.ts. Also tighten the explore.ts lede which says 'Both use the same region, occupation and industry filters above' — the framing is accurate but can be made more explicit that these filters are local to this page.

## C41 · CRAFT P1 · TunableFigure year-picker selects have no accessible name
- source: ux-explore-interactive
- standard: WCAG 2.1 SC 4.1.2 (Name, Role, Value) — every interactive control must have a programmatically determinable name
- screen: Occupations, Skills, Geography, Industries pages — TunableFigure inline year picker (base-year mode and from/to mode)
- file: web/components/TunableFigure.tsx:88-118
- whyOff: The visible labels ('Base year', 'From', 'to') are plain sibling <span> nodes — not <label for=...> and not referenced via aria-labelledby on the <select>. The wrapper <div aria-label={yc.aria}> has no ARIA role so screen readers discard its label. Each <select> therefore has no accessible name and is announced bare as 'combobox'. This is the exact defect the live-capture noted (item 1). ExploreBuilder solves it correctly with aria-label on each <select> directly.
- fixHint: Add aria-label={yc.base} to the base-year <select> (TunableFigure.tsx:90). For the from/to pair add aria-label={yc.from} to the first <select> (line 99) and aria-label={yc.to} to the second (line 109) — same pattern ExploreBuilder already uses at lines 131 and 141.

## C42 · CRAFT P2 · ExploreTabs tablist missing arrow-key navigation (ARIA tab pattern)
- source: ux-explore-interactive
- standard: ARIA Authoring Practices Guide — Tab widget pattern requires roving tabindex with ArrowLeft/ArrowRight to move between tabs; Tab key must leave the tablist, not cycle within it
- screen: Explore page — 'Build a chart' / 'Find postings' tab switcher
- file: web/components/explore/ExploreTabs.tsx:22-41
- whyOff: The tablist has role='tablist' and each button has role='tab' + aria-selected, but there is no onKeyDown handler. Keyboard users must Tab to reach the second tab instead of using ArrowRight, which breaks the expected pattern and traps tab-stop focus in the tablist longer than expected. MapToggle (MapToggle.tsx:30-43) implements the roving-tabindex pattern correctly and is the template to follow.
- fixHint: Add an onKeyDown handler to each tab button (or to the tablist div) that handles ArrowLeft/ArrowRight to move focus between tabs and sets tabIndex={active ? 0 : -1} on each button per the roving-tabindex pattern. Mirror MapToggle.tsx lines 30-43 and the Home/End key support.

## C43 · CRAFT P2 · ExploreBuilder shows 'chart unavailable' error UI during normal initial load
- source: ux-explore-interactive
- standard: Nielsen heuristic 1 (visibility of system status) — loading states should be distinct from error states; a normal fetch must not look like a failure
- screen: Explore page — Build a chart tab, chart area on first render
- file: web/components/ExploreBuilder.tsx:56,166-168 + web/components/RemoteFigure.tsx:76-87
- whyOff: ExploreBuilder initialises fig={null} and loading=true. RemoteFigure renders its error fallback ('This chart is temporarily unavailable') whenever fig is null — regardless of whether a fetch is in flight. The result is that on page load the chart area briefly shows a dashed-border error box before the first figure arrives. The opacity-50 applied to that same error box during loading further muddies the state: a dimmed error notice reads as a degraded failure, not a normal load.
- fixHint: Pass a loading prop to RemoteFigure, or inline a skeleton/spinner in the ExploreBuilder chart area when loading && !fig. The simplest fix: render a height-matched placeholder div ('Loading…' or an animated shimmer) when loading is true and fig is null, and only show RemoteFigure once the first fig arrives or an actual error occurs.

## C44 · CRAFT P2 · Download CSV button can download stale data silently while new chart loads
- source: ux-explore-interactive
- standard: Nielsen heuristic 1 (visibility of system status) + data honesty — a download action should reflect the currently displayed data, not a previous state
- screen: Explore page — Build a chart tab, Download CSV button
- file: web/components/ExploreBuilder.tsx:56-58,106,157-164
- whyOff: When the user changes dim, measure, or year and a new fetch starts, fig is not reset to null — only loading is set to true. hasTrace is computed from the previous fig's trace, so the download button stays enabled. If the user clicks Download during the refetch they receive a CSV for the old chart, not the one being loaded. There is no loading indicator on the button and no disabled state during in-flight requests.
- fixHint: Disable the download button while loading is true (change the disabled condition from !hasTrace to !hasTrace || loading). Optionally reset fig to null on each parameter change before the fetch resolves — but simply adding loading to the disabled guard is the minimal safe fix.

## C45 · CRAFT P2 · U05 confirmed: FilterSpine sits above the page hero, outside <main>
- source: ux-explore-interactive
- standard: Consistent page template / information hierarchy — the shared hero pattern (eyebrow, headline, lede) should introduce the page before utility chrome appears
- screen: Explore page — full-page layout, FilterSpine sticky bar vs. hero section
- file: web/app/layout.tsx:72-75 + web/app/explore/page.tsx:34-39
- whyOff: layout.tsx renders FilterSpine between TopNav and <main>, so on the Explore page the sticky filter bar appears before the hero section (eyebrow 'Explore' + 'Explore the data your way' headline + lede). The hero is the first element inside <main>, which the filter bar visually precedes. This diverges from every other data page where the hero is the first thing the user sees. The comment in page.tsx ('matching every other data page — U05') acknowledges the intent but the layout ordering defeats it.
- fixHint: Move FilterSpine inside the Explore page below the hero section (inside <main>, after the hero <section>), removing it from the global layout shell. FilterSpine already conditionally renders only on /explore, so the change to layout.tsx is just removing it from there and placing it at the top of the ExploreTabs container or at the top of the page below the hero <section>.

## C46 · CRAFT P3 · Year-picker 'to' connector is invisible to screen readers and has no semantic grouping
- source: ux-explore-interactive
- standard: WCAG 2.1 SC 1.3.1 — related controls should be grouped with a <fieldset>/<legend> or equivalent to convey the range relationship
- screen: Explore page — Build a chart tab, from/to year range control; also TunableFigure from/to picker
- file: web/components/ExploreBuilder.tsx:127-152 + web/components/TunableFigure.tsx:97-119
- whyOff: The two year selects (start/end) are presented as a visual range with a 'to' connector span, but no <fieldset> or role='group' with a legend/aria-label wraps them. A screen reader encounters two separate selects ('From' and 'to') with no indication they form a date range pair. The ExploreBuilder wraps them in a <div className='flex flex-col gap-1'> with a plain <span> label, which carries no semantic grouping.
- fixHint: Wrap both selects and the connector span in a <fieldset> with a <legend className='sr-only'>Year range</legend> (or role='group' aria-label='Year range'). This makes the pairing explicit to AT without any visual change.

## C47 · CRAFT P3 · AuthGate 'checking' and 'error' phases lack visual structure matching the card
- source: ux-explore-interactive
- standard: Consistency / Nielsen heuristic 4 — all non-open gate phases should have visual parity; a bare centered text row for 'checking' is not card-consistent with locked/unconfigured
- screen: Explore page — Find postings tab, AuthGate during checking and error phases
- file: web/components/explore/AuthGate.tsx:58-63,97
- whyOff: The 'checking' phase renders a bare centered text row (py-24, no card). The 'error' phase renders inside the card alongside the PixelTiles header but with no retry affordance. The 'locked' and 'unconfigured' phases both render inside the card with proper structure. The inconsistency means the checking phase looks like empty space and the error phase offers no recovery path.
- fixHint: Wrap the checking state in the same mx-auto max-w-md card shell used by other phases, with the PixelTiles + eyebrow header and a spinner or animated ellipsis. Add a Retry button to the error phase that re-runs the authStatus() check.

## C48 · CRAFT P2 · ExploreView scopeSummary 'All Canada' is hardcoded English in FR locale
- source: ux-explore-interactive
- standard: i18n completeness — all user-visible strings must be locale-aware
- screen: Explore page — Find postings tab, posting count summary line ('N postings · All Canada')
- file: web/components/explore/ExploreView.tsx:93
- whyOff: When no scope filters are active the summary line falls back to the hardcoded string 'All Canada' (line 93). This string is never passed through the i18n dict, so FR users see 'N offres · All Canada'. The filter sentinel labels (All Canada / All occupations / All industries) in options.ts are likewise hardcoded English, as the live-capture confirmed (item 2).
- fixHint: Move the 'All Canada' fallback into the i18n dict (e.g. t.filter.allCanada or t.explore.allCanada) and translate in both locales. The same fix applies to the sentinel option labels in options.ts — drive them from the dict or from a locale-aware options factory.

