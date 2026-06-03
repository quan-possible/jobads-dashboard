FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=10000 \
    JOBADS_DASHBOARD_DATA_ROOT=/app/data/derived/labor_market_dashboard_v1

WORKDIR /app

COPY pyproject.toml README.md streamlit_app.py /app/
COPY src /app/src
COPY data/derived/labor_market_dashboard_v1 /app/data/derived/labor_market_dashboard_v1

RUN pip install --upgrade pip && pip install .

EXPOSE 10000

CMD ["sh", "-c", "jobads-dashboard app --output-root /app/data/derived/labor_market_dashboard_v1 -- --server.address=0.0.0.0 --server.port=${PORT:-10000} --server.headless=true"]
