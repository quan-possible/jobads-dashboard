"""Figure endpoint — serve a redesign2 Plotly factory as figure JSON.

``GET /api/figure/{chart_id}?locale=en|fr`` returns ``{data, layout, frames?}``
ready for ``Plotly.newPlot``. The response is the Plotly-encoded JSON string
returned verbatim — FastAPI's default encoder would choke on the numpy arrays and
pandas Timestamps inside the figure, so we never let it re-encode.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Response

from .. import figures
from .private import optional_session

router = APIRouter(prefix="/api", tags=["figures"])


@router.get("/figure/{chart_id}")
def figure(
    chart_id: str,
    locale: str = Query("en", pattern="^(en|fr)$"),
    base_year: int | None = Query(None, ge=2010, le=2100),
    end_year: int | None = Query(None, ge=2010, le=2100),
    full: bool = Query(False, description="Request the uncapped team view (only honoured for an authenticated session)."),
    authed: bool = Depends(optional_session),
) -> Response:
    """Year-anchored charts (indexed lines, contribution / waterfall / dumbbell,
    skill-churn, AI-exposure scatter, shift-share) accept an optional ``base_year``
    / ``end_year`` so the front-end can make them general; other charts ignore them.

    ``full=1`` serves the uncapped team view (every category, provinces split out),
    but **only** for a valid session — the server recomputes ``uncapped = full and
    authed``, so the flag alone can never bypass the public cap. Authenticated
    uncapped responses are marked ``private, no-store`` and carry the distinct
    ``full=1`` URL, so a capped public figure and an uncapped team figure never
    share a cache entry."""
    if chart_id not in figures.REGISTRY:
        raise HTTPException(status_code=404, detail=f"unknown chart_id: {chart_id}")
    uncapped = full and authed
    params = {k: v for k, v in (("base_year", base_year), ("end_year", end_year)) if v is not None}
    headers = {"Cache-Control": "private, no-store"} if uncapped else None
    return Response(
        content=figures.build(chart_id, locale=locale, uncapped=uncapped, **params),
        media_type="application/json",
        headers=headers,
    )


@router.get("/figures")
def figure_ids() -> dict:
    """List the registered chart ids (handy for the front-end and tests)."""
    return {"chart_ids": sorted(figures.REGISTRY)}
