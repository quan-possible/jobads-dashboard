"""Tests for the private Explore surface: auth + posting-level lookup.

Run with:
    PYTHONPATH=src .venv/bin/python -m pytest api/tests/test_private.py -q

These cover the auth gate (status, login, session cookie, 401 on the data
routes) and the posting lookup (scope filtering, search, detail, language
mapping). The posting-data tests skip automatically if the private parquet is
not present (it is gitignored and read from the main checkout).
"""

from __future__ import annotations

import time
from concurrent.futures import ThreadPoolExecutor
import warnings

import pytest
from fastapi.testclient import TestClient

warnings.filterwarnings("ignore", category=DeprecationWarning, module="starlette.testclient")

from api import auth, core  # noqa: E402
from api.main import app  # noqa: E402
from api.routers import private as private_router  # noqa: E402

PASSWORD = "test-explore-password"
HEALTH = "3 | Health occupations"

_lookup_present = core.POSTING_LOOKUP.exists()
needs_lookup = pytest.mark.skipif(not _lookup_present, reason="posting_lookup.parquet not available")


@pytest.fixture()
def configured(monkeypatch) -> None:
    """Configure a known plaintext password for the auth layer.

    The TestClient talks plain http to ``testserver``, so it cannot store/resend
    a ``Secure`` cookie — opt out of secure cookies here, exactly as local http
    dev does. (Secure-by-default is verified separately in
    ``test_session_cookie_secure_attributes``.)"""
    monkeypatch.delenv(auth.PASSWORD_HASH_ENV, raising=False)
    monkeypatch.setenv(auth.PASSWORD_PLAIN_ENV, PASSWORD)
    monkeypatch.setenv("JOBADS_API_COOKIE_SECURE", "false")


@pytest.fixture(autouse=True)
def _clear_rate_limit() -> None:
    """The per-IP login throttle keeps module-global state; clear it before each
    test so one test's failed logins can't bleed into another's (the rate-limit
    key is now the socket peer unless a trusted proxy is configured — S06)."""
    private_router._AUTH_FAILURES.clear()
    private_router._GLOBAL_FAILURES.clear()


@pytest.fixture()
def anon() -> TestClient:
    return TestClient(app)


@pytest.fixture()
def signed_in(configured) -> TestClient:
    c = TestClient(app)
    r = c.post("/api/auth", json={"password": PASSWORD})
    assert r.status_code == 200
    assert r.json()["authenticated"] is True
    return c


# --------------------------------------------------------------------------- #
# Unit: PBKDF2 + session tokens
# --------------------------------------------------------------------------- #


def test_pbkdf2_roundtrip():
    h = auth._hash_password  # noqa: SLF001 — internal but stable
    salt = b"sixteen_byte_salt"
    digest = h("hunter2", salt, auth.PASSWORD_HASH_ITERATIONS)
    encoded = f"pbkdf2_sha256${auth.PASSWORD_HASH_ITERATIONS}${_b64(salt)}${_b64(digest)}"
    assert auth._verify_against_hash("hunter2", encoded) is True
    assert auth._verify_against_hash("wrong", encoded) is False


def _b64(raw: bytes) -> str:
    import base64

    return base64.urlsafe_b64encode(raw).decode("ascii")


def test_session_mint_verify():
    token = auth.mint_session(now=1000.0)
    assert auth.verify_session(token, now=1000.0) is True
    # Expired.
    assert auth.verify_session(token, now=1000.0 + auth.SESSION_TTL_SECONDS + 1) is False
    # Tampered signature.
    body, _, _sig = token.partition(".")
    assert auth.verify_session(f"{body}.deadbeef", now=1000.0) is False
    assert auth.verify_session(None) is False


# --------------------------------------------------------------------------- #
# Auth endpoints
# --------------------------------------------------------------------------- #


def test_auth_status_configured(configured, anon):
    r = anon.get("/api/auth")
    assert r.status_code == 200
    body = r.json()
    assert body["configured"] is True
    assert body["authenticated"] is False


def test_login_wrong_password(configured, anon):
    r = anon.post("/api/auth", json={"password": "nope"})
    assert r.status_code == 401


def test_login_sets_cookie_and_status(signed_in):
    assert auth.COOKIE_NAME in signed_in.cookies
    r = signed_in.get("/api/auth")
    assert r.json()["authenticated"] is True


