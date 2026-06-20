# Live capture — 2026-06-20 deep audit

How the live UI was rendered and what was walked. Per the project rule that the
main agent owns UI/UX judgment, the visual walkthrough was performed by the
orchestrator (Opus) directly against a freshly launched **ungated** local
instance; Streamlit keeps inactive-tab content in the DOM, so table/text content
was also extracted via `preview_eval`.

## Environment
- Render target: fresh local Streamlit instance on `127.0.0.1:8530`, launched via
  Claude Preview tooling using the repo `.venv` (streamlit 1.58.0), **no auth env**
  (so the password gate was bypassed for full-UI coverage). The real public
  service keeps running, gated, on `:8522`.
- Preview returns screenshots inline to the orchestrator (no PNG files persisted:
  playwright is not installed and the preview MCP is inline-only). Durable evidence
  here is the walkthrough notes + DOM/eval extracts + console state below.
- Console: `preview_console_logs level=warn` → **No console logs** (clean; no JS
  warnings or errors on load or during the Explore lookup).
- Viewports exercised: desktop 1440×1000 / 1440×900, mobile 375×812. Color-scheme
  emulation: default, `light`, `dark`.

## Screens / states walked
All 8 tabs (Overview, Geography, Occupations, Industries, Compensation &
Conditions, Skills/Education/Requirements, Explore, Data Quality), plus: sidebar
expanded + collapsed (desktop), mobile sidebar drawer open/close, the Explore
"Specific postings" interactive lookup end-to-end (typed posting id `65563604`,
clicked **Search postings**, opened the posting detail + full description), and
the empty/auto states of Explore.

## Tab structure (preview_eval)
8 tabs: OVERVIEW, GEOGRAPHY, OCCUPATIONS, INDUSTRIES, COMPENSATION AND CONDITIONS,
SKILLS EDUCATION AND REQUIREMENTS, EXPLORE, DATA QUALITY. `h1` = "Labour demand in
Canadian job postings". No `stException` on load.

## Wide-table overlap (DOM extract — the headline UI defect)
Streamlit `st.table` output styled with `table-layout: fixed; width:100%`
(app.py:1065-1069) forces EQUAL column widths regardless of content. Wide tables
placed inside half-width `st.columns` get columns far too narrow:

- Geography "Top local areas": **6 columns each forced to 57px** in a 345px table.
  Headers: PROVINCE · LOCAL AREA / MARKET · NATIONAL LABEL · POSTINGS ·
  SELECTED-WINDOW SHARE (%) · CUMULATIVE SHARE (%). First row data is correct
  ("ON", "Toronto (CMA)", "ON | Toronto (CMA)", "4,482,423", "17.7", "17.7") but
  9-digit counts + long headers visibly collide/overlap in the rendered card.
  Note `NATIONAL LABEL` = `PROVINCE | LOCAL AREA` (redundant 3rd column).
