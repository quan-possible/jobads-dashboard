import React, { useState } from "react";

// EN/FR segmented toggle. Square analytical control with light and dark-shell
// treatments; the active segment always has a clear filled state.
export function LocaleToggle({ locale = "en", onChange, ariaLabel = "Language", inverted = false }) {
  const [current, setCurrent] = useState(locale);
  const choose = (l) => { setCurrent(l); if (onChange) onChange(l); };
  return (
    <div role="group" aria-label={ariaLabel} className="control t-caption" style={{ display: "flex", flexShrink: 0, overflow: "hidden", border: "1px solid " + (inverted ? "rgba(244,238,231,.28)" : "var(--card-border)"), fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", width: "fit-content" }}>
      {["en", "fr"].map((l) => {
        const active = l === current;
        return (
          <button key={l} type="button" onClick={() => choose(l)} aria-pressed={active}
            style={{ padding: "4px 8px", border: 0, cursor: "pointer", font: "inherit", transition: "color .15s var(--ease)", background: active ? (inverted ? "var(--ink-invert)" : "var(--navy)") : "transparent", color: active ? (inverted ? "var(--navy-deep)" : "var(--canvas)") : (inverted ? "rgba(244,238,231,.65)" : "var(--ink-soft)") }}>
            {l.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
