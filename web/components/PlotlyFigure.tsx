"use client";

import { useEffect, useRef } from "react";
import type { Config, Data, Layout } from "plotly.js";
import { aclmrWarm, baseConfig } from "@/lib/plotly/theme";

// Client host for every Plotly chart. Loads the partial bundle lazily (so it
// never touches the server), applies the house template, and keeps the figure
// sized to its container. The editorial frame lives in <Figure> around this.

export function PlotlyFigure({
  data,
  layout,
  config,
  height = 300,
  ariaLabel,
  className = "",
}: {
  data: Data[];
  layout?: Partial<Layout>;
  config?: Partial<Config>;
  height?: number;
  ariaLabel: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let disposed = false;
    let ro: ResizeObserver | undefined;
    // Keep a handle so cleanup can purge even if the component unmounts mid-load.
    let plotly: typeof import("@/lib/plotly").default | undefined;

    void import("@/lib/plotly").then((mod) => {
      if (disposed || !ref.current) return;
      plotly = mod.default;
      const merged: Partial<Layout> = {
        ...layout,
        height,
        template: aclmrWarm,
      };
      void plotly.react(el, data, merged, { ...baseConfig, ...config });
      ro = new ResizeObserver(() => {
        if (plotly && ref.current) plotly.Plots.resize(ref.current);
      });
      ro.observe(el);
    });

    return () => {
      disposed = true;
      ro?.disconnect();
      if (plotly && el) plotly.purge(el);
    };
  }, [data, layout, config, height]);

  return (
    <div
      ref={ref}
      style={{ height, width: "100%" }}
      role="img"
      aria-label={ariaLabel}
      className={className}
    />
  );
}
