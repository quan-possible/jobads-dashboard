"""Smoke test for the static review page (S05 regression guard).

review.py calls the figure factories by name; when factories are renamed or
removed the page silently rots (the original break was
``module 'figures.pulse' has no attribute 'stl_panel'``). This asserts every
name in ``_pages()`` resolves to a real factory and the whole catalogue renders.
"""

from __future__ import annotations

import plotly.graph_objects as go

from jobads_dashboard.viz import review
from jobads_dashboard.viz.datasource import DataSource


def test_every_review_item_is_callable() -> None:
    for section in review._pages():
        for item in section.items:
            assert callable(item.fn), f"{section.anchor}: non-callable item"


def test_review_page_builds_full_catalogue() -> None:
    ds = DataSource(None)

    # Every factory the page lists must render to a real figure.
    pages = review._pages()
    n_items = 0
    for section in pages:
        for item in section.items:
            fig = item.fn(ds)
            assert isinstance(fig, go.Figure), f"{section.anchor}: {item.takeaway!r} did not render"
            n_items += 1

    # And the assembled HTML carries one Plotly div per item.
    html = review.build_html(ds)
    assert html.count("plotly-graph-div") == n_items
