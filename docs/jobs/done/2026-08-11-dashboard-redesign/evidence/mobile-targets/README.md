# Responsive composition targets

These project-specific images resolve the mobile composition gap left by the
fixed-width desktop prototypes. They were generated on 2026-08-11 from the
approved Pulse and Explore desktop screenshots, then inspected at full size.

## Authority boundary

- `pulse-mobile-target.png` governs the 390 px Pulse hierarchy: compact navy
  masthead, hero, overlapping two-column KPI grid, numbered single-column
  sections, full-width chart, then stacked summary.
- `explore-mobile-target.png` governs the 390 px authenticated Explore
  hierarchy: compact team masthead, collapsed filter summary, full-width
  search, persistent tabs, two-column KPI grid, results-first rows, and a
  selected-posting bottom sheet.
- The original desktop targets remain authoritative for desktop proportions.
- Generated values, labels, spelling, and chart geometry are illustrative.
  Production data, current dynamic copy, i18n dictionaries, real figures, auth,
  privacy, and category-cap behaviour remain authoritative.
- Accessibility and real browser behaviour override any static-image detail
  that would be unusable, including focus order, semantics, touch targets,
  scrolling, and drawer dismissal.

## Deliberate responsive adaptations

- Desktop navigation becomes a simple hamburger; it is not squeezed into the
  phone masthead.
- Pulse preserves the 2 × 2 KPI scan at 390 px because current production
  content fits without illegible type. It may fall to one column below the
  validated narrow breakpoint.
- Pulse chart/summary pairs stack in reading order rather than shrinking both
  columns.
- Explore replaces the desktop table with information-rich result rows and the
  desktop detail pane with a bottom sheet. This preserves selection context
  while avoiding tiny columns or page-level horizontal scrolling.
- Analytical controls remain square. The team/access status may use a pill.
