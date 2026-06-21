"use client";

import * as Plot from "@observablehq/plot";
import { useCallback } from "react";
import { fmtMonth } from "@/lib/format";
import { baseStyle, C, monthDate } from "@/lib/plotTheme";
import type { SeriesPoint } from "@/lib/types";
import { PlotChart } from "./PlotChart";

// Indexed posting-demand series. Jan-2019 = 100 baseline drawn as a reference
// rule so the reader sees demand relative to the pre-pandemic norm.

export function DemandChart({ series, height = 300 }: { series: SeriesPoint[]; height?: number }) {
  const data = series
    .filter((p) => p.index !== null)
    .map((p) => ({ date: monthDate(p.month), index: p.index as number, postings: p.postings, month: p.month }));

  const render = useCallback(
    (width: number) =>
      Plot.plot({
        width,
        height,
        marginLeft: 40,
        marginRight: 16,
        marginTop: 18,
        marginBottom: 30,
        style: baseStyle,
        x: { type: "utc", label: null, ticks: width < 520 ? 4 : 7, tickFormat: "%Y" },
        y: {
          label: null,
          grid: true,
          domain: [0, Math.max(120, ...data.map((d) => d.index)) * 1.04],
          ticks: 5,
        },
        marks: [
          Plot.areaY(data, { x: "date", y: "index", fill: C.orange, fillOpacity: 0.1, curve: "monotone-x" }),
          Plot.ruleY([100], { stroke: C.navy, strokeDasharray: "3,4", strokeOpacity: 0.55 }),
          Plot.text([{ x: data[0]?.date, y: 100 }], {
            text: ["2019 = 100"],
            frameAnchor: "left",
            dx: 2,
            dy: -7,
            fill: C.navy,
            fontWeight: 700,
            fontSize: 10,
            opacity: 0.7,
          }),
          Plot.lineY(data, { x: "date", y: "index", stroke: C.orange, strokeWidth: 2, curve: "monotone-x" }),
          Plot.ruleX(
            data,
            Plot.pointerX({ x: "date", stroke: C.navy, strokeOpacity: 0.25, strokeWidth: 1 }),
          ),
          Plot.dot(
            data,
            Plot.pointerX({ x: "date", y: "index", fill: C.orange, stroke: "white", strokeWidth: 1.5, r: 4 }),
          ),
          Plot.tip(
            data,
            Plot.pointerX({
              x: "date",
              y: "index",
              fill: "white",
              stroke: C.grid,
              title: (d: { month: string; index: number; postings: number }) =>
                `${fmtMonth(d.month)}\nIndex ${Math.round(d.index)}  ·  ${d.postings.toLocaleString("en-CA")} postings`,
            }),
          ),
        ],
      }) as SVGSVGElement & { remove: () => void },
    [data, height],
  );

  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center text-[0.85rem] text-ink-faint" style={{ height }}>
        Not enough data for this selection.
      </div>
    );
  }

  return <PlotChart render={render} height={height} ariaLabel="Posting demand index over time, January 2019 equals 100" />;
}
