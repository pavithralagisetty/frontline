"""Common interface for both agent modes."""

from typing import Any, Protocol

from ..context import Context
from .schema import TriageResult


class Agent(Protocol):
    async def triage(self, incident: dict[str, Any], ctx: Context) -> TriageResult:
        """Analyze one new incident. May raise; the caller applies the safety fallback."""
        ...
