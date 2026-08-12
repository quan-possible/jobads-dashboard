import React from "react";
import { Sparkline } from "../Sparkline/Sparkline";

// One headline number. Optional delta chip + sparkline. The `accent` tile gets
// the orange treatment (used for the lead metric).
// delta / valueTrend are PERCENTAGE POINTS (18 -> "18%").
export function KpiTile({ label, value, unit, context, delta, deltaLabel, valueTrend, spark, sparkColor, accent = false }) {
  const hasDelta = delta !== null && delta !== undefined;
  const up = (delta || 0) >= 0;
  const hasValueTrend = valueTrend !== null && valueTrend !== undefined;
  const valueUp = (valueTrend || 0) >= 0;
  const pct = (n) => Math.abs(n).toFixed(1).replace(/\.0$/, "") + "%";
  return (
    <div className="card" style={{ position: "relative", display: "flex", flexDirection: "column", gap: 12, overflow: "hidden", padding: 20, boxShadow: accent ? "var(--shadow-card)" : "var(--shadow-soft)" }}>
      {accent && <span aria-hidden style={{ position: "absolute", insetInline: 0, top: 0, height: 4, background: "var(--orange)" }} />}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <span className="t-caption" style={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-soft)" }}>{label}</span>
        {context && <span className="t-caption" style={{ color: "var(--ink-faint)" }}>{context}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
        {hasValueTrend && (
          <span aria-hidden style={{ fontSize: "1.5rem", lineHeight: 1, color: valueUp ? "var(--pos)" : "var(--neg)" }}>{valueUp ? "▲" : "▼"}</span>
        )}
        <span className="num" style={{ fontSize: "2.05rem", fontWeight: 700, lineHeight: 1, color: hasValueTrend ? (valueUp ? "var(--pos)" : "var(--neg)") : "var(--navy-deep)" }}>{value}</span>
        {unit && <span className="t-body-sm" style={{ marginBottom: 2, fontWeight: 700, color: "var(--ink-soft)" }}>{unit}</span>}
      </div>
      <div style={{ marginTop: "auto", display: "flex", alignItems: "flex-end", gap: 8 }}>
        {hasDelta ? (
          <span className="num t-meta" style={{ display: "inline-flex", flexShrink: 0, alignItems: "center", gap: 4, whiteSpace: "nowrap", fontWeight: 700, color: up ? "var(--pos)" : "var(--neg)" }}>
            <span aria-hidden>{up ? "▲" : "▼"}</span>
            {pct(delta)}
            {deltaLabel && <span style={{ fontWeight: 400, color: "var(--ink-faint)" }}>{deltaLabel}</span>}
          </span>
        ) : <span />}
        {spark && spark.length > 1 && (
          <div style={{ display: "flex", minWidth: 0, flex: 1, justifyContent: "flex-end" }}>
            <Sparkline data={spark} stroke={sparkColor || (accent ? "var(--orange)" : "var(--teal)")} />
          </div>
        )}
      </div>
    </div>
  );
}
