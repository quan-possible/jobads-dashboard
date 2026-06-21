"""Pydantic response models — the API contract.

Every field here is something the frontend can rely on. Optional fields are
genuinely optional (e.g. tiles that depend on data-layer columns that do not
exist yet are omitted, never faked).
"""

from __future__ import annotations

from pydantic import BaseModel, Field

# --------------------------------------------------------------------------- #
# Shared
# --------------------------------------------------------------------------- #


class Scope(BaseModel):
    """The resolved filter scope echoed back to the client."""

    geo: str
    occ: str
    ind: str
    start: str
    end: str


class SourceWindow(BaseModel):
    min_date: str
    max_date: str


class CoverageItem(BaseModel):
    field: str
    label: str
    postings: int
    share: float = Field(description="Share of all postings with this field, 0–1.")


class Meta(BaseModel):
    generated_at_utc: str
    source_window: SourceWindow
    postings_total: int
    coverage: list[CoverageItem]
    caveats: list[str]
    latest_month: str
    earliest_month: str
    index_base_month: str


# --------------------------------------------------------------------------- #
# Series
# --------------------------------------------------------------------------- #


class SeriesPoint(BaseModel):
    month: str
    postings: int
    index: float | None = None
    yoy: float | None = None
    series: str | None = None  # label when comparing two scopes


# --------------------------------------------------------------------------- #
# Overview / Pulse
# --------------------------------------------------------------------------- #


class Kpis(BaseModel):
    demand_index: float | None = None
    demand_index_mom: float | None = None
    active_postings: int | None = None
    active_mom_pct: float | None = None
    active_yoy_pct: float | None = None
    median_wage: float | None = None
    wage_n: int | None = None
    # Deferred until the Phase-5 data-layer columns exist; omitted when absent.
    posting_intensity: float | None = None
    postings_new: int | None = None


class RankItem(BaseModel):
    code: str
    label: str
    value: int
    yoy: float | None = None
    share: float | None = None


class OverviewResponse(BaseModel):
    scope: Scope
    as_of: str
    kpis: Kpis
    series: list[SeriesPoint]
    key_points: list[str]
    top_growing: list[RankItem]
    top_cooling: list[RankItem]


# --------------------------------------------------------------------------- #
# Geography
# --------------------------------------------------------------------------- #


class GeoItem(BaseModel):
    code: str
    label: str
    value: float | None
    count: int | None = None
    yoy: float | None = None
    per10k: float | None = None
    lq: float | None = None


class GeographyResponse(BaseModel):
    scope: Scope
    as_of: str
    measure: str
    items: list[GeoItem]


# --------------------------------------------------------------------------- #
# Wages
# --------------------------------------------------------------------------- #


class WageItem(BaseModel):
    code: str
    label: str
    p25: float | None
    median: float | None
    p75: float | None
    n: int
    gated: bool = Field(description="True when n < the minimum sample and stats are withheld.")


class WagesResponse(BaseModel):
    scope: Scope
    as_of: str
    dim: str
    min_sample: int
    items: list[WageItem]


# --------------------------------------------------------------------------- #
# Skills
# --------------------------------------------------------------------------- #


class SkillItem(BaseModel):
    code: str
    label: str
    group: str | None = None
    share: float
    count: int
    lift: float | None = None  # distinctiveness vs national baseline


class SkillsResponse(BaseModel):
    scope: Scope
    as_of: str
    mode: str
    n: int
    items: list[SkillItem]


# --------------------------------------------------------------------------- #
# Requirements
# --------------------------------------------------------------------------- #


class CategoryShare(BaseModel):
    category: str
    label: str
    count: int
    share: float


class RequirementsResponse(BaseModel):
    scope: Scope
    as_of: str
    n: int
    remote: list[CategoryShare]
    employment_type: list[CategoryShare]
    education: list[CategoryShare]
    experience: list[CategoryShare]
    language: list[CategoryShare]


# --------------------------------------------------------------------------- #
# Auth + private postings (Explore)
# --------------------------------------------------------------------------- #


class AuthStatus(BaseModel):
    authenticated: bool
    configured: bool = Field(description="True if a password source is available.")


class PostingRow(BaseModel):
    """One posting in the Explore table (list view — no full description)."""

    posting_id: str
    month: str
    date_found: str | None = None
    job_title: str | None = None
    employer: str | None = None
    province: str | None = None
    market: str | None = None
    occupation: str | None = None
    industry: str | None = None
    wage_hourly: float | None = None
    wage_min: float | None = None
    wage_max: float | None = None
    employment_type: str | None = None
    remote_class: str | None = None
    has_description: bool = False


class PostingsResponse(BaseModel):
    scope: Scope
    total: int = Field(description="Total matching postings (capped for performance).")
    limit: int
    offset: int
    items: list[PostingRow]


class PostingDetail(PostingRow):
    """Full posting record, including the description, for the drawer view."""

    noc_code: str | None = None
    noc_label: str | None = None
    naics_code: str | None = None
    naics_label: str | None = None
    wage_unit: str | None = None
    duration: str | None = None
    experience: str | None = None
    experience_details: str | None = None
    education: str | None = None
    primary_posting_language: str | None = None
    data_source: str | None = None
    description_full: str | None = None
