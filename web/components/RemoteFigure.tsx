"use client";

import { useEffect, useRef, useState } from "react";
import { baseConfig } from "@/lib/plotly/theme";
import { useI18n } from "@/lib/i18n/provider";
import type { FigJSON } from "@/lib/types";

function wrapCompactAnnotation(text: unknown): unknown {
  if (typeof text !== "string" || text.includes("<br>")) return text;
  const words = text.split(" ");
  if (words.length < 2 || text.length <= 12) return text;
  const lines: string[] = [];
  for (const word of words) {
    const current = lines.at(-1);
    if (!current || current.length + word.length + 1 > 13) lines.push(word);
    else lines[lines.length - 1] = `${current} ${word}`;
  }
  return lines.join("<br>");
}

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
  const { t, locale } = useI18n();
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

        const compactMap = el.clientWidth < 520 && fig.data.some((trace) => (
          typeof trace === "object" && trace !== null && (trace as { type?: string }).type === "choropleth"
        ));
        const data = compactMap
          ? fig.data.map((trace) => {
              if (typeof trace !== "object" || trace === null || (trace as { type?: string }).type !== "choropleth") return trace;
              const item = trace as Record<string, unknown>;
              const colorbar = (item.colorbar ?? {}) as Record<string, unknown>;
              const title = (colorbar.title ?? {}) as Record<string, unknown>;
              return {
                ...item,
                colorbar: {
                  ...colorbar,
                  orientation: "h",
                  x: 0.5,
                  xanchor: "center",
                  y: 1.04,
                  yanchor: "bottom",
                  len: 0.72,
                  thickness: 10,
                  title: { ...title, side: "top" },
                },
              };
            })
          : fig.data;
        const authoredMargin = (fig.layout.margin ?? {}) as Record<string, unknown>;
        const authoredAnnotations = Array.isArray(fig.layout.annotations) ? fig.layout.annotations : [];
        const compactSmallMultiples = el.clientWidth < 520 && authoredAnnotations.length >= 8;
        const compactHeatmapLabels = el.clientWidth < 520
          ? fig.data.find((trace) => {
              if (typeof trace !== "object" || trace === null || (trace as { type?: string }).type !== "heatmap") return false;
              const x = (trace as { x?: unknown[] }).x;
              return Array.isArray(x) && x.length >= 8 && x.some((value) => typeof value === "string" && value.length > 8);
            }) as { x?: unknown[] } | undefined
          : undefined;
        const compactAnnotations = compactSmallMultiples
          ? authoredAnnotations.map((annotation) => {
              if (typeof annotation !== "object" || annotation === null) return annotation;
              const item = annotation as Record<string, unknown>;
              const font = (item.font ?? {}) as Record<string, unknown>;
              return { ...item, text: wrapCompactAnnotation(item.text), font: { ...font, size: 9 } };
            })
          : authoredAnnotations;
        const compactAxis = (axis: unknown, key: string) => {
          if (typeof axis !== "object" || axis === null) return axis;
          const item = axis as Record<string, unknown>;
          const tickfont = (item.tickfont ?? {}) as Record<string, unknown>;
          const title = (item.title ?? {}) as Record<string, unknown>;
          const titleFont = (title.font ?? {}) as Record<string, unknown>;
          const denseHeatmapX = key === "xaxis" && compactHeatmapLabels;
          return {
            ...item,
            automargin: true,
            ...(denseHeatmapX ? {
              tickangle: -90,
              tickmode: "array",
              tickvals: compactHeatmapLabels.x,
              ticktext: compactHeatmapLabels.x,
            } : {}),
            tickfont: { ...tickfont, size: Math.min(Number(tickfont.size ?? 10), denseHeatmapX ? 8 : 9) },
            title: { ...title, font: { ...titleFont, size: Math.min(Number(titleFont.size ?? 11), 10) } },
          };
        };
        const compactAxes = el.clientWidth < 520
          ? Object.fromEntries(Object.entries(fig.layout)
              .filter(([key]) => /^xaxis\d*$|^yaxis\d*$/.test(key))
              .map(([key, value]) => [key, compactAxis(value, key)]))
          : {};
        const compactCategoryCount = el.clientWidth < 520
          ? Math.max(0, ...fig.data.map((trace) => {
              if (typeof trace !== "object" || trace === null || (trace as { type?: string }).type !== "bar") return 0;
              const y = (trace as { y?: unknown[] }).y;
              return Array.isArray(y) && y.every((value) => typeof value === "string") ? y.length : 0;
            }))
          : 0;
        const renderHeight = compactSmallMultiples
          ? Math.max(figHeight, 340)
          : compactCategoryCount > 7
            ? Math.max(figHeight, compactCategoryCount * 34 + 80)
            : figHeight;
        // The authored heights target desktop. Give dense mobile labels actual
        // vertical room instead of shrinking or deleting categorical truth.
        el.style.height = `${renderHeight}px`;
        const layout = {
          ...fig.layout,
          ...compactAxes,
          height: renderHeight,
          ...(compactMap ? { margin: { ...authoredMargin, t: Math.max(Number(authoredMargin.t ?? 0), 54) } } : {}),
          ...(compactSmallMultiples ? {
            annotations: compactAnnotations,
            margin: { ...authoredMargin, t: Math.max(Number(authoredMargin.t ?? 0), 62) },
          } : {}),
        };
        void newPlot(el, data, layout, { ...baseConfig, locale })
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
  }, [fig, figHeight, locale]);

  // While a fetch is in flight and nothing has rendered yet, show a neutral
  // loading skeleton — not the error notice — so a normal load never reads as
  // broken (S15).
  if (!fig && loading && !failedFor) {
    return (
      <div
        style={{ height: figHeight, width: "100%" }}
        role="status"
        aria-live="polite"
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
        role="status"
        aria-live="polite"
        aria-label={`${ariaLabel}: ${t.common.chartUnavailable}`}
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
      className={`remote-figure min-w-0 max-w-full overflow-hidden ${className}`}
    />
  );
}
