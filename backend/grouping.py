"""Turns Error lines into incidents. Only Error lines ever come in here."""

from typing import Any

OPEN = {"analyzing", "assigned", "acknowledged", "escalated"}


class Grouper:
    def __init__(self, window_seconds: int):
        self.window = window_seconds
        self._next = 1

    def add(self, line: dict[str, Any], incidents: dict[str, dict[str, Any]]) -> tuple[dict[str, Any], bool]:
        """Attach the line to an open incident on the same service seen within the window,
        or create a new one. Returns (incident, created)."""
        for inc in reversed(list(incidents.values())):
            if (
                inc["service"] == line["service"]
                and inc["status"] in OPEN
                and line["ts"] - inc["last_seen"] <= self.window
            ):
                inc["count"] += 1
                inc["last_seen"] = line["ts"]
                inc["line_ids"].append(line["id"])
                return inc, False

        inc_id = f"INC {self._next}"
        self._next += 1
        inc = {
            "id": inc_id,
            "service": line["service"],
            "status": "analyzing",
            "severity": None,
            "title": None,
            "count": 1,
            "first_seen": line["ts"],
            "last_seen": line["ts"],
            "first_message": line["message"],
            "likely_cause": None,
            "first_step": None,
            "owner": None,
            "backup": None,
            "team": None,
            "agent_steps": [],
            "analysis_ms": None,
            "assigned_at": None,
            "escalate_at": None,
            "confidence": None,
            "line_ids": [line["id"]],
        }
        incidents[inc_id] = inc
        return inc, True
