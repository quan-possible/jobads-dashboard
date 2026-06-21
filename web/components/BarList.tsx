"use client";

import { useMemo } from "react";
import type { Data, Layout } from "plotly.js";
import { PC } from "@/lib/plotly/theme";
import { PlotlyFigure } from "./PlotlyFigure";

// Reusable horizontal ranked-bar chart in the house skin: bars from zero, direct
// value labels at the bar end, largest on top, optional dashed reference line
// (e.g. 1× baseline for skill lift). For genuine charts — not the tiny HTML data
// rows (KPI tiles, coverage, requirement shares) the spec keeps lightweight.

export type BarRow = {
  key: string;
  label: string;
  value: number;
  valueText: string;
  sublabel?: string;
};

export function BarList({
  rows,
  color = PC.teal,
  refLine,
  refLabel,
  rowHeight = 30,
  ariaLabel,
}: {
  rows: BarRow[];
  color?: string;
  refLine?: number;
  refLabel?: string;
  rowHeight?: number;
  ariaLabel: string;
}) {
  const { data, layout, height } = useMemo(() => {
    // ascending → largest at the TOP (Plotly draws first category at the bottom)
    const sorted = [...rows].sort((a, b) => a.value - b.value);
    const y = sorted.map((r) => r.label);
    const x = sorted.map((r) => r.value);
    const maxV = Math.max(1e-9, ...x, refLine ?? 0);

    const data: Data[] = [
      {
        type: "bar",
        orientation: "h",
        x,
        y,
        marker: { color },
        text: sorted.map((r) => r.valueText),
        textposition: "outside",
        textfont: { size: 11, color: PC.ink },
        cliponaxis: false,
        customdata: sorted.map((r) => r.sublabel ?? ""),
        hovertemplate: "%{y}<br>%{text}%{customdata}<extra></extra>",
      },
    ];

    const layout: Partial<Layout> = {
      margin: { l: 8, r: 48, t: refLine ? 16 : 8, b: 24 },
      bargap: 0.35,
      xaxis: { range: [0, maxV * 1.18], showticklabels: false, showgrid: false },
      yaxis: { type: "category", automargin: true, ticksuffix: "  " },
      shapes: refLine
        ? [
            {
              type: "line",
              x0: refLine,
              x1: refLine,
              yref: "paper",
              y0: 0,
              y1: 1,
              line: { color: PC.baseline, width: 1, dash: "dot" },
              opacity: 0.6,
            },
          ]
        : [],
      annotations:
        refLine && refLabel
          ? [
              {
                x: refLine,
                xref: "x",
                y: 1,
                yref: "paper",
                yshift: 10,
                text: refLabel,
                showarrow: false,
                font: { color: PC.baseline, size: 10 },
                xanchor: "center" as const,
              },
            ]
          : [],
    };

    return { data, layout, height: Math.max(120, sorted.length * rowHeight + (refLine ? 30 : 18)) };
  }, [rows, color, refLine, refLabel, rowHeight]);

  return <PlotlyFigure data={data} layout={layout} height={height} ariaLabel={ariaLabel} />;
}
