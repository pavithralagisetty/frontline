#!/usr/bin/env bash
# Configure the log-triage OpenClaw sandbox for dashboard alerts. Run from the repo root:
#   sg docker -c "bash openclaw/setup_sandbox.sh"
# 1. backs up and adds a "hooks" section to openclaw.json (token read from .env, never printed)
# 2. backs up and replaces the workspace AGENTS.md with openclaw/AGENTS.md
# 3. forwards host 127.0.0.1:18789 to the OpenClaw gateway in the sandbox
set -euo pipefail
cd "$(dirname "$0")/.."

C="$(docker ps --format '{{.Names}}' | grep -m1 '^openshell-default--log-triage-')"
WS=/sandbox/.openclaw/workspace
echo "==> sandbox container: $C"

echo "==> 1. hooks in openclaw.json"
grep '^OPENCLAW_HOOK_TOKEN=' .env | cut -d= -f2- | docker exec -i -u sandbox "$C" python3 -c '
import json, os, shutil, sys
p = "/sandbox/.openclaw/openclaw.json"
if not os.path.exists(p + ".pre-hooks"):
    shutil.copy2(p, p + ".pre-hooks")
tok = sys.stdin.read().strip()
assert tok, "OPENCLAW_HOOK_TOKEN is empty in .env"
d = json.load(open(p))
d["hooks"] = {"enabled": True, "token": tok, "path": "/hooks",
              "allowedAgentIds": ["main"], "allowRequestSessionKey": False}
json.dump(d, open(p, "w"), indent=2)
print("   hooks enabled (backup: openclaw.json.pre-hooks)")
'

echo "==> 2. AGENTS.md"
docker exec -u sandbox "$C" sh -c "[ -f $WS/AGENTS.md.orig ] || cp $WS/AGENTS.md $WS/AGENTS.md.orig"
docker exec -i -u sandbox "$C" sh -c "cat > $WS/AGENTS.md" < openclaw/AGENTS.md
echo "   replaced (backup: AGENTS.md.orig)"

echo "==> 3. port forward 127.0.0.1:18789 -> sandbox gateway"
# NemoClaw usually already runs "openshell ... forward service log-triage --target-port 18789".
if curl -s -o /dev/null http://127.0.0.1:18789/; then
  echo "   already forwarded"
else
  "$HOME/.local/bin/openshell" forward start -d 127.0.0.1:18789 log-triage
fi
