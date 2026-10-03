"""Incident alerts. A separate process that listens to the dashboard's live event stream
and announces each newly assigned or escalated incident to the team's Telegram group.

Run next to the backend:  .venv/bin/python -m backend.alerts

ALERT_VIA=openclaw (default): hand the incident to the OpenClaw agent through its webhook
  (POST /hooks/agent); OpenClaw writes the alert and posts it to every target in
  ALERT_TARGETS (for example "telegram:-5188313482,slack:channel:C0123"), so follow-up
  questions there are answered by the same agent. One agent run per target.
ALERT_VIA=direct: post a fixed-format message with the Telegram Bot API (fallback). Only
  sendMessage is used; never call getUpdates with this bot token, OpenClaw is already
  long-polling the same bot and the two would conflict.
"""

import asyncio
import html
import json
import logging
import os
import time
from typing import Any

import httpx
from dotenv import load_dotenv

from .config import ROOT

load_dotenv(ROOT / ".env")

log = logging.getLogger("alerts")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
# httpx logs every request URL at INFO, and Telegram URLs contain the bot token.
logging.getLogger("httpx").setLevel(logging.WARNING)

VIA = os.environ.get("ALERT_VIA", "openclaw")
CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "")
MIN_SEVERITY = os.environ.get("TELEGRAM_MIN_SEVERITY", "High")
BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
HOOK_URL = os.environ.get("OPENCLAW_HOOK_URL", "")
HOOK_TOKEN = os.environ.get("OPENCLAW_HOOK_TOKEN", "")
BACKEND = f"http://{os.environ.get('HOST', '127.0.0.1')}:{os.environ.get('PORT', '8000')}"
# "channel:to" pairs; defaults to the Telegram group alone.
TARGETS = [
    tuple(t.strip().split(":", 1))
    for t in (os.environ.get("ALERT_TARGETS") or (f"telegram:{CHAT_ID}" if CHAT_ID else "")).split(",")
    if ":" in t
]

RANK = {"Low": 0, "Medium": 1, "High": 2, "Critical": 3}
ICON = {"Critical": "🔴", "High": "🟠", "Medium": "🟡", "Low": "⚪"}


def _name(person: dict | None) -> str:
    return person["name"] if person else "nobody on file"


def alert_kind(inc: dict[str, Any]) -> str | None:
    if inc.get("status") not in ("assigned", "escalated") or not inc.get("severity"):
        return None
    if RANK.get(inc["severity"], 0) < RANK.get(MIN_SEVERITY, 2):
        return None
    return inc["status"]


def _escalates_in(inc: dict[str, Any]) -> str:
    if not inc.get("escalate_at"):
        return "no countdown"
    return f"{max(0, round((inc['escalate_at'] - time.time()) / 60))} min unless acknowledged"


# ---------- OpenClaw: the agent writes and posts the alert (see openclaw/AGENTS.md) ----------

def hook_message(inc: dict[str, Any], kind: str, channel: str) -> str:
    lines = [
        "INCIDENT ALERT",
        f"post_to: {channel}",
        f"id: {inc['id']}",
        f"severity: {inc['severity']}",
        f"service: {inc['service']}",
        f"title: {inc['title']}",
        f"likely_cause: {inc['likely_cause']}",
        f"first_step: {inc['first_step']}",
        f"owner: {_name(inc['owner'])}",
        f"team: {inc.get('team') or 'no team'}",
        f"backup: {_name(inc.get('backup'))}",
        f"error_count: {inc['count']}",
    ]
    if kind == "escalated":
        lines.append(f"escalated: yes, {_name(inc.get('previous_owner'))} did not acknowledge")
    else:
        lines.append(f"escalates_to_backup_in: {_escalates_in(inc)}")
    return "\n".join(lines)


async def send_openclaw(client: httpx.AsyncClient, inc: dict[str, Any], kind: str) -> bool:
    ok = False
    for channel, to in TARGETS:
        res = await client.post(
            HOOK_URL,
            headers={"Authorization": f"Bearer {HOOK_TOKEN}"},
            json={
                "message": hook_message(inc, kind, channel),
                "name": "Frontline dashboard",
                "agentId": "main",
                "deliver": True,
                "channel": channel,
                "to": to,
                "timeoutSeconds": 120,
            },
        )
        if res.status_code != 200:
            log.warning("OpenClaw hook for %s failed: HTTP %s %s", channel, res.status_code, res.text[:200])
        else:
            ok = True  # 200 means accepted; OpenClaw runs the agent and posts afterwards
    return ok


