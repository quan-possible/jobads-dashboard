import React from "react";
import { PixelTiles } from "../../brand/PixelTiles/PixelTiles";

// Descriptive findings (causation-guarded). A "what to read" panel beside the
// hero chart. The footnote guard is required copy — keep it.
export function KeyPoints({
  points = [],
  title = "Automated summary",
  note = "Descriptive signals only — postings show posted demand, not causes.",
  tone = "tinted",
}) {
  if (!points || points.length === 0) return null;
  const dark = tone === "navy";
  const surface = dark ? { background: "var(--surface-navy)", border: "1px solid var(--surface-navy)" } : { background: "var(--surface-alt)", border: "1px solid var(--card-border)" };
  return (
    <div className="card card-pad" style={Object.assign({ display: "flex", height: "100%", flexDirection: "column" }, surface)}>
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
        <PixelTiles rows={2} cols={4} size={7} gap={2} />
        <h2 className="h-card" style={{ margin: 0, color: dark ? "var(--orange-soft)" : "var(--navy)" }}>{title}</h2>
      </div>
      <ul style={{ display: "flex", flexDirection: "column", gap: 14, listStyle: "none", margin: 0, padding: 0 }}>
        {points.map((p, i) => (
          <li key={i} className="t-body" style={{ display: "flex", gap: 12, lineHeight: 1.45, color: dark ? "var(--ink-invert)" : "var(--ink)" }}>
            <span aria-hidden style={{ marginTop: 7, height: 6, width: 6, flex: "none", background: "var(--orange)" }} />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <p className="t-caption" style={{ margin: "auto 0 0", paddingTop: 16, lineHeight: 1.6, color: dark ? "rgba(244,238,231,.55)" : "var(--ink-faint)", borderTop: "1px solid " + (dark ? "rgba(244,238,231,.14)" : "var(--hairline)") }}>{note}</p>
    </div>
  );
}
