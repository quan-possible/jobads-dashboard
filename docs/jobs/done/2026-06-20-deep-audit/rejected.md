# Rejected candidates — 2026-06-20 deep audit

Candidates raised during the audit and **refuted** by the adversarial verify pass (or
by the orchestrator). Recorded so the next run does not re-report them. Full verifier
reasoning is in [`evidence/code-audit-findings.md`](evidence/code-audit-findings.md)
(REFUTED section).

## Code candidates refuted (10)

1. **`JOBADS_DASHBOARD_DATA_ROOT` path-traversal** (`app.py:1323-1324`). The env var is
   operator-supplied at deploy time; anyone who can set it already has filesystem
   access. No user-controlled path input exists. Treating the operator data dir as
   trusted is standard design, not a gap.

2. **Overview wage/occupation coverage uses `groupby().sum()` not a direct rollup
   lookup** (`app.py:2040,2046,2061`). `apply_selector_filters` pins all three
   dimensions simultaneously and the cube has one row per (month, province, occ, ind)
   GROUPING SET cell, so the sum is always over a single row per month — numerically
   identical to a direct lookup. The "multiple rows per month" scenario can't occur.

3. **`recent_vs_prior` `isin` fails for object/string month dtype** (`app.py:1963,1978,1984`).
   `data.py:78-79` always `pd.to_datetime`s the `month` column before any caller, so
   it's always `datetime64[ns]`. The string-dtype path is unreachable.

4. **Zero-byte parquet race between existence check and cache** (`app.py:2282-2297`).
   The existence/zero-size check `return`s early (2297) and never calls the cached
   function on that branch — the two branches are mutually exclusive, so no stale
   cached result can follow the warning.

5. **`render_industries` `coverage_series.iloc[-1]` may pick the wrong month**
   (`app.py:2662-2682`). `monthly_filter_cube.parquet` is written `ORDER BY month, …`
   (`prepare.py:190`); `pd.read_parquet` + `.loc[]` filters preserve order, so
   `iloc[-1]` is reliably the latest month.

6. **`render_industries` change table groups by shortened label, could merge industries**
   (`app.py:2661,2677-2680`). All 20 `INDUSTRY_SHORT_LABELS` values keep the unique
   NAICS prefix and are distinct; absent labels pass through unchanged. No two canonical
   scopes collapse to the same shortened label.

7. **`latest_denominator` `iloc[-1]` without sort** (`app.py:2759-2764`). Same as #5 —
   the cube's write-time `ORDER BY month` flows through `.loc[]` filters unchanged, so
   `iloc[-1]` is the latest month.

8. **`skills_coverage_pct` `iloc[-1]` may hit multiple rows at latest month**
   (`app.py:2901-2905`). The three scope filters are always applied to exact values, so
   after filtering there's exactly one row per month; `iloc[-1]`/`iloc[0]` are
   equivalent. Risk is zero, not low.

9. **Cached `load_dashboard_assets` returns mutable frames with one `.copy()` guard**
   (`app.py:1313-1316,3077`). `st.cache_data` serializes/deserializes on every hit, so
   each caller gets a fresh copy; grep finds no in-place mutation of `cube`. Safe on
   both axes.

10. **`description_excerpt` `substr(...,900)` splits mid-codepoint** (`prepare.py:559,698`).
    DuckDB `substr` is codepoint-based, not byte-based — the title's core claim is
    false. The fallback "900 leading whitespace chars blank the excerpt" needs a
    pathological input that doesn't occur in scraped job ads, and `has_description`
    already requires non-whitespace content.

## Live UI candidate dropped (1)

- **Compensation: "two empty white cards"**. At an early scroll position the wage-chart
  cards looked blank; scrolling down showed the charts render fine — it was the white
  top-margin of the chart cards caught above the plot area, not an empty/unrendered
  panel. Dropped as a false positive (crop timing). (The genuine spacing nuance — tall
  cards / large top margin — is captured as craft item **U04**, not a defect.)

## Notes for the next run
- Do **not** re-file `iloc[-1]`-without-sort findings on cube-derived frames: every cube
  is written `ORDER BY month` and reads preserve order.
- Do **not** re-file `month` dtype / `pd.to_datetime` concerns: `data.py:78-79` always
  coerces.
- The data-root-trust and cache-mutation patterns are intentional/safe as analyzed.
