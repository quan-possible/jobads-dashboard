import React, { useState, useId } from "react";

// A segmented control that swaps between pre-rendered figure variants (e.g. the
// province map shown as count / share / per-capita / LQ). Only which variant
// renders is client state.
export function MapToggle({ options = [], views = {}, ariaLabel = "Measure", height }) {
  const [active, setActive] = useState(options.length ? options[0].value : "");
  const baseId = useId();
  const activeIdx = options.findIndex((o) => o.value === active);
  const panelId = baseId + "-panel";
  const tabId = (v) => baseId + "-tab-" + v;

  const onKeyDown = (e) => {
    let next = activeIdx;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (activeIdx + 1) % options.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (activeIdx - 1 + options.length) % options.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = options.length - 1;
    else return;
    e.preventDefault();
    const value = options[next].value;
    setActive(value);
    const el = document.getElementById(tabId(value));
    if (el) el.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label={ariaLabel} style={{ marginBottom: 12, display: "inline-flex", flexWrap: "wrap", gap: 4, borderRadius: "var(--radius-sm)", background: "var(--surface-alt)", padding: 4 }}>
        {options.map((o) => {
          const on = active === o.value;
          return (
            <button key={o.value} id={tabId(o.value)} type="button" role="tab" aria-selected={on} aria-controls={panelId}
              tabIndex={on ? 0 : -1} onClick={() => setActive(o.value)} onKeyDown={onKeyDown} className="t-meta"
              style={{ borderRadius: 4, border: 0, cursor: "pointer", padding: "4px 12px", whiteSpace: "nowrap", fontWeight: 700, fontFamily: "inherit", transition: "color .15s var(--ease)", background: on ? "var(--orange)" : "transparent", color: on ? "#fff" : "var(--ink-soft)" }}>
              {o.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={panelId} aria-labelledby={tabId(active)} tabIndex={0} style={{ outline: "none", minHeight: height }}>
        {views[active]}
      </div>
    </div>
  );
}
