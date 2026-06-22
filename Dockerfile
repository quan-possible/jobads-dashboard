# Single-container deployment of the labour-market dashboard:
#   * Next.js web UI (standalone server) on $PORT  — the public surface
#   * FastAPI on 127.0.0.1:8530 (internal only)    — typed JSON + figure bridge
# Browser calls hit /api/* on the web server and are proxied to FastAPI by
# Next's rewrites(); server-side rendering fetches FastAPI directly. Both the
# proxy destination and NEXT_PUBLIC_API_BASE are baked at build time below.

# --------------------------------------------------------------------------- #
# Stage 1 — build the Next.js app into a self-contained standalone bundle.
# --------------------------------------------------------------------------- #
FROM node:20-bookworm-slim AS web
WORKDIR /app/web

# Baked into the build: server-side fetches target the in-container API, and the
# /api/* rewrite proxies there too (next.config.ts reads these at build time).
ENV NEXT_PUBLIC_API_BASE=http://127.0.0.1:8530 \
    JOBADS_API_ORIGIN=http://127.0.0.1:8530 \
    NEXT_TELEMETRY_DISABLED=1

COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# --------------------------------------------------------------------------- #
# Stage 2 — runtime: Python (FastAPI + figure factories) + Node (Next server).
# --------------------------------------------------------------------------- #
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=10000 \
    API_PORT=8530 \
    JOBADS_DASHBOARD_DATA_ROOT=/app/data/derived/labor_market_dashboard_v1

WORKDIR /app

# Node runtime for the standalone Next server (copied from the official image —
# the standalone bundle ships its own minimal node_modules, so npm is not needed).
COPY --from=node:20-bookworm-slim /usr/local/bin/node /usr/local/bin/node

# Python package: the data pipeline + the Plotly figure factories the API serves.
# Editable install keeps the source at /app/src so jobads_dashboard.viz can
# resolve its repo-relative data paths (data/geo, data/reference).
COPY pyproject.toml README.md ./
COPY src ./src
COPY api ./api
RUN pip install --upgrade pip && pip install -e ".[api]"

# Derived aggregates + reference + geometry the API reads at request time.
# (The private posting_lookup.parquet is excluded via .dockerignore.)
COPY data/derived/labor_market_dashboard_v1 ./data/derived/labor_market_dashboard_v1
COPY data/reference ./data/reference
COPY data/geo ./data/geo

# Next.js standalone server + the assets it does not bundle (static, public).
COPY --from=web /app/web/.next/standalone ./web
COPY --from=web /app/web/.next/static ./web/.next/static
COPY --from=web /app/web/public ./web/public

COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

EXPOSE 10000
CMD ["./docker-entrypoint.sh"]
