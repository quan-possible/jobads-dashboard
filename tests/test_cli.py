import json
from argparse import Namespace
from pathlib import Path
from types import SimpleNamespace

import pytest

import jobads_dashboard.cli as cli
from jobads_dashboard.cli import parse_args


def test_parse_args_allows_streamlit_passthrough_after_separator() -> None:
    args = parse_args(["app", "--", "--server.headless", "true", "--server.port", "8503"])
    assert args.command == "app"
    assert args.streamlit_args == ["--server.headless", "true", "--server.port", "8503"]


def test_parse_args_allows_streamlit_passthrough_without_separator() -> None:
    args = parse_args(["app", "--server.headless", "true"])
    assert args.command == "app"
    assert args.streamlit_args == ["--server.headless", "true"]


def test_validate_exits_nonzero_when_bundle_is_invalid(monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]) -> None:
    monkeypatch.setattr(
        cli,
        "parse_args",
        lambda: Namespace(command="validate", output_root="ignored", source_root="source", streamlit_args=[]),
    )
    monkeypatch.setattr(
        cli,
        "validate_derived_package",
        lambda _output_root, *, source_root=None: {"validated": False, "missing_files": ["monthly_overall.parquet"]},
    )

    with pytest.raises(SystemExit) as excinfo:
        cli.main()

    captured = capsys.readouterr()
    assert excinfo.value.code == 1
    assert "validated" in captured.out


def test_validate_output_is_valid_json(monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]) -> None:
    payload = {"validated": True, "missing_files": [], "schema_issues": {}}
    monkeypatch.setattr(
        cli,
        "parse_args",
        lambda: Namespace(command="validate", output_root="ignored", source_root="source", streamlit_args=[]),
    )
    monkeypatch.setattr(
        cli,
        "validate_derived_package",
        lambda _output_root, *, source_root=None: payload,
    )

    cli.main()

    captured = capsys.readouterr()
    assert json.loads(captured.out) == payload


def test_app_honors_explicit_output_root(monkeypatch: pytest.MonkeyPatch) -> None:
    called: dict[str, object] = {}

    monkeypatch.setattr(
        cli,
        "parse_args",
        lambda: Namespace(command="app", output_root=Path("/expected/output"), streamlit_args=["--server.headless", "true"]),
    )
    monkeypatch.setenv("JOBADS_DASHBOARD_DATA_ROOT", "/ambient/output")

    def fake_run(cmd: list[str], *, env: dict[str, str]) -> SimpleNamespace:
        called["cmd"] = cmd
        called["env"] = env
        return SimpleNamespace(returncode=0)

    monkeypatch.setattr(cli.subprocess, "run", fake_run)

    cli.main()

    assert called["env"]["JOBADS_DASHBOARD_DATA_ROOT"] == "/expected/output"
    assert str(called["cmd"][4]).endswith("streamlit_app.py")
