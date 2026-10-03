"""FastAPI app: REST routes, live event stream, and the built frontend."""

import asyncio
import json

from fastapi import FastAPI
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from .config import ROOT, settings

DIST = ROOT / "frontend" / "dist"

app = FastAPI(title="Log Triage Agent")


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "engine": settings.llm_model, "agent_mode": settings.agent_mode}


@app.get("/api/stream")
async def stream() -> StreamingResponse:
    async def events():
        # Phase 0: heartbeat only. Real events (log, incident_*, stats) arrive in Phase 1.
        while True:
            yield f"event: ping\ndata: {json.dumps({'ok': True})}\n\n"
            await asyncio.sleep(15)

    headers = {"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    return StreamingResponse(events(), media_type="text/event-stream", headers=headers)


# Serve the built frontend (npm run build) so the demo needs only one server.
if DIST.is_dir():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str) -> FileResponse:
        file = (DIST / path).resolve()
        if path and file.is_file() and DIST in file.parents:
            return FileResponse(file)
        return FileResponse(DIST / "index.html")
