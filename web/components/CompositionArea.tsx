"use client";

import { useMemo } from "react";
import type { Data, Layout } from "plotly.js";
import { PC, monthDate } from "@/lib/plotly/theme";
import type { CompositionResponse } from "@/lib/types";
import { PlotlyFigure } from "./PlotlyFigure";

// Composition over time as a 100% stacked area: how the mix of broad groups
// shifts month to month. Cool data colorway (orange stays reserved for brand),
// "Other" in slate, direct right-edge labels instead of a legend.

const BAND_COLORS = PC.colorway; // 7 cool hues
const OTHER = "#8b8178";

export function CompositionArea({
  data: resp,
  height = 320,
  notEnough = "Not enough data for this selection.",
  ariaLabel = "Composition of demand over time",
}: {
  data: CompositionResponse;
  height?: number;
  notEnough?: string;
  ariaLabel?: string;
}) {
  const { data, layout, enough } = useMemo(() => {
    const { months, groups } = resp;
    if (months.length < 2 || groups.length === 0) {
      return { data: [] as Data[], layout: {} as Partial<Layout>, enough: false };
    }
    const x = months.map(monthDate);
    // Draw "Other" first (bottom of stack), then groups largest→smallest on top.
    const ordered = [...groups].sort((a, b) => {
      if (a.code === "__other__") return -1;
      if (b.code === "__other__") return 1;
      const al = a.values[a.values.length - 1];
      const bl = b.values[b.values.length - 1];
      return al - bl;
    });

    const traces: Data[] = ordered.map((g, i) => {
      const isOther = g.code === "__other__";
      const color = isOther ? OTHER : BAND_COLORS[i % BAND_COLORS.length];
      return {
        type: "scatter",
        mode: "lines",
        x,
        y: g.values.map((v) => v * 100),
        stackgroup: "one",
        groupnorm: "percent",
        name: g.label,
        line: { width: 0.5, color },
        fillcolor: color,
        hovertemplate: `${g.label}: %{y:.1f}%<extra></extra>`,
      };
    });

    // Right-edge labels at each band's vertical midpoint (last month).
    let cum = 0;
    const annotations = ordered.map((g) => {
      const last = g.values[g.values.length - 1] * 100;
      const mid = cum + last / 2;
      cum += last;
      return {
        xref: "paper" as const,
        x: 1,
        xanchor: "left" as const,
        y: mid,
        yref: "y" as const,
        text: g.label.length > 22 ? `${g.label.slice(0, 21)}…` : g.label,
        showarrow: false,
        font: { size: 10, color: PC.ink },
        xshift: 6,
        opacity: last < 4 ? 0 : 1, // hide labels for slivers
      };
    });

    const layout: Partial<Layout> = {
      margin: { l: 36, r: 150, t: 8, b: 28 },
      xaxis: { type: "date", tickformat: "%Y", hoverformat: "%b %Y" },
      yaxis: { ticksuffix: "%", range: [0, 100], showgrid: false },
      hovermode: "x unified",
      annotations,
    };

    return { data: traces, layout, enough: true };
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
