"""Counters for the top bar and footer."""

import platform
from dataclasses import dataclass, field

import psutil

DEMO_RAM_GB = 128  # the Dell GB10 has 128 GB unified memory; the footer always shows usage out of this


@dataclass
class Stats:
    lines_processed: int = 0
    by_level: dict[str, int] = field(default_factory=lambda: {"Info": 0, "Warn": 0, "Error": 0})
    incidents_assigned: int = 0
    assign_seconds: list[float] = field(default_factory=list)
    open_incidents: int = 0

    def count_line(self, level: str) -> None:
        self.lines_processed += 1
        self.by_level[level] = self.by_level.get(level, 0) + 1

    def snapshot(self) -> dict:
        avg = sum(self.assign_seconds) / len(self.assign_seconds) if self.assign_seconds else None
        return {
            "lines_processed": self.lines_processed,
            "by_level": dict(self.by_level),
            "incidents_assigned": self.incidents_assigned,
            "avg_time_to_assign_s": avg,
            "open_incidents": self.open_incidents,
            "ram_used_gb": round(psutil.virtual_memory().used / 1024**3, 1),
            "ram_total_gb": DEMO_RAM_GB,
            "machine": platform.node().split(".")[0],
        }


stats = Stats()
