"""FastAPI app: REST routes, live event stream, and the built frontend."""

import asyncio
import json
import logging
import time
from contextlib import asynccontextmanager
from urllib.parse import urlparse

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from .agent.direct import DirectAgent
from .agent.schema import TriageResult
from .config import ROOT, settings
from .context import Context, gather, load_owners
from .generator import SCENARIOS, SERVICES, LogGenerator, RawLine
from .grouping import OPEN, Grouper
from .masking import mask
from .state import hub
from .stats import stats

log = logging.getLogger("triage")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

DIST = ROOT / "frontend" / "dist"

generator = LogGenerator(settings.log_rate_per_sec, settings.error_rate, settings.warn_rate)
grouper = Grouper(settings.group_window_seconds)
agent = DirectAgent(settings)
MAX_INCIDENTS = 50
_tasks: set[asyncio.Task] = set()  # keep references so triage tasks are not garbage collected


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

    # Only Error lines enter grouping; Info and Warn are display only.
    created = None
    if raw.level == "Error":
        inc, is_new = grouper.add(line, hub.incidents)
        line["incident_id"] = inc["id"]
        created = inc if is_new else None
        if not is_new:
            hub.publish("incident_updated", inc)

    hub.publish("log", line)
    if created:
        _trim_incidents()
        refresh_open_count()
        hub.publish("incident_created", created)
        task = asyncio.create_task(run_triage(created))
        _tasks.add(task)
        task.add_done_callback(_tasks.discard)


def _trim_incidents() -> None:
    while len(hub.incidents) > MAX_INCIDENTS:
        oldest = next((k for k, v in hub.incidents.items() if v["status"] not in OPEN), None)
        if oldest is None:
            break
        del hub.incidents[oldest]


def refresh_open_count() -> None:
    stats.open_incidents = sum(1 for i in hub.incidents.values() if i["status"] in OPEN)


def _person(p: dict | None, team: str | None) -> dict | None:
    return {"name": p["name"], "initials": p["initials"], "team": team} if p else None


async def run_triage(inc: dict) -> None:
    """Analyze a new incident once. On any failure, fall back to High and assign the owner anyway."""
    t0 = time.time()
    ctx: Context = gather(inc, list(hub.logs))
    info = ctx.service_info
    owner_name = info.get("owner", {}).get("name")

    inc["agent_steps"] = ctx.steps + [{"name": "Analyzing", "detail": f"Analyzing with {settings.llm_model}", "done": False}]
    hub.publish("incident_updated", inc)

    errors = list(dict.fromkeys(l["message"] for l in hub.logs if l["incident_id"] == inc["id"]))[:5]
    result: TriageResult | None = None
    try:
        result = await asyncio.wait_for(agent.triage(inc, ctx, errors), timeout=30)
        model_step = {"name": "Analyzed with model", "detail": f"{settings.llm_model} · confidence {result.confidence:.0%}", "done": True}
    except Exception as e:  # timeout, HTTP error, bad JSON: never crash the pipeline
        log.warning("triage failed for %s: %s", inc["id"], type(e).__name__ + ": " + str(e)[:200])
        model_step = {"name": "Analyzed with model", "detail": f"Model failed ({type(e).__name__}), used safety rule", "done": True}

    if result:
        if owner_name and result.owner.strip().lower() != owner_name.lower():
            log.warning("%s: model picked owner %r, using listed owner %r", inc["id"], result.owner, owner_name)
        inc.update(
            severity=result.severity,
            title=result.title,
            likely_cause=result.likely_cause,
            first_step=result.first_step,
            confidence=result.confidence,
        )
    else:
        inc.update(
            severity="High",
            title=f"{inc['service']} errors",
            likely_cause="Agent could not analyze, check logs",
            first_step="Open the flagged log lines for this incident",
            confidence=None,
        )

    now = time.time()
    inc.update(
        owner=_person(info.get("owner"), info.get("team")),
        backup=_person(info.get("backup"), info.get("team")),
        team=info.get("team"),
        status="assigned",
        assigned_at=now,
        analysis_ms=int((now - t0) * 1000),
        agent_steps=ctx.steps
        + [model_step, {"name": "Assigned owner", "detail": owner_name or "No owner on file", "done": True}],
    )
    stats.incidents_assigned += 1
    stats.assign_seconds.append(now - inc["first_seen"])
    refresh_open_count()
    hub.publish("incident_updated", inc)
    log.info("%s %s -> %s (%s ms)", inc["id"], inc["severity"], owner_name, inc["analysis_ms"])


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


def team() -> list[dict]:
    return [
        {"service": svc, "team": v["team"], **v["owner"]}
        for svc, v in load_owners().items()
    ]


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", **app_config()}


@app.get("/api/state")
def state() -> dict:
    return {
        "logs": list(hub.logs),
        "incidents": list(hub.incidents.values()),
        "team": team(),
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
