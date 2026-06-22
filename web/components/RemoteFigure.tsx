"use client";

import { useEffect, useRef } from "react";
import { baseConfig } from "@/lib/plotly/theme";
import type { FigJSON } from "@/lib/types";

// Client host for a figure authored in Python (the redesign2 Plotly factories,
// served as figure JSON by /api/figure and fetched server-side by the page).
// Unlike PlotlyFigure it does NOT inject the web template — the figure already
// carries its own inlined `aclmr_light` look from the bridge — and it renders
// native Plotly `frames` (time sliders) the same way ChoroplethTime does.
//
// The partial-bundle types model neither treemap/waterfall traces nor frames, so
// cast through `unknown` at the Plotly boundary (same idiom as ChoroplethTime).

export function RemoteFigure({
  fig,
  height,
  ariaLabel,
  className = "",
}: {
  fig: FigJSON;
  height?: number;
  ariaLabel: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // The factory's own height is the authored intent; fall back to the prop.
  const figHeight = (fig.layout?.height as number | undefined) ?? height ?? 360;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let disposed = false;
    let ro: ResizeObserver | undefined;
    let plotly: typeof import("@/lib/plotly").default | undefined;

    void import("@/lib/plotly").then((mod) => {
      if (disposed || !ref.current) return;
      plotly = mod.default;
      const newPlot = plotly.newPlot as unknown as (
        el: HTMLElement, data: unknown, layout: unknown, config: unknown,
      ) => Promise<unknown>;
      const addFrames = plotly.addFrames as unknown as (
        el: HTMLElement, frames: unknown,
      ) => Promise<unknown>;

      const layout = { ...fig.layout, height: figHeight };
      void newPlot(el, fig.data, layout, { ...baseConfig }).then(() => {
        if (!disposed && fig.frames?.length) void addFrames(el, fig.frames);
      });
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
  }, [fig, figHeight]);

  return (
    <div
      ref={ref}
      style={{ height: figHeight, width: "100%" }}
      role="img"
      aria-label={ariaLabel}
      className={className}
    />
  );
}
