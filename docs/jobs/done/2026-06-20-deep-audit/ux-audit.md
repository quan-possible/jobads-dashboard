# UX-standards & design-craft audit — 2026-06-20

Design-craft findings (`U##`) for the jobads-dashboard Streamlit app, judged by the
orchestrator (main agent) against the standard UI/UX rubric (typography, spacing,
color/contrast, hierarchy, consistency, states, affordance, motion, content,
responsiveness). Subjective calls are allowed — each names the standard it misses
and where to look. Live UI *defects* (broken/illegible rendering) are tracked
separately as `L##` in `findings.md`; this file is "is it *good*?", not "is it
broken?". Reference design contract: the `aclmr-design-language` skill and the
`docs/jobs/ui-polish-ongoing.md` waves.

Evidence base: full live walkthrough on `127.0.0.1:8530` (see
`evidence/live-capture.md`).

## Priority tally
| Priority | Count |
|---|---|
| P1 (clear craft miss, hurts use) | 1 |
| P2 (notable, should refine) | 4 |
| P3 (polish / nice-to-have) | 4 |
| **Total** | **9** |

---

## P1

### U01 — No semantic color or direction cue for change values
- **Screen/element**: Overview "MoM and YoY growth"; Occupations & Industries
  "Absolute change" / "Percent change (%)" tables; Overview "YoY change" KPI.
- **Standard missed**: Hierarchy & emphasis / color used semantically. The single
  most important signal on a labour-demand dashboard — *is demand rising or
  falling?* — is rendered in flat dark text. "-7.6%", "-1,319", "-4.8" look
  identical in weight and colour to positive values; the reader must parse the
  minus sign on every cell. Convention (every comparable analytics dashboard) is a
  red/green or up/down treatment for signed change.
- **Why it reads as off**: the palette already has `orange`/`teal` accents but they
  are decorative, never tied to meaning. The eye lands on nothing first.
- **Where**: `render_overview`/`recent_vs_prior` change tables and KPI rows in
  `src/jobads_dashboard/dashboard/app.py` (e.g. `show_table` output, st.metric KPIs).

---

## P2

### U02 — Skills panel shows raw numeric skill codes, not labels
- **Screen/element**: Skills, Education & Requirements → "Skill code / Postings with
  code" table (20020012, 20020002, 10070002 …).
- **Standard missed**: Content & microcopy — labels must be meaningful. The app's
  own caption admits it ("this panel uses a ranked table until skill labels are
  available"). A reader cannot tell what any row means. A panel of opaque codes is
  not informative; better to hide the panel, or map the top codes to names, until
  labels exist.
- **Where**: `render_requirements` skills branch, `app.py` (~2873-2970);
  `monthly_skills_topk.parquet`.

### U03 — Inconsistent date formats + a duplicated "month" card
- **Screen/element**: Data Quality cards — "Latest month 2026-03", "First month
  2016-01-01", "Last month 2026-03-31"; also Explore/Overview KPI date ranges.
- **Standard missed**: Consistency. Three date formats coexist (`YYYY-MM`,
  `YYYY-MM-DD`). Worse, "Latest month" and "Last month" are the *same* underlying
  value (`latest_processed`) shown twice under different labels. (This is also the
  code defect S — see `findings.md`; the craft point is the formatting/labeling, the
  code point is the duplicate source value.)
- **Where**: `render_quality` `app.py:2986-2991`.

### U04 — Fixed cards waste vertical space for short values
- **Screen/element**: All KPI metric cards (`min-height: 8.5rem`), and the two large
  wage-chart cards that open with a tall blank top margin.
- **Standard missed**: Spacing & layout / density. A single number like "2,071" or
  "-7.6%" sits in a 136px-tall card, so KPI rows feel sparse and push real content
  far down the page. The hero + active-filter band already consume a full viewport
  before any tab content appears.
- **Where**: `div[data-testid="stMetric"] { min-height: 8.5rem }` `app.py:953-962`.

### U05 — Unlabelled multi-series charts
- **Screen/element**: Industries "Industry mix over time" (~20 stacked bands, **no
  legend**); Compensation wage-trend chart (3 unlabelled lines).
- **Standard missed**: Content / hierarchy. A 20-series stacked area with no legend
  is decorative, not readable — the viewer cannot map a colour to an industry. The
  3-line wage chart gives no key for min/median/max.
- **Where**: `render_industries` mix chart, `render_compensation_and_conditions`
  wage chart in `app.py`.

---

## P3

### U06 — Redundant "National label" column
- **Screen/element**: Geography "Top local areas" table — `National label` =
  `Province | Local area / market` (e.g. "ON | Toronto (CMA)"), duplicating the two
  columns beside it.
- **Standard missed**: Consistency / density. A third column that restates the prior
  two adds width to an already-overflowing 6-column table (compounds defect L01).
- **Where**: `render_geography` / `compute_market_concentration_summary` `app.py`.

### U07 — App ignores the user's light/dark preference
- **Screen/element**: Whole app. Fixed branded theme (cream page, navy cards);
  `prefers-color-scheme` is not honoured.
- **Standard missed**: Color & light/dark parity. A single fixed theme is a
  legitimate brand choice, but here it is *unmanaged*: the app doesn't declare
  `color-scheme`, so a dark-mode browser flips uncontrolled text colours and breaks
  contrast (defect L02). Either commit to light explicitly (`color-scheme: light`)
  or provide real dark parity.
- **Where**: `:root` block `app.py:136-155` (no `color-scheme`); no
  `.streamlit/config.toml [theme]`.

### U08 — Runtime external Google Fonts import
- **Screen/element**: Global typography (PT Sans).
- **Standard missed**: Typography reliability / consistency. `@import url(google
  fonts)` at `app.py:134` fetches the brand font from the network at render time. On
  an offline / locked-down / privacy-sensitive private deployment the font silently
  falls back to a system sans, changing the whole look, and it adds a third-party
  request from a gated page.
- **Where**: `app.py:134`.

### U09 — Uneven tab-ribbon grid
- **Screen/element**: The 2×4 tab ribbon. "COMPENSATION AND CONDITIONS" and "SKILLS,
  EDUCATION, AND REQUIREMENTS" wrap to two lines while the other six tabs are one
  line, so the two rows have uneven heights and ragged baselines.
- **Standard missed**: Consistency / alignment. Either shorten those two labels
  (e.g. "Compensation", "Skills & requirements") or fix a uniform two-line cell
  height.
- **Where**: tab-ribbon CSS in `app.py` GLOBAL_STYLES; tab labels in `main()`
  `app.py:3179+`.

---

Note: the catastrophic *header overlap* on the wide tables (Geography local-areas,
Occupations LQ heatmap, Explore results) is a rendering **defect**, not a craft
nuance — it is filed as L01 in `findings.md` with its root cause and fix.
