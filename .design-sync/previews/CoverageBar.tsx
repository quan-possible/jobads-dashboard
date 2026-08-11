import { CoverageBar } from "web";

// One row of the field-completeness list on the Method page
// (app/method/page.tsx:100), which maps `meta.coverage` straight into this
// component. Labels are the real field names from
// src/jobads_dashboard/viz/figures/quality.py (_FIELD_LABELS).
//
// UNIT NOTE — `share` here is a 0–1 PROPORTION, not percentage points. The
// component does `(share * 100).toFixed(0)` itself, so `share={0.94}` renders
// "94%". This is the opposite convention from KpiTile's `delta`, which IS in
// percentage points. Verified against web/components/CoverageBar.tsx:21.
//
// The variant axis is the 0.4 threshold: at or above it the bar and the figure
// go teal, below it they flip to orange (`text-orange-deep` / `bg-orange`) to
// mark the field as too sparse to read honestly. The cells straddle that line —
// two well-covered, one just above, two sparse.
//
// `count` runs through fmtCompact (web/lib/format.ts:27): ≥10,000 becomes
// "412.8k" and ≥1,000,000 becomes "1.2M", so the counts below are raw integers.
// The `locale` prop only changes number formatting and is paired with
// `postingsLabel`, which the app fills from t.coveragePostingsLabel
// ("postings" / "offres").

export const WellCoveredField = () => (
  <div style={{ maxWidth: 300 }}>
    <CoverageBar label="Occupation (NOC)" share={0.97} count={1284000} />
  </div>
);

export const SolidCoverage = () => (
  <div style={{ maxWidth: 300 }}>
    <CoverageBar label="Industry (NAICS)" share={0.82} count={1084000} />
  </div>
);

export const JustAboveThreshold = () => (
  <div style={{ maxWidth: 300 }}>
    <CoverageBar label="Education" share={0.44} count={581600} />
  </div>
);

export const SparseFieldOrange = () => (
  <div style={{ maxWidth: 300 }}>
    <CoverageBar label="Hourly wage" share={0.31} count={412800} />
  </div>
);

export const VerySparseField = () => (
  <div style={{ maxWidth: 300 }}>
    <CoverageBar label="Remote work" share={0.08} count={9640} />
  </div>
);

export const FrenchLocale = () => (
  <div style={{ maxWidth: 300 }}>
    <CoverageBar
      label="Salaire horaire"
      share={0.31}
      count={412800}
      postingsLabel="offres"
      locale="fr"
    />
  </div>
);
