"""Assemble every figure factory into one static, sectioned review page.

This is a *demo consumer* of the viz core, not the live site: it renders the full
Core->Deep catalogue to a single self-contained HTML file so the design can be
reviewed end to end. The figure factories it calls are the same ones the live app
will import, so a green review here means the charts are ready to port.

Run:  python -m jobads_dashboard.viz.review [--out tmp/review/index.html]
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass, field
from pathlib import Path

import plotly.graph_objects as go

from .datasource import DataSource
from .figures import geography, industries, occupations, pay, pulse, quality, skills
from .theme import DEMAND_SIGNAL_NOTE, register_templates

_PLOTLY_CDN = "https://cdn.plot.ly/plotly-2.35.2.min.js"
_CONFIG = {"displayModeBar": "hover", "displaylogo": False, "responsive": True,
           "modeBarButtonsToRemove": ["select2d", "lasso2d", "autoScale2d"]}


@dataclass
class Item:
    fn: callable
    takeaway: str
    tier: str = "Core"


@dataclass
class Section:
    num: str
    title: str
    anchor: str
    intro: str
    items: list[Item] = field(default_factory=list)


def _pages() -> list[Section]:
    # Mirrors the live api/figures.py REGISTRY (the set the site actually
    # renders). The demand map is one factory parameterised by `measure`, so the
    # old bubble_map / share_choropleth / lq_choropleth entries are now measures
    # of geography.demand_map. Keep this in sync with the REGISTRY.
    return [
        Section("1", "Pulse — the market's vital signs", "pulse",
                "How strong is demand, how is it moving, and what is driving it.", [
            Item(pulse.demand_ribbon, "Demand fell from the 2022 peak; the dotted tail is provisional.", "Core"),
            Item(pulse.yoy_bars, "Year-over-year turns negative through the recent cooling.", "Core"),
            Item(pulse.seasonality_heatmap, "A repeatable within-year rhythm, separated from the trend.", "Core"),
            Item(pulse.composition_area, "The occupational mix is fairly stable year to year.", "Core"),
            Item(pulse.occupation_trends_grid, "Small multiples: each occupation group's own trajectory.", "Deep"),
            Item(pulse.momentum, "Short-run momentum: the 3-month average against the 12-month.", "Deep"),
            Item(pulse.diffusion_index, "Breadth: how many groups grow at once, not just the total.", "Deep"),
        ]),
        Section("2", "Geography — where, and what each place is known for", "geography",
                "Counts, shares, specialisation, and momentum across provinces.", [
            Item(lambda ds: geography.demand_map(ds, measure="count", animate="by-year"),
                 "Ontario, Quebec, BC and Alberta dominate raw volume.", "Core"),
            Item(lambda ds: geography.demand_map(ds, measure="share", animate="by-year"),
                 "Share of national demand, normalised — never raw counts on a map.", "Core"),
            Item(geography.ranked_provinces, "The list carries the exact ranking the map cannot.", "Core"),
            Item(geography.cma_demand, "The largest metropolitan markets within the provinces.", "Core"),
            Item(lambda ds: geography.demand_map(ds, measure="percap", animate="by-year"),
                 "Postings per 10k labour force — normalised for population.", "Deep"),
            Item(lambda ds: geography.demand_map(ds, measure="lq", animate="by-year"),
                 "Location quotient shows relative specialisation, not size.", "Deep"),
            Item(geography.shift_share_bars, "Is a province's change structural or competitive? (identity, not cause).", "Deep"),
            Item(lambda ds: geography.yoy_choropleth(ds, animate="by-year"),
                 "Where momentum is positive vs cooling.", "Deep"),
            Item(geography.ai_exposure_map, "Mean AI-exposure of each province's demand mix (the ceiling, not displacement).", "Deep"),
        ]),
        Section("3", "Occupations — what work, and how the mix is shifting", "occupations",
                "Hierarchy, growth comparison, and the decomposition of change.", [
            Item(lambda ds: occupations.treemap(ds, animate="by-year"),
                 "Sales & service and trades carry the largest volume.", "Core"),
            Item(occupations.indexed_lines, "Indexed to 2019, growth diverges sharply by group.", "Core"),
            Item(occupations.contribution_bars, "Which groups drove the national change — bars sum to the headline.", "Deep"),
            Item(occupations.waterfall, "Visual proof the group deltas reconcile start to end.", "Deep"),
            Item(occupations.dumbbell, "The before/after gap per group, sorted.", "Deep"),
            Item(occupations.noc_naics_heatmap, "Which sectors demand which occupations.", "Deep"),
            Item(occupations.skill_churn, "How the skill mix within occupations is turning over.", "Deep"),
            Item(occupations.ai_exposure_scatter, "AI-exposure vs demand growth, by occupation group.", "Deep"),
        ]),
        Section("4", "Industries (NAICS) — coverage-gated", "industries",
                "The same shapes as occupations, led by the coverage caveat.", [
            Item(industries.coverage_line, "Lead with coverage: NAICS is incomplete, so every total is conditional.", "Core"),
            Item(lambda ds: industries.treemap(ds, animate="by-year"),
                 "Sector volumes among coded postings.", "Core"),
            Item(industries.share_over_time, "How the coded-industry mix shifts.", "Core"),
            Item(industries.contribution_bars, "Which sectors drove the change (coded postings only).", "Deep"),
        ]),
        Section("5", "Pay & conditions — advertised, not paid", "pay",
                "Wages limited to P25/median/P75, plus posting attributes.", [
            Item(pay.wage_band, "Median advertised wage with its P25–P75 band and coverage companion.", "Core"),
            Item(pay.wage_dumbbell, "Wage spread by province at a stable recent month.", "Deep"),
            Item(pay.wage_demand_quadrant, "Pay vs momentum — well-paid and growing sits upper-right.", "Deep"),
            Item(pay.wage_by_education, "Advertised wage by stated education band (a proxy, not a return).", "Deep"),
            Item(pay.education_wage_proxy, "Education's wage signal across the market.", "Deep"),
            Item(pay.conditions_mix, "The full-time / part-time mix over time.", "Deep"),
            Item(pay.language_gap, "English vs French mandatory-requirement share (post-2021).", "Deep"),
        ]),
        Section("6", "Skills & requirements", "skills",
                "Lift-weighted skills, education, and experience.", [
            Item(skills.top_skills_trend, "The most-mentioned skills and how their share moves.", "Core"),
            Item(skills.skill_lift_bars, "Skills most distinctive to an occupation vs the whole market.", "Core"),
            Item(skills.ai_skill_diffusion, "How fast AI-related skills are diffusing into postings.", "Deep"),
            Item(skills.skill_occupation_heatmap, "Which skills cluster in which occupation groups.", "Deep"),
            Item(skills.education_composition, "Stated education requirements over time.", "Deep"),
            Item(skills.experience_mix, "Advertised experience bands over time.", "Deep"),
        ]),
        Section("7", "Data quality & methods — the trust page", "quality",
                "How complete each field is, and where to be careful.", [
            Item(quality.coverage_lines, "Coverage of key fields over time.", "Core"),
            Item(quality.coverage_latest_bars, "Field completeness today, traffic-lighted.", "Core"),
        ]),
    ]


def _figure_html(fig: go.Figure, idx: int) -> str:
    height = fig.layout.height or 460
    return fig.to_html(full_html=False, include_plotlyjs=False, config=_CONFIG,
                       div_id=f"fig-{idx}", default_height=f"{height}px", default_width="100%")


def build_html(ds: DataSource) -> str:
    register_templates()
    sections = _pages()
    meta = ds.metadata
    window = meta.get("source_window", {})
    total = meta.get("headline_counts", {}).get("postings_total")
    through = window.get("max_date", str(ds.latest_month.date()))

    nav = "".join(
        f'<a href="#{s.anchor}"><span class="np">{s.num}</span>{s.title.split("—")[0].strip()}</a>'
        for s in sections)

    blocks: list[str] = []
    idx = 0
    for s in sections:
        cards = []
        for it in s.items:
            fig = it.fn(ds)
            tier_cls = "tier-core" if it.tier == "Core" else "tier-deep"
            cards.append(
                f'<figure class="card {tier_cls}">'
                f'<div class="card-tier {tier_cls}">{it.tier}</div>'
                f'<div class="plot">{_figure_html(fig, idx)}</div>'
                f'<figcaption><span class="take">{it.takeaway}</span>'
                f'<span class="src">{DEMAND_SIGNAL_NOTE}</span></figcaption>'
                f'</figure>')
            idx += 1
        blocks.append(
            f'<section id="{s.anchor}"><div class="sec-head">'
            f'<h2><span class="sn">{s.num}</span>{s.title}</h2>'
            f'<p>{s.intro}</p></div>{"".join(cards)}</section>')

    total_str = f"{total:,} postings" if total else ""
    return _TEMPLATE.format(
        cdn=_PLOTLY_CDN, nav=nav, body="".join(blocks),
        through=through, total=total_str, ncharts=idx)


_TEMPLATE = """<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Job-ads dashboard — visualization review</title>
<script src="{cdn}" charset="utf-8"></script>
<style>
:root{{--canvas:#fbf8f5;--surface:#fff;--ink:#132330;--muted:#5d6b74;--line:#ece3da;
--brand:#cf7730;--teal:#345961;}}
*{{box-sizing:border-box}}
body{{margin:0;background:var(--canvas);color:var(--ink);
font-family:Inter,-apple-system,Segoe UI,Helvetica,Arial,sans-serif;line-height:1.5}}
header.top{{background:linear-gradient(110deg,#041c2c 0%,#345961 55%,#cf7730 130%);
color:#fff;padding:34px 32px 30px}}
header.top h1{{margin:0 0 6px;font-size:25px;font-weight:650}}
header.top p{{margin:0;opacity:.92;font-size:13.5px;max-width:880px}}
.badges{{margin-top:14px;display:flex;gap:8px;flex-wrap:wrap}}
.badge{{background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.28);
border-radius:999px;padding:4px 12px;font-size:12px}}
nav{{position:sticky;top:0;z-index:20;background:rgba(251,248,245,.95);
backdrop-filter:blur(6px);border-bottom:1px solid var(--line);
display:flex;gap:2px;flex-wrap:wrap;padding:8px 22px}}
nav a{{color:var(--muted);text-decoration:none;font-size:12.5px;font-weight:550;
padding:6px 10px;border-radius:7px}}
nav a:hover{{color:var(--ink);background:#fff}}
nav .np{{display:inline-block;width:18px;height:18px;line-height:18px;text-align:center;
background:var(--teal);color:#fff;border-radius:50%;font-size:11px;margin-right:6px}}
main{{max-width:1180px;margin:0 auto;padding:8px 22px 80px}}
section{{padding-top:30px}}
.sec-head{{border-bottom:2px solid var(--line);margin:14px 0 18px;padding-bottom:8px}}
.sec-head h2{{font-size:21px;margin:0 0 2px;display:flex;align-items:center;gap:10px}}
.sec-head .sn{{background:var(--brand);color:#fff;border-radius:8px;width:30px;height:30px;
display:inline-flex;align-items:center;justify-content:center;font-size:15px}}
.sec-head p{{margin:0;color:var(--muted);font-size:13.5px}}
.card{{position:relative;background:var(--surface);border:1px solid var(--line);
border-radius:14px;padding:14px 16px 6px;margin:0 0 22px;
box-shadow:0 10px 26px rgba(6,31,47,.06)}}
.card-tier{{position:absolute;top:14px;right:16px;font-size:10.5px;font-weight:700;
letter-spacing:.04em;text-transform:uppercase;padding:3px 9px;border-radius:999px;z-index:5}}
.tier-core.card-tier{{background:#eef4f3;color:#2f6f77}}
.tier-deep.card-tier{{background:#fbeede;color:#a85c1f}}
.card.tier-deep{{border-left:3px solid #e7b988}}
.plot{{width:100%}}
figcaption{{display:flex;justify-content:space-between;gap:18px;flex-wrap:wrap;
border-top:1px solid var(--line);margin-top:6px;padding:9px 2px 6px}}
figcaption .take{{font-size:13px;color:var(--ink);max-width:760px}}
figcaption .src{{font-size:11px;color:var(--muted);font-style:italic;white-space:nowrap}}
footer{{max-width:1180px;margin:0 auto;padding:0 22px 60px;color:var(--muted);font-size:12px}}
</style></head>
<body>
<header class="top">
<h1>Job-ads dashboard — visualization review</h1>
<p>The full Core→Deep catalogue from the from-scratch design plan, rendered from the live
derived aggregates. Every chart here is produced by a framework-agnostic figure factory in
<code>jobads_dashboard.viz</code>, so what you approve ports directly into the site.</p>
<div class="badges"><span class="badge">⬤ Demand signal, not employment</span>
<span class="badge">Data through {through}</span>
<span class="badge">{total}</span>
<span class="badge">{ncharts} charts · Core + Deep</span></div>
</header>
<nav>{nav}</nav>
<main>{body}</main>
<footer>Source: Vicinity Jobs online job ads, processed into the dashboard's derived
aggregate layer. Job ads measure posted labour demand, not employment, unemployment, or
vacancies. 2025+ is provisional (upstream fetch provenance under audit). Wages are advertised
(P25/median/P75 only). NAICS, remote, and language fields are sparse or unstable before 2021.
Decomposition and shift-share are accounting identities, not causal claims.</footer>
</body></html>
"""


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Render the static visualization review page.")
    ap.add_argument("--out", default="tmp/review/index.html", type=Path)
    ap.add_argument("--data-root", default=None)
    args = ap.parse_args(argv)
    ds = DataSource(args.data_root)
    html = build_html(ds)
    out = args.out
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")
    print(f"Wrote {out} ({out.stat().st_size/1024:.0f} KB, {html.count('plotly-graph-div')} charts)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
