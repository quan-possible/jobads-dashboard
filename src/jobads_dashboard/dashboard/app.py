"""Streamlit app for the labor-market dashboard."""

from __future__ import annotations

from html import escape
import os
from pathlib import Path

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

from .constants import ALL_CANADA, ALL_INDUSTRIES, ALL_OCCUPATIONS, PLOTLY_SEQUENCE, THEME
from .data import load_metadata, load_tables
from .metrics import format_int, format_pct, safe_pct, summarize_headlines

REPO_ROOT = Path(__file__).resolve().parents[3]
DATA_ROOT = Path(
    os.environ.get(
        "JOBADS_DASHBOARD_DATA_ROOT",
        str(REPO_ROOT / "data" / "derived" / "labor_market_dashboard_v1"),
    )
)

COMPARISON_MONTHS = 3
MAX_LIST_ITEMS = 10
UNKNOWN_OCCUPATION_GROUP = "Unknown occupation group"
UNKNOWN_INDUSTRY_GROUP = "Unknown industry group"

GLOBAL_STYLES = f"""
<style>
@import url('https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap');

:root {{
  --aclmr-navy: {THEME.navy};
  --aclmr-navy-deep: {THEME.navy_deep};
  --aclmr-teal: {THEME.teal};
  --aclmr-sand: {THEME.sand};
  --aclmr-orange: {THEME.orange};
  --aclmr-black: {THEME.black};
  --aclmr-white: {THEME.white};
  --aclmr-surface: {THEME.surface};
  --aclmr-surface-alt: {THEME.surface_alt};
  --aclmr-canvas: {THEME.canvas};
  --aclmr-text: {THEME.text};
  --aclmr-muted: {THEME.secondary_text};
  --aclmr-grid: {THEME.grid};
  --aclmr-border: {THEME.card_border};
  --aclmr-shadow: {THEME.shadow};
  --aclmr-gradient: {THEME.gradient};
}}

.stApp {{
  position: relative !important;
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(207, 119, 48, 0.12), transparent 22%),
    linear-gradient(180deg, #f7efe8 0%, var(--aclmr-canvas) 100%);
  color: var(--aclmr-text);
  font-family: "PT Sans", sans-serif;
  overflow: visible !important;
}}

.stApp::before {{
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: clamp(28rem, 45vw, 34rem);
  background:
    radial-gradient(circle at top right, rgba(195, 158, 128, 0.26), transparent 30%),
    linear-gradient(180deg, rgba(4, 28, 44, 0.99) 0%, rgba(6, 31, 47, 0.96) 58%, rgba(6, 31, 47, 0.14) 100%);
  pointer-events: none;
  z-index: 0;
}}

html,
body,
[data-testid="stAppViewContainer"],
[data-testid="stAppViewContainer"] > section,
[data-testid="stAppViewContainer"] .main {{
  height: auto !important;
  overflow: visible !important;
}}

[data-testid="stAppViewContainer"] {{
  position: relative !important;
  min-height: 100vh;
  overflow: visible !important;
}}

[data-testid="stAppViewContainer"] > .main {{
  background: transparent;
  position: relative;
  z-index: 1;
}}

.block-container {{
  max-width: 1450px;
  padding-top: 1.5rem;
  padding-bottom: 4rem;
  position: relative;
  z-index: 1;
}}

h1, h2, h3, h4, h5, h6, p, span, label {{
  font-family: "PT Sans", sans-serif !important;
}}

[data-testid="stHeader"] {{
  background: transparent;
  height: 0;
}}

[data-testid="stToolbar"],
[data-testid="stMainMenuButton"],
[data-testid="stBaseButton-header"] {{
  display: none !important;
}}

[data-testid="stBaseButton-headerNoPadding"],
[data-testid="stExpandSidebarButton"] {{
  position: fixed;
  top: 0.75rem;
  left: 0.85rem;
  z-index: 1000;
  display: inline-flex !important;
  margin-left: 0.4rem;
  margin-top: 0.4rem;
  padding: 0.5rem 0.85rem;
  min-width: auto !important;
  width: auto !important;
  height: auto !important;
  border-radius: 999px;
  border: 1px solid rgba(195, 158, 128, 0.38);
  background: rgba(6, 31, 47, 0.92);
  box-shadow: var(--aclmr-shadow);
  color: transparent !important;
  font-size: 0 !important;
}}

[data-testid="stBaseButton-headerNoPadding"]::after,
[data-testid="stExpandSidebarButton"]::after {{
  content: "Filters";
  color: #fff;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}}

section[data-testid="stSidebar"] {{
  background:
    linear-gradient(180deg, rgba(4, 28, 44, 0.96), rgba(6, 31, 47, 0.92)),
    var(--aclmr-gradient);
  border-right: 1px solid rgba(255, 255, 255, 0.12);
  position: relative;
  z-index: 2;
}}

section[data-testid="stSidebar"] * {{
  color: #fff !important;
}}

section[data-testid="stSidebar"] [data-baseweb="select"] > div,
section[data-testid="stSidebar"] .stSlider,
section[data-testid="stSidebar"] input {{
  background: rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}}

section[data-testid="stSidebar"] label {{
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}}

section[data-testid="stSidebar"] [data-baseweb="select"] > div {{
  border: 1px solid rgba(195, 158, 128, 0.58) !important;
  background: rgba(255, 255, 255, 0.07) !important;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.03);
  min-height: 3rem;
}}

section[data-testid="stSidebar"] [data-baseweb="select"] [role="combobox"] {{
  color: #fff !important;
}}

section[data-testid="stSidebar"] [data-baseweb="select"] svg {{
  color: rgba(255, 255, 255, 0.82) !important;
}}

section[data-testid="stSidebar"] [data-baseweb="slider"] > div > div > div:last-child {{
  background: var(--aclmr-gradient) !important;
  border-radius: 999px;
}}

section[data-testid="stSidebar"] [data-baseweb="slider"] [role="slider"] {{
  width: 18px !important;
  height: 18px !important;
  border-radius: 999px !important;
  background: var(--aclmr-orange) !important;
  border: 2px solid rgba(255, 255, 255, 0.92) !important;
  box-shadow: 0 0 0 4px rgba(207, 119, 48, 0.16);
}}

.aclmr-sidebar-brand {{
  padding: 0.5rem 0 1rem;
}}

.aclmr-sidebar-kicker {{
  display: inline-block;
  font-size: 0.72rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
  margin-bottom: 0.6rem;
}}

.aclmr-sidebar-brand h2 {{
  font-size: 1.45rem;
  line-height: 1.05;
  margin: 0;
  color: #fff;
}}

.aclmr-sidebar-brand p {{
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.95rem;
  line-height: 1.4;
  margin: 0.8rem 0 0;
}}

.aclmr-hero {{
  display: grid;
  grid-template-columns: minmax(0, 1.75fr) minmax(340px, 1.08fr);
  gap: 1.5rem;
  align-items: stretch;
  margin-bottom: 1.35rem;
}}

.aclmr-hero__copy,
.aclmr-hero__aside {{
  position: relative;
  overflow: hidden;
  border-radius: 28px;
}}

.aclmr-hero__copy {{
  background: linear-gradient(145deg, rgba(4, 28, 44, 0.96), rgba(6, 31, 47, 0.92));
  padding: 2.2rem 2.2rem 2rem;
  box-shadow: var(--aclmr-shadow);
}}

.aclmr-hero__aside {{
  background: var(--aclmr-gradient);
  padding: 1px;
  box-shadow: var(--aclmr-shadow);
}}

.aclmr-hero__aside-inner {{
  height: 100%;
  background: linear-gradient(180deg, rgba(6, 31, 47, 0.96), rgba(6, 31, 47, 0.9));
  border-radius: 27px;
  padding: 1.5rem;
  color: #fff;
}}

.aclmr-kicker {{
  display: inline-block;
  margin-bottom: 0.75rem;
  color: rgba(255, 255, 255, 0.78);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}}

.aclmr-hero h1 {{
  color: #fff;
  font-size: clamp(2.2rem, 1.8rem + 1.6vw, 3.6rem);
  line-height: 0.95;
  margin: 0;
  max-width: 11ch;
}}

.aclmr-hero p {{
  color: rgba(255, 255, 255, 0.82);
  font-size: 1.05rem;
  line-height: 1.45;
  margin: 1rem 0 0;
  max-width: 64ch;
}}

.aclmr-chip-row {{
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 1.3rem;
}}

.aclmr-chip {{
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 2.5rem;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 0.92rem;
}}

.aclmr-chip strong {{
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
}}

.aclmr-callout-title {{
  display: inline-block;
  margin-bottom: 0.8rem;
  color: rgba(255, 255, 255, 0.76);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}}

.aclmr-callout-grid {{
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 1rem;
}}

.aclmr-callout-grid .aclmr-statbox:last-child {{
  grid-column: 1 / -1;
}}

.aclmr-statbox {{
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 22px;
  padding: 1rem 0.95rem;
}}

.aclmr-statbox-label {{
  color: rgba(255, 255, 255, 0.72);
  font-size: 0.74rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}}

.aclmr-statbox-value {{
  color: #fff;
  font-size: clamp(1.15rem, 1rem + 0.45vw, 1.45rem);
  line-height: 1.05;
  margin-top: 0.55rem;
  word-break: normal;
}}

.aclmr-statbox-note {{
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.85rem;
  line-height: 1.4;
  margin-top: 0.4rem;
}}

.aclmr-pixels {{
  position: absolute;
  right: 1rem;
  top: 1rem;
  display: grid;
  grid-template-columns: repeat(4, 10px);
  gap: 5px;
  opacity: 0.95;
}}

.aclmr-pixels span {{
  width: 10px;
  height: 10px;
  background: transparent;
}}

.aclmr-pixels span:nth-child(2),
.aclmr-pixels span:nth-child(5),
.aclmr-pixels span:nth-child(11) {{
  background: rgba(255, 255, 255, 0.55);
}}

.aclmr-pixels span:nth-child(4),
.aclmr-pixels span:nth-child(9) {{
  background: var(--aclmr-orange);
}}

.aclmr-pixels span:nth-child(7),
.aclmr-pixels span:nth-child(14) {{
  background: var(--aclmr-sand);
}}

.aclmr-filter-ribbon {{
  margin: 0.4rem 0 1.25rem;
  padding: 1rem 1.2rem;
  border-radius: 24px;
  background: linear-gradient(90deg, rgba(4, 28, 44, 0.98), rgba(52, 89, 97, 0.92));
  box-shadow: var(--aclmr-shadow);
}}

.aclmr-filter-ribbon__title {{
  color: rgba(255, 255, 255, 0.76);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin-bottom: 0.75rem;
}}

.aclmr-filter-ribbon__body {{
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}}

.aclmr-filter-pill {{
  padding: 0.5rem 0.85rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 0.9rem;
}}

.aclmr-filter-pill strong {{
  color: rgba(255, 255, 255, 0.74);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.72rem;
}}

.stTabs [data-baseweb="tab-list"] {{
  gap: 0.45rem;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: stretch;
  background: linear-gradient(90deg, rgba(4, 28, 44, 0.98), rgba(6, 31, 47, 0.96));
  padding: 0.5rem;
  border-radius: 28px;
  box-shadow: var(--aclmr-shadow);
}}

.stTabs [data-baseweb="tab"] {{
  width: 100%;
  border-radius: 999px;
  padding: 0.72rem 0.9rem;
  min-height: 3rem;
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: normal;
  text-align: center;
  line-height: 1.18;
}}

.stTabs [aria-selected="true"] {{
  background: var(--aclmr-gradient) !important;
  color: #fff !important;
}}

.aclmr-section-heading {{
  margin: 1.5rem 0 0.9rem;
}}

.aclmr-section-heading__eyebrow {{
  display: inline-block;
  color: var(--aclmr-orange);
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  margin-bottom: 0.45rem;
}}

.aclmr-section-heading h2 {{
  color: var(--aclmr-white);
  font-size: clamp(1.65rem, 1.4rem + 0.6vw, 2.1rem);
  line-height: 1;
  margin: 0;
}}

.aclmr-section-heading p {{
  color: rgba(255, 255, 255, 0.78);
  font-size: 1rem;
  line-height: 1.5;
  margin: 0.55rem 0 0;
  max-width: 80ch;
}}

div[data-testid="stMetric"] {{
  position: relative;
  min-height: 8.5rem;
  background: var(--aclmr-surface);
  border: 1px solid var(--aclmr-border);
  border-radius: 26px;
  padding: 1rem 1rem 0.9rem;
  box-shadow: var(--aclmr-shadow);
  overflow: hidden;
}}

div[data-testid="stMetric"]::before {{
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 0.38rem;
  background: var(--aclmr-gradient);
}}

div[data-testid="stMetricLabel"] {{
  color: var(--aclmr-muted);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}}

div[data-testid="stMetricValue"] {{
  color: var(--aclmr-navy-deep);
  font-size: clamp(1.7rem, 1.2rem + 1vw, 2.6rem);
}}

div[data-testid="stPlotlyChart"],
div[data-testid="stDataFrame"],
div[data-testid="stAlert"],
div[data-testid="stTable"] {{
  background: var(--aclmr-surface);
  border: 1px solid var(--aclmr-border);
  border-radius: 26px;
  padding: 0.65rem;
  box-shadow: var(--aclmr-shadow);
}}

div[data-testid="stDataFrame"] {{
  padding-top: 0.3rem;
}}

div[data-testid="stPlotlyChart"] {{
  padding: 0.85rem 0.9rem 0.45rem;
  overflow: visible !important;
}}

div[data-testid="stPlotlyChart"] > div,
div[data-testid="stPlotlyChart"] .js-plotly-plot,
div[data-testid="stPlotlyChart"] .plot-container,
div[data-testid="stPlotlyChart"] .svg-container {{
  width: 100% !important;
  max-width: 100% !important;
  overflow: visible !important;
}}

div[data-testid="stPlotlyChart"] .modebar {{
  right: 0.2rem !important;
  top: 0.2rem !important;
}}

div[data-testid="stTable"] {{
  padding: 0.25rem 0.85rem 0.8rem;
  overflow: visible !important;
}}

div[data-testid="stTable"] table {{
  width: 100%;
  border-collapse: collapse;
}}

div[data-testid="stTable"] thead tr {{
  border-bottom: 1px solid rgba(195, 158, 128, 0.45);
}}

div[data-testid="stTable"] th {{
  color: var(--aclmr-muted);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}}

div[data-testid="stTable"] td {{
  color: var(--aclmr-text);
  font-size: 0.92rem;
}}

div[data-testid="stCaptionContainer"] p,
.stMarkdown p,
.st-emotion-cache-10trblm p {{
  color: var(--aclmr-muted);
}}

.aclmr-footer {{
  position: relative;
  margin-top: 1.6rem;
  padding: 1.35rem 1.45rem;
  border-radius: 28px;
  background: linear-gradient(135deg, rgba(4, 28, 44, 0.98), rgba(6, 31, 47, 0.96));
  box-shadow: var(--aclmr-shadow);
  overflow: hidden;
}}

.aclmr-footer h3 {{
  margin: 0;
  color: #fff;
  font-size: 1.2rem;
}}

.aclmr-footer p {{
  margin: 0.65rem 0 0;
  color: rgba(255, 255, 255, 0.76);
  line-height: 1.45;
  max-width: 90ch;
}}

@media (max-width: 1100px) {{
  .aclmr-hero {{
    grid-template-columns: 1fr;
  }}

  .stTabs [data-baseweb="tab-list"] {{
    grid-template-columns: repeat(3, minmax(0, 1fr));
    border-radius: 28px;
  }}
}}

@media (max-width: 780px) {{
  .block-container {{
    padding-top: 1rem;
  }}

  [data-testid="stBaseButton-headerNoPadding"] {{
    margin-left: 0;
    margin-top: 0;
    padding: 0.45rem 0.75rem;
  }}

  .aclmr-hero__copy,
  .aclmr-hero__aside-inner,
  .aclmr-filter-ribbon,
  .aclmr-footer {{
    border-radius: 22px;
  }}

  .aclmr-callout-grid {{
    grid-template-columns: 1fr;
  }}

  .stTabs [data-baseweb="tab-list"] {{
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    border-radius: 24px;
    padding-bottom: 0.35rem;
  }}

  .stTabs [data-baseweb="tab"] {{
    width: auto;
    min-width: 172px;
    font-size: 0.74rem;
    padding: 0.7rem 0.85rem;
  }}

  section[data-testid="stSidebar"][aria-expanded="false"] {{
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    bottom: 0 !important;
    width: 0 !important;
    min-width: 0 !important;
    max-width: 0 !important;
    flex-basis: 0 !important;
    transform: translateX(-100%) !important;
    overflow: hidden !important;
    border-right: 0 !important;
  }}

  section[data-testid="stSidebar"][aria-expanded="false"] > div {{
    width: 0 !important;
    min-width: 0 !important;
    opacity: 0 !important;
    pointer-events: none !important;
  }}

  section[data-testid="stSidebar"][aria-expanded="true"] {{
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    bottom: 0 !important;
    width: min(84vw, 320px) !important;
    min-width: min(84vw, 320px) !important;
    max-width: min(84vw, 320px) !important;
    height: 100vh !important;
    z-index: 1001 !important;
    box-shadow: 16px 0 40px rgba(0, 0, 0, 0.26);
  }}

  section[data-testid="stSidebar"][aria-expanded="true"] > div {{
    width: 100% !important;
    min-width: 100% !important;
    opacity: 1 !important;
    pointer-events: auto !important;
  }}
}}
</style>
"""


