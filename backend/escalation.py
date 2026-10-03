"""Countdown timers for Critical incidents. If nobody acknowledges before the timer
ends, the incident moves to the backup on the dashboard and becomes "escalated"."""

import asyncio
import time
from typing import Any, Callable


class Escalator:
    def __init__(self, seconds: int, on_change: Callable[[dict[str, Any]], None]):
        self.seconds = seconds
        self.on_change = on_change
        self._timers: dict[str, asyncio.Task] = {}

    def start(self, inc: dict[str, Any]) -> None:
        self.cancel(inc["id"])
        inc["escalate_at"] = time.time() + self.seconds
        self._timers[inc["id"]] = asyncio.create_task(self._wait(inc))

    def cancel(self, inc_id: str) -> None:
        task = self._timers.pop(inc_id, None)
        if task:
            task.cancel()

    async def _wait(self, inc: dict[str, Any]) -> None:
        try:
            await asyncio.sleep(max(0.0, inc["escalate_at"] - time.time()))
        except asyncio.CancelledError:
            return
        self._timers.pop(inc["id"], None)
        if inc["status"] != "assigned":
            return
        escalate(inc)
        self.on_change(inc)


def escalate(inc: dict[str, Any]) -> None:
    """Move the incident from the owner to the backup."""
    now = time.time()
    previous = inc["owner"]
    inc.update(
        status="escalated",
        owner=inc["backup"],
        backup=previous,  # the original owner can still take it back
        previous_owner=previous,
        escalated_at=now,
        escalate_at=None,
    )
    inc["agent_steps"] = inc["agent_steps"] + [
        {
            "name": "Escalated to backup",
            "detail": f"{previous['name'] if previous else 'Owner'} did not acknowledge, reassigned to "
            f"{inc['owner']['name'] if inc['owner'] else 'backup'}",
            "done": True,
        }
    ]
