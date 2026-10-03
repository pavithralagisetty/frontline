#!/usr/bin/env bash
# Development: backend with auto reload + Vite dev server (proxies /api to the backend).
source "$(dirname "$0")/_common.sh"
ensure_env_file

PORT="$(env_value PORT 8000)"
export PORT

"$PY" -m uvicorn backend.main:app --host 127.0.0.1 --port "$PORT" --reload --reload-dir backend &
BACKEND_PID=$!
trap 'kill "$BACKEND_PID" 2>/dev/null || true' EXIT INT TERM

cd "$ROOT/frontend"
npm run dev
