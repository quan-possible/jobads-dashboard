"use client";

import { useMemo } from "react";
import type { Data, Layout } from "plotly.js";
import { PC } from "@/lib/plotly/theme";
import { PlotlyFigure } from "./PlotlyFigure";

// Cumulative-concentration (Lorenz-style) curve: rank the entities by demand and
// plot how the cumulative share of all postings builds up. Reads off as "the top
// N groups hold X% of demand" — a compact concentration story. Built client-side
// from a ranked list, no extra endpoint.

export function CumulativeCurve({
  items,
  height = 280,
  unitLabel = "groups",
  notEnough = "Not enough data for this selection.",
  ariaLabel = "Cumulative concentration of demand",
}: {
  items: { label: string; value: number }[];
  height?: number;
  unitLabel?: string;
  notEnough?: string;
  ariaLabel?: string;
}) {
  const { data, layout, enough } = useMemo(() => {
    const sorted = [...items].filter((i) => i.value > 0).sort((a, b) => b.value - a.value);
    const total = sorted.reduce((a, b) => a + b.value, 0);
    if (sorted.length < 3 || total === 0) return { data: [] as Data[], layout: {} as Partial<Layout>, enough: false };

    const x: number[] = [0];
    const y: number[] = [0];
    const labels: string[] = [""];
    let cum = 0;
    sorted.forEach((it, i) => {
      cum += it.value;
      x.push(i + 1);
      y.push((cum / total) * 100);
      labels.push(it.label);
    });

    // Where does cumulative demand cross 80%?
    const idx80 = y.findIndex((v) => v >= 80);

    const data: Data[] = [
      {
        type: "scatter",
        mode: "lines+markers",
        x,
        y,
        line: { color: PC.teal, width: 2.5, shape: "spline", smoothing: 0.3 },
        marker: { size: 5, color: PC.teal },
        customdata: labels,
        hovertemplate: `Top %{x} ${unitLabel}: %{y:.0f}% of demand<br>%{customdata}<extra></extra>`,
      },
    ];

    const layout: Partial<Layout> = {
      margin: { l: 44, r: 16, t: 8, b: 36 },
      xaxis: { title: { text: `Number of ${unitLabel} (ranked)`, font: { size: 11, color: PC.inkFaint } }, dtick: 1, rangemode: "tozero" },
      yaxis: { ticksuffix: "%", range: [0, 100] },
      shapes:
        idx80 > 0
          ? [
              {
                type: "line",
                x0: 0,
                x1: idx80,
                y0: 80,
                y1: 80,
                yref: "y",
                xref: "x",
                line: { color: PC.baseline, width: 1, dash: "dot" },
                opacity: 0.5,
              },
              {
                type: "line",
                x0: idx80,
                x1: idx80,
                y0: 0,
                y1: 80,
                yref: "y",
                xref: "x",
                line: { color: PC.baseline, width: 1, dash: "dot" },
                opacity: 0.5,
              },
            ]
          : [],
      annotations:
        idx80 > 0
          ? [
              {
                x: idx80,
                y: 80,
                yref: "y" as const,
                text: `Top ${idx80} = 80%`,
                showarrow: false,
                font: { color: PC.baseline, size: 10 },
                xanchor: "left" as const,
                yanchor: "bottom" as const,
                xshift: 4,
              },
            ]
          : [],
    };

    return { data, layout, enough: true };
  }, [items, unitLabel]);

  if (!enough) {
    return (
      <div className="flex items-center justify-center text-[0.85rem] text-ink-faint" style={{ height }}>
        {notEnough}
      </div>
    );
  }

  return <PlotlyFigure data={data} layout={layout} height={height} ariaLabel={ariaLabel} />;
}
