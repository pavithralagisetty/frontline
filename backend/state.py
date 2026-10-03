"""In-memory app state and fan-out of live events to every open stream."""

import asyncio
from collections import deque
from typing import Any

MAX_LOGS = 200


class Hub:
    def __init__(self) -> None:
        self.logs: deque[dict[str, Any]] = deque(maxlen=MAX_LOGS)
        self.incidents: dict[str, dict[str, Any]] = {}
        self._subscribers: set[asyncio.Queue] = set()
        self._next_id = 1

    def new_log_id(self) -> int:
        i = self._next_id
        self._next_id += 1
        return i

    def publish(self, event: str, data: Any) -> None:
        for q in list(self._subscribers):
            try:
                q.put_nowait((event, data))
            except asyncio.QueueFull:
                # A stuck client should not slow everyone else down; it will resync on reconnect.
                self._subscribers.discard(q)

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=1000)
        self._subscribers.add(q)
        return q

    def unsubscribe(self, q: asyncio.Queue) -> None:
        self._subscribers.discard(q)


hub = Hub()
