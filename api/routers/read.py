"""All public read endpoints over the aggregates."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Path, Query

from .. import queries
from ..deps import scope_dependency
from ..models import (
    GeographyResponse,
    Meta,
    OverviewResponse,
    RankItem,
    RequirementsResponse,
    Scope,
    SeriesPoint,
    SkillsResponse,
    WagesResponse,
    WageTrendResponse,
    CompositionResponse,
    ConcentrationResponse,
    MatrixResponse,
    CoverageTrendResponse,
    GeoTrendResponse,
)

router = APIRouter(prefix="/api", tags=["read"])


@router.get("/meta", response_model=Meta)
def meta() -> Meta:
    return queries.get_meta()


@router.get("/overview", response_model=OverviewResponse)
def overview(scope: Scope = Depends(scope_dependency)) -> OverviewResponse:
    return queries.overview(scope)


@router.get("/series/postings", response_model=list[SeriesPoint])
def series_postings(
    scope: Scope = Depends(scope_dependency),
    metric: str = Query("index", pattern="^(index|level|yoy)$"),
) -> list[SeriesPoint]:
    return queries.postings_series(scope, metric)


@router.get("/rank/{dim}", response_model=list[RankItem])
def rank(
    dim: str,
    scope: Scope = Depends(scope_dependency),
    limit: int = Query(10, ge=1, le=50),
    order: str = Query("value", pattern="^(value|yoy)$"),
) -> list[RankItem]:
    target = "occupations" if dim.startswith("occ") else "industries"
    return queries.rank(scope, target, limit, order)


@router.get("/geography", response_model=GeographyResponse)
def geography(
    scope: Scope = Depends(scope_dependency),
    measure: str = Query("per10k", pattern="^(per10k|lq|count)$"),
) -> GeographyResponse:
    return queries.geography(scope, measure)


@router.get("/wages", response_model=WagesResponse)
def wages(
    scope: Scope = Depends(scope_dependency),
    dim: str = Query("occupation", pattern="^(occupation|province|overall)$"),
) -> WagesResponse:
    return queries.wages(scope, dim)


@router.get("/wages/trend", response_model=WageTrendResponse)
def wages_trend(scope: Scope = Depends(scope_dependency)) -> WageTrendResponse:
    return queries.wage_trend(scope)


@router.get("/composition/{dim}", response_model=CompositionResponse)
def composition(
    dim: str = Path(..., pattern="^(occupations|industries)$"),
    scope: Scope = Depends(scope_dependency),
    top_n: int = Query(6, ge=2, le=10),
) -> CompositionResponse:
    return queries.composition(scope, dim, top_n)


@router.get("/concentration/{dim}", response_model=ConcentrationResponse)
def concentration(
    dim: str = Path(..., pattern="^(occupations|industries)$"),
    scope: Scope = Depends(scope_dependency),
) -> ConcentrationResponse:
    return queries.concentration(scope, dim)


@router.get("/matrix/occ-province", response_model=MatrixResponse)
def matrix_occ_province(
    scope: Scope = Depends(scope_dependency),
    measure: str = Query("lq", pattern="^(lq|count)$"),
) -> MatrixResponse:
    return queries.occ_province_matrix(scope, measure)


@router.get("/coverage/trend", response_model=CoverageTrendResponse)
def coverage_trend(
    scope: Scope = Depends(scope_dependency),
    field: str = Query("naics", pattern="^(naics|noc|wage|skills|remote)$"),
) -> CoverageTrendResponse:
    return queries.coverage_trend(scope, field)


@router.get("/geography/trend", response_model=GeoTrendResponse)
def geography_trend(
    scope: Scope = Depends(scope_dependency),
    measure: str = Query("count", pattern="^(count)$"),
) -> GeoTrendResponse:
    return queries.geography_trend(scope, measure)


@router.get("/skills", response_model=SkillsResponse)
def skills(
    scope: Scope = Depends(scope_dependency),
    mode: str = Query("top", pattern="^(top|distinctive)$"),
    limit: int = Query(15, ge=1, le=50),
) -> SkillsResponse:
    return queries.skills(scope, mode, limit)


@router.get("/requirements", response_model=RequirementsResponse)
def requirements(scope: Scope = Depends(scope_dependency)) -> RequirementsResponse:
    return queries.requirements(scope)