def plotly_layout() -> dict:
    return {
        "paper_bgcolor": THEME.surface,
        "plot_bgcolor": THEME.surface,
        "font": {"color": THEME.text, "family": "PT Sans, sans-serif"},
        "legend": {"orientation": "h", "y": 1.02, "x": 0, "font": {"size": 12}},
        "margin": {"l": 20, "r": 20, "t": 44, "b": 20},
        "title": {"font": {"size": 18, "color": THEME.navy_deep}},
        "hoverlabel": {"bgcolor": THEME.navy_deep, "font": {"color": THEME.white}},
        "xaxis": {
            "title": None,
            "gridcolor": THEME.grid,
            "linecolor": THEME.axis,
            "zerolinecolor": THEME.grid,
            "automargin": True,
        },
        "yaxis": {
            "title": None,
            "gridcolor": THEME.grid,
            "linecolor": THEME.axis,
            "zerolinecolor": THEME.grid,
            "automargin": True,
        },
    }


@st.cache_data(show_spinner=False)
def load_dashboard_assets() -> tuple[dict, dict[str, pd.DataFrame]]:
    return load_metadata(DATA_ROOT), load_tables(DATA_ROOT)


def inject_global_styles() -> None:
    st.markdown(GLOBAL_STYLES, unsafe_allow_html=True)


