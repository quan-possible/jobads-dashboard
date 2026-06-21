"use client";

import { useMemo } from "react";
import type { Data, Layout } from "plotly.js";
import { PC } from "@/lib/plotly/theme";
import type { RankItem } from "@/lib/types";
import { PlotlyFigure } from "./PlotlyFigure";

// One diverging horizontal bar replacing the twin +/− mover cards. Growth and
// decline share a single honest scale anchored at zero; green/red carry the
// direction. NOC group names run long, so each label sits ABOVE its bar (a left
// gutter would crush the bars), and the value is labelled at the bar end.

const MAX_LABEL = 52;
const short = (s: string) => (s.length > MAX_LABEL ? `${s.slice(0, MAX_LABEL - 1)}…` : s);

export function DivergingMovers({
  items,
  emptyHint,
  rowHeight = 46,
}: {
  items: RankItem[];
  emptyHint?: string;
  rowHeight?: number;
}) {
  const ranked = useMemo(
    () =>
      items
        .filter((i) => i.yoy !== null && i.yoy !== undefined)
        // ascending → largest growth at the TOP (Plotly draws index 0 at the bottom)
        .sort((a, b) => (a.yoy as number) - (b.yoy as number)),
    [items],
  );

  const { data, layout } = useMemo(() => {
    const y = ranked.map((_, i) => i);
    const x = ranked.map((i) => i.yoy as number);
    const colors = x.map((v) => (v >= 0 ? PC.growth : PC.decline));
    const valueText = x.map((v) => `${v >= 0 ? "+" : "−"}${Math.abs(Math.round(v))}%`);
    const maxAbs = Math.max(5, ...x.map((v) => Math.abs(v)));

    const data: Data[] = [
      {
        type: "bar",
        orientation: "h",
        x,
        y,
        width: 0.5,
        marker: { color: colors },
        text: valueText,
        textposition: "outside",
        textfont: { size: 11, color: PC.ink },
        cliponaxis: false,
        customdata: ranked.map((i) => i.label),
        hovertemplate: "%{customdata}: %{x:+.1f}% YoY<extra></extra>",
      },
    ];

    const labelAnnotations = ranked.map((i, idx) => ({
      xref: "paper" as const,
      x: 0,
      xanchor: "left" as const,
      y: idx,
      yref: "y" as const,
      yshift: 13,
      text: short(i.label),
      showarrow: false,
      font: { size: 11, color: PC.ink },
      align: "left" as const,
    }));

    const layout: Partial<Layout> = {
      margin: { l: 6, r: 38, t: 8, b: 22 },
      bargap: 0.5,
      xaxis: {
        range: [-maxAbs * 1.35, maxAbs * 1.35],
        zeroline: true,
        zerolinecolor: PC.baseline,
        zerolinewidth: 1,
        showticklabels: false,
      },
      yaxis: {
        showticklabels: false,
        showgrid: false,
        zeroline: false,
        range: [-0.6, ranked.length - 0.4],
        fixedrange: true,
      },
      annotations: labelAnnotations,
    };

    return { data, layout };
  }, [ranked]);

  if (ranked.length === 0) {
    return <p className="py-6 text-center text-[0.85rem] text-ink-faint">{emptyHint ?? "No data for this selection."}</p>;
  }

  const height = ranked.length * rowHeight + 26;
  return (
    <PlotlyFigure
      data={data}
      layout={layout}
      height={height}
      ariaLabel="Biggest year-over-year movers, growth and decline on one scale"
    />
  );
}
