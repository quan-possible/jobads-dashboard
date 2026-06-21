"""Tests for the private Explore surface: auth + posting-level lookup.

Run with:
    PYTHONPATH=src .venv/bin/python -m pytest api/tests/test_private.py -q

These cover the auth gate (status, login, session cookie, 401 on the data
routes) and the posting lookup (scope filtering, search, detail, language
mapping). The posting-data tests skip automatically if the private parquet is
not present (it is gitignored and read from the main checkout).
"""

from __future__ import annotations

import warnings

import pytest
from fastapi.testclient import TestClient

warnings.filterwarnings("ignore", category=DeprecationWarning, module="starlette.testclient")

from api import auth, core  # noqa: E402
from api.main import app  # noqa: E402

PASSWORD = "test-explore-password"
HEALTH = "3 | Health occupations"

_lookup_present = core.POSTING_LOOKUP.exists()
needs_lookup = pytest.mark.skipif(not _lookup_present, reason="posting_lookup.parquet not available")


@pytest.fixture()
def configured(monkeypatch) -> None:
    """Configure a known plaintext password for the auth layer."""
    monkeypatch.delenv(auth.PASSWORD_HASH_ENV, raising=False)
    monkeypatch.setenv(auth.PASSWORD_PLAIN_ENV, PASSWORD)


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


def test_logout_clears(signed_in):
    signed_in.post("/api/auth/logout")
    # Cookie removed → data route rejects.
    r = signed_in.get("/api/postings")
    assert r.status_code == 401


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
