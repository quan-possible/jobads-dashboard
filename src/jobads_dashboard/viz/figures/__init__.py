"""Figure factories, one module per topic surface.

Every public function takes a :class:`~jobads_dashboard.viz.datasource.DataSource`
and returns a plain ``plotly.graph_objects.Figure``. No Streamlit/Dash imports, so
the same callables render in a static page or the live app.
"""
