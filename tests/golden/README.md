# Golden-file test suite

Answers one question: **is the information in each chart correct?** — the actual
numbers a reader sees (bar heights, treemap areas, choropleth fills, line values,
animation frames), end to end from raw postings to figure JSON.

## The one principle

A golden file is a correctness test **only if its expected output was derived
independently of the code under test**. Every expected value here is **known by
construction**: the fixture corpus is hand-specified so the correct aggregate and
the correct plotted number are known before any production code runs. Nothing is
ever pasted from `build()` output. Charts that also read a frozen reference asset
(AI-β, labour force, wage-by-education) combine the hand-built postings with the
committed asset, read in-test.

Honest limit: golden tests prove correctness only for the inputs in the fixture.
The corpus is designed to hit every code path that carries a number; Layer A
covers the pure math analytically for all inputs of its shape.

## The three layers

| File | Layer | Boundary | Catches |
|---|---|---|---|
| `test_compute_golden.py` | A — transforms | `viz/compute.py` (12 pure fns) | wrong formulas (LQ, contribution, shift-share, diffusion, …) |
| `test_aggregation_golden.py` | B — aggregation | `dashboard/prepare.py` (`refresh_dashboard_data`) | wrong SQL: grouping sets, rollup scope, quantiles, coverage, skills unnest |
| `test_figures_golden.py` | C — figure data | `api.figures.build(id, locale)` over the Layer-B bundle + frozen assets | wrong wiring accessor→transform→plot; share/round/sort/top-N; asset joins; FR chrome; frames |

Layer C builds the Layer-B bundle once (session fixture) and points
`api.figures._ds` at it, so it re-exercises B implicitly. The reference assets are
read from the repo (not the fixture), exactly as production does.

## Running

```
uv run pytest tests/golden
```

## The fixture corpus

`tests/fixtures/golden_corpus/<year>/processed_fixture_<year>.parquet` — a tiny
(~510-row) hand-specified corpus. Counts, wages, and skill mentions are chosen so
every charted number is non-degenerate and known by construction (see the job's
`fixture-spec.md`). Both the parquet **and** its generator are committed.

Regenerate the corpus (only when the spec deliberately changes):

```
uv run python -m tests.fixtures.build_corpus
```

## Regeneration and re-blessing

There are **no committed expected-value files** to regenerate: expected values
live inline in the tests as analytic / by-construction literals (clearer and
harder to get wrong than an opaque CSV of "correct" outputs). The only
regenerable artifact is the corpus parquet above.

Re-blessing therefore means a human **edits an inline expected value** — and the
bar is the principle above: the new number must be derived independently (from the
corpus construction, Layer-A math, or a committed asset), never copied from a test
run that "went green". A real upstream data refresh changes nothing here, because
the suite is pinned to the frozen corpus and the committed assets.
