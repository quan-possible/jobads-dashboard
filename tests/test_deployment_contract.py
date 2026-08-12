from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]


def test_internal_uvicorn_does_not_rewrite_client_from_forwarded_headers() -> None:
    """FastAPI must see the Next socket peer, not an attacker-controlled XFF.

    Starlette's TestClient does not exercise Uvicorn's proxy-header middleware,
    so keep the production launch boundary under regression coverage here.
    """
    entrypoint = (REPO_ROOT / "docker-entrypoint.sh").read_text(encoding="utf-8")
    assert "--no-proxy-headers" in entrypoint
