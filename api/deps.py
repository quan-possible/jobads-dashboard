"""Shared FastAPI dependencies."""

from __future__ import annotations

from fastapi import Query

from . import queries
from .models import Scope


def scope_dependency(
    geo: str | None = Query(None, description="Province code (e.g. ON) or 'All Canada'."),
    occ: str | None = Query(None, description="NOC broad label or 'All occupations'."),
    ind: str | None = Query(None, description="NAICS broad label or 'All industries'."),
    start: str | None = Query(None, description="Window start 'YYYY-MM'."),
    end: str | None = Query(None, description="Window end / as-of 'YYYY-MM'."),
) -> Scope:
    return queries.resolve_scope(geo, occ, ind, start, end)
