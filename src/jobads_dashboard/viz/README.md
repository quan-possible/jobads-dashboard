# `jobads_dashboard.viz` — visualization core

A framework-agnostic implementation of the from-scratch visualization plan
(`docs/jobs/.../dashboard-viz-from-scratch/plan.md`). Every chart is a pure
`plotly.graph_objects.Figure` factory, so the same functions render in a static
page, Streamlit, or Dash without modification. The live site renders them through
the FastAPI figure bridge (`api/figures.py`).

## Layout

| Module | Responsibility |
|---|---|
| `theme.py` | Registered `aclmr_light` Plotly template; palette; chrome helpers (COVID / provisional / pre-2021 bands, reference lines, provisional-tail split). |
| `compute.py` | Analytical transforms — YoY, index-to-100, contribution-to-growth, shift-share, diffusion index. Pure functions, no Plotly. |
| `datasource.py` | `DataSource` — typed, cached accessors over the derived parquet bundle (reuses `dashboard.data.load_tables`). Never scans the raw corpus. |
| `figures/` | One module per topic surface (`pulse`, `geography`, `occupations`, `industries`, `pay`, `skills`, `quality`). Each function takes a `DataSource` and returns a `Figure`. |

## Use a figure in the live app

```python
from jobads_dashboard.viz.datasource import DataSource
from jobads_dashboard.viz.figures import pulse

ds = DataSource()
fig = pulse.demand_ribbon(ds)      # plain go.Figure

# Streamlit:  st.plotly_chart(fig, use_container_width=True)
# Dash:       dcc.Graph(figure=fig)
# Static:     fig.write_html(...) / fig.to_html(full_html=False)
```

`theme.register_templates()` is called automatically by the figure modules; call
it once at app start to set the default `aclmr_light` template.

## Honesty rules baked in

Job ads are a labour-**demand** signal, not employment. 2025+ is provisional
(upstream fetch under audit) and rendered with a dotted/faded tail. Wages are
advertised P25/median/P75 only — no synthetic distributions. NAICS, remote, and
language fields are coverage-gated and shaded unstable before 2021. Contribution
and shift-share are accounting identities; the wage×demand quadrant is
correlation — none implies causation.

## Net-new data asset

`data/geo/canada_provinces.geojson` — provinces/territories keyed by 2-letter
`code` (coordinate-rounded), for the choropleth and LQ maps.

## Static PNG verification (dev)

`pip install -e .[dev]` adds `kaleido`. Figures whose x-axis is datetime must be
round-tripped through Plotly's JSON encoder before `write_image` (kaleido's
serializer does not handle pandas Timestamps):

```python
import plotly.io as pio
pio.from_json(pio.to_json(fig)).write_image("fig.png", width=1000, height=460)
```