# ---------- direct: fixed-format message through the Telegram Bot API (fallback) ----------

def format_direct(inc: dict[str, Any], kind: str) -> str:
    e = html.escape
    sev = inc["severity"]
    lines = [f"{ICON.get(sev, '')} <b>{e(sev)} · {e(inc['id'])} · {e(inc['service'])}</b>"]
    if kind == "escalated":
        lines.append(
            f"⏫ <b>Escalated</b>: {e(_name(inc.get('previous_owner')))} did not acknowledge, "
            f"now assigned to <b>{e(_name(inc['owner']))}</b>"
        )
    lines += [
        f"<b>{e(inc['title'] or '')}</b>",
        "",
        f"<b>Likely cause:</b> {e(inc['likely_cause'] or '')}",
        f"<b>First step:</b> {e(inc['first_step'] or '')}",
        "",
        f"<b>Owner:</b> {e(_name(inc['owner']))} ({e(inc.get('team') or 'no team')})"
        f" · backup {e(_name(inc.get('backup')))}",
    ]
    if kind == "assigned" and inc.get("escalate_at"):
        lines.append(f"Escalates to the backup in {_escalates_in(inc)}.")
    lines += ["", f"Full details on the triage dashboard. Reply here to ask the agent about {e(inc['id'])}."]
    return "\n".join(lines)


async def send_direct(client: httpx.AsyncClient, inc: dict[str, Any], kind: str) -> bool:
    res = await client.post(
        f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
        json={"chat_id": CHAT_ID, "text": format_direct(inc, kind), "parse_mode": "HTML",
              "disable_web_page_preview": True},
    )
    if res.status_code != 200:
        # Never log the exception or URL: both contain the token.
        try:
            desc = res.json().get("description", "")
        except ValueError:
            desc = ""
        log.warning("sendMessage failed: HTTP %s %s", res.status_code, desc[:200])
        return False
    return True


# ---------- event loop ----------

async def run() -> None:
    send = send_openclaw if VIA == "openclaw" else send_direct
    sent: set[tuple] = set()  # (incident id, first_seen, kind); first_seen tells apart IDs reused after a backend restart
    async with httpx.AsyncClient(timeout=httpx.Timeout(10, read=60)) as client:
        while True:
            try:
                async with client.stream("GET", f"{BACKEND}/api/stream") as stream:
                    dest = ", ".join(f"{c} {t}" for c, t in TARGETS) if VIA == "openclaw" else f"telegram {CHAT_ID}"
                    log.info("listening to %s/api/stream, sending %s+ via %s to %s", BACKEND, MIN_SEVERITY, VIA, dest)
                    event = None
                    async for line in stream.aiter_lines():
                        if line.startswith("event: "):
                            event = line[7:]
                        elif line.startswith("data: ") and event in ("incident_updated", "incident_created"):
                            inc = json.loads(line[6:])
                            kind = alert_kind(inc)
                            key = (inc["id"], inc["first_seen"], kind)
                            if kind and key not in sent:
                                sent.add(key)
                                if await send(client, inc, kind):
                                    log.info("alerted %s %s (%s) via %s", inc["id"], inc["severity"], kind, VIA)
            except (httpx.HTTPError, json.JSONDecodeError) as e:
                log.warning("stream lost (%s), retrying in 3 s", type(e).__name__)
            await asyncio.sleep(3)


def main() -> None:
    if VIA == "openclaw" and not (HOOK_URL and HOOK_TOKEN and TARGETS):
        raise SystemExit("Set OPENCLAW_HOOK_URL, OPENCLAW_HOOK_TOKEN and ALERT_TARGETS in .env, or use ALERT_VIA=direct.")
    if VIA == "direct" and not (BOT_TOKEN and CHAT_ID):
        raise SystemExit("Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env, or use ALERT_VIA=openclaw.")
    asyncio.run(run())


if __name__ == "__main__":
    main()
