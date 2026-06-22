import json
from argparse import Namespace

import pytest

import jobads_dashboard.cli as cli
from jobads_dashboard.cli import parse_args


def test_parse_args_supports_data_pipeline_commands() -> None:
    assert parse_args(["refresh"]).command == "refresh"
    assert parse_args(["validate"]).command == "validate"
    assert parse_args(["posting-lookup"]).command == "posting-lookup"


def test_parse_args_rejects_the_removed_streamlit_app_command() -> None:
    # The Streamlit UI was replaced by the Next.js + FastAPI app; the CLI now
    # only builds/validates the derived data package.
    with pytest.raises(SystemExit):
        parse_args(["app"])


def test_validate_exits_nonzero_when_bundle_is_invalid(monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]) -> None:
    monkeypatch.setattr(
        cli,
        "parse_args",
        lambda: Namespace(command="validate", output_root="ignored", source_root="source"),
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
        lambda: Namespace(command="validate", output_root="ignored", source_root="source"),
    )
    monkeypatch.setattr(
        cli,
        "validate_derived_package",
        lambda _output_root, *, source_root=None: payload,
    )

    cli.main()

    captured = capsys.readouterr()
    assert json.loads(captured.out) == payload
