#!/bin/bash
# Run the two server processes that make up the dashboard in one container.
# FastAPI is internal-only (127.0.0.1); the Next.js standalone server is the
# public surface on $PORT and proxies /api/* to FastAPI. If either process
# exits, tear the whole container down so the platform restarts it.
set -euo pipefail

API_PORT="${API_PORT:-8530}"
PORT="${PORT:-10000}"

echo "[entrypoint] starting FastAPI on 127.0.0.1:${API_PORT}"
python -m uvicorn api.main:app --host 127.0.0.1 --port "${API_PORT}" &
api_pid=$!

echo "[entrypoint] starting Next.js on 0.0.0.0:${PORT}"
HOSTNAME=0.0.0.0 PORT="${PORT}" node /app/web/server.js &
web_pid=$!

# Exit as soon as either process does, then stop the other.
wait -n
echo "[entrypoint] a server process exited — shutting down"
kill "${api_pid}" "${web_pid}" 2>/dev/null || true
exit 1
