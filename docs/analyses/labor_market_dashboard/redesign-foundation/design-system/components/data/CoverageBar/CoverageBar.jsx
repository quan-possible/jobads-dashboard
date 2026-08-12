import React from "react";

// A single row showing how completely a field is populated across postings.
// The bar fills teal when well-covered, ORANGE when sparse (<40%) — the
// sparse-data honesty cue. `share` is a 0-1 proportion.
function fmtCompact(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1e4) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "k";
  return n.toLocaleString("en-CA");
}

export function CoverageBar({ label, share, count, postingsLabel = "postings" }) {
  const pct = (share * 100).toFixed(0);
  const isSparse = share < 0.4;
  const accent = isSparse ? "var(--orange-deep)" : "var(--teal)";
  const bar = isSparse ? "var(--orange)" : "var(--teal)";
  return (
    <div role="img" aria-label={label + ": " + pct + "% coverage, " + fmtCompact(count) + " " + postingsLabel}>
      <div style={{ marginBottom: 4, display: "grid", gridTemplateColumns: "1fr auto", alignItems: "baseline", gap: 8 }}>
        <span className="t-body-sm" style={{ fontWeight: 700, color: "var(--navy)" }}>{label}</span>
        <span className="num t-body-sm" style={{ fontWeight: 700, color: accent }}>{pct}%</span>
      </div>
      <div style={{ height: 10, width: "100%", borderRadius: "var(--radius-sm)", background: "var(--surface-alt)" }}>
        <div style={{ height: "100%", borderRadius: "var(--radius-sm)", background: bar, width: Math.min(1, share) * 100 + "%" }} />
      </div>
      <p className="t-caption" style={{ margin: "4px 0 0", color: "var(--ink-faint)" }}>{fmtCompact(count)} {postingsLabel}</p>
    </div>
  );
}
