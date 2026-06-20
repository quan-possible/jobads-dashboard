# Fix spec — 2026-06-20 deep audit

How to fix or refine **every confirmed item** — defects (`S`/`L`) and craft (`U`) —
keyed by the IDs in [`findings.md`](findings.md) and [`ux-audit.md`](ux-audit.md).
Each entry: current code (re-read and confirmed present at audit time), the change,
ordered steps, risk/regression, and how to verify. This is documentation only — **no
code was changed**. Apply in the order set by [`remediation-plan.md`](remediation-plan.md).

Line numbers are as of audit time (`app.py` = `src/jobads_dashboard/dashboard/app.py`,
3213 lines). Re-confirm with a quick `grep` before editing — earlier fixes may shift
lines.

Standard verify after any change: `python -m py_compile` the touched files →
`PYTHONPATH=src .venv/bin/pytest -q` (baseline 29 passed) → launch ungated on a spare
port and re-walk the affected screen → `/_stcore/health` `ok` → redeploy per AGENTS.md
rule 6.

---

## Systemic fixes (each resolves several findings)

### FIX-A — Wide-table rendering  → resolves **L01** (and reduces U06)
- **Current** (`app.py:1065-1069`):
  ```css
  div[data-testid="stTable"] table { width: 100%; table-layout: fixed; border-collapse: collapse; }
  ```
  plus `th/td { white-space: normal; overflow-wrap: anywhere; }` (1081-1090) and
  `show_table` → `st.table(...)` (app.py:1808).
- **Change** (pick one; B is the smaller diff, A is the more robust UX):
  - **(A, recommended) Route wide frames to `st.dataframe`.** In `show_table`
    (app.py:1799-1808), if `display.shape[1] > 5`, render
    `st.dataframe(display, hide_index=True, use_container_width=True)` (native column
    sizing + horizontal scroll), else keep the styled `st.table`. Gives readable
    columns and scroll on both the 6-col local-areas and 10-col heatmap/results tables.
  - **(B) CSS-only.** Drop `table-layout: fixed`; set cells to `white-space: nowrap`
    and wrap the table in `overflow-x: auto` so columns size to content and the card
    scrolls horizontally instead of overlapping. Keeps the bespoke `st.table` look.
  - **For the LQ heatmap specifically**: also consider transposing it (occupations as
    rows, months/provinces as columns) so the long occupation labels become row labels
    with room to breathe — even (A)/(B) leave 10 column headers tight on phones.
- **Steps**: edit `show_table` (A) or the GLOBAL_STYLES table block (B); re-walk
  Geography, Occupations heatmap, Explore results at 1440 and 375 px.
- **Risk**: `st.dataframe` styling differs from the branded `st.table` (sortable header,
  default chrome) — restyle via the existing CSS or accept it for wide tables only;
  verify number formatting (`show_table` pre-formats to strings, so dtypes are object —
  fine for display).
- **Verify**: at 375 px the heatmap header row is readable (scroll or transposed); no
  text overlaps in the local-areas/results tables.

### FIX-B — Pin the color scheme  → resolves **L02** and the uncontrolled half of **U07**
- **Current**: `:root` (app.py:136-155) declares no `color-scheme`; metric card bg is
  hard light `var(--aclmr-surface)` (956); label color `var(--aclmr-muted)` (969) and
  value `var(--aclmr-navy-deep)` (979) lack `!important`. No `.streamlit/config.toml`.
- **Change** (do both for belt-and-suspenders):
  1. Add `color-scheme: light;` to the `.stApp` rule (app.py:157-165) — and/or `:root`.
     This tells the browser to keep light rendering of native UI and stops the dark
     default from overriding unstyled text.
  2. Add `!important` to the metric label/value colors (969, 979) so app intent wins
     regardless of scheme.
  3. Optionally add `.streamlit/config.toml` with `[theme]\nbase = "light"` to fix the
     theme at the Streamlit level too (note: this is a new project config file).
- **Risk**: low; only forces the already-intended light look. Re-check the dark hero
  cards still read white-on-navy (they set explicit colors, so unaffected).