def month_label(value: pd.Timestamp | str | None) -> str:
    if value is None:
        return "n/a"
    if isinstance(value, pd.Timestamp):
        return value.strftime("%Y-%m")
    return str(value)[:7]


def months_in_window(date_window: tuple[pd.Timestamp, pd.Timestamp]) -> int:
    start, end = (pd.Timestamp(date_window[0]), pd.Timestamp(date_window[1]))
    return max(1, (end.year - start.year) * 12 + end.month - start.month + 1)


def compact_scope_label(value: str, all_value: str, fallback: str) -> str:
    return fallback if value == all_value else value


def render_dashboard_shell(
    metadata: dict,
    date_window: tuple[pd.Timestamp, pd.Timestamp],
    province_scope: str,
    occupation_scope: str,
    industry_scope: str,
) -> None:
    source_window = metadata.get("source_window", {})
    refresh_month = month_label(source_window.get("max_date"))
    window_start = month_label(pd.Timestamp(date_window[0]))
    window_end = month_label(pd.Timestamp(date_window[1]))
    st.markdown(
        f"""
        <section class="aclmr-hero">
          <div class="aclmr-hero__copy">
            <div class="aclmr-kicker">ACLMR dashboard surface</div>
            <h1>Labour demand in Canadian job postings</h1>
            <p>
              A descriptive, economics-driven monitoring surface for Vicinity job ads,
              redesigned to feel like ACLMR while keeping the dashboard useful for operators and researchers.
            </p>
            <div class="aclmr-chip-row">
              <span class="aclmr-chip"><strong>Window</strong> {escape(window_start)} to {escape(window_end)}</span>
              <span class="aclmr-chip"><strong>Refresh</strong> {escape(refresh_month)}</span>
              <span class="aclmr-chip"><strong>Frame</strong> Postings, not employment</span>
            </div>
          </div>
          <div class="aclmr-hero__aside">
            <div class="aclmr-hero__aside-inner">
              <div class="aclmr-pixels">
                <span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span>
                <span></span><span></span><span></span><span></span>
              </div>
              <div class="aclmr-callout-title">Research frame</div>
              <p>
                Read the dashboard as a disciplined summary of posted labour demand, with
                explicit coverage caveats and cautious freshness messaging.
              </p>
              <div class="aclmr-callout-grid">
                <div class="aclmr-statbox">
                  <div class="aclmr-statbox-label">Months in view</div>
                  <div class="aclmr-statbox-value">{months_in_window(date_window)}</div>
                  <div class="aclmr-statbox-note">Selected analysis window.</div>
                </div>
                <div class="aclmr-statbox">
                  <div class="aclmr-statbox-label">Source window</div>
                  <div class="aclmr-statbox-value">{escape(month_label(source_window.get("min_date")))}</div>
                  <div class="aclmr-statbox-note">Beginning of processed coverage.</div>
                </div>
                <div class="aclmr-statbox">
                  <div class="aclmr-statbox-label">Latest source month</div>
                  <div class="aclmr-statbox-value">{escape(refresh_month)}</div>
                  <div class="aclmr-statbox-note">Upstream endpoint, still caveat-aware.</div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section class="aclmr-filter-ribbon">
          <div class="aclmr-filter-ribbon__title">Active filters</div>
          <div class="aclmr-filter-ribbon__body">
            <span class="aclmr-filter-pill"><strong>Geography</strong> {escape(compact_scope_label(province_scope, ALL_CANADA, "National frame"))}</span>
            <span class="aclmr-filter-pill"><strong>Occupation</strong> {escape(compact_scope_label(occupation_scope, ALL_OCCUPATIONS, "All occupations"))}</span>
            <span class="aclmr-filter-pill"><strong>Industry</strong> {escape(compact_scope_label(industry_scope, ALL_INDUSTRIES, "All industries"))}</span>
          </div>
        </section>
        """,
        unsafe_allow_html=True,
    )


def render_footer_note(metadata: dict) -> None:
    max_date = month_label(metadata.get("source_window", {}).get("max_date"))
    st.markdown(
        f"""
        <section class="aclmr-footer">
          <h3>Interpret with labour-market caution</h3>
          <p>
            Latest processed month: {escape(max_date)}. The dashboard summarizes posting activity in Vicinity data.
            Wage, remote-work, language, and detailed requirement fields still need denominator context, and 2025 provenance
            remains a visible caution rather than a hidden footnote.
          </p>
        </section>
        """,
        unsafe_allow_html=True,
    )


def apply_selector_filters(
    frame: pd.DataFrame,
    province_scope: str | None = None,
    occupation_scope: str | None = None,
    industry_scope: str | None = None,
) -> pd.DataFrame:
    filtered = frame.copy()
    if province_scope is not None and "province_scope" in filtered.columns:
        filtered = filtered.loc[filtered["province_scope"] == province_scope]
    if occupation_scope is not None and "occupation_scope" in filtered.columns:
        filtered = filtered.loc[filtered["occupation_scope"] == occupation_scope]
    if industry_scope is not None and "industry_scope" in filtered.columns:
        filtered = filtered.loc[filtered["industry_scope"] == industry_scope]
    return filtered


def apply_date_window(frame: pd.DataFrame, date_window: tuple[pd.Timestamp, pd.Timestamp]) -> pd.DataFrame:
    start, end = date_window
    if "month" not in frame.columns:
        return frame.copy()
    return frame.loc[(frame["month"] >= start) & (frame["month"] <= end)].copy()


def filter_skills_frame(
    frame: pd.DataFrame,
    *,
    province_scope: str,
    occupation_scope: str,
    industry_scope: str,
) -> pd.DataFrame:
    filtered = frame.copy()
    if province_scope != ALL_CANADA and "province_scope" in filtered.columns:
        filtered = filtered.loc[filtered["province_scope"] == province_scope]
    if occupation_scope != ALL_OCCUPATIONS and "occupation_scope" in filtered.columns:
        filtered = filtered.loc[filtered["occupation_scope"] == occupation_scope]
    if industry_scope != ALL_INDUSTRIES and "industry_scope" in filtered.columns:
        filtered = filtered.loc[filtered["industry_scope"] == industry_scope]
    return filtered


def section_header(title: str, body: str) -> None:
    st.markdown(
        f"""
        <div class="aclmr-section-heading">
          <div class="aclmr-section-heading__eyebrow">Dashboard section</div>
          <h2>{escape(title)}</h2>
          <p>{escape(body)}</p>
        </div>
        """,
        unsafe_allow_html=True,
    )


