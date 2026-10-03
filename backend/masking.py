"""Hide secrets in log text before it is shown or sent to the agent."""

import re


def _card(m: re.Match) -> str:
    digits = re.sub(r"\D", "", m.group())
    return f"**** {digits[-4:]}"


def _iban(m: re.Match) -> str:
    v = m.group()
    return f"{v[:4]}****{v[-4:]}"


_RULES: list[tuple[re.Pattern, object]] = [
    # Card numbers: 13 to 19 digits, optionally split by spaces or dashes.
    (re.compile(r"\b(?:\d[ -]?){12,18}\d\b"), _card),
    # IBAN style account numbers.
    (re.compile(r"\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b"), _iban),
    # Bearer tokens and JWTs.
    (re.compile(r"(?i)\bbearer\s+[A-Za-z0-9._~+/=-]+"), "Bearer [REDACTED]"),
    (re.compile(r"\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+"), "[REDACTED_JWT]"),
    # API keys like sk_live_..., pk_test_...
    (re.compile(r"\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]+"), "[REDACTED_KEY]"),
    # key=value secrets.
    (re.compile(r"(?i)\b(password|passwd|pwd|secret|token|api_key|otp)=\S+"), r"\1=[REDACTED]"),
    # Emails: keep the first letter and the domain.
    (re.compile(r"\b([A-Za-z0-9])[A-Za-z0-9._%+-]*@([A-Za-z0-9.-]+\.[A-Za-z]{2,})\b"), r"\1***@\2"),
]


def mask(text: str) -> str:
    for pattern, repl in _RULES:
        text = pattern.sub(repl, text)
    return text
