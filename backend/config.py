"""Settings loaded from .env. Every path is relative to the project folder."""

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")


def _path(value: str) -> Path:
    p = Path(value)
    return p if p.is_absolute() else (ROOT / p).resolve()


@dataclass(frozen=True)
class Settings:
    llm_base_url: str
    llm_api_key: str
    llm_model: str
    agent_mode: str
    log_rate_per_sec: float
    error_rate: float
    warn_rate: float
    escalation_seconds: int
    group_window_seconds: int
    openclaw_hook_url: str
    openclaw_hook_token: str
    shared_dir: Path
    host: str
    port: int

    def __repr__(self) -> str:  # never leak the key or token into logs
        return f"Settings(model={self.llm_model!r}, mode={self.agent_mode!r}, base_url={self.llm_base_url!r})"


def load() -> Settings:
    e = os.environ.get
    return Settings(
        llm_base_url=e("LLM_BASE_URL", "https://api.openai.com/v1").rstrip("/"),
        llm_api_key=e("LLM_API_KEY", ""),
        llm_model=e("LLM_MODEL", "gpt-4o-mini"),
        agent_mode=e("AGENT_MODE", "direct"),
        log_rate_per_sec=float(e("LOG_RATE_PER_SEC", "1")),
        error_rate=float(e("ERROR_RATE", "0.1")),
        warn_rate=float(e("WARN_RATE", "0.05")),
        escalation_seconds=int(e("ESCALATION_SECONDS", "120")),
        group_window_seconds=int(e("GROUP_WINDOW_SECONDS", "300")),
        openclaw_hook_url=e("OPENCLAW_HOOK_URL", ""),
        openclaw_hook_token=e("OPENCLAW_HOOK_TOKEN", ""),
        shared_dir=_path(e("SHARED_DIR", "./shared")),
        host=e("HOST", "127.0.0.1"),
        port=int(e("PORT", "8000")),
    )


settings = load()