def finalize_figure(
    fig: go.Figure,
    *,
    is_timeseries: bool = False,
    horizontal_bar: bool = False,
) -> go.Figure:
    fig.update_layout(**plotly_layout())
    fig.update_layout(height=430, hovermode="x unified" if is_timeseries else "closest")

    if len(fig.data) >= 5:
        fig.update_layout(
            legend={
                "orientation": "v",
                "y": 1,
                "yanchor": "top",
                "x": 1.02,
                "xanchor": "left",
                "font": {"size": 11},
                "bgcolor": "rgba(255, 255, 255, 0.88)",
                "bordercolor": THEME.card_border,
                "borderwidth": 1,
            },
            margin={"l": 20, "r": 170, "t": 44, "b": 20},
        )

    if horizontal_bar:
        fig.update_layout(margin={"l": 170, "r": 20, "t": 44, "b": 20})

    fig.update_xaxes(title=None, automargin=True)
    fig.update_yaxes(title=None, automargin=True)
    return fig


def make_line_chart(frame: pd.DataFrame, x: str, y: str, color: str | None = None, title: str | None = None) -> go.Figure:
    fig = px.line(
        frame,
        x=x,
        y=y,
        color=color,
        color_discrete_sequence=PLOTLY_SEQUENCE,
        title=title,
    )
    return finalize_figure(fig, is_timeseries=True)


def make_area_chart(frame: pd.DataFrame, x: str, y: str, color: str, title: str | None = None) -> go.Figure:
    fig = px.area(
        frame,
        x=x,
        y=y,
        color=color,
        color_discrete_sequence=PLOTLY_SEQUENCE,
        title=title,
    )
    fig.update_traces(line={"width": 1.35})
    return finalize_figure(fig, is_timeseries=True)


def make_bar_chart(
    frame: pd.DataFrame,
    x: str,
    y: str,
    color: str | None = None,
    title: str | None = None,
    *,
    orientation: str = "v",
) -> go.Figure:
    if orientation == "h":
        plot_frame = frame.iloc[::-1].copy()
        fig = px.bar(
            plot_frame,
            x=y,
            y=x,
            color=color,
            orientation="h",
            color_discrete_sequence=PLOTLY_SEQUENCE,
            title=title,
        )
        fig.update_traces(marker_line_width=0)
        return finalize_figure(fig, horizontal_bar=True)

    fig = px.bar(
        frame,
        x=x,
        y=y,
        color=color,
        color_discrete_sequence=PLOTLY_SEQUENCE,
        title=title,
    )
    fig.update_traces(marker_line_width=0)
    return finalize_figure(fig)


def plot_chart(fig: go.Figure, key: str | None = None) -> None:
    st.plotly_chart(
        fig,
        width="stretch",
        key=key,
        config={"displaylogo": False, "displayModeBar": False, "responsive": True},
    )


def show_table(frame: pd.DataFrame) -> None:
    st.table(frame.reset_index(drop=True))


def show_empty(message: str) -> None:
    st.info(message)


def latest_month(frame: pd.DataFrame) -> pd.Timestamp | None:
    if frame.empty or "month" not in frame.columns:
        return None
    return pd.Timestamp(frame["month"].max())


def add_share(frame: pd.DataFrame, group_cols: list[str], value_col: str = "postings_total", share_col: str = "share_pct") -> pd.DataFrame:
    if frame.empty:
        result = frame.copy()
        result[share_col] = []
        return result
    result = frame.copy()
    totals = result.groupby(group_cols)[value_col].transform("sum")
    result[share_col] = 100.0 * result[value_col] / totals.clip(lower=1)
    return result


def latest_slice(frame: pd.DataFrame) -> pd.DataFrame:
    latest = latest_month(frame)
    if latest is None:
        return frame.iloc[0:0].copy()
    return frame.loc[frame["month"] == latest].copy()


def summarize_selected_window(frame: pd.DataFrame, group_cols: list[str], value_col: str = "postings_total") -> pd.DataFrame:
    if frame.empty:
        return pd.DataFrame(columns=[*group_cols, value_col])
    return frame.groupby(group_cols, as_index=False)[value_col].sum()


def rank_and_limit(
    frame: pd.DataFrame,
    *,
    sort_col: str,
    limit: int = MAX_LIST_ITEMS,
    ascending: bool = False,
    tie_breakers: list[str] | None = None,
) -> pd.DataFrame:
    if frame.empty:
        return frame.copy()
    tie_breakers = tie_breakers or []
    sort_cols = [sort_col, *tie_breakers]
    sort_directions = [ascending, *([True] * len(tie_breakers))]
    return frame.sort_values(sort_cols, ascending=sort_directions).head(limit).copy()


def top_ranked_values(
    frame: pd.DataFrame,
    label_col: str,
    *,
    value_col: str = "postings_total",
    limit: int = MAX_LIST_ITEMS,
    exclude_values: set[str] | None = None,
) -> list[str]:
    if frame.empty:
        return []
    exclude_values = exclude_values or set()
    filtered = frame.loc[frame[label_col].notna() & (~frame[label_col].isin(exclude_values))]
    if filtered.empty:
        return []
    summary = summarize_selected_window(filtered, [label_col], value_col=value_col)
    top = rank_and_limit(summary, sort_col=value_col, limit=limit, tie_breakers=[label_col])
    return top[label_col].tolist()


def build_selector_options(
    cube: pd.DataFrame,
    label_col: str,
    *,
    all_value: str,
    scope_filters: dict[str, str],
    exclude_values: set[str] | None = None,
) -> list[str]:
    filtered = cube.copy()
    for column, value in scope_filters.items():
        filtered = filtered.loc[filtered[column] == value]
    top_values = top_ranked_values(
        filtered,
        label_col,
        limit=max(MAX_LIST_ITEMS - 1, 0),
        exclude_values={all_value, *(exclude_values or set())},
    )
    return [all_value, *top_values]


def render_metric_rows(items: list[tuple[str, str]], *, columns: int = 4) -> None:
    for start in range(0, len(items), columns):
        row = st.columns(columns)
        for column, (label, value) in zip(row, items[start : start + columns], strict=False):
            column.metric(label, value)


def compute_top_group_shares(
    frame: pd.DataFrame,
    group_col: str,
    *,
    time_col: str = "month",
    value_col: str = "postings_total",
    top_n: int = MAX_LIST_ITEMS,
) -> pd.DataFrame:
    if frame.empty:
        return frame.copy()

    group_totals = rank_and_limit(
        frame.groupby(group_col, as_index=False)[value_col].sum(),
        sort_col=value_col,
        limit=top_n,
        tie_breakers=[group_col],
    )
    if group_totals.empty:
        return frame.iloc[0:0].copy()

    month_totals = frame.groupby(time_col, as_index=False)[value_col].sum().rename(columns={value_col: "denominator_total"})
    result = frame.merge(month_totals, on=time_col, how="left")
    result["share_pct"] = 100.0 * result[value_col] / result["denominator_total"].clip(lower=1)
    return result.loc[result[group_col].isin(group_totals[group_col])].copy()


def compute_market_concentration_summary(market_frame: pd.DataFrame, *, top_n: int = MAX_LIST_ITEMS) -> pd.DataFrame:
    if market_frame.empty:
        return pd.DataFrame(
            columns=[
                "market_province",
                "market",
                "market_label",
                "postings_total",
                "window_share_pct",
                "cumulative_share_pct",
            ]
        )

    market_summary = summarize_selected_window(market_frame, ["market_province", "market", "market_label"])
    market_total = max(float(market_summary["postings_total"].sum()), 1.0)
    market_summary["window_share_pct"] = 100.0 * market_summary["postings_total"] / market_total
    market_summary = rank_and_limit(
        market_summary,
        sort_col="postings_total",
        limit=top_n,
        tie_breakers=["market_label"],
    )
    market_summary["cumulative_share_pct"] = market_summary["window_share_pct"].cumsum()
    return market_summary


