"""FastAPI application entrypoint.

Run locally:  uvicorn api.main:app --reload --port 8530
"""

from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import explore, figures, private, read

app = FastAPI(
    title="ACLMR Labour Market API",
    version="0.1.0",
    description="Typed JSON over the local job-ads aggregates. Reads only derived parquet — never the upstream corpus at request time.",
    # Serve docs + schema under /api/* so they reach the public surface: in the
    # container only /api/* is proxied to this internal-only FastAPI process.
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
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
