"""Explore endpoint — the self-serve "Build a chart" figure.

``GET /api/explore/figure?dim=…&measure=…&geo=…&occ=…&ind=…&locale=en|fr``
returns ``{data, layout}`` ready for ``Plotly.newPlot``, themed like the
registered charts. The body is the Plotly-encoded JSON string returned verbatim
(FastAPI's default encoder would choke on the numpy/pandas internals), exactly
as :mod:`api.routers.figures` does.

The figure builder never raises on an awkward combination — its three gates
(axis / data / sample) return a friendly message figure — so the only 422 here
comes from query-param validation (a bad ``dim`` / ``measure`` / ``locale``).
"""

from __future__ import annotations

from fastapi import APIRouter, Query, Response

from .. import explore

router = APIRouter(prefix="/api/explore", tags=["explore"])


@router.get("/figure")
def explore_figure(
    dim: str = Query(..., pattern="^(province|occupation|industry|time)$"),
    measure: str = Query(..., pattern="^(postings|share|yoy|two_year|wage)$"),
    geo: str | None = Query(None, description="Province code (e.g. ON) or 'All Canada'."),
    occ: str | None = Query(None, description="NOC broad scope label or 'All occupations'."),
    ind: str | None = Query(None, description="NAICS broad scope label or 'All industries'."),
    start_year: int | None = Query(None, ge=2010, le=2100),
    end_year: int | None = Query(None, ge=2010, le=2100),
    locale: str = Query("en", pattern="^(en|fr)$"),
) -> Response:
    return Response(
        content=explore.build_explore_figure(
            dim,
            measure,
            geo=geo,
            occ=occ,
            ind=ind,
            start_year=start_year,
            end_year=end_year,
            locale=locale,
        ),
        media_type="application/json",
    )
