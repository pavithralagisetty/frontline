"""Gathers what the agent needs for one incident: nearby logs, owner, releases, fix notes.
Everything here is already masked log text or our own data files."""

import json
import re
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any

from .config import ROOT

DATA = ROOT / "backend" / "data"
RELEASE_WINDOW_S = 30 * 60
NEARBY = 20


def load_owners() -> dict[str, Any]:
    return json.loads((DATA / "owners.json").read_text())


def _releases() -> list[dict[str, Any]]:
    path = DATA / "releases.json"
    return json.loads(path.read_text()) if path.exists() else []


@dataclass
class FixNote:
    file: str
    title: str
    keywords: list[str]
    body: str


def load_fixnotes() -> list[FixNote]:
    notes = []
    for path in sorted((DATA / "fixnotes").glob("*.md")):
        text = path.read_text()
        title = re.search(r"^title:\s*(.+)$", text, re.M)
        kw = re.search(r"^keywords:\s*(.+)$", text, re.M)
        body = re.sub(r"^(title|keywords):.*\n", "", text, flags=re.M).strip()
        notes.append(
            FixNote(
                file=path.name,
                title=title.group(1).strip() if title else path.stem,
                keywords=[k.strip() for k in kw.group(1).split(",")] if kw else [],
                body=body,
            )
        )
    return notes


def clock(ts: float) -> str:
    return datetime.fromtimestamp(ts).strftime("%-I:%M %p")


@dataclass
class Context:
    nearby: list[dict[str, Any]]
    service_info: dict[str, Any]
    releases: list[dict[str, Any]]
    fixnotes: list[FixNote]
    steps: list[dict[str, Any]] = field(default_factory=list)


def gather(incident: dict[str, Any], logs: list[dict[str, Any]]) -> Context:
    first_id = incident["line_ids"][0]
    idx = next((i for i, l in enumerate(logs) if l["id"] == first_id), len(logs) - 1)
    nearby = logs[max(0, idx - NEARBY) : idx + NEARBY + 1]

    owners = load_owners()
    info = owners.get(incident["service"], {})

    start = incident["first_seen"]
    releases = [
        r
        for r in _releases()
        if r["service"] == incident["service"] and start - RELEASE_WINDOW_S <= r["deployed_at"] <= start
    ]

    text = incident["first_message"].lower()
    notes = [n for n in load_fixnotes() if any(k.lower() in text for k in n.keywords)]

    steps = [
        {"name": "Read nearby logs", "detail": f"Read {len(nearby)} nearby log lines", "done": True},
        {
            "name": "Looked up owner",
            "detail": f"Owner: {info['owner']['name']}, {info['team']}" if info else "No owner on file",
            "done": True,
        },
        {
            "name": "Checked releases",
            "detail": (
                "; ".join(f"Found release {r['version']} at {clock(r['deployed_at'])}" for r in releases)
                if releases
                else "No releases in the last 30 min"
            ),
            "done": True,
        },
        {
            "name": "Searched fix notes",
            "detail": "Matched fix note: " + ", ".join(n.title.lower() for n in notes) if notes else "No matching fix note",
            "done": True,
        },
    ]
    return Context(nearby=nearby, service_info=info, releases=releases, fixnotes=notes, steps=steps)
