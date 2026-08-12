"""Private Explore surface: password auth + posting-level lookup.

The posting lookup is sensitive, so every data route here requires a valid
session cookie minted by ``POST /api/auth``. The cookie is httpOnly and signed;
see ``api/auth.py``.
"""

from __future__ import annotations

import os
import threading
import time

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from pydantic import BaseModel

from .. import auth, core, private
from ..deps import scope_dependency
from ..models import AuthStatus, PostingDetail, PostingsResponse, Scope

router = APIRouter(prefix="/api", tags=["private"])


def _cookie_secure() -> bool:
    """Secure cookies by default; opt out for local http dev (and the http test
    client) with ``JOBADS_API_COOKIE_SECURE=false``. Resolved per request so the
    container's runtime env is honoured regardless of import order."""
    return os.environ.get("JOBADS_API_COOKIE_SECURE", "true").strip().lower() not in {"0", "false", "no"}


class LoginBody(BaseModel):
    password: str


# --------------------------------------------------------------------------- #
# Login rate limiting (S12). In-process, best-effort per-IP throttle against
# brute force on the single shared password. Single-container deploy, so an
# in-memory window is enough; behind the Next proxy the real client IP arrives
# in X-Forwarded-For.
# --------------------------------------------------------------------------- #

_AUTH_FAILURES: dict[str, list[float]] = {}
_AUTH_MAX_FAILURES = 8          # allowed failures per window before lockout
_AUTH_WINDOW = 900.0            # 15 minutes

# Global login-failure ceiling across ALL per-IP keys (S01). A single list of
# timestamps; if total failures across all IPs within the window exceeds this
# cap, all further login attempts are rejected. This prevents an attacker from
# rotating XFF-spoofed per-key buckets to bypass the per-IP lockout.
_GLOBAL_FAILURES: list[float] = []
_GLOBAL_MAX_FAILURES = 50       # global cap within _AUTH_WINDOW

def _trusted_proxies() -> set[str]:
    """Return explicitly configured proxy peers.

    Trust is opt-in. A generic reverse proxy/rewrite may preserve a client-
    supplied X-Forwarded-For header instead of replacing it, so trusting
    loopback by default would let a caller choose their own rate-limit key.
    Deployments may enable this only after the public proxy is known to
    sanitize the header at the trust boundary.
    """
    raw = os.environ.get("JOBADS_API_TRUSTED_PROXY", "").strip()
    return {p.strip() for p in raw.split(",") if p.strip()}


def _client_ip(request: Request) -> str:
    """The per-IP rate-limit key.

    Only honour the client-supplied ``X-Forwarded-For`` when the request's
    socket peer is a trusted proxy; otherwise an attacker rotates the header to
    reset their own backoff and brute-forces the shared password (S06). When the
    peer is untrusted we key on the real socket address.

    For an explicitly trusted, sanitizing single-hop proxy, use the rightmost
    entry. If a multi-proxy topology is added, configure and parse its trusted
    chain deliberately rather than broadening this default."""
    peer = request.client.host if request.client else "unknown"
    if peer in _trusted_proxies():
        xff = request.headers.get("x-forwarded-for")
        if xff:
            return xff.split(",")[-1].strip()
    return peer


_AUTH_FAILURES_MAX_KEYS = 1024   # S10: cap dict size to resist memory exhaustion
_AUTH_RATE_LOCK = threading.Lock()


def _auth_rate_check(ip: str) -> None:
    global _GLOBAL_FAILURES
    now = time.time()

    # S10: sweep stale per-IP keys on every check to keep memory bounded.
    stale = [k for k, ts in _AUTH_FAILURES.items() if all(now - t >= _AUTH_WINDOW for t in ts)]
    for k in stale:
        del _AUTH_FAILURES[k]

    # S10: if the dict is still over the size cap, drop the keys whose most-recent
    # failure is the oldest (they are the coldest, least-active attackers).
    if len(_AUTH_FAILURES) > _AUTH_FAILURES_MAX_KEYS:
        sorted_keys = sorted(_AUTH_FAILURES, key=lambda k: max(_AUTH_FAILURES[k]))
        for k in sorted_keys[: len(_AUTH_FAILURES) - _AUTH_FAILURES_MAX_KEYS]:
            del _AUTH_FAILURES[k]

    # Per-IP check.
    fails = [t for t in _AUTH_FAILURES.get(ip, []) if now - t < _AUTH_WINDOW]
    _AUTH_FAILURES[ip] = fails
    if len(fails) >= _AUTH_MAX_FAILURES:
        # Exponential backoff once over the threshold, capped at the window.
        retry = min(_AUTH_WINDOW, 5 * 2 ** (len(fails) - _AUTH_MAX_FAILURES))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Try again later.",
            headers={"Retry-After": str(int(retry))},
        )

    # S01: global ceiling — reject if total failures across ALL keys within the
    # window exceed the global cap. Prune old entries first.
    _GLOBAL_FAILURES = [t for t in _GLOBAL_FAILURES if now - t < _AUTH_WINDOW]
    if len(_GLOBAL_FAILURES) >= _GLOBAL_MAX_FAILURES:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Try again later.",
            headers={"Retry-After": str(int(_AUTH_WINDOW))},
        )


