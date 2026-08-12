import React from "react";
import { PixelTiles } from "../PixelTiles/PixelTiles";

// Wordmark lockup: 3x3 pixel tiles + ACLMR + optional tagline. The dashboard's
// stand-in for the aclmr.ca logo (the real SVG is not vendored here).
export function Brand({ compact = false, tagline = "Labour Market Pulse", href = "#", inverted = false }) {
  const inkMain = inverted ? "var(--ink-invert)" : "var(--navy-deep)";
  const inkSub = inverted ? "rgba(244,238,231,.55)" : "var(--ink-soft)";
  return (
    <a href={href} style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }} aria-label={"ACLMR " + tagline}>
      <PixelTiles rows={3} cols={3} size={7} gap={2} />
      <span style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span style={{ fontSize: "1.05rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.01em", color: inkMain }}>ACLMR</span>
        {!compact && (
          <span className="t-caption" style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: inkSub, marginTop: 3, whiteSpace: "nowrap" }}>{tagline}</span>
        )}
      </span>
    </a>
  );
}
