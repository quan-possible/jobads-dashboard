"use client";

import { useMemo } from "react";
import type { Data, Layout } from "plotly.js";
import { PC } from "@/lib/plotly/theme";
import { PlotlyFigure } from "./PlotlyFigure";

// Wage vs demand: each occupation a bubble — x = posting demand, y = median
// advertised wage, size = volume. Dashed median reference lines split the field
// into four quadrants (high pay/high demand, etc.). Built client-side by joining
// the occupation ranking with occupation wages.

export type WageDemandPoint = { label: string; demand: number; wage: number; n: number };

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function WageDemandScatter({
  points,
  height = 360,
  notEnough = "Not enough data for this selection.",
  ariaLabel = "Median wage versus posting demand by occupation",
}: {
  points: WageDemandPoint[];
  height?: number;
  notEnough?: string;
  ariaLabel?: string;
}) {
  const { data, layout, enough } = useMemo(() => {
    const pts = points.filter((p) => p.demand > 0 && p.wage > 0);
    if (pts.length < 3) return { data: [] as Data[], layout: {} as Partial<Layout>, enough: false };

    const mx = median(pts.map((p) => p.demand));
    const my = median(pts.map((p) => p.wage));
    const maxN = Math.max(...pts.map((p) => p.n));

    const data: Data[] = [
      {
        type: "scatter",
        mode: "text+markers",
        x: pts.map((p) => p.demand),
        y: pts.map((p) => p.wage),
        text: pts.map((p) => (p.label.length > 16 ? `${p.label.slice(0, 15)}…` : p.label)),
        textposition: "top center",
        textfont: { size: 9, color: PC.inkFaint },
        marker: {
          size: pts.map((p) => 8 + Math.sqrt(p.n / maxN) * 30),
          color: PC.teal,
          opacity: 0.55,
          line: { color: PC.ground, width: 1 },
        },
        customdata: pts.map((p) => p.n),
        hovertemplate: "%{text}<br>$%{y:.2f}/hr · %{x:,} postings · n=%{customdata:,}<extra></extra>",
      },
    ];

    const refLine = (axis: "x" | "y", v: number) =>
      axis === "x"
        ? { type: "line" as const, x0: v, x1: v, yref: "paper" as const, y0: 0, y1: 1, line: { color: PC.baseline, width: 1, dash: "dot" as const }, opacity: 0.4 }
        : { type: "line" as const, y0: v, y1: v, xref: "paper" as const, x0: 0, x1: 1, line: { color: PC.baseline, width: 1, dash: "dot" as const }, opacity: 0.4 };

    const layout: Partial<Layout> = {
      margin: { l: 52, r: 16, t: 8, b: 40 },
      xaxis: { title: { text: "Posting demand (active postings)", font: { size: 11, color: PC.inkFaint } }, rangemode: "tozero" },
      yaxis: { title: { text: "Median wage ($/hr)", font: { size: 11, color: PC.inkFaint } }, tickprefix: "$", rangemode: "tozero" },
      hovermode: "closest",
      shapes: [refLine("x", mx), refLine("y", my)],
    };

    return { data, layout, enough: true };
  }, [points]);

  if (!enough) {
    return (
      <div className="flex items-center justify-center text-[0.85rem] text-ink-faint" style={{ height }}>
        {notEnough}
      </div>
    );
  }

  return <PlotlyFigure data={data} layout={layout} height={height} ariaLabel={ariaLabel} />;
}
