"use client";

import { useMemo } from "react";
import type { Data, Layout } from "plotly.js";
import { PC, monthDate } from "@/lib/plotly/theme";
import type { CoverageTrendResponse } from "@/lib/types";
import { PlotlyFigure } from "./PlotlyFigure";

// Coverage-stability line: the share of postings carrying a usable value for a
// field (e.g. industry/NAICS) over time. The honesty companion to any chart
// built on that field — flat-and-high is good, a dip warns of thinner coverage.

export function CoverageTrend({
  data: resp,
  height = 200,
  notEnough = "Not enough data for this selection.",
  ariaLabel = "Field coverage over time",
}: {
  data: CoverageTrendResponse;
  height?: number;
  notEnough?: string;
  ariaLabel?: string;
}) {
  const { data, layout, enough } = useMemo(() => {
    const { months, share } = resp;
    if (months.length < 2) return { data: [] as Data[], layout: {} as Partial<Layout>, enough: false };
    const x = months.map(monthDate);
    const y = share.map((s) => s * 100);
    const last = y[y.length - 1];
    const data: Data[] = [
      {
        type: "scatter",
        mode: "lines",
        x,
        y,
        line: { color: PC.teal, width: 2 },
        fill: "tozeroy",
        fillcolor: "rgba(52,89,97,0.08)",
        hovertemplate: "%{y:.0f}% coverage<extra></extra>",
      },
    ];
    const layout: Partial<Layout> = {
      margin: { l: 40, r: 44, t: 8, b: 28 },
      xaxis: { type: "date", tickformat: "%Y", hoverformat: "%b %Y" },
      yaxis: { ticksuffix: "%", range: [0, 100] },
      annotations: [
        {
          x: `${resp.months[resp.months.length - 1]}-01`,
          y: last,
          yref: "y" as const,
          text: `<b>${Math.round(last)}%</b>`,
          showarrow: false,
          font: { color: PC.teal, size: 12 },
          xanchor: "left" as const,
          xshift: 6,
        },
      ],
    };
    return { data, layout, enough: true };
  }, [resp]);

  if (!enough) {
    return (
      <div className="flex items-center justify-center text-[0.85rem] text-ink-faint" style={{ height }}>
        {notEnough}
      </div>
    );
  }

  return <PlotlyFigure data={data} layout={layout} height={height} ariaLabel={ariaLabel} />;
}
