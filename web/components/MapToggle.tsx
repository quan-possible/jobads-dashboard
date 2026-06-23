"use client";

import { useId, useState } from "react";
import { RemoteFigure } from "@/components/RemoteFigure";
import type { FigJSON } from "@/lib/types";

// A segmented control that swaps between pre-fetched figure variants (e.g. the
// authoritative province map shown as count / share / per-capita / LQ). Each
// variant is a plain server-fetched figure; only which one renders is client
// state, so no measure logic lives in the browser.

export function MapToggle({
  options,
  figs,
  height,
  ariaLabel,
}: {
  options: { value: string; label: string }[];
  figs: Record<string, FigJSON | null>;
  height?: number;
  ariaLabel: string;
}) {
  const [active, setActive] = useState(options[0].value);
  const baseId = useId();
  const activeIdx = options.findIndex((o) => o.value === active);
  const panelId = `${baseId}-panel`;
  const tabId = (value: string) => `${baseId}-tab-${value}`;

  // Roving-tabindex arrow-key navigation across the tablist (S33).
  const onKeyDown = (e: React.KeyboardEvent) => {
    let next = activeIdx;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (activeIdx + 1) % options.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (activeIdx - 1 + options.length) % options.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = options.length - 1;
    else return;
    e.preventDefault();
    const value = options[next].value;
    setActive(value);
    document.getElementById(tabId(value))?.focus();
  };

  return (
    <div>
      <div role="tablist" aria-label={ariaLabel} className="mb-3 inline-flex flex-wrap gap-1 rounded-md bg-surface-alt p-1">
        {options.map((o) => {
          const on = active === o.value;
          return (
            <button
              key={o.value}
              id={tabId(o.value)}
              type="button"
              role="tab"
              aria-selected={on}
              aria-controls={panelId}
              tabIndex={on ? 0 : -1}
              onClick={() => setActive(o.value)}
              onKeyDown={onKeyDown}
              className={[
                "rounded px-3 py-1 t-meta font-bold transition-colors",
                "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange",
                on ? "bg-orange text-white shadow-sm" : "text-ink-soft hover:text-navy-deep",
              ].join(" ")}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={panelId} aria-labelledby={tabId(active)} tabIndex={0} className="outline-none">
        <RemoteFigure fig={figs[active]} height={height} ariaLabel={ariaLabel} />
      </div>
    </div>
  );
}
