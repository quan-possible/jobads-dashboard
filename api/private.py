"""Private posting-level lookup (the Explore surface).

Reads the gitignored ``posting_lookup.parquet`` directly with DuckDB. This is the
only place the API touches posting-level rows; everything else is aggregate-only.
Access is gated by the auth layer at the router. Values are sanitised so the JSON
contract never leaks NaN/inf.
"""

from __future__ import annotations

import math

from . import core
from .models import PostingDetail, PostingRow, PostingsResponse, Scope

MAX_LIMIT = 100

# Posting-language code → display label (matches the aggregate layer).
_LANGUAGE_LABELS = {"en": "English", "fr": "French"}


def _lookup() -> str:
    return f"read_parquet('{core.POSTING_LOOKUP}')"


def _language(value) -> str | None:
    raw = _s(value)
    if raw is None:
        return None
    return _LANGUAGE_LABELS.get(raw.lower(), raw)


def _s(value) -> str | None:
    if value is None:
        return None
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return None
    text = str(value).strip()
    return text or None


def _f(value) -> float | None:
    if value is None:
        return None
    try:
        f = float(value)
    except (TypeError, ValueError):
        return None
    if math.isnan(f) or math.isinf(f):
        return None
    return f


def _iso(value) -> str | None:
    if value is None:
        return None
    if hasattr(value, "strftime"):
        return value.strftime("%Y-%m-%d")
    return str(value)[:10]


def _scope_filters(scope: Scope, q: str | None) -> tuple[str, list]:
    clauses: list[str] = []
    params: list = []
    if scope.geo and scope.geo != core.ALL_GEO:
        clauses.append("province_scope = ?")
        params.append(scope.geo)
    if scope.occ and scope.occ != core.ALL_OCC:
        clauses.append("occupation_scope = ?")
        params.append(scope.occ)
    if scope.ind and scope.ind != core.ALL_IND:
        clauses.append("industry_scope = ?")
        params.append(scope.ind)
    if scope.start:
        clauses.append("month >= ?")
        params.append(f"{scope.start}-01")
    if scope.end:
        clauses.append("month <= ?")
        params.append(f"{scope.end}-01")
    if q and q.strip():
        # S12: escape LIKE special characters in the user term so that a search
        # for e.g. "100%" or "_nurse" matches the literal characters rather than
        # acting as wildcards. The escape character itself must be escaped first.
        term = q.strip().lower().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        like = f"%{term}%"
        clauses.append("(lower(job_title) LIKE ? ESCAPE '\\' OR lower(employer) LIKE ? ESCAPE '\\')")
        params.extend([like, like])
    where = " AND ".join(clauses) if clauses else "TRUE"
    return where, params


def _row(r) -> PostingRow:
    return PostingRow(
        posting_id=str(r["posting_id"]),
        month=_iso(r["month"]) or "",
        date_found=_iso(r["date_found"]),
        job_title=_s(r["job_title"]),
        employer=_s(r["employer"]),
        province=_s(r["province_scope"]),
        market=_s(r["market"]),
        occupation=_s(r["occupation_scope"]),
        industry=_s(r["industry_scope"]),
        wage_hourly=_f(r["wage_hourly"]),
        wage_min=_f(r["wage_min"]),
        wage_max=_f(r["wage_max"]),
        employment_type=_s(r["employment_type"]),
        remote_class=_s(r["remote_class"]),
        has_description=bool(r["has_description"]),
    )


def postings(scope: Scope, q: str | None, limit: int, offset: int) -> PostingsResponse:
    limit = max(1, min(limit, MAX_LIMIT))
    offset = max(0, offset)
    where, params = _scope_filters(scope, q)

    total = int(
        core.query_df(f"SELECT count(*) AS n FROM {_lookup()} WHERE {where}", params)["n"].iloc[0]
    )

    sql = f"""
        SELECT posting_id, month, date_found, job_title, employer, province_scope,
               market, occupation_scope, industry_scope, wage_hourly, wage_min,
               wage_max, employment_type, remote_class, has_description
        FROM {_lookup()}
        WHERE {where}
        -- Recency first; a stable hash interleaves provinces/employers so the
        -- first page reads as a representative mix, not one cluster of IDs.
        ORDER BY date_found DESC NULLS LAST, hash(posting_id)
        LIMIT ? OFFSET ?
    """
    df = core.query_df(sql, params + [limit, offset])
    items = [_row(row) for _, row in df.iterrows()]
    return PostingsResponse(scope=scope, total=total, limit=limit, offset=offset, items=items)


def posting_detail(posting_id: str) -> PostingDetail | None:
    df = core.query_df(
        f"SELECT * FROM {_lookup()} WHERE posting_id = ? LIMIT 1",
        [posting_id],
    )
    if df.empty:
        return None
    r = df.iloc[0]
    base = _row(r)
    return PostingDetail(
        **base.model_dump(),
        noc_code=_s(r["noc_code"]),
        noc_label=_s(r["noc_label"]),
        naics_code=_s(r["naics_code"]),
        naics_label=_s(r["naics_label"]),
        wage_unit=_s(r["wage_unit"]),
        duration=_s(r["duration"]),
        experience=_s(r["experience"]),
        experience_details=_s(r["experience_details"]),
        education=_s(r["education"]),
        primary_posting_language=_language(r["primary_posting_language"]),
        data_source=_s(r["data_source"]),
        description_full=_s(r["description_full"]),
    )