def recent_vs_prior(frame: pd.DataFrame, group_col: str, value_col: str = "postings_total") -> pd.DataFrame:
    if frame.empty or "month" not in frame.columns:
        return pd.DataFrame(columns=[group_col, "prior_postings", "recent_postings", "abs_change", "pct_change"])

    months = sorted(pd.Timestamp(value) for value in frame["month"].dropna().unique())
    if len(months) < 2:
        return pd.DataFrame(columns=[group_col, "prior_postings", "recent_postings", "abs_change", "pct_change"])

    window = min(COMPARISON_MONTHS, max(1, len(months) // 2))
    recent_months = months[-window:]
    prior_months = months[-2 * window : -window]
    if not prior_months:
        split = len(months) // 2
        prior_months = months[:split]
        recent_months = months[split:]
    if not prior_months or not recent_months:
        return pd.DataFrame(columns=[group_col, "prior_postings", "recent_postings", "abs_change", "pct_change"])

    prior = (
        frame.loc[frame["month"].isin(prior_months)]
        .groupby(group_col, as_index=False)[value_col]
        .sum()
        .rename(columns={value_col: "prior_postings"})
    )
    recent = (
        frame.loc[frame["month"].isin(recent_months)]
        .groupby(group_col, as_index=False)[value_col]
        .sum()
        .rename(columns={value_col: "recent_postings"})
    )
    merged = prior.merge(recent, on=group_col, how="outer").fillna(0)
    merged["abs_change"] = merged["recent_postings"] - merged["prior_postings"]
    merged["pct_change"] = merged.apply(
        lambda row: safe_pct(row["abs_change"], row["prior_postings"]) if row["prior_postings"] else None,
        axis=1,
    )
    return merged.sort_values("abs_change", ascending=False)


def concentration_metrics(frame: pd.DataFrame, value_col: str = "postings_total") -> tuple[float | None, float | None]:
    if frame.empty or frame[value_col].sum() <= 0:
        return None, None
    shares = frame[value_col] / frame[value_col].sum()
    hhi = float((shares.pow(2)).sum() * 10000.0)
    top5_share = float(shares.nlargest(min(5, len(shares))).sum() * 100.0)
    return hhi, top5_share


def rename_for_display(frame: pd.DataFrame, mapping: dict[str, str]) -> pd.DataFrame:
    return frame.rename(columns=mapping)


def province_scope_frame(
    cube: pd.DataFrame,
    date_window: tuple[pd.Timestamp, pd.Timestamp],
    occupation_scope: str,
    industry_scope: str,
) -> pd.DataFrame:
    frame = apply_date_window(
        apply_selector_filters(cube, None, occupation_scope, industry_scope),
        date_window,
    )
    return frame.loc[frame["province_scope"] != ALL_CANADA].copy()


def render_overview(
    tables: dict[str, pd.DataFrame],
    metadata: dict,
    date_window: tuple[pd.Timestamp, pd.Timestamp],
    province_scope: str,
    occupation_scope: str,
    industry_scope: str,
) -> None:
    section_header(
        "Overview",
        "Fast read on market size, growth, composition, and field coverage. Counts reflect postings, not employment.",
    )
    cube = apply_date_window(
        apply_selector_filters(tables["monthly_filter_cube"], province_scope, occupation_scope, industry_scope),
        date_window,
    )
    monthly = cube.groupby("month", as_index=False).sum(numeric_only=True).sort_values("month")
    if monthly.empty:
        show_empty("No postings match the current filters.")
        return

    headlines = summarize_headlines(monthly)
    latest = monthly.iloc[-1]
    province_frame = province_scope_frame(tables["monthly_filter_cube"], date_window, occupation_scope, industry_scope)
    latest_province_count = 0
    latest_month_value = latest_month(province_frame)
    if latest_month_value is not None:
        latest_province_count = int(
            province_frame.loc[(province_frame["month"] == latest_month_value) & (province_frame["postings_total"] > 0), "province_scope"]
            .nunique()
        )
    render_metric_rows(
        [
            ("Postings in window", format_int(headlines.postings_total)),
            ("Latest month postings", format_int(headlines.postings_latest_month)),
            ("YoY change", format_pct(headlines.postings_yoy_pct)),
            ("3M average YoY", format_pct(headlines.postings_ma3_yoy_pct)),
            ("Wage coverage", format_pct(safe_pct(latest["wage_postings"], latest["postings_total"]))),
            ("Occupation coverage", format_pct(safe_pct(latest["noc_postings"], latest["postings_total"]))),
            ("Province count covered", format_int(latest_province_count)),
            ("Latest refresh month", metadata.get("source_window", {}).get("max_date", "n/a")[:7]),
        ],
        columns=4,
    )

    growth = monthly[["month", "postings_total"]].copy()
    growth["mom_pct"] = growth["postings_total"].pct_change(1) * 100.0
    growth["yoy_pct"] = growth["postings_total"].pct_change(12) * 100.0

    monthly_col, growth_col = st.columns(2)
    with monthly_col:
        plot_chart(
            make_line_chart(monthly, x="month", y="postings_total", title="Monthly postings"),
            key="overview-monthly-postings",
        )
    with growth_col:
        growth_long = growth.melt(id_vars="month", value_vars=["mom_pct", "yoy_pct"], var_name="growth_type", value_name="growth_pct")
        plot_chart(
            make_line_chart(growth_long, x="month", y="growth_pct", color="growth_type", title="MoM and YoY growth"),
            key="overview-growth",
        )

    province_share = province_frame.copy()
    national_totals = apply_date_window(
        apply_selector_filters(tables["monthly_filter_cube"], ALL_CANADA, occupation_scope, industry_scope),
        date_window,
    )[["month", "postings_total"]].rename(columns={"postings_total": "national_total"})
    province_share = province_share.merge(national_totals, on="month", how="left")
    province_share["share_pct"] = 100.0 * province_share["postings_total"] / province_share["national_total"].clip(lower=1)
    if province_scope != ALL_CANADA:
        province_share = province_share.loc[province_share["province_scope"] == province_scope]
    else:
        top_provinces = top_ranked_values(province_share, "province_scope")
        province_share = province_share.loc[province_share["province_scope"].isin(top_provinces)]

    occupation_mix = apply_date_window(
        apply_selector_filters(tables["monthly_filter_cube"], province_scope, None, industry_scope),
        date_window,
    )
    occupation_mix = occupation_mix.loc[
        (occupation_mix["occupation_scope"] != ALL_OCCUPATIONS)
        & (occupation_mix["occupation_scope"] != UNKNOWN_OCCUPATION_GROUP)
    ]
    top_occupations = top_ranked_values(occupation_mix, "occupation_scope")
    occupation_mix = compute_top_group_shares(occupation_mix, "occupation_scope", top_n=len(top_occupations))

    coverage = apply_date_window(
        apply_selector_filters(tables["coverage_by_field_monthly"], province_scope, occupation_scope, industry_scope),
        date_window,
    )
    coverage = coverage.loc[coverage["field_name"].isin(["remunerationHrly", "noc", "remoteWorkOptions", "primaryPostingLanguage"])]
    coverage = latest_slice(coverage)
    coverage["coverage_pct"] = 100.0 * coverage["populated_postings"] / coverage["postings_total"].clip(lower=1)
    coverage = rank_and_limit(coverage, sort_col="coverage_pct", ascending=True, tie_breakers=["field_name"])

    share_col, occ_col = st.columns(2)
    with share_col:
        if province_share.empty:
            show_empty("Province-share view is empty for the current filters.")
        else:
            plot_chart(
                make_area_chart(province_share, x="month", y="share_pct", color="province_scope", title="Province share of national postings"),
                key="overview-province-share",
            )
    with occ_col:
        if occupation_mix.empty:
            show_empty("Occupation mix is empty for the current filters.")
        else:
            plot_chart(
                make_area_chart(occupation_mix, x="month", y="share_pct", color="occupation_scope", title="Broad occupation mix over time"),
                key="overview-occupation-mix",
            )

    if coverage.empty:
        show_empty("Coverage panel is empty for the latest month in the selected window.")
    else:
        plot_chart(
            make_bar_chart(
                coverage,
                x="field_name",
                y="coverage_pct",
                title="Latest-month coverage mini-panel",
                orientation="h",
            ),
            key="overview-coverage",
        )


def render_geography(
    tables: dict[str, pd.DataFrame],
    date_window: tuple[pd.Timestamp, pd.Timestamp],
    province_scope: str,
    occupation_scope: str,
    industry_scope: str,
) -> None:
    section_header(
        "Geography",
        "Regional concentration and local-market composition. Geography counts are descriptive posting measures, not employment counts.",
    )
    province_frame = province_scope_frame(tables["monthly_filter_cube"], date_window, occupation_scope, industry_scope)
    national_totals = apply_date_window(
        apply_selector_filters(tables["monthly_filter_cube"], ALL_CANADA, occupation_scope, industry_scope),
        date_window,
    )[["month", "postings_total"]].rename(columns={"postings_total": "national_total"})
    province_share = province_frame.merge(national_totals, on="month", how="left")
    province_share["share_pct"] = 100.0 * province_share["postings_total"] / province_share["national_total"].clip(lower=1)
    if province_scope != ALL_CANADA:
        province_frame = province_frame.loc[province_frame["province_scope"] == province_scope]
        province_share = province_share.loc[province_share["province_scope"] == province_scope]
    else:
        top_provinces = top_ranked_values(province_frame, "province_scope")
        province_frame = province_frame.loc[province_frame["province_scope"].isin(top_provinces)]
        province_share = province_share.loc[province_share["province_scope"].isin(top_provinces)]

    market_frame = apply_date_window(
        apply_selector_filters(tables["monthly_by_market"], province_scope, occupation_scope, industry_scope),
        date_window,
    )
    market_summary = compute_market_concentration_summary(market_frame)

    trend_col, share_col = st.columns(2)
    with trend_col:
        if province_frame.empty:
            show_empty("Province posting trends are empty for the current filters.")
        else:
            plot_chart(
                make_line_chart(province_frame, x="month", y="postings_total", color="province_scope", title="Postings by province"),
                key="geography-province-trend",
            )
    with share_col:
        if province_share.empty:
            show_empty("Province shares are empty for the current filters.")
        else:
            plot_chart(
                make_area_chart(province_share, x="month", y="share_pct", color="province_scope", title="Province share of national postings"),
                key="geography-province-share",
            )

    market_col, table_col = st.columns(2)
    with market_col:
        if market_summary.empty:
            show_empty("No market data matches the current filters.")
        else:
            label_col = "market_label" if province_scope == ALL_CANADA else "market"
            plot_chart(
                make_bar_chart(
                    market_summary,
                    x=label_col,
                    y="postings_total",
                    title="Top local areas in the selected window",
                    orientation="h",
                ),
                key="geography-top-markets",
            )
    with table_col:
        if market_summary.empty:
            show_empty("Market concentration table is empty for the current filters.")
        else:
            show_table(
                rename_for_display(
                    market_summary,
                    {
                        "market_province": "Province",
                        "market": "Local area / market",
                        "market_label": "National label",
                        "postings_total": "Postings",
                        "window_share_pct": "Selected-window share (%)",
                        "cumulative_share_pct": "Cumulative share (%)",
                    },
                )
            )


def render_occupations(
    tables: dict[str, pd.DataFrame],
    date_window: tuple[pd.Timestamp, pd.Timestamp],
    province_scope: str,
    industry_scope: str,
) -> None:
    section_header(
        "Occupations",
        "Broad occupational demand, growth, provincial mix, and concentration over the selected window.",
    )
    frame = apply_date_window(
        apply_selector_filters(tables["monthly_filter_cube"], None if province_scope == ALL_CANADA else province_scope, None, industry_scope),
        date_window,
    )
    frame = frame.loc[
        (frame["occupation_scope"] != ALL_OCCUPATIONS)
        & (frame["occupation_scope"] != UNKNOWN_OCCUPATION_GROUP)
    ]
    if province_scope == ALL_CANADA:
        trend = frame.loc[frame["province_scope"] == ALL_CANADA].copy()
    else:
        trend = frame.loc[frame["province_scope"] == province_scope].copy()

    latest_counts = summarize_selected_window(trend, ["occupation_scope"])
    latest_counts = latest_counts.sort_values(["postings_total", "occupation_scope"], ascending=[False, True])
    latest_total = max(float(latest_counts["postings_total"].sum()), 1.0) if not latest_counts.empty else 1.0
    latest_counts["share_pct"] = 100.0 * latest_counts["postings_total"] / latest_total
    trend_top = latest_counts.head(MAX_LIST_ITEMS)["occupation_scope"].tolist()
    trend_frame = compute_top_group_shares(trend, "occupation_scope", top_n=len(trend_top))
    change_table = recent_vs_prior(trend, "occupation_scope").head(MAX_LIST_ITEMS)

    mix_frame = frame.loc[frame["province_scope"] != ALL_CANADA].copy()
    mix_frame = summarize_selected_window(mix_frame, ["province_scope", "occupation_scope"])
    mix_top = latest_counts.head(MAX_LIST_ITEMS)["occupation_scope"].tolist()
    mix_provinces = top_ranked_values(mix_frame, "province_scope")
    mix_frame = add_share(mix_frame, ["province_scope"])
    mix_frame = mix_frame.loc[
        mix_frame["occupation_scope"].isin(mix_top)
        & mix_frame["province_scope"].isin(mix_provinces)
    ]
    mix_pivot = (
        mix_frame.pivot(index="province_scope", columns="occupation_scope", values="share_pct")
        .reindex(index=mix_provinces, columns=mix_top)
        .dropna(how="all")
        .fillna(0)
        .round(1)
    )

    hhi, top5_share = concentration_metrics(latest_counts)
    indicator_col, change_col = st.columns([1, 2])
    with indicator_col:
        st.metric("Occupation HHI", "n/a" if hhi is None else f"{hhi:,.0f}")
        st.metric("Top 5 occupation share", format_pct(top5_share))
    with change_col:
        if change_table.empty:
            show_empty("Need at least two months in the selected window to compare occupation growth.")
        else:
            show_table(
                rename_for_display(
                    change_table,
                    {
                        "occupation_scope": "Occupation group",
                        "prior_postings": "Prior window postings",
                        "recent_postings": "Recent window postings",
                        "abs_change": "Absolute change",
                        "pct_change": "Percent change (%)",
                    },
                )
            )

    trend_col, mix_col = st.columns(2)
    with trend_col:
        if trend_frame.empty:
            show_empty("Occupation share trend is empty for the current filters.")
        else:
            plot_chart(
                make_area_chart(trend_frame, x="month", y="share_pct", color="occupation_scope", title="Occupation share over time"),
                key="occupations-share-trend",
            )
    with mix_col:
        if mix_pivot.empty:
            show_empty("Occupation mix by province is empty for the current filters.")
        else:
            show_table(mix_pivot)


def render_industries(
    tables: dict[str, pd.DataFrame],
    date_window: tuple[pd.Timestamp, pd.Timestamp],
    province_scope: str,
    occupation_scope: str,
) -> None:
    section_header(
        "Industries",
        "Industry-coded posting mix, province patterns, and denominator coverage. Shares are always reported against the usable-industry denominator.",
    )
    base = apply_date_window(
        apply_selector_filters(tables["monthly_filter_cube"], None if province_scope == ALL_CANADA else province_scope, occupation_scope, None),
        date_window,
    )
    industry_frame = base.loc[
        (base["industry_scope"] != ALL_INDUSTRIES) & (base["industry_scope"] != UNKNOWN_INDUSTRY_GROUP)
    ].copy()
    denominator_frame = base.loc[base["industry_scope"] == ALL_INDUSTRIES, ["month", "province_scope", "occupation_scope", "naics_postings", "postings_total"]].copy()
    denominator_frame = denominator_frame.rename(
        columns={"naics_postings": "industry_coded_postings", "postings_total": "all_postings_total"}
    )

    if province_scope == ALL_CANADA:
        national_trend = industry_frame.loc[industry_frame["province_scope"] == ALL_CANADA].copy()
        national_denom = denominator_frame.loc[denominator_frame["province_scope"] == ALL_CANADA, ["month", "industry_coded_postings", "all_postings_total"]].copy()
    else:
        national_trend = industry_frame.loc[industry_frame["province_scope"] == province_scope].copy()
        national_denom = denominator_frame.loc[denominator_frame["province_scope"] == province_scope, ["month", "industry_coded_postings", "all_postings_total"]].copy()

    national_trend = national_trend.merge(national_denom, on="month", how="left")
    national_trend["share_in_coded_pct"] = 100.0 * national_trend["postings_total"] / national_trend["industry_coded_postings"].clip(lower=1)
    top_industries = top_ranked_values(national_trend, "industry_scope")
    national_trend = national_trend.loc[national_trend["industry_scope"].isin(top_industries)]
    coverage_series = national_denom.copy()
    coverage_series["coverage_pct"] = 100.0 * coverage_series["industry_coded_postings"] / coverage_series["all_postings_total"].clip(lower=1)

    province_mix = industry_frame.loc[industry_frame["province_scope"] != ALL_CANADA].copy()
    province_mix = summarize_selected_window(province_mix, ["province_scope", "industry_scope"])
    province_denoms = summarize_selected_window(
        denominator_frame.loc[denominator_frame["province_scope"] != ALL_CANADA],
        ["province_scope"],
        value_col="industry_coded_postings",
    ).rename(columns={"industry_coded_postings": "province_coded_total"})
    province_mix = province_mix.merge(province_denoms, on="province_scope", how="left")
    province_mix["share_in_coded_pct"] = 100.0 * province_mix["postings_total"] / province_mix["province_coded_total"].clip(lower=1)
    province_mix = rank_and_limit(province_mix, sort_col="postings_total", tie_breakers=["province_scope", "industry_scope"])

    change_table = recent_vs_prior(
        national_trend[["month", "industry_scope", "postings_total"]],
        "industry_scope",
    ).head(MAX_LIST_ITEMS)

    latest_coverage = coverage_series.iloc[-1] if not coverage_series.empty else None
    if latest_coverage is not None:
        st.caption(
            "Industry-coded denominator in the latest selected month: "
            f"{format_pct(latest_coverage['coverage_pct'])} of postings carry usable industry information."
        )

    coverage_col, change_col = st.columns([1, 2])
    with coverage_col:
        st.metric("Latest industry-code coverage", format_pct(None if latest_coverage is None else latest_coverage["coverage_pct"]))
    with change_col:
        if change_table.empty:
            show_empty("Need at least two months in the selected window to compare industry growth.")
        else:
            show_table(
                rename_for_display(
                    change_table,
                    {
                        "industry_scope": "Industry group",
                        "prior_postings": "Prior window postings",
                        "recent_postings": "Recent window postings",
                        "abs_change": "Absolute change",
                        "pct_change": "Percent change (%)",
                    },
                )
            )

    trend_col, coverage_time_col = st.columns(2)
    with trend_col:
        if national_trend.empty:
            show_empty("Industry trend is empty for the current filters.")
        else:
            plot_chart(
                make_area_chart(national_trend, x="month", y="share_in_coded_pct", color="industry_scope", title="Industry mix over time"),
                key="industries-mix-trend",
            )
    with coverage_time_col:
        if coverage_series.empty:
            show_empty("Industry coverage series is empty for the current filters.")
        else:
            plot_chart(
                make_line_chart(coverage_series, x="month", y="coverage_pct", title="Share of postings with usable industry codes"),
                key="industries-coverage",
            )

    if province_mix.empty:
        show_empty("Industry-by-province view is empty for the current filters.")
    else:
        show_table(
            rename_for_display(
                province_mix,
                {
                    "province_scope": "Province",
                    "industry_scope": "Industry group",
                    "postings_total": "Industry-coded postings",
                    "share_in_coded_pct": "Share within coded postings (%)",
                },
            )
        )


def render_compensation_and_conditions(
    tables: dict[str, pd.DataFrame],
    date_window: tuple[pd.Timestamp, pd.Timestamp],
    province_scope: str,
    occupation_scope: str,
    industry_scope: str,
) -> None:
    section_header(
        "Compensation And Conditions",
        "Advertised wages and job conditions, always read with denominator context for the same filtered scope.",
    )
    wage_frame = apply_date_window(
        apply_selector_filters(tables["monthly_wage_cube"], province_scope, occupation_scope, industry_scope),
        date_window,
    )
    denominator_frame = apply_date_window(
        apply_selector_filters(tables["monthly_filter_cube"], province_scope, occupation_scope, industry_scope),
        date_window,
    )[["month", "wage_postings", "postings_total"]].copy()
    denominator_frame["wage_coverage_pct"] = 100.0 * denominator_frame["wage_postings"] / denominator_frame["postings_total"].clip(lower=1)
    latest_denominator = denominator_frame.iloc[-1] if not denominator_frame.empty else None

    trend_col, coverage_col = st.columns(2)
    with trend_col:
        if wage_frame.empty:
            show_empty("No wage observations match the current filters.")
        else:
            fig = go.Figure(
                data=[
                    go.Scatter(x=wage_frame["month"], y=wage_frame["wage_p25"], name="P25", line={"color": PLOTLY_SEQUENCE[2]}),
                    go.Scatter(x=wage_frame["month"], y=wage_frame["wage_median"], name="Median", line={"color": PLOTLY_SEQUENCE[0], "width": 3}),
                    go.Scatter(x=wage_frame["month"], y=wage_frame["wage_p75"], name="P75", line={"color": PLOTLY_SEQUENCE[1]}),
                ]
            )
            fig.update_layout(title="Hourly wage median, P25, and P75 over time")
            finalize_figure(fig, is_timeseries=True)
            plot_chart(fig, key="compensation-wage-trend")
    with coverage_col:
        if denominator_frame.empty:
            show_empty("Wage coverage series is empty for the current filters.")
        else:
            plot_chart(
                make_line_chart(denominator_frame, x="month", y="wage_coverage_pct", title="Wage coverage in the same filtered denominator"),
                key="compensation-wage-coverage",
            )
    st.caption(
        "Latest-month wage coverage: "
        f"{format_pct(None if latest_denominator is None else latest_denominator['wage_coverage_pct'])}. "
        "Use wage panels as advertised-pay summaries only."
    )

    wage_province = apply_date_window(
        apply_selector_filters(tables["monthly_wage_cube"], None, occupation_scope, industry_scope),
        date_window,
    )
    wage_province = wage_province.loc[wage_province["province_scope"] != ALL_CANADA]
    wage_province = latest_slice(wage_province).sort_values(["wage_median", "province_scope"], ascending=[False, True])
    if province_scope != ALL_CANADA:
        wage_province = wage_province.loc[wage_province["province_scope"] == province_scope]
    else:
        wage_province = wage_province.head(MAX_LIST_ITEMS)

    wage_occupation = apply_date_window(
        apply_selector_filters(tables["monthly_wage_cube"], province_scope, None, industry_scope),
        date_window,
    )
    wage_occupation = wage_occupation.loc[
        (wage_occupation["occupation_scope"] != ALL_OCCUPATIONS)
        & (wage_occupation["occupation_scope"] != UNKNOWN_OCCUPATION_GROUP)
    ]
    wage_occupation = rank_and_limit(
        latest_slice(wage_occupation),
        sort_col="wage_median",
        tie_breakers=["occupation_scope"],
    )

    province_col, occupation_col = st.columns(2)
    with province_col:
        if wage_province.empty:
            show_empty("Wage-by-province view is empty for the current filters.")
        else:
            plot_chart(
                make_bar_chart(wage_province, x="province_scope", y="wage_median", title="Latest-month wage median by province"),
                key="compensation-wage-by-province",
            )
    with occupation_col:
        if wage_occupation.empty:
            show_empty("Wage-by-occupation view is empty for the current filters.")
        else:
            plot_chart(
                make_bar_chart(
                    wage_occupation,
                    x="occupation_scope",
                    y="wage_median",
                    title="Latest-month wage median by broad occupation",
                    orientation="h",
                ),
                key="compensation-wage-by-occupation",
            )

    conditions = apply_date_window(
        apply_selector_filters(tables["monthly_conditions"], province_scope, occupation_scope, industry_scope),
        date_window,
    )
    if conditions.empty:
        show_empty("Condition mix is empty for the current filters.")
        return
    conditions = summarize_selected_window(conditions, ["dimension", "category"])
    conditions = add_share(conditions, ["dimension"])
    condition_specs = ["Employment type", "Duration", "Student job flag", "Advertised by"]
    for start in range(0, len(condition_specs), 2):
        row = st.columns(2)
        for slot, dimension in zip(row, condition_specs[start : start + 2], strict=False):
            with slot:
                subset = rank_and_limit(
                    conditions.loc[conditions["dimension"] == dimension],
                    sort_col="postings_total",
                    tie_breakers=["category"],
                )
                if subset.empty:
                    show_empty(f"{dimension} is empty for the current filters.")
                else:
                    plot_chart(
                        make_bar_chart(subset, x="category", y="share_pct", title=dimension),
                        key=f"conditions-{dimension.lower().replace(' ', '-')}",
                    )


def render_requirements(
    tables: dict[str, pd.DataFrame],
    date_window: tuple[pd.Timestamp, pd.Timestamp],
    province_scope: str,
    occupation_scope: str,
    industry_scope: str,
) -> None:
    section_header(
        "Skills, Education, And Requirements",
        "Drill-down requirement panels for skills, education, and experience. These are not homepage headline metrics.",
    )
    requirements = apply_date_window(
        apply_selector_filters(tables["monthly_requirements"], province_scope, occupation_scope, industry_scope),
        date_window,
    )
    skills = apply_date_window(
        filter_skills_frame(
            tables["monthly_skills_topk"],
            province_scope=province_scope,
            occupation_scope=occupation_scope,
            industry_scope=industry_scope,
        ),
        date_window,
    )
    coverage = apply_date_window(
        apply_selector_filters(tables["coverage_by_field_monthly"], province_scope, occupation_scope, industry_scope),
        date_window,
    )
    skills_coverage = latest_slice(coverage.loc[coverage["field_name"] == "skills"])
    skills_coverage_pct = None
    if not skills_coverage.empty:
        row = skills_coverage.iloc[-1]
        skills_coverage_pct = safe_pct(row["populated_postings"], row["postings_total"])
    st.caption(f"Skills are shown only for postings with skills present. Latest-month skills coverage: {format_pct(skills_coverage_pct)}.")

    skills_summary = rank_and_limit(
        summarize_selected_window(skills, ["skill_code"]),
        sort_col="postings_total",
        tie_breakers=["skill_code"],
    )
    req_summary = summarize_selected_window(requirements, ["dimension", "category"])
    req_summary = add_share(req_summary, ["dimension"])

    skills_col, education_col = st.columns(2)
    with skills_col:
        if skills_summary.empty:
            show_empty("No skill observations match the current filters.")
        else:
            st.caption("The current aggregate exposes top skills as standardized codes, so this panel uses a ranked table until skill labels are available.")
            show_table(
                rename_for_display(
                    skills_summary,
                    {
                        "skill_code": "Skill code",
                        "postings_total": "Postings with code",
                    },
                ),
            )
    with education_col:
        education = rank_and_limit(
            req_summary.loc[req_summary["dimension"] == "Education"],
            sort_col="postings_total",
            tie_breakers=["category"],
        )
        if education.empty:
            show_empty("Education mix is empty for the current filters.")
        else:
            plot_chart(
                make_bar_chart(education, x="category", y="share_pct", title="Education mix", orientation="h"),
                key="requirements-education",
            )

    experience_col, detail_col = st.columns(2)
    with experience_col:
        experience = rank_and_limit(
            req_summary.loc[req_summary["dimension"] == "Experience category"],
            sort_col="postings_total",
            tie_breakers=["category"],
        )
        if experience.empty:
            show_empty("Experience category mix is empty for the current filters.")
        else:
            plot_chart(
                make_bar_chart(experience, x="category", y="share_pct", title="Experience category mix", orientation="h"),
                key="requirements-experience",
            )
    with detail_col:
        detail = rank_and_limit(
            req_summary.loc[req_summary["dimension"] == "Experience details band"],
            sort_col="postings_total",
            tie_breakers=["category"],
        )
        if detail.empty:
            show_empty("Experience-details bands are empty for the current filters.")
        else:
            plot_chart(
                make_bar_chart(detail, x="category", y="share_pct", title="Experience-details coverage and bins", orientation="h"),
                key="requirements-experience-detail",
            )


def render_quality(
    tables: dict[str, pd.DataFrame],
    metadata: dict,
    date_window: tuple[pd.Timestamp, pd.Timestamp],
    province_scope: str,
    occupation_scope: str,
    industry_scope: str,
) -> None:
    section_header(
        "Data Quality And Freshness",
        "Coverage notes, freshness limits, and interpretation guardrails that keep the dashboard trustworthy.",
    )
    latest_processed = metadata.get("source_window", {}).get("max_date", "n/a")
    earliest_processed = metadata.get("source_window", {}).get("min_date", "n/a")
    cards = st.columns(3)
    cards[0].metric("Latest processed month", latest_processed[:7] if isinstance(latest_processed, str) else "n/a")
    cards[1].metric("Source window start", earliest_processed)
    cards[2].metric("Source window end", latest_processed)

    coverage = apply_date_window(
        apply_selector_filters(tables["coverage_by_field_monthly"], province_scope, occupation_scope, industry_scope),
        date_window,
    )
    coverage = latest_slice(coverage)
    coverage["coverage_pct"] = 100.0 * coverage["populated_postings"] / coverage["postings_total"].clip(lower=1)
    coverage = rank_and_limit(coverage, sort_col="coverage_pct", ascending=True, tie_breakers=["field_name"])

    language = apply_date_window(
        apply_selector_filters(tables["monthly_language"], province_scope, occupation_scope, industry_scope),
        date_window,
    )
    language = summarize_selected_window(language, ["dimension", "category"])
    language = add_share(language, ["dimension"])
    language = rank_and_limit(language, sort_col="postings_total", tie_breakers=["dimension", "category"])

    notes_col, table_col = st.columns([1, 2])
    with notes_col:
        st.warning(
            "Interpretation guardrail: postings measure hiring demand in the Vicinity data, not employment, unemployment, or total economy-wide vacancies."
        )
        st.info(
            "2025 provenance note: the processed source currently runs through 2025-07, but the upstream 2025 raw-fetch provenance remains under audit."
        )
        st.caption(
            "Wage coverage note: wage series describe only postings with hourly wage data in the same filtered denominator."
        )
        st.caption(
            "Remote and language availability note: remote-work and language fields are historically sparse and should be read as partial-coverage indicators."
        )
        for caveat in metadata.get("known_caveats", []):
            st.markdown(f"- {caveat}")
    with table_col:
        if coverage.empty:
            show_empty("Coverage table is empty for the current filters.")
        else:
            show_table(
                rename_for_display(
                    coverage[["field_name", "postings_total", "populated_postings", "coverage_pct"]],
                    {
                        "field_name": "Field",
                        "postings_total": "Postings in denominator",
                        "populated_postings": "Populated postings",
                        "coverage_pct": "Coverage (%)",
                    },
                )
            )

    if language.empty:
        show_empty("Language and requirement coverage table is empty for the current filters.")
    else:
        show_table(
            rename_for_display(
                language,
                {
                    "dimension": "Language dimension",
                    "category": "Category",
                    "postings_total": "Postings",
                    "share_pct": "Share (%)",
                },
            )
        )


def main() -> None:
    st.set_page_config(
        page_title="ACLMR Job Ads Labor Market Dashboard",
        layout="wide",
        initial_sidebar_state="auto",
    )
    inject_global_styles()

    if not DATA_ROOT.exists():
        st.error(
            "Derived dashboard data is missing. Run `jobads-dashboard refresh` first to build `data/derived/labor_market_dashboard_v1/`."
        )
        st.stop()

    metadata, tables = load_dashboard_assets()
    monthly = tables["monthly_overall"].copy()
    monthly["month"] = pd.to_datetime(monthly["month"])
    date_values = sorted(monthly["month"].unique())
    min_month = pd.Timestamp(date_values[0]).to_pydatetime()
    max_month = pd.Timestamp(date_values[-1]).to_pydatetime()

    cube = tables["monthly_filter_cube"]
    province_options = build_selector_options(
        cube,
        "province_scope",
        all_value=ALL_CANADA,
        scope_filters={
            "occupation_scope": ALL_OCCUPATIONS,
            "industry_scope": ALL_INDUSTRIES,
        },
    )
    occupation_options = build_selector_options(
        cube,
        "occupation_scope",
        all_value=ALL_OCCUPATIONS,
        scope_filters={
            "province_scope": ALL_CANADA,
            "industry_scope": ALL_INDUSTRIES,
        },
        exclude_values={UNKNOWN_OCCUPATION_GROUP},
    )
    industry_options = build_selector_options(
        cube,
        "industry_scope",
        all_value=ALL_INDUSTRIES,
        scope_filters={
            "province_scope": ALL_CANADA,
            "occupation_scope": ALL_OCCUPATIONS,
        },
        exclude_values={UNKNOWN_INDUSTRY_GROUP},
    )

    with st.sidebar:
        st.markdown(
            """
            <div class="aclmr-sidebar-brand">
              <div class="aclmr-sidebar-kicker">ACLMR</div>
              <h2>Job ads dashboard</h2>
              <p>Use the controls below to set the research frame. The main page keeps the narrative and caveats visible.</p>
            </div>
            """,
            unsafe_allow_html=True,
        )
        st.subheader("Filters")
        date_window = st.slider(
            "Date range",
            min_value=min_month,
            max_value=max_month,
            value=(min_month, max_month),
            format="YYYY-MM",
        )
        province_scope = st.selectbox("Geography", options=province_options, index=province_options.index(ALL_CANADA))
        occupation_scope = st.selectbox("Occupation group", options=occupation_options, index=occupation_options.index(ALL_OCCUPATIONS))
        industry_scope = st.selectbox("Industry group", options=industry_options, index=industry_options.index(ALL_INDUSTRIES))
        st.markdown("#### Notes")
        st.caption("Wages, remote-work fields, and language fields always require coverage context.")
        st.caption("Industry charts are shown relative to postings with usable industry codes.")

    render_dashboard_shell(metadata, date_window, province_scope, occupation_scope, industry_scope)

    tabs = st.tabs(
        [
            "Overview",
            "Geography",
            "Occupations",
            "Industries",
            "Compensation and Conditions",
            "Skills, Education, and Requirements",
            "Data Quality",
        ]
    )

    with tabs[0]:
        render_overview(tables, metadata, date_window, province_scope, occupation_scope, industry_scope)
    with tabs[1]:
        render_geography(tables, date_window, province_scope, occupation_scope, industry_scope)
    with tabs[2]:
        render_occupations(tables, date_window, province_scope, industry_scope)
    with tabs[3]:
        render_industries(tables, date_window, province_scope, occupation_scope)
    with tabs[4]:
        render_compensation_and_conditions(tables, date_window, province_scope, occupation_scope, industry_scope)
    with tabs[5]:
        render_requirements(tables, date_window, province_scope, occupation_scope, industry_scope)
    with tabs[6]:
        render_quality(tables, metadata, date_window, province_scope, occupation_scope, industry_scope)

    render_footer_note(metadata)


if __name__ == "__main__":
    main()
