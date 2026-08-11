import { KeyPoints } from "web";

// The "what to read" panel that sits beside the hero chart. Descriptive
// findings only — the copy is causation-guarded, which is part of the
// component's contract, not decoration.

export const WhatStandsOut = () => (
  <div style={{ maxWidth: 420 }}>
    <KeyPoints
      points={[
        "Health care and social assistance holds the largest share of active postings at 18%, up from 15% a year ago.",
        "Trades postings are concentrated in Calgary and Edmonton, which together carry 71% of the provincial total.",
        "Postings requiring a bachelor's degree grew fastest in professional services, while entry-level roles thinned.",
      ]}
    />
  </div>
);

export const SingleFinding = () => (
  <div style={{ maxWidth: 420 }}>
    <KeyPoints points={["Posted demand fell for four consecutive months, the longest run since 2020."]} />
  </div>
);

export const CustomTitleAndNote = () => (
  <div style={{ maxWidth: 420 }}>
    <KeyPoints
      title="How to read this chart"
      note="Shares are of postings, not of employment. A rising share can reflect fewer postings elsewhere."
      points={[
        "Each bar is one occupation group's share of all active postings in the selected region.",
        "The grey band marks the 2019 pre-pandemic baseline for the same group.",
        "Groups below 1% are folded into an “Other” residual so no chart exceeds ten categories.",
      ]}
    />
  </div>
);
