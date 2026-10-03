# frontline

Log Triage Agent: a live dashboard where fake bank service logs stream in, Error lines are grouped into incidents, and an AI agent triages each incident (severity, likely cause, first step) and assigns it to the owning team. All AI can run locally on a Dell GB10.

## Run it

First time:

```bash
scripts/setup_mac.sh     # MacBook (Homebrew)
scripts/setup_dell.sh    # Dell GB10 (apt)
```

This creates `.venv`, installs Python and npm packages, builds the frontend, and creates `.env` from `.env.example`. Put your `LLM_API_KEY` in `.env`.

Then:

```bash
scripts/run.sh   # one server on http://127.0.0.1:8000 (API + built frontend)
scripts/dev.sh   # development: backend with reload + Vite on http://localhost:5173
```

## Switching models

Edit only `.env`:

| Engine | LLM_BASE_URL | LLM_MODEL |
|---|---|---|
| OpenAI | `https://api.openai.com/v1` | a small OpenAI model |
| Ollama | `http://127.0.0.1:11434/v1` | the local model tag |
| vLLM | `http://127.0.0.1:8001/v1` | the served model name |

## Layout

- `backend/`: FastAPI app, log generator, grouping, agent
- `frontend/`: React + Vite + TypeScript + Tailwind dashboard
- `shared/`: folder shared with the OpenClaw sandbox
- `scripts/`: setup, run and dev scripts
- `design/`: Stitch export used as the visual reference
