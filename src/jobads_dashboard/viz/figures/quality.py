"""Data quality & methods - the trust page."""

from __future__ import annotations

import pandas as pd
import plotly.graph_objects as go

from .._capctx import UNCAPPED
from ..datasource import DataSource
from ..theme import BRAND, CONTEXT, DOWN, MUTED, add_provisional_band, add_unstable_band
from ._common import titled

from ..theme import COLORWAY

# Friendly labels for the raw field names in coverage_by_field_monthly.
_FIELD_LABELS = {
    "noc": "Occupation (NOC)", "naics": "Industry (NAICS)", "remunerationHrly": "Hourly wage",
    "remoteWorkOptions": "Remote work", "primaryPostingLanguage": "Posting language",
    "englishLanguageRequirement": "English req.", "frenchLanguageRequirement": "French req.",
    "experienceDetails": "Experience detail", "education": "Education", "skills": "Skills",
    "type": "Employment type", "duration": "Duration", "advertisedBy": "Advertised by",
}
_KEY_FIELDS = ["noc", "naics", "remunerationHrly", "education", "skills", "remoteWorkOptions"]


def coverage_lines(ds: DataSource) -> go.Figure:
    cov = ds.coverage_overall
    fig = go.Figure()
    for i, f in enumerate(_KEY_FIELDS):
        sub = cov[cov["field_name"] == f]
        fig.add_trace(go.Scatter(x=sub["month"], y=sub["coverage_pct"], mode="lines",
                                 name=_FIELD_LABELS.get(f, f),
                                 line=dict(width=2.2, color=COLORWAY[i % len(COLORWAY)]),
                                 hovertemplate="%{x|%b %Y} · " + _FIELD_LABELS.get(f, f) + ": %{y:.0f}%<extra></extra>"))
    add_unstable_band(fig)
    add_provisional_band(fig)
    fig.update_yaxes(title_text="% of postings with the field", ticksuffix="%", range=[0, 100])
    return titled(fig, "How complete is each field? Coverage over time",
                  "Sparse fields (wage, remote, skills) are honest only where coverage is high")


def coverage_latest_bars(ds: DataSource) -> go.Figure:
    cov = ds.coverage_overall
    latest = cov[cov["month"] == cov["month"].max()].copy()
    latest["label"] = latest["field_name"].map(lambda f: _FIELD_LABELS.get(f, f))
    # Cap at ten fields: always keep the six key fields, then fill with the
    # sparsest of the rest so the "read sparse fields with their denominator"
    # message stays intact (the well-covered extras are the ones dropped).
    # The team view (uncapped) shows every field.
    if not UNCAPPED.get() and len(latest) > 10:
        key = latest[latest["field_name"].isin(_KEY_FIELDS)]
        rest = latest[~latest["field_name"].isin(_KEY_FIELDS)].sort_values("coverage_pct")
        latest = pd.concat([key, rest.head(10 - len(key))])
    latest = latest.sort_values("coverage_pct")
    colors = [BRAND if v >= 80 else (CONTEXT if v >= 40 else DOWN) for v in latest["coverage_pct"]]
    fig = go.Figure(go.Bar(
        x=latest["coverage_pct"], y=latest["label"], orientation="h", marker_color=colors,
        text=latest["coverage_pct"].map(lambda v: f"{v:.0f}%"), textposition="auto",
        hovertemplate="%{y}: %{x:.0f}% covered<extra></extra>"))
    fig.update_xaxes(title_text="% of postings with the field (latest month)", ticksuffix="%",
                     range=[0, 100])
    fig.update_layout(height=440)
    return titled(fig, "Field completeness today",
                  "Green ≥80% · grey 40–80% · red <40% — read sparse fields with their denominator")
