"use client";

import { useEffect, useRef, useState } from "react";
import { baseConfig } from "@/lib/plotly/theme";
import { useI18n } from "@/lib/i18n/provider";
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
  loading = false,
}: {
  fig: FigJSON | null | undefined;
  height?: number;
  ariaLabel: string;
  className?: string;
  /** True while a fetch is in flight. A null figure then reads as *loading*
   *  (neutral skeleton), not *failed* ("unavailable") — S15. */
  loading?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { t } = useI18n();
  const [failedFor, setFailedFor] = useState<FigJSON | null>(null);

  // The factory's own height is the authored intent; fall back to the prop.
  const figHeight = (fig?.layout?.height as number | undefined) ?? height ?? 360;

  useEffect(() => {
    if (!fig) return;
    const el = ref.current;
    if (!el) return;
    let disposed = false;
    let ro: ResizeObserver | undefined;
    let plotly: typeof import("@/lib/plotly").default | undefined;

    void import("@/lib/plotly")
      .then((mod) => {
        if (disposed || !ref.current) return;
        plotly = mod.default;
        const newPlot = plotly.newPlot as unknown as (
          el: HTMLElement, data: unknown, layout: unknown, config: unknown,
        ) => Promise<unknown>;
        const addFrames = plotly.addFrames as unknown as (
          el: HTMLElement, frames: unknown,
        ) => Promise<unknown>;

        const layout = { ...fig.layout, height: figHeight };
        void newPlot(el, fig.data, layout, { ...baseConfig })
          .then(() => {
            if (!disposed && fig.frames?.length) void addFrames(el, fig.frames);
          })
          .catch(() => !disposed && setFailedFor(fig));
        ro = new ResizeObserver(() => {
          if (plotly && ref.current) plotly.Plots.resize(ref.current);
        });
        ro.observe(el);
      })
      .catch(() => !disposed && setFailedFor(fig));

    return () => {
      disposed = true;
      ro?.disconnect();
      if (plotly && el) plotly.purge(el);
    };
  }, [fig, figHeight]);

  // While a fetch is in flight and nothing has rendered yet, show a neutral
  // loading skeleton — not the error notice — so a normal load never reads as
  // broken (S15).
  if (!fig && loading && !failedFor) {
    return (
      <div
        style={{ height: figHeight, width: "100%" }}
        role="img"
        aria-busy="true"
        aria-label={t.common.loading}
        className={`flex min-w-0 max-w-full animate-pulse items-center justify-center overflow-hidden rounded-md border border-card-border bg-surface-alt/40 px-4 text-center t-meta text-ink-faint ${className}`}
      >
        {t.common.loading}
      </div>
    );
  }

  // Per-figure fallback: a missing figure (server fetch failed) or a render
  // error degrades to a small notice — it never blanks the rest of the page (S23).
  const renderFailed = failedFor === fig;
  if (!fig || renderFailed) {
    return (
      <div
        style={{ height: figHeight, width: "100%" }}
        role="img"
        aria-label={ariaLabel}
        className={`flex min-w-0 max-w-full items-center justify-center overflow-hidden rounded-md border border-dashed border-card-border bg-surface-alt/40 px-4 text-center t-meta text-ink-faint ${className}`}
      >
        {t.common.chartUnavailable}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      style={{ height: figHeight, width: "100%" }}
      role="img"
      aria-label={ariaLabel}
      className={`min-w-0 max-w-full overflow-hidden ${className}`}
    />
  );
}
