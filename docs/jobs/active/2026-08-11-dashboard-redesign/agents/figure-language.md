# Figure-language handoff

## Scope

Updated the shared Plotly visual language only. Figure IDs, metrics, source
tables, public category caps, API bridge behavior, measurement caveats, and
figure data arrays remain unchanged.

## Changes

- `src/jobads_dashboard/viz/theme.py`
  - Uses the literal `'PT Sans'` family so Plotly SVG attributes do not receive
    an unresolved CSS variable and silently fall back to system UI fonts.
  - Aligns shared navy/teal/sand/orange and semantic growth/decline tokens with
    the approved ACLMR design system.
  - Keeps Plotly paper/plot backgrounds transparent for cream or white cards.
  - Removes default axis strokes/ticks, softens grids, tightens margins and
    legend placement, and keeps legends transparent.
  - Insets reference-line labels so translated or narrow charts do not clip at
    the right edge.
- `src/jobads_dashboard/viz/figures/_common.py`
  - Gives `titled()` compact missing-edge margins while preserving any
    figure-specific label allowance.
- `src/jobads_dashboard/viz/figures/quality.py`
  - Uses the shared `DOWN` status token for low-coverage bars.
- `tests/golden/test_figures_golden.py`
  - Updates the expected shared decline token and adds bridge-level assertions
    for font, transparency, grid, axes, legend, and margin chrome.

## Checks

```text
uv run --with pytest --with fastapi --with httpx python -m pytest -q tests/golden/test_figures_golden.py
134 passed
```

Static render spot checks were generated from the frozen golden corpus after
the change and composited against the cream target surface:

- `tmp/figure-language/demand-ribbon-cream.png`
- `tmp/figure-language/yoy-bars-cream.png`
- `tmp/figure-language/composition-cream.png`
- `tmp/figure-language/indexed-lines-cream.png`

The renders show the intended PT Sans/cream-friendly transparent chart body,
restrained axes/grid, ACLMR palette, and readable in-plot annotations. Full
Python, web build, browser, and release-gate checks remain parent-scope work.
