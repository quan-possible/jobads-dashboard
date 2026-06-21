"use client";

import { useMemo } from "react";
import type { Data, Layout } from "plotly.js";
import { PC } from "@/lib/plotly/theme";
import type { MatrixResponse } from "@/lib/types";
import { PlotlyFigure } from "./PlotlyFigure";

// Occupation × province heatmap. measure='lq' shows the location quotient — a
// cell's share of a province's demand relative to the national mix, so 1.0 means
// "as expected", >1 over-represented (regional specialisation), <1 under. Warm
// sequential ramp anchored so 1.0 sits mid-scale; exact LQ + count on hover.

const short = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export function MatrixHeatmap({
  data: m,
  height = 360,
  notEnough = "Not enough data for this selection.",
  ariaLabel = "Occupation by province demand heatmap",
}: {
  data: MatrixResponse;
  height?: number;
  notEnough?: string;
  ariaLabel?: string;
}) {
  const { data, layout, enough } = useMemo(() => {
    if (m.rows.length === 0 || m.cols.length === 0) {
      return { data: [] as Data[], layout: {} as Partial<Layout>, enough: false };
    }
    const isLq = m.measure === "lq";
    const colorscale = PC.sequential.map((c, i) => [i / (PC.sequential.length - 1), c]) as [number, string][];

    const data: Data[] = [
      {
        type: "heatmap",
        z: m.z,
        x: m.cols.map((c) => short(c, 12)),
        y: m.rows.map((r) => short(r, 34)),
        customdata: m.counts,
        colorscale,
        zmin: isLq ? 0 : undefined,
        zmax: isLq ? 2 : undefined,
        xgap: 2,
        ygap: 2,
        colorbar: { thickness: 10, len: 0.9, outlinewidth: 0, tickfont: { size: 10, color: PC.inkFaint } },
        hovertemplate: isLq
          ? "%{y} · %{x}<br>LQ %{z:.2f} · %{customdata:,} postings<extra></extra>"
          : "%{y} · %{x}<br>%{z:,} postings<extra></extra>",
        hoverongaps: false,
      },
    ];

    const layout: Partial<Layout> = {
      margin: { l: 8, r: 8, t: 8, b: 70 },
      xaxis: { type: "category", showgrid: false, ticks: "", tickangle: -40, tickfont: { size: 10 }, automargin: true },
      yaxis: { type: "category", showgrid: false, ticks: "", autorange: "reversed", automargin: true, tickfont: { size: 10 } },
    };

    return { data, layout, enough: true };
  }, [m]);

  if (!enough) {
    return (
      <div className="flex items-center justify-center text-[0.85rem] text-ink-faint" style={{ height }}>
        {notEnough}
      </div>
    );
  }

  return <PlotlyFigure data={data} layout={layout} height={height} ariaLabel={ariaLabel} />;
}
