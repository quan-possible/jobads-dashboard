"""All public read endpoints over the aggregates."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query

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
