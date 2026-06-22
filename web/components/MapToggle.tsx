"use client";

import { useState } from "react";
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
  figs: Record<string, FigJSON>;
  height?: number;
  ariaLabel: string;
}) {
  const [active, setActive] = useState(options[0].value);
  return (
    <div>
      <div role="tablist" aria-label={ariaLabel} className="mb-3 inline-flex flex-wrap gap-1 rounded-md bg-surface-alt p-1">
        {options.map((o) => {
          const on = active === o.value;
          return (
            <button
              key={o.value}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActive(o.value)}
              className={[
                "rounded px-3 py-1 text-[0.82rem] font-bold transition-colors",
                "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange",
                on ? "bg-orange text-white shadow-sm" : "text-ink-soft hover:text-navy-deep",
              ].join(" ")}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      <RemoteFigure fig={figs[active]} height={height} ariaLabel={ariaLabel} />
    </div>
  );
}
