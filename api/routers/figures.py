"""Figure endpoint — serve a redesign2 Plotly factory as figure JSON.

``GET /api/figure/{chart_id}?locale=en|fr`` returns ``{data, layout, frames?}``
ready for ``Plotly.newPlot``. The response is the Plotly-encoded JSON string
returned verbatim — FastAPI's default encoder would choke on the numpy arrays and
pandas Timestamps inside the figure, so we never let it re-encode.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, Response

from .. import figures

router = APIRouter(prefix="/api", tags=["figures"])


@router.get("/figure/{chart_id}")
def figure(
    chart_id: str,
    locale: str = Query("en", pattern="^(en|fr)$"),
) -> Response:
    if chart_id not in figures.REGISTRY:
        raise HTTPException(status_code=404, detail=f"unknown chart_id: {chart_id}")
    return Response(
        content=figures.build(chart_id, locale=locale),
        media_type="application/json",
    )


@router.get("/figures")
def figure_ids() -> dict:
    """List the registered chart ids (handy for the front-end and tests)."""
    return {"chart_ids": sorted(figures.REGISTRY)}
