"""Authentication for the private Explore surface.

The posting-level lookup is sensitive, so it sits behind a password. We reuse the
same PBKDF2 scheme as the Streamlit app (`pbkdf2_sha256$iterations$salt$digest`)
so a single configured hash works for both. Nothing secret is committed: the
verifier is sourced, in order, from

  1. ``JOBADS_DASHBOARD_PASSWORD_HASH``  (production — a salted PBKDF2 hash)
  2. ``JOBADS_DASHBOARD_PASSWORD``       (plain password, convenient for local dev)
  3. the macOS Keychain entry            (dev fallback on this machine only)

A successful login mints a short HMAC-signed session token stored in an
httpOnly cookie. The signing secret comes from ``JOBADS_API_SESSION_SECRET`` or,
if unset, a random per-process secret (logins simply expire on restart in dev).
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import logging
import os
import secrets
import subprocess
import sys
import time

_log = logging.getLogger("api.auth")

# --------------------------------------------------------------------------- #
# Password verification (PBKDF2, matching src/jobads_dashboard/dashboard/app.py)
# --------------------------------------------------------------------------- #

PASSWORD_HASH_PREFIX = "pbkdf2_sha256"
PASSWORD_HASH_ITERATIONS = 240_000
# Reject hashes below the current default — a hash weaker than what we generate
# today should not be honoured (S13). 240k is the project default; OWASP guidance
# for PBKDF2-SHA256 is higher still.
PASSWORD_HASH_MIN_ITERATIONS = 240_000
PASSWORD_HASH_MAX_ITERATIONS = 1_000_000

PASSWORD_HASH_ENV = "JOBADS_DASHBOARD_PASSWORD_HASH"
PASSWORD_PLAIN_ENV = "JOBADS_DASHBOARD_PASSWORD"

# macOS Keychain coordinates (dev fallback only).
_KEYCHAIN_ACCOUNT = "jobads-dashboard-public"
_KEYCHAIN_SERVICE = "jobads-dashboard-public-password"


def _hash_password(password: str, salt: bytes, iterations: int) -> bytes:
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)


def _verify_against_hash(password: str, password_hash: str) -> bool:
    parts = password_hash.split("$")
    if len(parts) != 4 or parts[0] != PASSWORD_HASH_PREFIX:
        return False
    try:
        iterations = int(parts[1])
        if not (PASSWORD_HASH_MIN_ITERATIONS <= iterations <= PASSWORD_HASH_MAX_ITERATIONS):
            return False
        salt = base64.urlsafe_b64decode(parts[2].encode("ascii"))
        expected = base64.urlsafe_b64decode(parts[3].encode("ascii"))
    except (ValueError, TypeError):
        return False
    candidate = _hash_password(password, salt, iterations)
    return hmac.compare_digest(candidate, expected)


def _keychain_password() -> str | None:
    """Read the dev password from the macOS Keychain, or None if unavailable."""
    if sys.platform != "darwin":
        return None
    try:
        out = subprocess.run(
            [
                "security",
                "find-generic-password",
                "-a",
                _KEYCHAIN_ACCOUNT,
                "-s",
                _KEYCHAIN_SERVICE,
                "-w",
            ],
            capture_output=True,
            text=True,
            timeout=5,
        )
    except (OSError, subprocess.SubprocessError):
        return None
    if out.returncode != 0:
        return None
    value = out.stdout.strip()
    return value or None


# S11: cache the keychain presence result so the subprocess fork runs at most
# once per process. The production env-hash/plain-password paths short-circuit
# before reaching this and are intentionally NOT cached (they honour runtime env
# changes without a restart). Only the slow Keychain fallback is memoized.
_keychain_presence_cache: list[bool | None] = [None]  # list so we can mutate in-place


def _keychain_present() -> bool:
    """Return True if the macOS Keychain has a dev password, cached after first call."""
    if _keychain_presence_cache[0] is None:
        _keychain_presence_cache[0] = _keychain_password() is not None
    return _keychain_presence_cache[0]


def auth_configured() -> bool:
    """True if any password source is available (so the surface can be unlocked)."""
    if os.environ.get(PASSWORD_HASH_ENV, "").strip():
        return True
    if os.environ.get(PASSWORD_PLAIN_ENV, "").strip():
        return True
    return _keychain_present()


def verify_password(password: str) -> bool:
    """Verify a submitted password against the configured source (constant-time)."""
    if not password:
        return False
    configured_hash = os.environ.get(PASSWORD_HASH_ENV, "").strip()
    if configured_hash:
        return _verify_against_hash(password, configured_hash)
    plain = os.environ.get(PASSWORD_PLAIN_ENV, "").strip()
    if not plain:
        plain = _keychain_password() or ""
    if not plain:
        return False
    return hmac.compare_digest(password.encode("utf-8"), plain.encode("utf-8"))


def _warn_if_plaintext_password() -> None:
    """Warn (once, at import) if a plaintext password is the active source with no
    hash configured — convenient for local dev, but discouraged in production (S14)."""
    if os.environ.get(PASSWORD_PLAIN_ENV, "").strip() and not os.environ.get(PASSWORD_HASH_ENV, "").strip():
        _log.warning(
            "%s (plaintext) is set as the active password source; prefer %s "
            "(a PBKDF2 hash) in production.",
            PASSWORD_PLAIN_ENV,
            PASSWORD_HASH_ENV,
        )


_warn_if_plaintext_password()


# --------------------------------------------------------------------------- #
# Session tokens — HMAC-signed, httpOnly cookie payload
# --------------------------------------------------------------------------- #

SESSION_SECRET_ENV = "JOBADS_API_SESSION_SECRET"
SESSION_TTL_SECONDS = 8 * 60 * 60  # 8 hours
COOKIE_NAME = "jobads_session"

SESSION_SECRET_MIN_LENGTH = 32


def _resolve_session_secret() -> str:
    """Configured secret (validated) or a per-process random one.

    A configured-but-short secret weakens the session HMAC, so fail fast at
    startup rather than signing with it (S15). Unset means a random per-process
    secret: sessions then drop on restart and don't validate across workers."""
    configured = os.environ.get(SESSION_SECRET_ENV, "").strip()
    if configured:
        if len(configured) < SESSION_SECRET_MIN_LENGTH:
            raise RuntimeError(
                f"{SESSION_SECRET_ENV} must be at least {SESSION_SECRET_MIN_LENGTH} characters."
            )
        return configured
    return secrets.token_hex(32)


