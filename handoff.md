# Log Triage Agent: Hackathon Handoff

Context for Claude Code, running on the Dell Pro Max with GB10. Read this fully before touching any code.

## How I want you to work

- Ask clarifying questions and confirm the approach before writing code. Push back when you see a better path.
- Say "I'm not sure" instead of guessing. "It might work" and "it will work" are different statements.
- Flag UX, performance and architecture problems as soon as you notice them.
- Keep explanations short and technical. When there are several valid approaches, show the tradeoffs.
- Ask before running anything that installs software, uses sudo, rebuilds the sandbox or restarts services.
- Never print, log or commit secrets (bot tokens, API keys).

## Event constraints

- Dell x NVIDIA AI Hackathon, Boston, Saturday Oct 3 2026. Doors 9 AM, awards by 9 PM. Submission deadline: ask me.
- Build an always-on business AI agent that runs 100% locally on the Dell Pro Max with GB10. No cloud inference.
- Required stack: at least one of OpenClaw, NemoClaw, OpenShell (organizers confirmed "one or more"). We use all three.
- The demo must run on this machine.

## The project

An agent that watches production logs, detects failures, triages severity and likely root cause, assigns the owner, and alerts the team.

Pitch: production logs contain customer data and secrets, so companies don't want them going to cloud LLMs. This runs fully local, and the chat agent runs in a sandbox with a restrictive network policy.

Differentiator to show in the demo: reasoning that rules can't do. Example: kill a database in the toy services, three services start failing, the agent identifies one root cause, assigns one owner instead of paging three teams, and explains why in plain English.

## Decided architecture

```
Toy services -> logs -> Python backend (on host)
                           |  triage agent loop
                           v
                    Ollama gpt-oss:120b (host, 127.0.0.1:11434)
                           |
                           v
          Dashboard (teammates' UI)   +   Telegram alert to team group
                                                    |
                                    team replies in Telegram
                                                    v
                         OpenClaw agent (inside NemoClaw/OpenShell sandbox)
                         answers follow-ups by calling the backend API
```

1. The Python backend (written by teammates) does triage by calling local Ollama directly. It currently calls cloud gpt-4o-mini and must be switched.
2. The backend posts each new incident to a Telegram group using the bot token, including the incident ID.
3. OpenClaw, which already polls the same bot, handles replies like "why do you think it's the release?", "show the last 20 errors", "reassign to Marcus" by calling the backend API.
4. Telegram was chosen over Slack because it already works. Mention in the pitch that Slack works the same way.

Rejected options and why:
- Routing triage itself through OpenClaw: would mean rewriting the teammates' working agent loop, and the OpenClaw gateway API for structured results is unknown. Too risky for the time left.
- OpenClaw only sending alerts: a webhook does that. OpenClaw must handle two-way conversation to justify itself.

## Teammates' dashboard (current state)

- Python backend. Frontend stack unknown, check the repo.
- Shows live logs with service filters, flagged errors, incidents with severity, likely cause, first step, assigned owner, Reassign / Resolve / Acknowledge buttons, an escalation countdown, "Agent steps: 6" per incident, and metrics (log lines processed, incidents assigned, avg time to assign, open incidents).
- Currently labeled "Cloud model · development mode" and "Engine: gpt-4o-mini (cloud - direct mode)". These labels must change.
- With gpt-4o-mini, 6 agent steps take about 1.7s. Locally, expect much slower (estimate 20 to 40s per incident, unverified).

## Machine state (verified)

- Dell Pro Max GB10, aarch64, user `dell`, hostname `promaxgb10-968c`. NemoClaw detects it as a DGX Spark.
- I connect over SSH from my laptop.
- Docker works; user `dell` is in the docker group.

### Ollama