def _auth_record_failure(ip: str) -> None:
    ts = time.time()
    _AUTH_FAILURES.setdefault(ip, []).append(ts)
    _GLOBAL_FAILURES.append(ts)


def _auth_record_success(ip: str) -> None:
    _AUTH_FAILURES.pop(ip, None)


def _verify_login_attempt(ip: str, password: str) -> bool:
    """Atomically check, verify, and record one login attempt.

    FastAPI runs this sync route in a thread pool. Keeping the failure-window
    check and its state update under one lock prevents a burst of concurrent
    requests from all passing the check before any failure is recorded.
    Password verification is intentionally inside the critical section: this
    endpoint uses one shared credential and serializing attempts is both small
    in scope and part of the brute-force defence.
    """
    with _AUTH_RATE_LOCK:
        _auth_rate_check(ip)
        verified = auth.verify_password(password)
        if verified:
            _auth_record_success(ip)
        else:
            _auth_record_failure(ip)
        return verified


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=auth.COOKIE_NAME,
        value=token,
        max_age=auth.SESSION_TTL_SECONDS,
        httponly=True,
        samesite="lax",
        secure=_cookie_secure(),
        path="/",
    )


def require_session(request: Request) -> None:
    """FastAPI dependency: 401 unless a valid session cookie is present."""
    token = request.cookies.get(auth.COOKIE_NAME)
    if not auth.verify_session(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
        )


def optional_session(request: Request) -> bool:
    """FastAPI dependency: ``True`` when a valid session cookie is present, else
    ``False`` — never raises. Used by public routes (e.g. the figure endpoint)
    that stay open to everyone but serve fuller detail to the authenticated team
    view. The caller decides what to unlock; the cookie is the single switch."""
    return auth.verify_session(request.cookies.get(auth.COOKIE_NAME))


def require_lookup() -> None:
    """FastAPI dependency: 503 (not a raw 500) when the posting lookup is absent.

    The lookup parquet is gitignored / not bundled into the container, so the
    private routes must degrade cleanly when it is missing rather than surfacing
    a DuckDB IO error."""
    if not core.POSTING_LOOKUP.exists():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Posting lookup unavailable.",
        )


@router.get("/auth", response_model=AuthStatus)
def auth_status(request: Request) -> AuthStatus:
    token = request.cookies.get(auth.COOKIE_NAME)
    return AuthStatus(
        authenticated=auth.verify_session(token),
        configured=auth.auth_configured(),
    )


@router.post("/auth", response_model=AuthStatus)
def login(body: LoginBody, request: Request, response: Response) -> AuthStatus:
    ip = _client_ip(request)
    if not auth.auth_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Access control is not configured on this server.",
        )
    if not _verify_login_attempt(ip, body.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password.",
        )
    _set_session_cookie(response, auth.mint_session())
    return AuthStatus(authenticated=True, configured=True)


@router.post("/auth/logout", response_model=AuthStatus)
def logout(response: Response) -> AuthStatus:
    # Mirror the attributes used when setting the cookie, so a Secure cookie is
    # reliably cleared (some browsers ignore a delete that omits Secure).
    response.delete_cookie(
        key=auth.COOKIE_NAME,
        path="/",
        httponly=True,
        samesite="lax",
        secure=_cookie_secure(),
    )
    return AuthStatus(authenticated=False, configured=auth.auth_configured())


@router.get(
    "/postings",
    response_model=PostingsResponse,
    dependencies=[Depends(require_session), Depends(require_lookup)],
)
def list_postings(
    response: Response,
    scope: Scope = Depends(scope_dependency),
    q: str | None = Query(None, description="Search job title / employer."),
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> PostingsResponse:
    response.headers["Cache-Control"] = "private, no-store"
    return private.postings(scope, q, limit, offset)


@router.get(
    "/postings/{posting_id}",
    response_model=PostingDetail,
    dependencies=[Depends(require_session), Depends(require_lookup)],
)
def posting_detail(posting_id: str, response: Response) -> PostingDetail:
    response.headers["Cache-Control"] = "private, no-store"
    detail = private.posting_detail(posting_id)
    if detail is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Posting not found.",
            headers={"Cache-Control": "private, no-store"},
        )
    return detail