- **Verify**: `preview_resize colorScheme=dark` → metric labels ("Occupation HHI", all
  KPI labels) remain dark `#5d6b74` on white; `getComputedStyle(label).color` ≠ near-white.

### FIX-C — Metric value truncation  → resolves **L03**
- **Current**: `[data-testid="stMetricValue"] > div { white-space:normal; overflow:visible; text-overflow:clip !important }` (app.py:985-990) no longer matches Streamlit 1.58's DOM, so the date-range value ellipsizes.
- **Change**: simplest — don't put a long range string in `st.metric`. For the Explore
  "Selected window" KPI (rendered via `render_metric_rows`, app.py:2272), show the range
  as a caption or split into two cards ("Window start" / "Window end"). Alternatively,
  fix the CSS to target the current value element (verify the live selector with
  `preview_inspect`; in 1.58 the text sits in `[data-testid="stMetricValue"]` itself —
  apply `white-space:normal; overflow:visible; min-width:0` there, with `!important`).
- **Risk**: low. Verify the value shows the full "2016-01 to 2026-03" on Overview and
  Explore at desktop and mobile.

---

## Security & auth

### S01 — Escape LIKE metacharacters in posting search (`app.py:1429-1449`)
- **Current**: `term = search_term.strip().lower(); pattern = f"%{term}%"`; LIKE built
  with no `ESCAPE`.
