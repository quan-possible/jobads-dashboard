"""Framework-agnostic visualization core for the job-ads dashboard.

Everything in this package returns plain ``plotly.graph_objects.Figure`` objects
(or pure data), so the same factories drop into Streamlit, Dash, or a static
HTML export without modification. The static review page in :mod:`review` is one
consumer; the live site is another.

Layout
------
- :mod:`theme`      - registered Plotly templates (light/dark) + chrome helpers.
- :mod:`compute`    - analytical transforms (YoY, index, contribution, shift-share, LQ, HHI...).
- :mod:`datasource` - typed, cached accessors over the derived parquet bundle.
- :mod:`figures`    - one module per topic surface; each function returns a Figure.
"""

from __future__ import annotations

from .theme import register_templates

__all__ = ["register_templates"]
