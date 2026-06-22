"""Public read endpoints over the aggregates.

The dashboard renders its charts through the figure bridge (``/api/figure/{id}``);
these two endpoints serve the small amount of typed JSON the UI still needs —
dataset metadata (``/meta``) and the homepage snapshot (``/overview``).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from .. import queries
from ..deps import scope_dependency
from ..models import Meta, OverviewResponse, Scope

router = APIRouter(prefix="/api", tags=["read"])


@router.get("/meta", response_model=Meta)
def meta() -> Meta:
    return queries.get_meta()


@router.get("/overview", response_model=OverviewResponse)
def overview(scope: Scope = Depends(scope_dependency)) -> OverviewResponse:
    return queries.overview(scope)
