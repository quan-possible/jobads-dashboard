import React from "react";

// The "Core -> Deep" section break shared by the researcher pages: a hairline
// rule, an eyebrow, and a one-line lede introducing the deeper charts below.
export function DeepDivider({ eyebrow = "Going deeper", lede }) {
  return (
    <section className="container-x" style={{ paddingTop: 32, paddingBottom: 4 }}>
      <div style={{ borderTop: "1px solid var(--card-border)", paddingTop: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>{eyebrow}</div>
        <p className="lede" style={{ margin: 0, maxWidth: "42rem" }}>{lede}</p>
      </div>
    </section>
  );
}
