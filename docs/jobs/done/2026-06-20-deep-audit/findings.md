# Deep audit — defects — 2026-06-20

Real, distinct defects in the `jobads-dashboard` Streamlit app: backend / data /
logic correctness (`S##`, from the Sonnet code fan-out) and live UI defects
(`L##`, from the orchestrator's live walkthrough). Design-craft / UX-standards
items are in [`ux-audit.md`](ux-audit.md); every confirmed item here and there has
a fix in [`fix-spec.md`](fix-spec.md), ordered by [`remediation-plan.md`](remediation-plan.md).

## Scope & method
- **Code (`S`)**: 11 parallel Sonnet auditors read every slice of `src/**` across
  the standard lenses (logic, pandas/duckdb data integrity, dates/bounds, Streamlit
  state/rerun, caching, security, error handling, a11y, performance, cross-file
  consistency, edge cases). Each candidate was then **adversarially re-checked** by a
  separate Sonnet pass that tried to refute it. 42 candidates → **30 real, 2
  uncertain, 10 refuted**; refuted ones are in [`rejected.md`](rejected.md). After
  the orchestrator deduped the duplicate clusters (LIKE-wildcard ×3, detail_options
  ×2, empty-monthly_overall ×2, totals-zero ×2), **25 distinct `S` findings + 2
  uncertain** remain. Raw per-finding detail + verifier verdicts:
  [`evidence/code-audit-findings.md`](evidence/code-audit-findings.md).
- **Live UI (`L`)**: full walkthrough of all 8 tabs + the interactive Explore
  lookup, mobile/desktop, sidebar states, and light/dark color-scheme on an ungated
  local instance (`127.0.0.1:8530`). Evidence + DOM extracts:
  [`evidence/live-capture.md`](evidence/live-capture.md).

## Verification note
Items tagged **hand-verified** were confirmed by the orchestrator directly — by
re-reading the cited code and/or by live render + `getComputedStyle`/DOM inspection.
The rest carry the Sonnet auditor's claim plus the adversarial verifier's verdict.
The refuted set is load-bearing: several plausible-looking `iloc[-1]` "unsorted"
claims were correctly killed because `prepare.py` writes every cube `ORDER BY month`
and `data.py` always coerces `month` to datetime — do not re-report them.

## Severity tally
| | HIGH 🟧 | MEDIUM 🟨 | LOW ⬜ | Total |
|---|---|---|---|---|
| Static (`S`) | 0 | 9 | 16 | 25 (+2 uncertain) |
| Live UI (`L`) | 0 | 2 | 4 | 6 |
| **Total** | **0** | **11** | **20** | **31 (+2)** |

Severity: **High** = data loss / broken core feature / security / auth-recovery ·
**Medium** = wrong behavior in a real path, a11y, notable UI defect · **Low** =
minor / edge / cosmetic. No HIGH findings: the data/logic surface is sound; the
empty-bundle crash (S05) is a real robustness gap but needs an abnormal bundle, so
it lands MEDIUM, not data-loss HIGH.

---

# Static findings (`S`) — code fan-out

## Security & auth

### S01 — Posting search: LIKE metacharacters not escaped 🟨 MEDIUM
- **Category**: correctness / data integrity · **`app.py:1429-1449`** · hand-verified
- The search term is lowercased and dropped into `pattern = f"%{term}%"` (line 1431)
  with no escaping of LIKE metacharacters and no `ESCAPE` clause. A user typing `%`
  yields pattern `%%%` (matches every row); `_` matches any single char. Results are
  silently unrelated to the literal text typed.
- **Root cause**: `%`/`_`/`\` not escaped before building the LIKE pattern.
- **Verdict (real)**: parameterization prevents SQL injection but not wildcard
  mis-interpretation. Impact is *wrong search results*, not data exposure (tab is
  gated + `LIMIT`-capped) — a correctness bug, not a security bypass.

### S02 — Password gate has no rate-limit or lockout 🟨 MEDIUM
- **Category**: security / auth · **`app.py:1358-1394`**
- `require_dashboard_authentication()` calls `verify_dashboard_password` on every
  submit with no attempt counter, lockout, or delay beyond PBKDF2 cost. `AUTH_FAILURE_KEY`
  is a boolean only; opening a new session resets even that. Unlimited guesses.
- **Root cause**: no session/server attempt counter or throttle.
- **Verdict (real)**: PBKDF2@240k raises per-guess cost (~50-200ms) but is not a
  substitute for a rate-limit on a publicly reachable auth endpoint. The standing
  caveat (this is app-level, not edge auth) is recorded in `MEMORY.md`.

### S03 — Posting-detail fields are Markdown-injectable 🟨 MEDIUM
- **Category**: injection / content integrity · **`app.py:2357-2368`** · hand-verified
- The detail panel renders `job_title`, `employer`, `market`, `occupation_scope`,
  `industry_scope` via `st.markdown(f"**…:** {escape(...)}")`. `html.escape` neutralizes
  HTML entities but **not** Markdown syntax. Corpus text like `[clickme](http://x)`
  becomes a live link; `![](http://x)` embeds an external image (IP leak); a leading
  `#` becomes a heading that breaks layout.
- **Root cause**: HTML-escaping used where the renderer is Markdown. (The full
  description at 2372-2374 is safe — `st.text_area(disabled=True)`, plain text.)
- **Verdict (real)**: requires malicious content in the job-ads corpus, not direct
  user input, and the tab is gated — hence MEDIUM, not HIGH.

### S04 — `verify_dashboard_password` trusts unbounded `iterations` from the hash ⬜ LOW
- **Category**: security / auth · **`app.py:1342-1355`**
- `iterations = int(parts[1])` is read from the stored hash and passed straight to
  `pbkdf2_hmac` with no min/max bound. A hash with `iterations=1` removes the work
  factor; a huge value hangs the verifier.
- **Verdict (real, low)**: the hash is admin-supplied via env only, so this is a
  misconfiguration-hardening gap, not an external attack path.

## Error handling & robustness

### S05 — Empty `monthly_overall.parquet` → unguarded `IndexError` on startup 🟨 MEDIUM
- **Category**: error handling / edge case · **`app.py:3079-3082`** (dup of code-audit [24]+[31]) · hand-verified
- `month_options = sorted(monthly["month"].unique())` then `month_options[0]` /
  `[-1]` with no length guard. `load_tables` only raises `DashboardDataError` for
  *missing/unreadable* files (data.py:64-89), not zero-row ones — so a present-but-empty
  or truncated `monthly_overall.parquet` crashes with a raw Streamlit traceback
  instead of the branded `render_data_bundle_error` panel.
- **Root cause**: no non-empty check on required tables; no empty-list guard.

### S06 — `metadata.json` I/O errors bypass the `DashboardDataError` handler 🟨 MEDIUM
- **Category**: error handling · **`data.py:53-61`** · hand-verified
- The `try/except` around `open()`+`json.load()` catches only `JSONDecodeError`. A
  `PermissionError`, `OSError`, or `UnicodeDecodeError` (file exists but unreadable /
  bad encoding) propagates raw; the caller (app.py:3071-3075) catches only
  `DashboardDataError`, so it escapes to a Streamlit traceback instead of the panel.

### S07 — `app` subcommand prints a traceback on Ctrl+C ⬜ LOW
- **Category**: error handling / CLI UX · **`cli.py:130`**
- `subprocess.run(cmd, check=True, env=env)` for the long-running Streamlit process:
  Ctrl+C (exit 130) raises `CalledProcessError`, printing a full traceback and exiting
  1 instead of propagating 130. No `KeyboardInterrupt`/returncode handling.

## Data correctness & display accuracy

### S08 — Data Quality month cards: duplicate value + inconsistent format 🟨 MEDIUM
- **Category**: UI correctness · **`app.py:2986-2991`** · hand-verified (code + live)
- `cards[0]` "Latest month" = `latest_processed[:7]` ("2026-03"); `cards[2]` "Last
  month" = `latest_processed` ("2026-03-31") — **same value, two labels, two
  formats**; `cards[1]` "First month" = `earliest_processed` (full date, not `[:7]`).
  Live capture showed exactly "2026-03 / 2016-01-01 / 2026-03-31".
- **Root cause**: missing `[:7]` on `earliest_processed`; copy-paste of `latest_processed`
  into `cards[2]` where `earliest`/`latest` First/Last was intended. (See also U03.)

### S09 — Occupations province-mix heatmap: misleading share denominator 🟨 MEDIUM
- **Category**: data integrity / silent wrong result · **`app.py:2572-2588`**
- `add_share(mix_frame, ["province_scope"])` (line 2576) computes `share_pct` over
  **all** occupation groups, then the frame is filtered to the top-10 (2577-2580). The
  rendered heatmap therefore shows each occupation's share of *all* province postings;
  per-province columns sum to the top-10 combined share, not 100%, with no note. A
  reader naturally infers within-shown shares.
- **Root cause**: share computed before the top-10 filter; intent undocumented.

### S10 — Overview occupation-mix: denominator excludes uncoded postings ⬜ LOW
- **Category**: data integrity · **`app.py:1927-1929, 2100-2109`**
- `render_overview` filters `ALL_OCCUPATIONS` **and** `UNKNOWN_OCCUPATION_GROUP` out
  before `compute_top_group_shares`, whose `month_totals` then sums only coded rows.
  "Unknown" postings leave both numerator and denominator, so displayed shares inflate
  vs true national share and sum to ~100% as if they cover all activity. Title "Broad
  occupation mix over time" doesn't say "coded-only".
- **Root cause**: denominator should be the `ALL_OCCUPATIONS` rollup row, not the sum
  of surviving coded rows.

### S11 — Province-mix views collapse to a single province when one is selected ⬜ LOW
- **Category**: logic / misleading UI · **`app.py:2549-2551, 2572, 2639, 2665`**
- When a specific province is selected, `apply_selector_filters` narrows the frame to
  that province; the later `province_scope != ALL_CANADA` mix filter then yields a
  single-row "province mix" table presented as a cross-province comparison. The empty
  guards (2622/2727) don't catch this degenerate single-row case.

### S12 — Wage-by-province chart doesn't exclude the synthetic 'Unknown' province ⬜ LOW
- **Category**: data integrity · **`app.py:2795-2804`**
- `wage_province` excludes only `ALL_CANADA`. `prepare.py:81` coalesces blank province
  to the string `'Unknown'` (not NULL), which survives and can appear as a real
  province bar — unlike the occupation branch (2810-2812) which excludes its Unknown
  group. (Verifier confirmed `'Unknown'` is also missing from the province selector's
  `exclude_values`.)

### S13 — Posting detail shows literal "NaT" for a null `date_found` ⬜ LOW
- **Category**: edge case / cosmetic · **`app.py:1493-1498, 2363`**
- `month_label` guards `None` and `pd.Timestamp` but not `NaT`. `month_label(pd.Timestamp(detail['date_found']))`
  with a NULL `date_found` → `NaT` → falls to `str(value)[:7]` = `"NaT"`, so the panel
  renders "**Date:** NaT" instead of "n/a".

### S14 — `detail_options` can silently drop a posting on duplicate id ⬜ LOW
- **Category**: logic / UX · **`app.py:2351-2356`**
- The inspect-selectbox dict is keyed by `f"{posting_id} | {title[:70]} | {employer[:45]}"`.
  Two rows with the **same `posting_id`** (a re-scraped duplicate; the pipeline never
  dedupes on id) overwrite each other, making one row visible in the table but
  unreachable in the inspector.

## ETL / `prepare.py`

### S15 — Schema validation checks columns for only ~2 of ~13 derived files 🟨 MEDIUM
- **Category**: data integrity / validation · **`prepare.py:778-811`**
- `validate_derived_package` enforces required columns only for
  `monthly_skills_topk.parquet` and `monthly_by_market.parquet`; the other ~11
  required files are existence-checked only. A stale/older-version or partially-written
  parquet with renamed/missing columns passes validation, then surfaces as a silent
  wrong result or a runtime `KeyError` in the app.

### S16 — NOC/NAICS `regexp_extract` not trimmed → leading-space codes misclassified ⬜ LOW
- **Category**: data integrity · **`prepare.py:86-89, 636-638`**
- `regexp_extract(noc,'^([0-9])',1)` / `naics` are applied to untrimmed columns while
  all neighboring string columns are `TRIM`'d. A leading space (e.g. `' 12345'`) makes
  the anchored regex return `''` → `NULLIF` → NULL → "Unknown occupation/industry
  group", despite a valid code. Duplicated in the posting-lookup builder.

### S17 — `build_skills_table` keeps blank `skill_code` from malformed `|` skills ⬜ LOW
- **Category**: data integrity · **`prepare.py:495-509`**
- `UNNEST(string_split(skills,'|'))` + `trim` with no `NULLIF`/`WHERE` guard: `'A||B'`,
  `'|A'`, `'A|'` yield empty-string skill codes that are grouped, counted, written to
  `monthly_skills_topk.parquet`, and can rank in the app's skills panel (no blank filter
  there either).

### S18 — `validate_derived_package` falsy-zero totals bug ⬜ LOW
- **Category**: validation / edge case · **`prepare.py:843`** (dup [34]+[39])
- `int(overall_total or -1)` treats `0` as falsy → `-1`, so a genuinely zero-postings
  corpus would be flagged invalid. Line 852 uses the correct `is not None` idiom,
  confirming the inconsistency. Largely unreachable (DuckDB `SUM` over empty = NULL),
  so LOW.

### S19 — `COVERAGE_FIELDS` imported but unused; `build_coverage_table` duplicates the dict ⬜ LOW
- **Category**: cross-file consistency / drift risk · **`prepare.py:16, 453-468`**
- The imported constant is never referenced; `build_coverage_table` defines its own
  local field dict that currently matches it. Future edits to `constants.COVERAGE_FIELDS`
  silently won't affect the coverage parquet.

### S20 — Posting-lookup builder double-scans the corpus ⬜ LOW
- **Category**: ETL performance · **`prepare.py:521-528`**
- The cutoff date is a scalar subquery `(SELECT … FROM normalized_postings)` inside a
  query that also scans `normalized_postings` (a `read_parquet` view, not materialized),
  so the parquet is read twice. DuckDB *usually* hoists it, but there's no guarantee; a
  CTE would make single-evaluation explicit.

## Performance / caching (runtime)

### S21 — Posting-lookup query runs on every rerun (not gated behind submit) 🟨 MEDIUM
- **Category**: performance / UX · **`app.py:2298-2316`** · hand-verified
- `st.form_submit_button("Search postings")`'s return is discarded; `query_posting_lookup`
  is then called unconditionally — on initial load and on every sidebar-filter change,
  before the user ever searches. `@st.cache_data` helps for identical params, but any
  date/scope change busts the key and triggers a fresh DuckDB scan of the 105 MB lookup.

### S22 — Lookup/asset caches have no TTL or file-mtime key → stale after rebuild ⬜ LOW
- **Category**: caching staleness · **`app.py:1397-1483` (and 1313)**
- `@st.cache_data(show_spinner=False)` with no `ttl`, keyed on the data-root *string*
  not its mtime/hash. Rebuilding `posting_lookup.parquet` on a long-running server (the
  Mac Mini service) serves stale cached results until restart.

### S23 — All 8 tabs render on every rerun ⬜ LOW
- **Category**: performance (Streamlit model) · **`app.py:3179-3207`**
- `st.tabs` switches visually only; every `render_*` body executes each rerun. Mostly
  in-memory work; the heavy posting lookup is conditionally gated. Largely inherent —
  recorded as a minor cost, not a defect to "fix" aggressively.

## Maintenance

### S24 — Redundant `pd.to_datetime` on `monthly_overall["month"]` ⬜ LOW
- **Category**: maintenance · **`app.py:3077-3078`** · hand-verified
- `load_tables` already coerces `month` to datetime (data.py:79); the main body does it
  again — a harmless no-op today but split ownership that can drift.

### S25 — `validate`/`refresh`/`posting-lookup` CLI print Python repr, not JSON ⬜ LOW
- **Category**: CLI / operator UX · **`cli.py:100, 107, 119`**
- All three structured-output paths use bare `print(dict)`, emitting Python repr
  (single-quoted keys, `True`/`False`) rather than JSON; `cli.py` never imports `json`.
  Any script/CI that pipes the output and parses it as JSON fails. Inconsistent with
  `prepare.py`'s own `__main__` (line 943) which uses `json.dumps(..., indent=2)`.
- **Root cause**: `json` not imported in `cli.py`; `print(dict)` used as a shortcut.

## Uncertain (recorded, low priority — data/ETL-dependent)

### S26 — `latest_month()` returns `NaT` (not `None`) for an all-null month column ⬜ LOW · uncertain
- **`app.py:1815-1818`** — Real type-contract gap, but **unreachable today**:
  `prepare.py:135` filters `dateFound IS NOT NULL`, so no null months reach the cubes.
  Worth a one-line defensive guard; not a current wrong-result path.

### S27 — Zero hourly wages counted as valid in coverage/quantiles ⬜ LOW · uncertain
- **`prepare.py:173, 248-251`** — No `> 0` guard on `remunerationHrly` in coverage
  counts / quantiles. **Not evidenced** in current data (derived `wage_p25` min is
  $9.50, so no zeros present). Add the guard only if upstream can emit `0` as
  "unknown"; otherwise moot.

---

# Live UI defects (`L`) — orchestrator walkthrough

### L01 — Wide tables render with overlapping, illegible columns 🟨 MEDIUM
- **Category**: layout / readability · **`app.py:1065-1069` (CSS), `1799-1808` (show_table)** · hand-verified
- `div[data-testid="stTable"] table { width:100%; table-layout:fixed }` forces **equal
  column widths**. Wide tables in half-width `st.columns` get columns too narrow for
  their content, so headers and 9-digit counts visibly collide:
  - Geography "Top local areas" — 6 cols @ 57px in a 345px card (data verified correct
    underneath; the overlap is purely visual).
  - Occupations LQ heatmap — 10 occupation columns; headers are an unreadable jumble.
    **Catastrophic on mobile** (10 cols ≈ 31px each; a horizontal scrollbar exists but
    the table is pinned to container width, so scrolling doesn't help).
  - Explore "Specific postings" results — 10 columns.
- **Root cause**: `table-layout: fixed` + equal columns + many columns, with no
  horizontal-scroll/`auto` path for wide tables.

### L02 — Metric-card labels go invisible in a dark color-scheme 🟨 MEDIUM
- **Category**: color & contrast (a11y) · **`app.py:136-155, 953-990`** · hand-verified
- With `prefers-color-scheme: dark`, metric-card labels disappear. `getComputedStyle`
  on the "Occupation HHI" label → `color: rgb(250,250,250)` on card bg `rgb(255,255,255)`
  = white-on-white. Root: `:root` declares no `color-scheme`, the card bg is hard light
  (`var(--aclmr-surface)`, line 956), and the label color (`var(--aclmr-muted)`, line
  969) lacks `!important`, so the browser's dark default overrides it. Systemic to every
  white metric card for dark-mode users. (See also U07.)

### L03 — Explore "Selected window" metric value truncates ⬜ LOW
- **Category**: content / overflow · **`app.py:978-990` (CSS), `2272` (render)** · hand-verified
- The KPI shows `2016-01 to 20…`. The anti-truncation override
  (`[data-testid="stMetricValue"] > div {…}`, 985-990) no longer matches Streamlit
  1.58's DOM, so the default single-line ellipsis wins for long values. (The hero WINDOW
  pill — custom HTML, not `st.metric` — shows the full range, isolating this to
  `st.metric`.)

### L04 — Plotly legends clipped at the card's right edge ⬜ LOW
- **Category**: chart legibility · `render_overview` / `render_occupations` chart config
- Overview "MoM and YoY growth" legend ("…Year-over-year") is cut off; occupation
  short-label legends clip to "Admi", "Cultu", "Trans", "Manufacturi"; a stray "1" sits
  at the MoM/YoY chart's top-left (clipped y-axis artifact).

### L05 — Industries "Industry mix over time": ~20-series stacked area, no legend ⬜ LOW
- **Category**: chart legibility · `render_industries` mix chart
- The colored bands are unidentifiable — no legend or annotation maps colour → industry.
  (Also U05.)

### L06 — Mobile sidebar chevron clipped / overlapping ⬜ LOW
- **Category**: responsive polish · sidebar toggle CSS
- On 375px the collapsed ">" chevron is partly clipped at the left viewport edge and, on
  the Occupations tab, overlaps the chart's "Occupation" legend label.

---

See [`fix-spec.md`](fix-spec.md) for the concrete fix for every `S`, `L`, and `U`
item, and [`remediation-plan.md`](remediation-plan.md) for batching/order.
