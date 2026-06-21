"""FastAPI application entrypoint.

Run locally:  uvicorn api.main:app --reload --port 8530
"""

from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import read

app = FastAPI(
    title="ACLMR Labour Market API",
    version="0.1.0",
    description="Typed JSON over the local job-ads aggregates. Reads only derived parquet — never the upstream corpus at request time.",
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


@app.get("/health", tags=["meta"])
def health() -> dict:
    return {"status": "ok"}
