"""TriageResult and validation of the model's JSON reply."""

import json
import re
from typing import Literal

from pydantic import BaseModel, Field, ValidationError, field_validator

Severity = Literal["Critical", "High", "Medium", "Low"]


class AgentStep(BaseModel):
    name: str
    detail: str = ""
    done: bool = True


class TriageResult(BaseModel):
    severity: Severity
    title: str = Field(min_length=3, max_length=120)
    likely_cause: str = Field(min_length=3, max_length=400)
    first_step: str = Field(min_length=3, max_length=400)
    owner: str = Field(min_length=1, max_length=80)
    agent_steps: list[AgentStep] = Field(default_factory=list)
    confidence: float = Field(default=0.5, ge=0, le=1)

    @field_validator("severity", mode="before")
    @classmethod
    def _cap(cls, v: object) -> object:
        return v.strip().capitalize() if isinstance(v, str) else v


class InvalidReply(ValueError):
    pass


def _extract_json(text: str) -> dict:
    # Local models sometimes wrap JSON in ``` fences or add a <think> block first.
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.S).strip()
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.S)
    if fenced:
        text = fenced.group(1)
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end <= start:
        raise InvalidReply("no JSON object in reply")
    try:
        return json.loads(text[start : end + 1])
    except json.JSONDecodeError as e:
        raise InvalidReply(f"bad JSON: {e}") from e


def parse(text: str) -> TriageResult:
    data = _extract_json(text)
    try:
        return TriageResult.model_validate(data)
    except ValidationError as e:
        raise InvalidReply(f"schema: {e.errors()[0]['loc']} {e.errors()[0]['msg']}") from e
