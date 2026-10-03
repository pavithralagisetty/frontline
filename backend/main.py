"""FastAPI app: REST routes, live event stream, and the built frontend."""

import asyncio
import json
from contextlib import asynccontextmanager
from urllib.parse import urlparse

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from .config import ROOT, settings
from .generator import SCENARIOS, SERVICES, LogGenerator, RawLine
from .masking import mask
from .state import hub
from .stats import stats

DIST = ROOT / "frontend" / "dist"

generator = LogGenerator(settings.log_rate_per_sec, settings.error_rate, settings.warn_rate)


async def on_line(raw: RawLine) -> None:
    line = {
        "id": hub.new_log_id(),
        "ts": raw.ts,
        "service": raw.service,
        "level": raw.level,
        "message": mask(raw.message),  # secrets never leave this function unmasked
        "incident_id": None,
    }
    hub.logs.append(line)
    stats.count_line(raw.level)
    hub.publish("log", line)


async def stats_ticker() -> None:
    while True:
        await asyncio.sleep(1)
        hub.publish("stats", stats.snapshot())


@asynccontextmanager
async def lifespan(_: FastAPI):
    tasks = [asyncio.create_task(generator.run(on_line)), asyncio.create_task(stats_ticker())]
    yield
    for t in tasks:
        t.cancel()


app = FastAPI(title="Log Triage Agent", lifespan=lifespan)


def _is_local(url: str) -> bool:
    host = urlparse(url).hostname or ""
    return host in {"localhost", "127.0.0.1", "::1"} or host.startswith(("10.", "192.168.", "172."))


def app_config() -> dict:
    return {
        "engine": settings.llm_model,
        "agent_mode": settings.agent_mode,
        "local": _is_local(settings.llm_base_url),
        "services": SERVICES,
    }


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", **app_config()}


@app.get("/api/state")
def state() -> dict:
    return {
        "logs": list(hub.logs),
        "incidents": list(hub.incidents.values()),
        "team": [],
        "stats": stats.snapshot(),
        "config": app_config(),
    }


@app.get("/api/stream")
async def stream(request: Request) -> StreamingResponse:
    q = hub.subscribe()

    async def events():
        try:
            yield "retry: 2000\n\n"
            while True:
                if await request.is_disconnected():
                    break
                try:
                    event, data = await asyncio.wait_for(q.get(), timeout=15)
                    yield f"event: {event}\ndata: {json.dumps(data)}\n\n"
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"
        finally:
            hub.unsubscribe(q)

    headers = {"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    return StreamingResponse(events(), media_type="text/event-stream", headers=headers)


@app.post("/api/demo/trigger/{scenario}")
def trigger(scenario: str) -> dict:
    if scenario not in SCENARIOS:
        raise HTTPException(404, f"Unknown scenario. Options: {', '.join(SCENARIOS)}")
    generator.trigger(scenario)
    return {"triggered": scenario}


# Serve the built frontend (npm run build) so the demo needs only one server.
if DIST.is_dir():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str) -> FileResponse:
        file = (DIST / path).resolve()
        if path and file.is_file() and DIST in file.parents:
            return FileResponse(file)
        return FileResponse(DIST / "index.html")
