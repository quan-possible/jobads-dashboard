import React from "react";

// Every chart goes through Figure: a finding-first title, an as-of stamp, the
// chart body, and an optional source/denominator note. Enforces consistency.
export function Figure({ eyebrow, title, asOf, note, actions, children, className = "" }) {
  return (
    <figure className={"card card-pad " + className} style={{ margin: 0, display: "flex", flexDirection: "column" }}>
      <div style={{ marginBottom: 16, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div style={{ minWidth: 0 }}>
          {eyebrow && <div className="eyebrow" style={{ marginBottom: 6 }}>{eyebrow}</div>}
          <figcaption className="t-figure-title" style={{ fontWeight: 700, lineHeight: 1.375, color: "var(--navy-deep)" }}>{title}</figcaption>
        </div>
        <div style={{ display: "flex", flexShrink: 0, alignItems: "center", gap: 12 }}>
          {actions}
          {asOf && (
            <span className="num t-caption" style={{ whiteSpace: "nowrap", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em", color: "var(--ink-faint)" }}>{asOf}</span>
          )}
        </div>
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>{children}</div>
      {note && (
        <div className="t-meta" style={{ marginTop: 12, borderTop: "1px solid var(--hairline)", paddingTop: 12, lineHeight: 1.6, color: "var(--ink-soft)" }}>{note}</div>
      )}
    </figure>
  );
}
