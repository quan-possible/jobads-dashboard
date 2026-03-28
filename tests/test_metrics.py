from jobads_dashboard.dashboard.metrics import format_pct, safe_pct


def test_safe_pct_handles_zero_denominator() -> None:
    assert safe_pct(5, 0) is None


def test_format_pct_rounds() -> None:
    assert format_pct(12.345) == "12.3%"
