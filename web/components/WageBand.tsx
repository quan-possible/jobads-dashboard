"use client";

import { useMemo } from "react";
import type { Data, Layout } from "plotly.js";
import { PC, monthDate } from "@/lib/plotly/theme";
import type { WageTrendPoint } from "@/lib/types";
import { PlotlyFigure } from "./PlotlyFigure";

// Advertised hourly pay as a distribution over time: a teal p25–p75 band with a
// navy median line. Honest by construction — only p25/median/p75 exist in the
// cube, so this is a band, never a box plot. Direct end-labels, no legend.

export function WageBand({
  points,
  height = 340,
  labels = { p25: "P25", median: "Median", p75: "P75", notEnough: "Not enough wage data for this selection." },
}: {
  points: WageTrendPoint[];
  height?: number;
  labels?: { p25: string; median: string; p75: string; notEnough: string };
}) {
  const { data, layout, enough } = useMemo(() => {
    if (points.length < 2) return { data: [] as Data[], layout: {} as Partial<Layout>, enough: false };

    const x = points.map((p) => monthDate(p.month));
    const p25 = points.map((p) => p.p25);
    const med = points.map((p) => p.median);
    const p75 = points.map((p) => p.p75);
    const last = points[points.length - 1];

    const data: Data[] = [
      {
        type: "scatter",
        mode: "lines",
        x,
        y: p25,
        line: { color: PC.teal, width: 1 },
        hovertemplate: "P25 $%{y:.2f}<extra></extra>",
        name: labels.p25,
      },
      {
        type: "scatter",
        mode: "lines",
        x,
        y: p75,
        fill: "tonexty",
        fillcolor: "rgba(52,89,97,0.14)",
        line: { color: PC.teal, width: 1 },
        hovertemplate: "P75 $%{y:.2f}<extra></extra>",
        name: labels.p75,
      },
      {
        type: "scatter",
        mode: "lines",
        x,
        y: med,
        line: { color: PC.baseline, width: 2.5, shape: "spline", smoothing: 0.4 },
        hovertemplate: "Median $%{y:.2f}<extra></extra>",
        name: labels.median,
      },
    ];

    const endLabel = (text: string, y: number, color: string, bold = false) => ({
      x: `${last.month}-01`,
      y,
      yref: "y" as const,
      text: bold ? `<b>${text} $${y.toFixed(0)}</b>` : `${text} $${y.toFixed(0)}`,
      showarrow: false,
      font: { color, size: 11 },
      xanchor: "left" as const,
      yanchor: "middle" as const,
      xshift: 6,
    });

    const layout: Partial<Layout> = {
      xaxis: { type: "date", tickformat: "%Y", hoverformat: "%b %Y" },
      yaxis: { tickprefix: "$", rangemode: "tozero" },
      margin: { l: 44, r: 64, t: 8, b: 28 },
      annotations: [
        endLabel(labels.p75, last.p75, PC.teal),
        endLabel(labels.median, last.median, PC.baseline, true),
        endLabel(labels.p25, last.p25, PC.teal),
      ],
    };

    return { data, layout, enough: true };
  }, [points, labels]);

  if (!enough) {
    return (
      <div className="flex items-center justify-center text-[0.85rem] text-ink-faint" style={{ height }}>
        {labels.notEnough}
      </div>
    );
  }

  return (
    <PlotlyFigure
      data={data}
      layout={layout}
      height={height}
      ariaLabel="Advertised hourly pay distribution over time: 25th to 75th percentile band with median"
    />
  );
}
