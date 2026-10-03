#!/usr/bin/env bash
# One-time setup on the Dell GB10 (DGX OS 7 / Ubuntu 24.04, arm64).
source "$(dirname "$0")/_common.sh"

sudo apt-get update
sudo apt-get install -y python3 python3-venv python3-pip curl ca-certificates

# Node.js 22 from NodeSource if the installed version is missing or older.
NODE_MAJOR="$(node --version 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/' || echo 0)"
if [ "${NODE_MAJOR:-0}" -lt 22 ]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

# Ubuntu 24.04 ships Python 3.12; use 3.11 if it happens to be installed.
if command -v python3.11 >/dev/null 2>&1; then PYBIN=python3.11; else PYBIN=python3; fi
install_project "$(command -v "$PYBIN")"
