# UI Polish Ongoing Job

**Target Area**: UI Polish of `jobads-dashboard`
**Goal**: Iterate until the interface is perfect, strictly conforming to the `aclmr-design-language` skill guidelines.
**Status**: ✅ COMPLETE — Dashboard passes delivery-quality review.

## Previous Waves (1-5)
All passed. See git history for details.

## Wave 6 — Label Humanization (2026-03-28)
- **Status**: ✅ DONE
- **Changes**:
  - Added `FIELD_DISPLAY_NAMES` mapping to convert camelCase field names to human-readable labels
  - Added `LEGEND_TITLE_MAP` to replace raw column names in Plotly legend titles (`province_scope` → "Province", `occupation_scope` → "Occupation", `growth_type` → "Growth metric")
  - Added `GROWTH_TYPE_LABELS` mapping (`mom_pct` → "Month-over-month", `yoy_pct` → "Year-over-year")
  - Applied `humanize_field_name()` to coverage mini-panel and Data Quality coverage table
  - Updated `show_table()` to format numbers with thousands separators and round decimals
  - Tab bar changed from `flex-wrap: wrap` to `nowrap` with horizontal scroll to prevent orphan tab wrapping
  - CSS rule added to hide st.table index column (`th:first-child` / `td:first-child` → `display: none`)
  - Tab button padding and font-size tightened for denser fit

## Wave 7 — Compact Scope Labels (2026-03-28)
- **Status**: ✅ DONE
- **Changes**:
  - Added `OCCUPATION_SHORT_LABELS` and `INDUSTRY_SHORT_LABELS` mappings for chart legend display
  - Added `shorten_scope_label()` utility function
  - Applied shortened labels to:
    - Overview tab: occupation mix area chart legend
    - Occupations tab: change table, area chart legend, LQ heatmap column headers
    - Industries tab: change table, area chart legend, province mix table
    - Compensation tab: wage-by-occupation horizontal bar chart Y-axis labels
  - Fixed province_coded_total column name in industries province mix table

## Wave 8 — Final Delivery-Quality Review (2026-03-28)
- **Status**: ✅ PASSED
- **Reviewer**: Browser subagent delivery-quality reviewer
- **Verdict**: All 7 tabs pass. No clipped text, no raw column names, no formatting issues.
  - Overview: ✅
  - Geography: ✅
  - Occupations: ✅
  - Industries: ✅
  - Compensation and Conditions: ✅
  - Skills, Education, and Requirements: ✅
  - Data Quality: ✅

## Wave 9 — Browser Sidebar and Explore Hardening (2026-06-02)
- **Status**: ✅ DONE
- **Trigger**: Live Browser interaction found that collapsing the left sidebar could leave no usable reopen path.
- **Changes**:
  - Restored the Streamlit sidebar reopen control while restyling it as an ACLMR-style `Open filters` affordance.
  - Hid stale open/close controls so collapsed and expanded states do not visually overlap.
  - Removed deprecated Plotly width usage from charts.
  - Guarded the private posting lookup against a partial or zero-byte lookup parquet file.
  - Made app-surface tests select sidebar controls by label instead of positional indexes.
- **Evidence**:
  - `PYTHONPATH=src pytest -q` passed with `25 passed`.
  - In-app Browser walkthrough covered sidebar close/reopen, filter changes, Explore question switching, and Data Quality.
  - Local and ngrok `/_stcore/health` checks returned `ok`.
  - Current live URL: `https://2b0e-2001-569-5046-4801-f08a-3b33-3407-3627.ngrok-free.app`.

## Wave 10 — Low-Impact Drawer and Overflow Pass (2026-06-02)
- **Status**: ✅ DONE
- **Trigger**: Keep verification light on the local machine while finishing the sidebar/scroll polish.
- **Changes**:
  - Avoided upstream refreshes, posting-lookup builds, and full-corpus scans.
  - Fixed the desktop scrolled-page drawer state where reopening filters could show only the `Filters` pill while controls remained off-screen.
  - Made the open sidebar a fixed drawer at all viewport widths.
  - Added a readable selected date-range pill and suppressed the clipped slider value bubble.
  - Restored normal vertical page scrolling while keeping horizontal overflow hidden.
- **Evidence**:
  - In-app Browser viewport checks passed at `1440x1000`, `1024x768`, `768x900`, and `390x844`.
  - Explore question switching to `Top local markets` passed after the drawer patch.
  - `PYTHONPATH=src pytest -q` passed with `25 passed`.
  - Local and ngrok health checks returned `ok`.
  - Current live URL: `https://ee39-2001-569-5046-4801-f08a-3b33-3407-3627.ngrok-free.app`.

## Wave 11 — Browser-Only Final Interaction Polish (2026-06-02)
- **Status**: ✅ DONE
- **Trigger**: Finish the user-requested no-unwanted-overflow polish pass without Playwright and without heavy local data work.
- **Changes**:
  - Kept the app on the existing derived aggregate bundle; did not run refresh, posting lookup generation, or upstream scans.
  - Rebalanced the tab ribbon into a clean wrapped grid: four columns on desktop, three on tablet, and two on mobile.
  - Removed the default Streamlit tab underline so selected tabs use only the ACLMR pill treatment.
  - Applied existing compact occupation and industry labels to sidebar selector display values.
