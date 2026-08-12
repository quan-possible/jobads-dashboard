Shows how completely a field is populated across postings — teal when well-covered, ORANGE below 40% so a reader can see the field is too sparse to read honestly.

    <CoverageBar label="Wage" share={0.62} count={212000} />
    <CoverageBar label="Education" share={0.28} count={94000} />

share is a 0–1 proportion (KpiTile's delta, by contrast, is percentage points). Always straddle the 40% threshold in a set so the cue is visible.