- Occupations LQ heatmap: **10 occupation columns** in a half-width container →
  headers ("6 | SALES & SERVICE", "1 | BUSINESS & ADMIN", "7 | TRADES & TRANSPORT",
  …) become an unreadable overlapping jumble. On mobile (375px) it is far worse:
  tableW 312px / parentW 314px, 10 cols ≈ 31px each; the header row is illegible
  even though a horizontal scrollbar exists (the table is pinned to container width,
  so scrolling doesn't widen the columns).
- Explore "Specific postings" results table has **10 columns** (POSTING ID, DATE,
  TITLE, EMPLOYER, PROVINCE, MARKET, OCCUPATION, INDUSTRY, HOURLY WAGE, SOURCE).
- Readable counter-examples: the 5-column change tables (Occupations/Industries)
  and 4-column coverage tables render fine because they sit full-width with fewer
  columns. So the defect is specifically *many columns × narrow container*.

## Metric cards (st.metric via render_metric_rows, app.py:1900-1904)
- **Truncation**: Explore "Selected window" KPI shows `2016-01 to 20…` — the value
  is ellipsized. The CSS override meant to prevent this
  (`[data-testid="stMetricValue"] > div { white-space:normal; overflow:visible }`,
  app.py:985-990) no longer matches Streamlit 1.58's DOM, so the default
  single-line ellipsis wins. (The hero WINDOW pill — custom HTML, not st.metric —
  shows the full range, confirming it's a st.metric issue.)
- **Dark color-scheme contrast (hand-verified)**: with `prefers-color-scheme: dark`
  the metric-card *labels* disappear. `getComputedStyle` on the "Occupation HHI"
  label → `color: rgb(250,250,250)` on card background `rgb(255,255,255)` =
  white-on-white. Root: `:root` sets no `color-scheme`, the metric card bg is a
  hard light `var(--aclmr-surface)` (app.py:956), and the label color
  (`var(--aclmr-muted)`, app.py:969) lacks `!important`, so the browser's dark
  default overrides it. Systemic to every white metric card for dark-mode users.

## Charts (Plotly)
- Overview "MoM and YoY growth": legend ("…Year-over-year") clipped at the card's
  right edge; a stray "1" sits at the top-left (clipped y-axis artifact).
- Overview occupation-mix + Occupations area chart legends: short labels clipped on
  the right ("Admi", "Cultu", "Trans", "Manufacturi").
- Industries "Industry mix over time": ~20-series stacked area with **no legend** —
  the colored bands are unidentifiable.
- Occupation-mix area chart x-axis renders only "2020 / 2025" ticks (sparse) vs the
  Industries chart's full year ticks — inconsistent axis labelling.

## Explore posting lookup (verified end-to-end)
- Search for `65563604` returned: Title "Server", Employer "Unknown employer",
  Market "NT | Whitehorse (CA)", Occupation "6 | Sales and service occupations",
  Industry "Unknown industry group", Hourly wage 18.5, Source www.yuwin.ca.
- Posting detail + **Full description** render cleanly with NO raw markup/HTML/LaTeX
  leak. Description text begins "Posted March 30, 2026 Server Big Bear Eatery and
  Taphouse **Whitehorse, YT** Full Time Compensation: $18.51 Hourly…".
- DATA-QUALITY OBSERVATION (likely upstream): the province code "NT" contradicts the
  description's "Whitehorse, **YT**". Whitehorse is in Yukon. The Geography province
  legend also showed an odd "DC"-looking entry. The dashboard faithfully displays
  upstream codes; flag for upstream verification, not a dashboard logic bug.
- The flow auto-lists individual postings for the current scope even before a search
  (intentional bounded-lookup design; gated by password on public deployments).

## Skills tab content gap
The Skills panel lists **raw numeric skill codes** (20020012, 20020002, 10070002, …)
with no human-readable labels; the app's own caption admits "this panel uses a
ranked table until skill labels are available". Education mix is dominated by an
"Unknown" bar.

## Responsive / theme
- Mobile hero + pills stack well; mobile sidebar opens as a styled overlay drawer
  (date slider, geography/occupation/industry selectors). The collapsed ">" chevron
  is slightly clipped at the left viewport edge on mobile.
- Desktop sidebar collapse reflows main content to full width correctly.
- The app uses a FIXED branded theme (light-cream page, dark navy cards) and does
  not adapt to `prefers-color-scheme`; forcing light changed nothing, forcing dark
  only broke text-on-white-card contrast (above).

## Date-format inconsistency
Data Quality cards mix formats: "Latest month 2026-03" (YYYY-MM) vs "First month
2016-01-01" and "Last month 2026-03-31" (YYYY-MM-DD).

## Baseline gate (audit-time, not fixed)
- `python -m py_compile` over all src → OK.
- `PYTHONPATH=src pytest -q` → **29 passed in ~30s**.
- (e2e is not run here; the project notes e2e counts are unreliable for this app.)
