"use client";

import { useMemo } from "react";
import type { Data, Layout } from "plotly.js";
import { PC } from "@/lib/plotly/theme";
import type { SeriesPoint } from "@/lib/types";
import { PlotlyFigure } from "./PlotlyFigure";

// Seasonality at a glance: a month × year heatmap of posting volume, normalised
// to EACH year's own average so the seasonal shape (spring hiring stripe, the
// 2020 break) shows through the long-run growth trend. Values are a ratio —
// 1.00 = that year's average month — so the colour means the same thing in
// 2016 and 2026. Warm sequential ramp; exact ratio + count on hover.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function SeasonalityHeatmap({
  series,
  height = 300,
  monthLabels = MONTHS,
  ariaLabel = "Seasonality heatmap of posting volume by month and year",
}: {
  series: SeriesPoint[];
  height?: number;
  monthLabels?: readonly string[];
  ariaLabel?: string;
}) {
  const { data, layout, enough } = useMemo(() => {
    // Group postings by year → month.
    const byYear = new Map<number, Map<number, number>>();
    for (const p of series) {
      const [y, m] = p.month.split("-").map(Number);
      if (!y || !m) continue;
      if (!byYear.has(y)) byYear.set(y, new Map());
      byYear.get(y)!.set(m, p.postings);
    }
    const years = [...byYear.keys()].sort((a, b) => a - b);
    if (years.length < 2) return { data: [] as Data[], layout: {} as Partial<Layout>, enough: false };

    // z[year][month] = postings / that year's mean (ratio). null where missing.
    const z: (number | null)[][] = [];
    const counts: (number | null)[][] = [];
    for (const y of years) {
      const row = byYear.get(y)!;
      const vals = [...row.values()];
      const mean = vals.reduce((a, b) => a + b, 0) / Math.max(1, vals.length);
      const zr: (number | null)[] = [];
      const cr: (number | null)[] = [];
      for (let m = 1; m <= 12; m++) {
        const v = row.get(m);
        zr.push(v === undefined ? null : mean > 0 ? v / mean : null);
        cr.push(v === undefined ? null : v);
      }
      z.push(zr);
      counts.push(cr);
    }

    const data: Data[] = [
      {
        type: "heatmap",
        z,
        x: [...monthLabels],
        y: years.map(String),
        customdata: counts,
        colorscale: PC.sequential.map((c, i) => [i / (PC.sequential.length - 1), c]) as [number, string][],
        hovertemplate: "%{y} %{x}<br>%{z:.2f}× year avg · %{customdata:,} postings<extra></extra>",
        xgap: 2,
        ygap: 2,
        showscale: true,
        colorbar: {
          thickness: 10,
          len: 0.9,
          outlinewidth: 0,
          tickfont: { size: 10, color: PC.inkFaint },
          tickvals: [0.8, 1.0, 1.2],
        },
        hoverongaps: false,
      },
    ];

    const layout: Partial<Layout> = {
      margin: { l: 40, r: 8, t: 8, b: 28 },
      xaxis: { type: "category", showgrid: false, ticks: "", side: "bottom" },
      yaxis: { type: "category", showgrid: false, ticks: "", autorange: "reversed" },
    };

    return { data, layout, enough: true };
  }, [series, monthLabels]);

  if (!enough) {
    return (
      <div className="flex items-center justify-center text-[0.85rem] text-ink-faint" style={{ height }}>
        Not enough history for this selection.
      </div>
    );
  }

  return <PlotlyFigure data={data} layout={layout} height={height} ariaLabel={ariaLabel} />;
}
