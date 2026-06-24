"""Unit tests for S01 — XFF-spoofable login throttle and global failure ceiling.

Tests:
  (a) A request whose forged *leftmost* XFF entry differs each attempt does NOT
      get a fresh bucket — the rate-limit key is the rightmost (observed) IP.
  (b) After _AUTH_MAX_FAILURES failures the next attempt is 429 even while the
      leftmost XFF rotates.
  (c) The global ceiling triggers 429 once total failures exceed _GLOBAL_MAX_FAILURES
      across rotating per-key buckets, even when no single key hit its per-IP cap.

Run with:
    PYTHONPATH=src .venv/bin/python -m pytest api/tests/test_xff_ratelimit.py -q
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from api import auth
from api.main import app
from api.routers import private as private_router

PASSWORD = "test-password-xff"


@pytest.fixture(autouse=True)
def _reset_state():
    """Clear all rate-limit state before each test."""
    private_router._AUTH_FAILURES.clear()
    private_router._GLOBAL_FAILURES.clear()
    yield
    private_router._AUTH_FAILURES.clear()
    private_router._GLOBAL_FAILURES.clear()


@pytest.fixture()
def configured(monkeypatch):
    monkeypatch.delenv(auth.PASSWORD_HASH_ENV, raising=False)
    monkeypatch.setenv(auth.PASSWORD_PLAIN_ENV, PASSWORD)
    monkeypatch.setenv("JOBADS_API_COOKIE_SECURE", "false")


@pytest.fixture()
def anon():
    return TestClient(app)


# --------------------------------------------------------------------------- #
# (a) Rightmost XFF is the rate-limit key, not leftmost
# --------------------------------------------------------------------------- #


def test_rightmost_xff_is_rate_key(configured, anon, monkeypatch):
    """Rotating the *leftmost* XFF entry must NOT reset the per-IP bucket.

    The single trusted hop is the Next proxy on loopback; it appends the real
    client IP as the *rightmost* entry. We keep the rightmost fixed at
    203.0.113.1 (the "observed" IP) while changing the leftmost each request
    (simulating an attacker's spoofed entries). All failures should accumulate
    in the same bucket keyed on 203.0.113.1."""
    monkeypatch.setenv("JOBADS_API_TRUSTED_PROXY", "testclient")

    statuses = []
    for i in range(private_router._AUTH_MAX_FAILURES + 2):
        # Leftmost changes every request (spoofed); rightmost stays fixed.
        xff = f"10.0.0.{i}, 203.0.113.1"
        r = anon.post("/api/auth", json={"password": "wrong"}, headers={"x-forwarded-for": xff})
        statuses.append(r.status_code)

    # Once per-IP cap is exceeded, must 429.
    assert 429 in statuses, f"Expected 429 in statuses: {statuses}"
    # First attempt is a plain 401 (not throttled yet).
    assert statuses[0] == 401


# --------------------------------------------------------------------------- #
# (b) Per-IP lockout fires even while leftmost XFF rotates
# --------------------------------------------------------------------------- #


def test_per_ip_lockout_despite_leftmost_rotation(configured, anon, monkeypatch):
    """After _AUTH_MAX_FAILURES failures, the next attempt must be 429 regardless
    of how many distinct leftmost XFF values the attacker supplied."""
    monkeypatch.setenv("JOBADS_API_TRUSTED_PROXY", "testclient")

    observed_ip = "203.0.113.99"

    # Drive exactly _AUTH_MAX_FAILURES failures, each with a different leftmost.
    for i in range(private_router._AUTH_MAX_FAILURES):
        xff = f"1.2.3.{i}, {observed_ip}"
        r = anon.post("/api/auth", json={"password": "wrong"}, headers={"x-forwarded-for": xff})
        assert r.status_code == 401, f"attempt {i} should be 401, got {r.status_code}"

    # The next attempt (no matter the leftmost) must be 429.
    xff_new = f"9.9.9.9, {observed_ip}"
    r = anon.post("/api/auth", json={"password": "wrong"}, headers={"x-forwarded-for": xff_new})
    assert r.status_code == 429, f"Expected 429 after per-IP cap, got {r.status_code}"


# --------------------------------------------------------------------------- #
# (c) Global ceiling triggers 429 across rotating per-IP buckets
# --------------------------------------------------------------------------- #


def test_global_ceiling_triggers_across_rotating_keys(configured, anon, monkeypatch):
    """The global failure ceiling must trip 429 even when each individual IP is
    far below its own per-IP cap.

    Strategy: send one failure per unique 'observed' (rightmost) IP so no
    single bucket ever reaches _AUTH_MAX_FAILURES. Once the total across all
    IPs exceeds _GLOBAL_MAX_FAILURES, the next attempt must be 429."""
    monkeypatch.setenv("JOBADS_API_TRUSTED_PROXY", "testclient")

    statuses = []
    # Use one request per unique rightmost IP, so no per-IP bucket exceeds 1.
    total_attempts = private_router._GLOBAL_MAX_FAILURES + 5
    for i in range(total_attempts):
        # Each request has a distinct observed (rightmost) IP.
        observed = f"203.0.{i // 256}.{i % 256}"
        xff = f"10.0.0.1, {observed}"
        r = anon.post("/api/auth", json={"password": "wrong"}, headers={"x-forwarded-for": xff})
        statuses.append(r.status_code)

    # No single per-IP bucket had more than 1 failure, so 429 must come from
    # the global ceiling.
    assert 429 in statuses, f"Global ceiling must trip 429; statuses: {statuses[:60]}"

    # Verify that no per-IP bucket exceeded 1 failure (global, not per-IP).
    for ip, ts_list in private_router._AUTH_FAILURES.items():
        assert len(ts_list) <= 1, f"IP {ip} accumulated {len(ts_list)} failures — per-IP cap must not be the cause"
