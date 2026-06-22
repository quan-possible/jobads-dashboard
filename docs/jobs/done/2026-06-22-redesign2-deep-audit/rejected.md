# redesign2 deep audit — rejected candidates

Candidates the adversarial pass (or the orchestrator's hand-read) refuted. Recorded so the next audit doesn't re-report them. Full verifier reasoning in `evidence/fanout-refuted.md`.

## Refuted by the adversarial pass (20)

1. **`wages()` ignores user scope** (`api/queries.py:548-598`, claimed HIGH) — **By design.** `dim='occupation'` reads `wage_by_noc` and `dim='province'` reads `wage_by_province`; those precomputed tables only contain the national slice, and the dimension toggle is the intended behaviour, not a dropped filter.
2. **`wages()` unknown-sentinel exclusion is redundant** (`api/queries.py:576-580`, LOW) — Inspection of the real parquet shows the exclusion is *not* redundant; the rows it removes are present.
3. **`postings_series()` returns full history (no lower bound)** (`api/queries.py:265-283`, LOW) — Intentional: the series chart wants full history; `scope.start` is for windowed contexts, not this series.
4. **`geography()` omits `scope.geo`** (`api/queries.py:485-510`, LOW) — That code path doesn't exist; the Geography page never passes a single-province `scope.geo` into `geography()` (province selection is the *output* dimension).
5. **DuckDB cursors share state across threads** (`api/core.py:126-144`, LOW) — Wrong for DuckDB ≥1.1: `connection.cursor()` returns an independent connection; reads are isolated.
6. **Missing `Vary` header → CDN cache poisoning** (`api/routers/figures.py:25-27`, MED) — No caching intermediary in the deploy (single Render service, no CDN that strips query params); threat model doesn't hold.
7. **`figure/build()` serializes twice** (`api/figures.py:240-246`, LOW) — `to_plotly_json()`/`to_dict()` is a dict copy, not a double JSON encode; cost overstated.
8. **`register_templates()` resets `pio.templates.default` every call** (`viz/theme.py:177-184`, LOW) — Structurally true but harmless: every call site sets the same default; no observable effect.
9. **DuckDB lock too narrow** (`api/core.py:127-146`, LOW) — Duplicate of #5; cursor-level isolation is guaranteed; the comment is accurate.
10. **Unbounded `offset` dumps the whole lookup** (`api/routers/private.py:87`, MED) — Endpoint is behind `require_session`; an authenticated team user paginating their own data is the intended use, not an exposure.
11. **`posting_detail` uses `SELECT *`** (`api/private.py:135`, LOW) — Pydantic `PostingDetail` is the response boundary; extra parquet columns can't leak into the response.
12. **`shift_share` zero-base NaN deflates `industry_mix`** (`viz/compute.py:109`, MED) — *(also raised then withdrawn by the orchestrator)* Structurally impossible: national base = Σ regional bases, so a zero-base group has zero regional base too; and pandas `.sum(skipna=True)` drops any stray NaN. The identity holds.
13. **`classical_decompose` seasonal centring uses unbalanced mean** (`viz/compute.py:199`, LOW) — Real at code level but negligible for the dense monthly series it runs on; not worth a finding (distinct from the genuine MA-shift bug `S08` at :195).
14. **Cross-section charts silently blank when base/end months absent** (`occupations.py`/`industries.py`/`geography.py`/`pay.py`, HIGH) — The hardcoded base/end timestamps exist in every relevant dataset (data starts 2016-01 and runs to the latest month); exact-equality lookups resolve.
15. **`add_unstable_band` hard-wires 2016 left edge** (`viz/theme.py:230-237`, LOW) — `2016-01-01` is exactly the first month in every dataset; no mismatch.
16. **CSV `escapeField` allows formula injection** (`web/lib/csv.ts:4-12`, MED) — Real gap at code level, but `DownloadCSV` is unused (see `U06`) and the data is server-controlled aggregates, so no reachable attack surface. *(If `DownloadCSV` is ever wired to user-influenced data, revisit — add `'`-prefix escaping then.)*
17. **LocaleToggle touch target ~24px** (`web/components/LocaleToggle.tsx:28-38`, MED) — Recomputed with the real `line-height:1.6`, the buttons are ~28px+; not the WCAG 2.5.5 failure claimed.
18. **Suspense fallback shows a 68px placeholder on all pages** (`web/app/layout.tsx:60-62`, LOW) — `FilterSpine` uses only `usePathname()`, which doesn't suspend here; the fallback doesn't render on non-explore pages.
19. **Sparkline endpoint dot is a compressed pixel** (`web/components/Sparkline.tsx:50`, P3) — The `<circle>` is fill-only (no stroke); the cited root cause/fix (`vectorEffect`) is irrelevant and the dot renders fine.
20. **Wages hero lede too long (3+ lines)** (`web/lib/i18n/dict/page-wages.ts:12`, P3) — False baseline: the Skills lede is already longer and wasn't flagged; lede length is consistent with the page family.

## Note
The eslint `react-hooks/set-state-in-effect` errors (ExploreView:47,52; PostingDrawer:39; TopNav:23) and `react-hooks/immutability` (LocaleToggle:13) are **lint-noise from Next 16's new rules**, not bugs — the effects use a `cancelled` race guard and the cookie write is a correct event-handler side effect. The one real issue near them (ExploreView's stale-offset double-fetch) is tracked as `S26`. Don't re-file the lint lines as defects.
