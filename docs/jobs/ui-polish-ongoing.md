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
