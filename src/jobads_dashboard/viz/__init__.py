"""Visualization core for the job-ads dashboard.

Everything in this package returns plain ``plotly.graph_objects.Figure`` objects
(or pure data). The live Next.js site renders them through the FastAPI figure
bridge (``api/figures.py``).

Layout
------
- :mod:`theme`      - registered Plotly template + chrome helpers.
- :mod:`compute`    - analytical transforms (YoY, index, contribution, shift-share, diffusion).
- :mod:`datasource` - typed, cached accessors over the derived parquet bundle.
- :mod:`figures`    - one module per topic surface; each function returns a Figure.
"""

from __future__ import annotations

from .theme import register_templates

__all__ = ["register_templates"]
