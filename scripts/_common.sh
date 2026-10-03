#!/usr/bin/env bash
# Shared helpers, sourced by the other scripts. Works on macOS (zsh/bash) and Ubuntu (bash).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Homebrew's node@22 is keg-only on the Mac; put it first on PATH when it exists.
if command -v brew >/dev/null 2>&1; then
  NODE22="$(brew --prefix node@22 2>/dev/null || true)"
  if [ -n "$NODE22" ] && [ -x "$NODE22/bin/node" ]; then
    export PATH="$NODE22/bin:$PATH"
  fi
fi

PY="$ROOT/.venv/bin/python"

# Read PORT/HOST from .env without exporting secrets into the shell.
env_value() {
  local key="$1" default="$2" line
  line="$(grep -E "^${key}=" "$ROOT/.env" 2>/dev/null | tail -n 1 || true)"
  if [ -n "$line" ]; then echo "${line#*=}"; else echo "$default"; fi
}

ensure_env_file() {
  if [ ! -f "$ROOT/.env" ]; then
    cp "$ROOT/.env.example" "$ROOT/.env"
    echo "Created .env from .env.example. Add your LLM_API_KEY to it."
  fi
}

install_project() {
  local python_bin="$1"
  echo "==> Python venv ($("$python_bin" --version))"
  [ -d "$ROOT/.venv" ] || "$python_bin" -m venv "$ROOT/.venv"
  "$PY" -m pip install --quiet --upgrade pip
  "$PY" -m pip install --quiet -r "$ROOT/requirements.txt"

  echo "==> Frontend packages (node $(node --version))"
  (cd "$ROOT/frontend" && npm ci --no-audit --no-fund)

  echo "==> Frontend build"
  (cd "$ROOT/frontend" && npm run build)

  ensure_env_file
  echo "==> Done. Start with scripts/run.sh (or scripts/dev.sh while developing)."
}
