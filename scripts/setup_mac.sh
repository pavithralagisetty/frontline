#!/usr/bin/env bash
# One-time setup on the MacBook (Apple Silicon).
source "$(dirname "$0")/_common.sh"

if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew is required: https://brew.sh" >&2
  exit 1
fi

for pkg in python@3.11 node@22; do
  brew list --versions "$pkg" >/dev/null 2>&1 || brew install "$pkg"
done

export PATH="$(brew --prefix node@22)/bin:$PATH"
install_project "$(brew --prefix python@3.11)/bin/python3.11"
