"""Private Explore surface: password auth + posting-level lookup.

The posting lookup is sensitive, so every data route here requires a valid
session cookie minted by ``POST /api/auth``. The cookie is httpOnly and signed;
see ``api/auth.py``.
"""

from __future__ import annotations

import os

from fastapi import APIRouter, Depends, HTTPException, Query, Request, Response, status
from pydantic import BaseModel

from .. import auth, private
from ..deps import scope_dependency
from ..models import AuthStatus, PostingDetail, PostingsResponse, Scope

router = APIRouter(prefix="/api", tags=["private"])

# Secure cookies in production; relaxed for local http dev.
_COOKIE_SECURE = os.environ.get("JOBADS_API_COOKIE_SECURE", "").strip().lower() in {"1", "true", "yes"}


class LoginBody(BaseModel):
    password: str


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=auth.COOKIE_NAME,
        value=token,
        max_age=auth.SESSION_TTL_SECONDS,
        httponly=True,
        samesite="lax",
        secure=_COOKIE_SECURE,
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


@router.get("/auth", response_model=AuthStatus)
def auth_status(request: Request) -> AuthStatus:
    token = request.cookies.get(auth.COOKIE_NAME)
    return AuthStatus(
        authenticated=auth.verify_session(token),
        configured=auth.auth_configured(),
    )


@router.post("/auth", response_model=AuthStatus)
def login(body: LoginBody, response: Response) -> AuthStatus:
    if not auth.auth_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Access control is not configured on this server.",
        )
    if not auth.verify_password(body.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password.",
        )
    _set_session_cookie(response, auth.mint_session())
    return AuthStatus(authenticated=True, configured=True)


@router.post("/auth/logout", response_model=AuthStatus)
def logout(response: Response) -> AuthStatus:
    response.delete_cookie(key=auth.COOKIE_NAME, path="/")
    return AuthStatus(authenticated=False, configured=auth.auth_configured())


@router.get("/postings", response_model=PostingsResponse, dependencies=[Depends(require_session)])
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
    dependencies=[Depends(require_session)],
)
def posting_detail(posting_id: str) -> PostingDetail:
    detail = private.posting_detail(posting_id)
    if detail is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Posting not found.")
    return detail