_SESSION_SECRET = _resolve_session_secret()


def _b64e(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _b64d(text: str) -> bytes:
    pad = "=" * (-len(text) % 4)
    return base64.urlsafe_b64decode(text + pad)


def mint_session(now: float | None = None) -> str:
    """Return a signed ``payload.signature`` token valid for SESSION_TTL_SECONDS."""
    issued = int(now if now is not None else time.time())
    payload = {"iat": issued, "exp": issued + SESSION_TTL_SECONDS}
    body = _b64e(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    sig = _b64e(hmac.new(_SESSION_SECRET.encode("utf-8"), body.encode("ascii"), hashlib.sha256).digest())
    return f"{body}.{sig}"


def verify_session(token: str | None, now: float | None = None) -> bool:
    """True if the token is well-formed, correctly signed, and unexpired."""
    if not token or "." not in token:
        return False
    body, _, sig = token.partition(".")
    expected = _b64e(hmac.new(_SESSION_SECRET.encode("utf-8"), body.encode("ascii"), hashlib.sha256).digest())
    if not hmac.compare_digest(sig, expected):
        return False
    try:
        payload = json.loads(_b64d(body))
    except (ValueError, TypeError):
        return False
    exp = payload.get("exp")
    if not isinstance(exp, int):
        return False
    return (now if now is not None else time.time()) < exp
