"""Private Explore surface: password auth + posting-level lookup.

The posting lookup is sensitive, so every data route here requires a valid
session cookie minted by ``POST /api/auth``. The cookie is httpOnly and signed;
see ``api/auth.py``.
"""

from __future__ import annotations

import os
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


def _client_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _auth_rate_check(ip: str) -> None:
    now = time.time()
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


def _auth_record_failure(ip: str) -> None:
    _AUTH_FAILURES.setdefault(ip, []).append(time.time())


def _auth_record_success(ip: str) -> None:
    _AUTH_FAILURES.pop(ip, None)


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
    _auth_rate_check(ip)
    if not auth.auth_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Access control is not configured on this server.",
        )
    if not auth.verify_password(body.password):
        _auth_record_failure(ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password.",
        )
    _auth_record_success(ip)
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
    scope: Scope = Depends(scope_dependency),
    q: str | None = Query(None, description="Search job title / employer."),
    limit: int = Query(25, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> PostingsResponse:
    return private.postings(scope, q, limit, offset)


@router.get(
    "/postings/{posting_id}",
    response_model=PostingDetail,
    dependencies=[Depends(require_session), Depends(require_lookup)],
)
def posting_detail(posting_id: str) -> PostingDetail:
    detail = private.posting_detail(posting_id)
    if detail is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Posting not found.")
    return detail
