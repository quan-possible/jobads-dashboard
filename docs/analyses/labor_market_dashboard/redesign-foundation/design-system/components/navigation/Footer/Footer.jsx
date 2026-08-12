import React from "react";
import { PixelTiles } from "../../brand/PixelTiles/PixelTiles";

const NAV_LABELS = ["Pulse", "Occupations", "Industries", "Geography", "Wages", "Skills", "Method", "Developers"];

// Navy footer: gradient ribbon, brand + tagline, section links, about-the-data
// column, and a bottom bar with the posted-demand disclaimer.
export function Footer({
  asOf = "July 2026",
  source = "Source: online job postings collected and de-duplicated by ACLMR.",
  tagline = "The Alberta Centre for Labour Market Research studies how Canada's labour market is changing, using timely data from online job postings.",
  year = 2026,
  links = NAV_LABELS,
}) {
  const soft = { color: "rgba(244,238,231,.7)" };
  return (
    <footer style={{ background: "var(--surface-navy)", color: "var(--ink-invert)" }}>
      <div className="gradient-bar" />
      <div className="container-x" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1.2fr", gap: 40, padding: "56px var(--gutter)" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <PixelTiles rows={3} cols={3} size={8} gap={2} />
            <span style={{ fontSize: "1.125rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.01em" }}>ACLMR</span>
          </div>
          <p className="t-body" style={Object.assign({ margin: "16px 0 0", maxWidth: "24rem", lineHeight: 1.65 }, soft)}>{tagline}</p>
        </div>
        <nav aria-label="Sections" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span className="eyebrow" style={{ color: "var(--orange-soft)" }}>Dashboard</span>
          {links.map((l) => (
            <a key={l} href="#" className="t-body" style={{ width: "fit-content", color: "rgba(244,238,231,.8)" }}>{l}</a>
          ))}
        </nav>
        <div className="t-meta" style={{ display: "flex", flexDirection: "column", gap: 12, color: "rgba(244,238,231,.65)", lineHeight: 1.6 }}>
          <span className="eyebrow" style={{ color: "var(--orange-soft)" }}>About the data</span>
          <p style={{ margin: 0 }}>{source}</p>
          <p style={{ margin: 0 }}>Categories follow the National Occupational Classification (NOC 2021).</p>
          <p className="num" style={{ margin: 0 }}>Data through {asOf}.</p>
          <a href="https://www.aclmr.ca/" style={{ marginTop: 8, width: "fit-content", color: "rgba(244,238,231,.8)" }}>aclmr.ca →</a>
        </div>
      </div>
      <div style={{ borderTop: "1px solid rgba(255,255,255,.1)" }}>
        <div className="container-x t-caption" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "20px var(--gutter)", color: "rgba(244,238,231,.5)" }}>
          <span>© {year} Alberta Centre for Labour Market Research</span>
          <span style={{ textTransform: "uppercase", letterSpacing: "0.04em" }}>Job ads measure posted demand — not employment</span>
        </div>
      </div>
    </footer>
  );
}
