"""Operator-friendly CLI for the dashboard project."""

from __future__ import annotations

import argparse
import importlib.resources as resources
import os
import subprocess
import sys
from contextlib import ExitStack
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_OUTPUT_ROOT = REPO_ROOT / "data" / "derived" / "labor_market_dashboard_v1"


def discover_source_root(repo_root: Path) -> Path:
    for anchor in (repo_root, *repo_root.parents):
        candidate = anchor.parent / "jobads-data" / "main" / "data" / "processed"
        if candidate.exists():
            return candidate
    return repo_root.parent / "jobads-data" / "main" / "data" / "processed"


DEFAULT_SOURCE_ROOT = discover_source_root(REPO_ROOT)


def refresh_dashboard_data(*args, **kwargs):
    from jobads_dashboard.dashboard.prepare import refresh_dashboard_data as _refresh_dashboard_data

    return _refresh_dashboard_data(*args, **kwargs)


def validate_derived_package(*args, **kwargs):
    from jobads_dashboard.dashboard.prepare import validate_derived_package as _validate_derived_package

    return _validate_derived_package(*args, **kwargs)


def build_posting_lookup(*args, **kwargs):
    from jobads_dashboard.dashboard.prepare import build_posting_lookup_from_source as _build_posting_lookup_from_source

    return _build_posting_lookup_from_source(
        kwargs["source_root"],
        kwargs["output_root"],
        posting_lookup_limit=kwargs["posting_lookup_limit"],
        posting_lookup_recent_months=kwargs["posting_lookup_recent_months"],
    )


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(prog="jobads-dashboard")
    subparsers = parser.add_subparsers(dest="command", required=True)

    refresh = subparsers.add_parser("refresh", help="Build local aggregate tables from upstream processed parquet.")
    refresh.add_argument("--source-root", type=Path, default=DEFAULT_SOURCE_ROOT)
    refresh.add_argument("--output-root", type=Path, default=DEFAULT_OUTPUT_ROOT)
    refresh.add_argument("--top-markets-per-province", type=int, default=10)
    refresh.add_argument("--skills-top-k", type=int, default=10)
    refresh.add_argument("--posting-lookup-limit", type=int, default=100_000)
    refresh.add_argument("--posting-lookup-recent-months", type=int, default=24)

    posting_lookup = subparsers.add_parser(
        "posting-lookup",
        help="Build only the private posting-level lookup index from upstream processed parquet.",
    )
    posting_lookup.add_argument("--source-root", type=Path, default=DEFAULT_SOURCE_ROOT)
    posting_lookup.add_argument("--output-root", type=Path, default=DEFAULT_OUTPUT_ROOT)
    posting_lookup.add_argument("--posting-lookup-limit", type=int, default=100_000)
    posting_lookup.add_argument("--posting-lookup-recent-months", type=int, default=24)

    validate = subparsers.add_parser("validate", help="Check the derived dashboard package.")
    validate.add_argument("--output-root", type=Path, default=DEFAULT_OUTPUT_ROOT)
    validate.add_argument("--source-root", type=Path, default=DEFAULT_SOURCE_ROOT)

    app = subparsers.add_parser("app", help="Launch the Streamlit dashboard.")
    app.add_argument("--output-root", type=Path, default=DEFAULT_OUTPUT_ROOT)

    args, extra = parser.parse_known_args(argv)
    if args.command == "app" and extra[:1] == ["--"]:
        extra = extra[1:]
    if args.command != "app" and extra:
        parser.error(f"unrecognized arguments: {' '.join(extra)}")
    args.streamlit_args = extra
    return args


def main() -> None:
    args = parse_args()
    if args.command == "refresh":
        refresh_dashboard_data(
            source_root=args.source_root,
            output_root=args.output_root,
            top_markets_per_province=args.top_markets_per_province,
            skills_top_k=args.skills_top_k,
            posting_lookup_limit=args.posting_lookup_limit,
            posting_lookup_recent_months=args.posting_lookup_recent_months,
        )
        validation = validate_derived_package(args.output_root, source_root=args.source_root)
        print(validation)
        if not validation.get("validated", False):
            raise SystemExit(1)
        return

    if args.command == "validate":
        validation = validate_derived_package(args.output_root, source_root=args.source_root)
        print(validation)
        if not validation.get("validated", False):
            raise SystemExit(1)
        return

    if args.command == "posting-lookup":
        path = build_posting_lookup(
            source_root=args.source_root,
            output_root=args.output_root,
            posting_lookup_limit=args.posting_lookup_limit,
            posting_lookup_recent_months=args.posting_lookup_recent_months,
        )
        print({"posting_lookup": path.as_posix()})
        return

    if args.command == "app":
        env = os.environ.copy()
        env["JOBADS_DASHBOARD_DATA_ROOT"] = args.output_root.as_posix()
        extra = getattr(args, "streamlit_args", []) or []
        package_app = resources.files("jobads_dashboard").joinpath("streamlit_app.py")
        with ExitStack() as stack:
            app_path = Path(stack.enter_context(resources.as_file(package_app)))
            cmd = [sys.executable, "-m", "streamlit", "run", app_path.as_posix(), *extra]
            subprocess.run(cmd, check=True, env=env)
        return


if __name__ == "__main__":
    main()