- **Change**: escape `\`, `%`, `_` in `term` and add an `ESCAPE` clause:
  ```python
  term = search_term.strip().lower()
  if term:
      esc = term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
      pattern = f"%{esc}%"
      search_sql = " OR ".join(
          f"lower(coalesce({c}, '')) LIKE ? ESCAPE '\\'" for c in search_columns
      )
  ```
- **Risk**: none functional; literal `%`/`_` now match literally. **Verify**: searching
  `%` returns "no match" (or literal-percent rows) rather than everything; normal terms
  unchanged. Add a unit test in `tests/test_posting_lookup.py`.

### S02 — Rate-limit the password gate (`app.py:1358-1394`)
- **Change**: track an attempt counter + lockout window in `st.session_state` (e.g.
  after 5 fails, disable the form for 60s with a message), and/or document that the real
  control is an edge proxy / Cloudflare Access in front. Keep PBKDF2 as-is.
- **Risk**: session-state lockout is bypassable by new sessions (Streamlit is stateless
  per session) — note this; a durable fix is network-edge auth. **Verify**: 6 wrong
  guesses → lockout message; correct password still unlocks after the window.

### S03 — Don't render posting text through Markdown (`app.py:2357-2368`)
- **Current**: `st.markdown(f"**Title:** {escape(str(detail['job_title']))}")` etc.
- **Change**: render the value side as plain, non-Markdown text. Either
  `unsafe_allow_html=True` with HTML-escaped values inside a `<span>` (escape already
  applied), or split label/value so the corpus text goes through a non-Markdown widget
  (e.g. `st.text`/`st.code` for the value, or escape Markdown specials
  `* _ [ ] ( ) # ! \` ` ` ``). Apply to `job_title, employer, market, occupation_scope,
  industry_scope`.
- **Risk**: layout shift (label/value formatting). **Verify**: a posting whose title
  contains `[x](http://y)` or `# Foo` or `![](u)` renders as literal text — no link,
  heading, or image.

### S04 — Bound the PBKDF2 iterations parsed from the hash (`app.py:1342-1355`)
- **Change**: after `iterations = int(parts[1])`, reject out-of-range:
  `if not (10_000 <= iterations <= 1_000_000): return False`.
- **Risk**: none for valid hashes. **Verify**: a hash with `iterations=1` fails closed;
  the configured hash still verifies.

---

## Error handling & robustness

### S05 — Guard empty `monthly_overall` (`app.py:3079-3082`)
- **Change**: after building `month_options`, `if not month_options: <raise/return the
  branded data-bundle error>` (reuse `render_data_bundle_error` or raise
  `DashboardDataError` with a "bundle has no months" message). Optionally extend
  `data.py:load_tables` to treat a zero-row required table as a `read_error`.
- **Risk**: low. **Verify**: point `JOBADS_DASHBOARD_DATA_ROOT` at a bundle with an
  empty `monthly_overall.parquet` → branded panel, not a traceback. Add a regression
  test alongside the existing partial-bundle test.

### S06 — Catch I/O errors in `load_metadata` (`data.py:53-61`)
- **Change**: broaden the `except` to also catch `OSError`/`UnicodeDecodeError` (or
  `except (JSONDecodeError, OSError, UnicodeDecodeError) as exc:`) and raise
  `DashboardDataError(..., read_errors=(f"metadata.json: {exc}",))`.
- **Risk**: none. **Verify**: `chmod 000 metadata.json` (or invalid UTF-8) → branded
  panel, not a raw traceback.

### S07 — Handle Ctrl+C / non-zero exit in `app` subcommand (`cli.py:130`)
- **Change**: drop `check=True`; capture `result = subprocess.run(cmd, env=env)` and
  `raise SystemExit(result.returncode)`; wrap in `try/except KeyboardInterrupt: pass`.
- **Risk**: none. **Verify**: Ctrl+C the running app → clean exit (code 130/0), no
  traceback; a genuine Streamlit failure still surfaces its exit code.

---

## Data correctness & display

### S08 — Fix Data Quality month cards (`app.py:2986-2991`) (also U03)
- **Current**: cards "Latest month"=`latest_processed[:7]`, "First month"=`earliest_processed`,
  "Last month"=`latest_processed`.
- **Change**: two meaningful cards with consistent `[:7]`:
  `cards[0].metric("First month", earliest_processed[:7] if isinstance(earliest_processed,str) else "n/a")`
  and `cards[1].metric("Latest month", latest_processed[:7] …)`; drop the duplicate
  "Last month" (or, if three are wanted, make the third a distinct fact such as "Months
  covered"). Use `st.columns(2)` if dropping to two.
- **Risk**: none. **Verify**: live — "First month 2016-01", "Latest month 2026-03"; no
  duplicate, all `YYYY-MM`.

### S09 — Document/correct the occupations province-mix denominator (`app.py:2572-2588`)
- **Change**: decide intent. If "share among the displayed top-10", filter to
  `mix_top` **before** `add_share`. If "share of all province postings" (current math),
  keep it but relabel the heatmap / add a caption ("share of each province's total
  postings"). Recommended: compute share within the shown set so columns sum to ~100%.
- **Risk**: changes displayed numbers — call it out in the commit; add/adjust a metrics
  test. **Verify**: per-province column shares behave per the chosen intent.

### S10 — Use the rollup total as the occupation-mix denominator (`app.py:2100-2109`)
- **Change**: keep `UNKNOWN_OCCUPATION_GROUP` rows in the denominator (compute
  `month_totals` from the `ALL_OCCUPATIONS` rollup row, or before filtering Unknown),
  and only drop Unknown from the *plotted series*. Or relabel the chart "share of
  NOC-coded postings". **Verify**: shares match coverage context; title is honest.

### S11 — Guard single-province "mix" views (`app.py:2549-2551, 2572, 2639, 2665`)
- **Change**: when `province_scope != ALL_CANADA`, hide the province-mix table/heatmap
  (or replace with a "select All Canada to compare provinces" note) since it degenerates
  to one row. **Verify**: pick "ON" → no misleading single-row comparison table.

### S12 — Exclude the 'Unknown' province (`app.py:2795-2804`)
- **Change**: add `& (wage_province["province_scope"] != "Unknown")` to the wage-province
  filter (mirroring the occupation branch), and add `"Unknown"` to the province selector's
  `exclude_values` (app.py:3085). Consider a shared `UNKNOWN_PROVINCE = "Unknown"`
  constant. **Verify**: no "Unknown" bar in the wage-by-province chart, no "Unknown" in
  the province dropdown.

### S13 — `month_label` should treat `NaT` as `None` (`app.py:1493-1498`)
- **Change**: first line `if value is None or pd.isna(value): return "n/a"`. **Verify**:
  a posting with NULL `date_found` shows "Date: n/a", not "NaT".

### S14 — Make `detail_options` keys unique (`app.py:2351-2356`)
- **Change**: key the dict by the DataFrame index, not the display string:
  `options=list(result.index)` with `format_func=lambda i: f"{result.loc[i,'posting_id']} | …"`.
  **Verify**: two rows sharing a `posting_id` are both selectable/inspectable.

---

## ETL / `prepare.py`

### S15 — Extend schema validation to all required files (`prepare.py:778-811`)
- **Change**: add required-column lists to `schema_requirements` for the remaining ~11
  parquet files (monthly_filter_cube, monthly_overall, monthly_by_province/noc/naics,
  monthly_wage_cube/by_province/by_noc, monthly_conditions, monthly_language,
  monthly_requirements, coverage_by_field_monthly, geography_top_markets). Best: derive
  the expected columns from the builder functions so they can't drift.
- **Risk**: stricter validation may flag an older bundle — intended. **Verify**: rename
  a column in one parquet → `validate` reports it; healthy bundle still passes. Extend
  `tests/test_refresh_contract.py`.

### S16 — TRIM noc/naics before regex (`prepare.py:86-89, 636-638`)
- **Change**: wrap with `TRIM(...)`, e.g. `regexp_extract(TRIM(CAST(noc AS VARCHAR)), '^([0-9])', 1)`,
  in both the normalized view and the posting-lookup builder. **Verify**: a row with
  `' 12345'` noc classifies into its real broad group, not "Unknown". Rebuild a small
  bundle and check the broad-group counts.

### S17 — Drop blank `skill_code` (`prepare.py:495-509`)
- **Change**: add `WHERE NULLIF(TRIM(skill_value.skill_code), '') IS NOT NULL` (or
  `HAVING`) so empty segments are excluded; optionally also filter blanks in the app's
  skills panel. **Verify**: a posting with `'A||B'` produces only A, B.

### S18 — Fix the falsy-zero totals check (`prepare.py:843`)
- **Change**: `int(overall_total) if overall_total is not None else -1` (match line 852's
  idiom). **Verify**: an all-zero (degenerate) corpus isn't falsely invalid; normal
  bundle unaffected.

### S19 — Use the constant in `build_coverage_table` (`prepare.py:16, 453-468`)
- **Change**: iterate over the imported `COVERAGE_FIELDS` instead of the duplicated
  local dict (or delete the stale import if the local dict is intentionally the source).
  **Verify**: coverage parquet columns unchanged; editing `COVERAGE_FIELDS` now flows
  through.

### S20 — Precompute the lookup cutoff in a CTE (`prepare.py:521-528`)
- **Change**: compute `date_trunc('month', max(date_found)) - INTERVAL N MONTH` once in
  a CTE (or read `metadata.json`'s max date like `posting_lookup_source_plan` does) and
  reference it, avoiding the self-referential scan. **Verify**: posting-lookup rebuild
  output identical; (optional) note runtime improvement.

---

## Performance / caching

### S21 — Gate the posting lookup behind submit (`app.py:2298-2316`)
- **Change**: capture `submitted = st.form_submit_button("Search postings")`, persist
  `search_term`/`row_limit` into `st.session_state`, and only call `query_posting_lookup`
  + render results when a search has been run (or seed an initial unfiltered page once).
  **Risk**: changes the "auto-lists on open" behavior — confirm desired UX with the
  owner (currently it lists scope postings immediately). **Verify**: dragging the date
  slider on a non-Explore tab no longer triggers a lookup scan; search still works.

### S22 — Add a cache key that tracks the lookup file (`app.py:1397-1483`)
- **Change**: include `posting_lookup.parquet`'s `st_mtime` (and size) in the cache key
  (pass it as an arg), or set a short `ttl`. Same for `load_dashboard_assets` if bundles
  are rebuilt live. **Verify**: rebuild the lookup while the server runs → fresh results
  without restart.

### S23 — (Optional) lazy tab bodies (`app.py:3179-3207`)
- Low priority / inherent to Streamlit. If desired, gate expensive tab bodies on the
  active tab via a query-param/session-state tab tracker. Otherwise document as accepted.

### S24 — Remove the redundant datetime cast (`app.py:3077-3078`)
- **Change**: drop the `pd.to_datetime` in the main body (data.py:79 owns it), or add a
  comment that data.py is authoritative. **Verify**: month options unchanged.

### S25 — Emit JSON from the CLI (`cli.py:100, 107, 119`)
- **Change**: `import json` and replace the three `print(<dict>)` calls with
  `print(json.dumps(<dict>, indent=2, default=str))` (matching `prepare.py:943`).
- **Risk**: none; output becomes machine-parseable. **Verify**:
  `jobads-dashboard validate | python -m json.tool` parses; add a small CLI test in
  `tests/test_cli.py`.

---

## Uncertain

### S26 — (defensive) `latest_month` NaT guard (`app.py:1815-1818`)
- One-line: `m = frame["month"].max(); return None if pd.isna(m) else pd.Timestamp(m)`.
  Harmless; closes the gap if the ETL ever permits null dates. Pairs with S13.

### S27 — (data-dependent) wage `> 0` guard (`prepare.py:173, 248-251`)
- Only if upstream uses `0` for "unknown wage": add `AND remunerationHrly > 0` to the
  coverage count and quantile filters. Current data shows no zeros (p25 min $9.50) — do
  **not** apply blindly; confirm against the source first.

---

## Live UI defects (covered by systemic fixes above + below)

- **L01** → FIX-A. **L02** → FIX-B. **L03** → FIX-C.
- **L04 — Plotly legend clipping**: in the chart builders, move the legend below the
  plot (`legend=dict(orientation="h", yanchor="top", y=-0.2)`) and/or add right margin;
  for the MoM/YoY chart fix the stray "1" (set explicit y-axis tick config). Verify all
  card legends fit within the card at 1440 and 375 px.
- **L05 — Industries mix legend**: add a legend (or, given ~20 series, a "top N + Other"
  grouping with a legend) so bands are identifiable; or switch to small-multiples.
  Verify the bands map to industries. (Also U05.)
- **L06 — Mobile chevron**: add left padding/inset to the collapsed sidebar control so
  it isn't clipped at x=0, and raise its z-index / offset so it doesn't overlap the
  chart legend. Verify at 375 px.

---

## Craft / UX-standards fixes (`U`)

- **U01 — Semantic change color**: in `recent_vs_prior` change tables and signed KPIs,
  color negatives (e.g. `--aclmr-orange`/red) vs positives (teal/green) and/or add ▲/▼.
  Easiest via a pandas Styler `applymap` on the change columns, or per-cell markup.
- **U02 — Skills labels**: map the top skill codes to names (even a partial lookup
  table), or hide the codes panel until labels land; at minimum show the codes with a
  clearer "internal skill code" caption. Tie to S17 (drop blanks).
- **U03 — Date formats / duplicate card**: same change as **S08** (consistent `YYYY-MM`,
  drop the duplicate). Audit other date displays for one format.
- **U04 — Card density**: reduce `min-height: 8.5rem` (app.py:955) to ~6rem and tighten
  padding so KPI rows aren't sparse; check value wrapping still fits.
- **U05 — Unlabelled charts**: add legends/keys (see L05) and label the 3-line wage
  chart (min/median/max).
- **U06 — Redundant "National label" column**: drop it from the local-areas table (keep
  Province + Local area), which also eases L01. Verify the table still reads clearly.
- **U07 — Light/dark intent**: covered by **FIX-B** (`color-scheme: light`); decide
  explicitly to ship light-only (document it) vs. invest in real dark parity.
- **U08 — External font**: self-host PT Sans (bundle the woff2 and `@font-face` from a
  local static path) instead of the runtime Google Fonts `@import` (app.py:134), so the
  brand font works offline and adds no third-party request from a gated page.
- **U09 — Tab ribbon**: shorten the two long tab labels (e.g. "Compensation",
  "Skills & requirements") or set a uniform two-line cell height so the 2×4 grid rows
  align. Verify at desktop/tablet/mobile.
