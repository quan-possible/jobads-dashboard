"""FastAPI application entrypoint.

Run locally:  uvicorn api.main:app --reload --port 8530
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import explore, figures, private, read

_log = logging.getLogger("api.main")


@asynccontextmanager
async def _lifespan(app: FastAPI):
    """S09: warm up the DuckDB connection + explore cubes at startup so the first
    real request does not block for ~2 minutes while DuckDB opens the parquet files
    and builds in-memory structures. Runs the default explore query (province /
    postings, no filters) and primes latest_month / earliest_month.

    All warm-up calls are wrapped in a broad try/except: a missing parquet or any
    other startup error must never prevent the app from starting."""
    try:
        from . import core
        from .explore import build_explore_figure

        # Prime the DuckDB connection and the month-boundary caches.
        core.latest_month()
        core.earliest_month()
        # Run the default explore figure (province × postings, no scope filters)
        # which touches both filter_cube and wage_cube code paths.
        build_explore_figure("province", "postings")
    except Exception:
        _log.warning(
            "Explore warm-up failed — first request may be slow.",
            exc_info=True,
        )
    yield  # application runs


app = FastAPI(
    title="ACLMR Labour Market API",
    version="0.1.0",
    description="Typed JSON over the local job-ads aggregates. Reads only derived parquet — never the upstream corpus at request time.",
    # Serve docs + schema under /api/* so they reach the public surface: in the
    # container only /api/* is proxied to this internal-only FastAPI process.
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=_lifespan,
)

_origins = os.environ.get(
    "JOBADS_API_CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _origins if o.strip()],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(read.router)
app.include_router(private.router)
app.include_router(figures.router)
app.include_router(explore.router)


@app.get("/health", tags=["meta"])
def health() -> dict:
    return {"status": "ok"}