- **Evidence**:
  - In-app Browser walkthrough covered sidebar collapse/reopen on desktop, mobile drawer open/close, date/geography/occupation/industry filter changes, every tab, chart-heavy panels, table-heavy panels, and Explore switching to `Top local markets`.
  - Viewport checks covered `1440x1000`, `1024x768`, `768x900`, and `390x844`.
  - Mobile horizontal-scroll attempt produced no screenshot movement.
  - `PYTHONPATH=src pytest -q` passed with `25 passed`.
  - Local and ngrok `/_stcore/health` checks returned `ok`.
  - Current live URL: `https://d04f-2001-569-5046-4801-c86f-a223-3a1e-dd7c.ngrok-free.app`.

## Wave 12 — Mac Mini Explore Lookup Recovery (2026-06-03)
- **Status**: ✅ DONE
- **Trigger**: The persistent Mac Mini public dashboard needed to work normally through Explore, including specific posting snippet lookup, for anyone with the link.
- **Changes**:
  - Fixed posting lookup date bounds so a selected end month includes the full month, not only the first day.
  - Added an explicit `Search postings` button to the Specific postings flow.
  - Updated lookup copy from `private lookup index` to `bounded lookup index` for the public Mac Mini site.
- **Evidence**:
  - Local focused tests passed with `14 passed`.
  - Remote focused tests on `bruces-mac-mini` passed with `14 passed`.
  - Mini public app health on `127.0.0.1:8522` returned `ok`.
  - Public Browser check at `https://047e-2001-56a-f068-c900-dc77-45fd-2bfb-31da.ngrok-free.app` found posting `65563604`, the `Server` row, and a bounded description excerpt.

## Wave 13 — Full Selected Posting Descriptions (2026-06-03)
- **Status**: ✅ DONE
- **Trigger**: User asked to show the full posting description instead of only the excerpt.
- **Changes**:
  - Added `description_full` to the posting lookup builder while preserving `description_excerpt`.
  - Made the app backward-compatible with older lookup bundles by falling back to the excerpt column.
  - Updated Specific postings detail view to show `Full description` for the selected posting only.
  - Rebuilt and redeployed `posting_lookup.parquet` to both public and private Mini data paths.
- **Evidence**:
  - Local focused tests passed with `22 passed`.
  - Remote focused tests on `bruces-mac-mini` passed with `15 passed`.
  - The enriched public lookup file is `105,604,302` bytes, and posting `65563604` has a `2,247` character full description.
  - Public Browser DOM check showed `Full description`, no `Description excerpt` label, and responsibilities/qualifications text for posting `65563604`.

## Wave 14 — Public Password Gate (2026-06-03)
- **Status**: ✅ DONE
- **Trigger**: User asked for the public web page to require a password so only people who know it can access the dashboard.
- **Changes**:
  - Added a Streamlit password gate that runs before dashboard data loads.
  - Stores only a salted PBKDF2 password hash in the service environment; no password or hash is committed to the repo.
  - Fails closed when `JOBADS_DASHBOARD_AUTH_REQUIRED=true` but no password hash is configured.
  - Updated the Mac Mini public LaunchAgent with auth-required environment variables and restarted the public service.
- **Evidence**:
  - Local focused tests passed with `16 passed`.
  - Remote focused tests on `bruces-mac-mini` passed with `16 passed`.
  - Mini public app health on `127.0.0.1:8522` returned `ok`.
  - Public Browser check confirmed the live URL shows the restricted password screen, rejects an incorrect password, unlocks with the correct password, and can still run Explore -> Specific postings for posting `65563604`.

## Wave 15 — Icon-Only Sidebar Toggle (2026-06-03)
- **Status**: ✅ DONE
- **Trigger**: User reported that the open/close filter button was buggy and should be icon-only, without visible `Open filters` or `Close filters` wording.
- **Changes**:
  - Replaced the label-based sidebar toggle with a compact CSS chevron icon.
  - Hid Streamlit's native Material arrow SVG so it does not distort or double-render the custom icon.
  - Made the Streamlit header layer transparent to pointer events so the fixed filter button remains clickable.
  - Copied the patched app to the Mac Mini deployment and restarted both the public LaunchAgent and private tunnel-backed app.
- **Evidence**:
  - `PYTHONPATH=src pytest -q tests/test_app_surface.py` passed with `11 passed`.
  - `python -m py_compile src/jobads_dashboard/dashboard/app.py` passed.
  - Browser checks at local `http://127.0.0.1:8520/` and Mini tunnel `http://127.0.0.1:8521/` clicked the marked top-left coordinate and confirmed the sidebar toggles open and closed.
  - Rendered styles no longer include visible `Open filters` / `Close filters` text; the native SVG is hidden and the centered chevron remains.
  - Local, Mini public, and Mini private health endpoints returned `ok` after restart.