def test_session_cookie_secure_attributes(monkeypatch, anon):
    """In the default (production) config the session cookie carries
    Secure + HttpOnly + SameSite=lax (S11)."""
    monkeypatch.delenv(auth.PASSWORD_HASH_ENV, raising=False)
    monkeypatch.setenv(auth.PASSWORD_PLAIN_ENV, PASSWORD)
    monkeypatch.delenv("JOBADS_API_COOKIE_SECURE", raising=False)  # default → secure
    r = anon.post("/api/auth", json={"password": PASSWORD})
    assert r.status_code == 200
    set_cookie = r.headers["set-cookie"].lower()
    assert "secure" in set_cookie
    assert "httponly" in set_cookie
    assert "samesite=lax" in set_cookie


def test_logout_clears(signed_in):
    signed_in.post("/api/auth/logout")
    # Cookie removed → data route rejects.
    r = signed_in.get("/api/postings")
    assert r.status_code == 401


def test_auth_rate_limited(configured, anon, monkeypatch):
    """Repeated bad logins from one IP eventually get 429 (S12). Behind a trusted
    proxy the per-IP key comes from X-Forwarded-For, so a unique value keeps this
    test's failures off the shared peer."""
    # Simulate running behind a trusted proxy: the TestClient socket peer is
    # "testclient", so honour its forwarded header (S06).
    monkeypatch.setenv("JOBADS_API_TRUSTED_PROXY", "testclient")
    headers = {"x-forwarded-for": "203.0.113.50"}
    statuses = [
        anon.post("/api/auth", json={"password": "wrong"}, headers=headers).status_code
        for _ in range(private_router._AUTH_MAX_FAILURES + 2)
    ]
    assert 429 in statuses, statuses
    # The early attempts are ordinary auth failures, not throttled.
    assert statuses[0] == 401


def test_xff_spoof_does_not_bypass_throttle(configured, anon):
    """With no trusted proxy configured, the rate limit keys on the socket peer,
    so rotating X-Forwarded-For per request can no longer reset the backoff and
    brute-force the password (S06)."""
    statuses = [
        anon.post(
            "/api/auth",
            json={"password": "wrong"},
            headers={"x-forwarded-for": f"198.51.100.{i}"},  # a fresh spoofed IP each time
        ).status_code
        for i in range(private_router._AUTH_MAX_FAILURES + 2)
    ]
    assert 429 in statuses, "rotating XFF must not defeat the per-peer throttle"


def test_loopback_proxy_xff_is_untrusted_by_default(configured, monkeypatch):
    """The current Next rewrite does not establish that XFF was sanitized.

    Even when the socket peer is loopback, a forged single-value header must
    not choose a fresh bucket unless proxy trust was explicitly configured.
    """
    monkeypatch.delenv("JOBADS_API_TRUSTED_PROXY", raising=False)
    proxy_client = TestClient(app, client=("127.0.0.1", 50000))
    statuses = [
        proxy_client.post(
            "/api/auth",
            json={"password": "wrong"},
            headers={"x-forwarded-for": f"198.51.100.{i}"},
        ).status_code
        for i in range(private_router._AUTH_MAX_FAILURES + 2)
    ]
    assert 429 in statuses, "forged single-value XFF through loopback must not reset the bucket"
    assert set(private_router._AUTH_FAILURES) == {"127.0.0.1"}


def test_concurrent_failed_logins_cannot_overshoot_per_ip_limit(configured, anon, monkeypatch):
    """The check and failure record form one atomic operation across workers."""

    def slow_reject(_password: str) -> bool:
        time.sleep(0.03)
        return False

    monkeypatch.setattr(private_router.auth, "verify_password", slow_reject)
    attempts = private_router._AUTH_MAX_FAILURES + 8

    def attempt(_index: int) -> int:
        return anon.post("/api/auth", json={"password": "wrong"}).status_code

    with ThreadPoolExecutor(max_workers=attempts) as pool:
        statuses = list(pool.map(attempt, range(attempts)))

    assert statuses.count(401) == private_router._AUTH_MAX_FAILURES
    assert statuses.count(429) == attempts - private_router._AUTH_MAX_FAILURES


