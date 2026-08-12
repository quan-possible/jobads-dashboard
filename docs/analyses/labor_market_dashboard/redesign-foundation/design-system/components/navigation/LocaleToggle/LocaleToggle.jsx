import React, { useState } from "react";

// EN/FR segmented toggle. Square control; active segment is navy on cream text.
export function LocaleToggle({ locale = "en", onChange, ariaLabel = "Language" }) {
  const [current, setCurrent] = useState(locale);
  const choose = (l) => { setCurrent(l); if (onChange) onChange(l); };
  return (
    <div role="group" aria-label={ariaLabel} className="control t-caption" style={{ display: "flex", flexShrink: 0, overflow: "hidden", border: "1px solid var(--card-border)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", width: "fit-content" }}>
      {["en", "fr"].map((l) => {
        const active = l === current;
        return (
          <button key={l} type="button" onClick={() => choose(l)} aria-pressed={active}
            style={{ padding: "4px 8px", border: 0, cursor: "pointer", font: "inherit", transition: "color .15s var(--ease)", background: active ? "var(--navy)" : "transparent", color: active ? "var(--canvas)" : "var(--ink-soft)" }}>
            {l.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