- Installed as a systemd service, runs as user `ollama`. Models in `/usr/share/ollama/.ollama/models`.
- Models: `gpt-oss:120b` (65 GB, main model), `qwen3-vl:30b` (19 GB, faster fallback), `bge-m3:latest` (embeddings, useful for clustering errors and finding similar past incidents).
- Systemd overrides in place: `OLLAMA_HOST=127.0.0.1:11434`, `OLLAMA_CONTEXT_LENGTH=32768`. NemoClaw also set a cuda_v13 backend override for DGX Spark.
- OpenAI-compatible endpoint: `http://127.0.0.1:11434/v1`.

Measured with `ollama run --verbose`:
- Output speed about 43 tok/s.
- gpt-oss reasons before answering. Default reasoning used 1,100 tokens and 27s for a 250 word answer. With `--think=low`: 369 tokens, 8.8s. Use low reasoning for the agent; go to medium only if triage quality is shallow.
- Prompt processing speed on long inputs is NOT yet measured. Test with:

```bash
for i in $(seq 1 300); do echo "2026-10-03 12:00:$i ERROR payment-service ConnectionPoolTimeout: could not acquire connection after 30000ms"; done > /tmp/fake.log
ollama run gpt-oss:120b --verbose --think=low "Give the root cause in one line: $(cat /tmp/fake.log)"
```

### NemoClaw / OpenShell / OpenClaw

- Installed via `curl -fsSL https://www.nvidia.com/nemoclaw.sh | NEMOCLAW_PROVIDER=ollama NEMOCLAW_MODEL=gpt-oss:120b bash`.
- CLI at `~/.local/bin/nemoclaw` (run `source ~/.bashrc` if not found).
- Sandbox name `log-triage`. OpenShell 0.0.116 (docker). OpenClaw v2026.7.1. Policy tier Balanced.
- Inference provider `ollama-local`, model `gpt-oss:120b`. Inside the sandbox, inference goes to `https://inference.local/v1`, routed by the OpenShell gateway to Ollama via an auth proxy on host port 11435. Status showed all inference checks healthy and the sandbox GPU enabled.
- Reasoning effort for OpenClaw's model calls is not configured yet. Check whether NemoClaw/OpenClaw supports it; otherwise try `Reasoning: low` at the top of the system prompt (standard for gpt-oss, untested here).

### Telegram

- Configured during onboarding. Bot token stored by NemoClaw; ask me to export it as `TELEGRAM_BOT_TOKEN` if the backend needs it.
- In `/sandbox/.openclaw/openclaw.json`: `allowFrom: ["8542643455"]`, `dmPolicy: allowlist`, `groupPolicy: open`.
- IN PROGRESS: adding a second user `7347044152`. `TELEGRAM_ALLOWED_IDS="8542643455,7347044152"` was exported and `rebuild` alone did not apply it. Next attempt is `nemoclaw log-triage channels add telegram` then `nemoclaw log-triage rebuild` in the same shell. Verify with the grep below. Don't spend long on this; the group chat works regardless since groupPolicy is open.
- Never call `getUpdates` with the bot token from the backend or a script. OpenClaw is already long-polling and the two will conflict. Sending with `sendMessage` from the backend is fine.
- To get the team group's chat ID, temporarily add `@RawDataBot` to the group (ID is negative), then remove it.

### Sandbox policy facts that matter

- Filesystem paths in the policy are container paths, not host paths. The sandbox cannot see host files. Writable: `/tmp`, `/sandbox/.openclaw`, `/sandbox/.nemoclaw`.
- I'm not sure files created inside the sandbox survive a rebuild. Keep all code on the host and in Git.
- Network: `local_inference` already allows `host.openshell.internal` on ports 8081, 11434, 11435, 8000 (GET and POST) for binaries `openclaw`, `node`, `curl`, `python3`. So the backend API on host port 8000 should be reachable from OpenClaw, OR add a dedicated policy rule for the backend's port (cleaner).
- Unknown: a backend bound to `127.0.0.1` on the host is probably NOT reachable from the container. Verify from inside the sandbox with curl. Avoid binding to `0.0.0.0` on hackathon Wi-Fi unless firewalled; prefer the Docker bridge interface.
- Balanced tier also allows NVIDIA cloud inference (`integrate.api.nvidia.com`), Hugging Face, PyPI, npm, brew, ClawHub, Telegram, OpenClaw docs/API. This contradicts the "logs can't leave" pitch. Tighten near the end, after everything works: keep local inference, managed inference, OpenClaw gateway, Telegram, and the backend rule. Check `nemoclaw log-triage --help` for the remove command. Show the final short policy on screen in the demo.

