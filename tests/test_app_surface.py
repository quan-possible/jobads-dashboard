import json
from pathlib import Path

import pandas as pd
from streamlit.testing.v1 import AppTest

from jobads_dashboard.dashboard.app import (
    ALL_CANADA,
    ALL_INDUSTRIES,
    ALL_OCCUPATIONS,
    MAX_LIST_ITEMS,
    compute_market_concentration_summary,
    compute_top_group_shares,
    filter_skills_frame,
)


def headline_metrics(app: AppTest) -> dict[str, str]:
    return {metric.label: metric.value for metric in app.metric[:8]}


def info_messages(app: AppTest) -> list[str]:
    return [message.value for message in app.info]


def selectbox_by_label(app: AppTest, label: str):
    for box in app.selectbox:
        if box.label == label:
            return box
    raise AssertionError(f"Missing selectbox with label {label!r}")


def test_partial_bundle_shows_operator_guidance(tmp_path: Path, monkeypatch) -> None:
    data_root = tmp_path / "partial-bundle"
    data_root.mkdir()
    (data_root / "metadata.json").write_text(
        json.dumps({"source_window": {"min_date": "2016-01-01", "max_date": "2025-07-31"}}),
        encoding="utf-8",
    )
    pd.DataFrame({"month": pd.to_datetime(["2025-07-01"]), "postings_total": [1]}).to_parquet(
        data_root / "monthly_overall.parquet"
    )

    monkeypatch.setenv("JOBADS_DASHBOARD_DATA_ROOT", str(data_root))

    app = AppTest.from_file("streamlit_app.py")
    app.run(timeout=120)

    assert len(app.exception) == 0
    assert len(app.error) == 1
    assert "jobads-dashboard refresh" in app.error[0].value
    assert any("Dashboard bundle needs a refresh before the app can load." in block.value for block in app.markdown)
    assert "monthly_filter_cube.parquet" in app.code[0].value


def test_filtered_province_views_stay_populated() -> None:
    app = AppTest.from_file("streamlit_app.py")
    app.run(timeout=120)

    selectbox_by_label(app, "Occupation group").set_value("6 | Sales and service occupations")
    selectbox_by_label(app, "Industry group").set_value("72 | Accommodation and food services")
    app.run(timeout=120)

    assert len(app.exception) == 0
    assert headline_metrics(app)["Province count covered"] != "0"
    assert "Province-share view is empty for the current filters." not in info_messages(app)
    assert "Province posting trends are empty for the current filters." not in info_messages(app)
    assert "Province shares are empty for the current filters." not in info_messages(app)


def test_explore_tab_renders_curated_query_surface() -> None:
    app = AppTest.from_file("streamlit_app.py")
    app.run(timeout=120)

    assert len(app.exception) == 0
    assert any("Choose a common question below." in block.value for block in app.caption)
    assert "Question" in [box.label for box in app.selectbox]


def test_selecting_province_does_not_duplicate_plotly_ids() -> None:
    app = AppTest.from_file("streamlit_app.py")
    app.run(timeout=120)

    selectbox_by_label(app, "Geography").set_value("ON")
    app.run(timeout=120)

    assert len(app.exception) == 0


def test_province_filtered_wage_by_occupation_stays_populated() -> None:
    app = AppTest.from_file("streamlit_app.py")
    app.run(timeout=120)

    selectbox_by_label(app, "Geography").set_value("ON")
    app.run(timeout=120)

    assert len(app.exception) == 0
    assert "Wage-by-occupation view is empty for the current filters." not in info_messages(app)


def test_sidebar_filters_hide_synthetic_unknown_groups() -> None:
    app = AppTest.from_file("streamlit_app.py")
    app.run(timeout=120)

    assert "Unknown occupation group" not in list(selectbox_by_label(app, "Occupation group").options)
    assert "Unknown industry group" not in list(selectbox_by_label(app, "Industry group").options)


def test_sidebar_filters_cap_options_at_ten_items() -> None:
    app = AppTest.from_file("streamlit_app.py")
    app.run(timeout=120)

    assert len(selectbox_by_label(app, "Geography").options) <= MAX_LIST_ITEMS
    assert len(selectbox_by_label(app, "Occupation group").options) <= MAX_LIST_ITEMS
    assert len(selectbox_by_label(app, "Industry group").options) <= MAX_LIST_ITEMS


def test_compute_top_group_shares_uses_full_month_denominator() -> None:
    frame = pd.DataFrame(
        {
            "month": pd.to_datetime(["2025-01-01", "2025-01-01", "2025-01-01"]),
            "occupation_scope": ["A", "B", "C"],
            "postings_total": [60, 30, 10],
        }
    )

    result = compute_top_group_shares(frame, "occupation_scope", top_n=2).sort_values("occupation_scope").reset_index(drop=True)

    assert result["occupation_scope"].tolist() == ["A", "B"]
    assert result["share_pct"].round(1).tolist() == [60.0, 30.0]


def test_compute_market_concentration_summary_uses_full_filtered_denominator() -> None:
    frame = pd.DataFrame(
        {
            "market_province": ["ON", "QC", "BC"],
            "market": ["Toronto (CMA)", "Montreal (CMA)", "Other area"],
            "market_label": ["ON | Toronto (CMA)", "QC | Montreal (CMA)", "BC | Other area"],
            "postings_total": [60, 30, 10],
        }
    )

    result = compute_market_concentration_summary(frame, top_n=2)

    assert result["market_label"].tolist() == ["ON | Toronto (CMA)", "QC | Montreal (CMA)"]
    assert result["window_share_pct"].round(1).tolist() == [60.0, 30.0]
    assert result["cumulative_share_pct"].round(1).tolist() == [60.0, 90.0]


def test_filter_skills_frame_treats_all_scopes_as_wildcards() -> None:
    frame = pd.DataFrame(
        {
            "province_scope": ["ON", "BC", "ON"],
            "occupation_scope": ["1 | Business", "2 | Science", "1 | Business"],
            "industry_scope": ["54 | Professional", "54 | Professional", "62 | Health"],
            "skill_code": ["A", "B", "C"],
            "postings_total": [10, 8, 6],
        }
    )

    result = filter_skills_frame(
        frame,
        province_scope=ALL_CANADA,
        occupation_scope=ALL_OCCUPATIONS,
        industry_scope=ALL_INDUSTRIES,
    )

    assert result["skill_code"].tolist() == ["A", "B", "C"]