def test_weak_pbkdf2_hash_rejected():
    """A hash below the iteration floor is refused even with the right password (S13)."""
    salt = b"sixteen_byte_salt"
    weak = auth._hash_password("hunter2", salt, 100_000)  # < PASSWORD_HASH_MIN_ITERATIONS
    encoded = f"pbkdf2_sha256$100000${_b64(salt)}${_b64(weak)}"
    assert auth._verify_against_hash("hunter2", encoded) is False


def test_session_secret_min_length(monkeypatch):
    """A configured-but-short session secret fails fast; a long one is accepted;
    unset yields a random per-process secret (S15)."""
    monkeypatch.setenv(auth.SESSION_SECRET_ENV, "short")
    with pytest.raises(RuntimeError):
        auth._resolve_session_secret()
    long_secret = "x" * auth.SESSION_SECRET_MIN_LENGTH
    monkeypatch.setenv(auth.SESSION_SECRET_ENV, long_secret)
    assert auth._resolve_session_secret() == long_secret
    monkeypatch.delenv(auth.SESSION_SECRET_ENV, raising=False)
    assert len(auth._resolve_session_secret()) >= auth.SESSION_SECRET_MIN_LENGTH


# --------------------------------------------------------------------------- #
# Gating
# --------------------------------------------------------------------------- #


def test_postings_requires_auth(anon):
    assert anon.get("/api/postings").status_code == 401


def test_posting_detail_requires_auth(anon):
    assert anon.get("/api/postings/whatever").status_code == 401


# --------------------------------------------------------------------------- #
# Posting lookup (needs the private parquet)
# --------------------------------------------------------------------------- #


@needs_lookup
def test_postings_list_shape(signed_in):
    r = signed_in.get("/api/postings", params={"limit": 5})
    assert r.status_code == 200
    body = r.json()
    assert body["total"] > 0
    assert len(body["items"]) <= 5
    row = body["items"][0]
    for key in ("posting_id", "month", "job_title", "province"):
        assert key in row


@needs_lookup
def test_private_posting_responses_are_not_cacheable(signed_in):
    listing = signed_in.get("/api/postings", params={"limit": 1})
    assert listing.status_code == 200
    assert listing.headers["cache-control"] == "private, no-store"

    posting_id = listing.json()["items"][0]["posting_id"]
    detail = signed_in.get(f"/api/postings/{posting_id}")
    assert detail.status_code == 200
    assert detail.headers["cache-control"] == "private, no-store"

    missing = signed_in.get("/api/postings/__no_such_id__")
    assert missing.status_code == 404
    assert missing.headers["cache-control"] == "private, no-store"


@needs_lookup
def test_postings_scope_filter(signed_in):
    r = signed_in.get("/api/postings", params={"occ": HEALTH, "limit": 25})
    assert r.status_code == 200
    items = r.json()["items"]
    assert items, "expected Health postings"
    assert all(i["occupation"] == HEALTH for i in items)


@needs_lookup
def test_postings_province_filter(signed_in):
    r = signed_in.get("/api/postings", params={"geo": "BC", "limit": 25})
    items = r.json()["items"]
    assert items and all(i["province"] == "BC" for i in items)


@needs_lookup
def test_postings_search(signed_in):
    r = signed_in.get("/api/postings", params={"q": "nurse", "limit": 10})
    assert r.status_code == 200
    items = r.json()["items"]
    assert items
    assert all("nurse" in (i["job_title"] or "").lower() or "nurse" in (i["employer"] or "").lower() for i in items)


@needs_lookup
def test_postings_pagination_stable(signed_in):
    a = signed_in.get("/api/postings", params={"limit": 10, "offset": 0}).json()["items"]
    b = signed_in.get("/api/postings", params={"limit": 10, "offset": 10}).json()["items"]
    ids_a = {i["posting_id"] for i in a}
    ids_b = {i["posting_id"] for i in b}
    assert ids_a.isdisjoint(ids_b), "pages must not overlap"


@needs_lookup
def test_posting_detail(signed_in):
    first = signed_in.get("/api/postings", params={"limit": 1}).json()["items"][0]
    r = signed_in.get(f"/api/postings/{first['posting_id']}")
    assert r.status_code == 200
    d = r.json()
    assert d["posting_id"] == first["posting_id"]
    # Language is mapped to a label, never the raw 'en'/'fr' code.
    assert d["primary_posting_language"] not in ("en", "fr")


@needs_lookup
def test_posting_detail_404(signed_in):
    assert signed_in.get("/api/postings/__no_such_id__").status_code == 404
