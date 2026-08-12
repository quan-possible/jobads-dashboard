import React, { useState } from "react";

// Labelled square select. Border turns orange when a non-default value is
// chosen (the "filter active" cue); disabled placeholder when options are empty.
export function Select({ label, value, options = [], onChange, id }) {
  const [internal, setInternal] = useState(value);
  const labelStyle = { fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink-faint)" };
  if (options.length === 0) {
    return (
      <label htmlFor={id} style={{ display: "flex", minWidth: 0, flexDirection: "column", gap: 4 }}>
        <span className="t-label" style={labelStyle}>{label}</span>
        <select id={id} disabled className="control t-body" style={{ width: "100%", cursor: "not-allowed", appearance: "none", border: "1px solid var(--card-border)", background: "var(--surface)", padding: "8px 36px 8px 12px", color: "var(--ink-faint)", opacity: 0.6, fontFamily: "inherit" }}>
          <option>—</option>
        </select>
      </label>
    );
  }
  const current = (internal !== undefined ? internal : options[0].value);
  const isDefault = current === options[0].value;
  const change = (e) => { setInternal(e.target.value); if (onChange) onChange(e.target.value); };
  return (
    <label htmlFor={id} style={{ display: "flex", minWidth: 0, flexDirection: "column", gap: 4 }}>
      <span className="t-label" style={labelStyle}>{label}</span>
      <div style={{ position: "relative" }}>
        <select id={id} value={current} onChange={change} className="control t-body"
          style={{ width: "100%", cursor: "pointer", appearance: "none", background: "var(--surface)", padding: "8px 36px 8px 12px", fontWeight: 700, fontFamily: "inherit", transition: "border-color .15s var(--ease)", border: "1px solid " + (isDefault ? "var(--card-border)" : "rgba(207,119,48,.6)"), color: isDefault ? "var(--navy)" : "var(--navy-deep)" }}>
          {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
        </select>
        <svg aria-hidden viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" style={{ pointerEvents: "none", position: "absolute", right: 12, top: "50%", height: 12, width: 12, transform: "translateY(-50%)", color: "var(--ink-soft)" }}>
          <path d="M2.5 4.5 6 8l3.5-3.5" strokeLinecap="square" />
        </svg>
      </div>
    </label>
  );
}