## Task plan

Do these in order. Confirm with me before each step.

1. **Tool calling sanity check.** Confirm gpt-oss returns proper `tool_calls` through Ollama's OpenAI endpoint. I'm not sure Ollama accepts `reasoning_effort` here; if it errors, remove it and find the right way to set low reasoning.

```bash
curl http://127.0.0.1:11434/v1/chat/completions -H "Content-Type: application/json" -d '{
  "model": "gpt-oss:120b",
  "reasoning_effort": "low",
  "messages": [{"role": "user", "content": "Check the error rate for payments-service"}],
  "tools": [{"type": "function", "function": {
    "name": "get_error_rate",
    "description": "Get the current error rate for a service",
    "parameters": {"type": "object", "properties": {"service": {"type": "string"}}, "required": ["service"]}
  }}]
}'
```

2. **Read the backend.** Find the LLM client, the agent loop (6 steps), the tools, the prompts, and how results reach the UI. Report whether it uses real function calling or JSON-in-prompt. Summarize before changing anything.
3. **Switch to Ollama.** Base URL `http://127.0.0.1:11434/v1`, model `gpt-oss:120b`, dummy API key, low reasoning. Remove the cloud dependency entirely (no OpenAI key needed at runtime). Make the model and URL configurable via env vars so `qwen3-vl:30b` is a one-line fallback.
4. **Fix labels.** Replace the cloud wording with something like "Local model · gpt-oss 120b on Dell GB10".
5. **Measure latency per incident.** If it's too slow for a live demo: cut agent steps, shorten prompts, stream each agent step to the UI as it happens (turns waiting into a demo feature), or fall back to qwen3-vl:30b.
6. **Telegram alerts from the backend.** Post each new incident to the team group with incident ID, severity, likely cause, owner and a pointer to the dashboard.
7. **Backend API for OpenClaw.** Small read-mostly API: get incident by ID, get recent logs for an incident, and optionally acknowledge / reassign. Make it reachable from the sandbox (see policy notes).
8. **Teach OpenClaw its job.** Give it instructions and tools to answer follow-ups in Telegram using the backend API. I don't know the right mechanism yet (workspace instruction files, skills, or config). Check docs.openclaw.ai and docs.nvidia.com/nemoclaw before building. Remember rebuilds may wipe sandbox files.
9. **Tighten the network policy** and capture it for the demo.
10. **Rehearse the demo**: inject a fault, watch the dashboard triage it, receive the Telegram alert, ask a follow-up in Telegram, OpenClaw answers.

## Useful commands

```bash
nemoclaw log-triage status
nemoclaw log-triage logs --follow
nemoclaw log-triage connect          # shell into sandbox; then `openclaw tui`
nemoclaw launch log-triage           # talk to the agent from the terminal
nemoclaw log-triage dashboard-url --quiet
nemoclaw log-triage policy-add
nemoclaw log-triage channels add telegram
nemoclaw log-triage rebuild
openshell term                       # host monitoring TUI, approve or deny network requests
openshell forward list
ollama ps                            # confirms which model is loaded and in use
systemctl cat ollama | grep -E "CONTEXT|HOST"
grep -n -A5 "allowFrom" /sandbox/.openclaw/openclaw.json   # inside sandbox
```

Docs: https://docs.nvidia.com/nemoclaw/latest/ , https://docs.openclaw.ai , https://build.nvidia.com/spark/nemoclaw/instructions

## Open questions to ask me

- Submission deadline and demo length.
- Where the backend repo lives on this machine and how to run it.
- Whether the toy log generator already exists in the teammates' code or needs building.
