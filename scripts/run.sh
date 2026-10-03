#!/usr/bin/env bash
# Demo mode: one server. FastAPI serves the API and the built frontend.
source "$(dirname "$0")/_common.sh"
ensure_env_file

if [ ! -f "$ROOT/frontend/dist/index.html" ]; then
  echo "==> No frontend build found, building once"
  (cd "$ROOT/frontend" && npm run build)
fi

HOST="$(env_value HOST 127.0.0.1)"
PORT="$(env_value PORT 8000)"
echo "==> Open http://$HOST:$PORT"
exec "$PY" -m uvicorn backend.main:app --host "$HOST" --port "$PORT"
