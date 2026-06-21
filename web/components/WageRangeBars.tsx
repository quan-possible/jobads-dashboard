"use client";

import { useMemo } from "react";
import type { Data, Layout } from "plotly.js";
import { PC } from "@/lib/plotly/theme";
import { fmtCompact } from "@/lib/format";
import type { WageItem } from "@/lib/types";
import { PlotlyFigure } from "./PlotlyFigure";

// Wage ranges as a Plotly dumbbell: a teal p25–p75 bar with a navy median dot,
// one row per group, sorted by median. Four numbers per row (p25, median, p75,
// n) on hover plus a tidy median column at the right. Gated groups (n below the
// minimum sample) are listed beneath, muted — never plotted.

const MAX_LABEL = 30;
const short = (s: string) => (s.length > MAX_LABEL ? `${s.slice(0, MAX_LABEL - 1)}…` : s);

export function WageRangeBars({ items, rowHeight = 30 }: { items: WageItem[]; rowHeight?: number }) {
  const nonGated = useMemo(
    () =>
      items
        .filter((i) => !i.gated && i.p25 !== null && i.median !== null && i.p75 !== null)
        // ascending → highest median at the TOP (Plotly draws first category at the bottom)
        .sort((a, b) => (a.median ?? 0) - (b.median ?? 0)),
    [items],
  );
  const gated = useMemo(() => items.filter((i) => i.gated), [items]);

  const { data, layout } = useMemo(() => {
    if (nonGated.length === 0) return { data: [] as Data[], layout: {} as Partial<Layout> };

    const labels = nonGated.map((i) => short(i.label));
    const lineX: (number | null)[] = [];
    const lineY: (string | null)[] = [];
    nonGated.forEach((i) => {
      lineX.push(i.p25 as number, i.p75 as number, null);
      lineY.push(short(i.label), short(i.label), null);
    });

    const mk = (key: "p25" | "median" | "p75", color: string, size: number, symbol: string): Data => ({
      type: "scatter",
      mode: "markers",
      x: nonGated.map((i) => i[key] as number),
      y: labels,
      marker: { color, size, symbol, line: { color: PC.ground, width: 1 } },
      customdata: nonGated.map((i) => fmtCompact(i.n)),
      hovertemplate: `${key === "p25" ? "P25" : key === "p75" ? "P75" : "Median"} $%{x:.2f}<extra></extra>`,
    });

    const data: Data[] = [
      {
        type: "scatter",
        mode: "lines",
        x: lineX,
        y: lineY,
        line: { color: PC.teal, width: 3 },
        opacity: 0.5,
        hoverinfo: "skip",
      },
      mk("p25", PC.teal, 9, "line-ns-open"),
      mk("p75", PC.teal, 9, "line-ns-open"),
      mk("median", PC.baseline, 11, "circle"),
    ];

    const layout: Partial<Layout> = {
      hovermode: "y unified",
      margin: { l: 8, r: 56, t: 8, b: 28 },
      xaxis: { tickprefix: "$", rangemode: "tozero", showgrid: true, gridcolor: PC.grid },
      yaxis: { type: "category", automargin: true, ticksuffix: "  " },
      annotations: nonGated.map((i) => ({
        xref: "paper" as const,
        x: 1,
        xanchor: "left" as const,
        y: short(i.label),
        yref: "y" as const,
        text: `<b>$${Math.round(i.median as number)}</b>`,
        showarrow: false,
        font: { color: PC.baseline, size: 11 },
        xshift: 6,
      })),
    };

    return { data, layout };
  }, [nonGated]);

  if (nonGated.length === 0 && gated.length === 0) {
    return <p className="py-6 text-center text-[0.85rem] text-ink-faint">No wage data for this selection.</p>;
  }

  const height = Math.max(120, nonGated.length * rowHeight + 36);

  return (
    <div>
      {nonGated.length > 0 && (
        <PlotlyFigure
          data={data}
          layout={layout}
          height={height}
          ariaLabel={`Hourly wage ranges for ${nonGated.length} groups, p25 to p75 with median, sorted by median`}
        />
      )}
      {gated.length > 0 && (
        <ul className="mt-3 flex flex-col gap-y-1.5 border-t border-hairline pt-3">
          {gated.map((item) => (
            <li key={item.code} className="flex items-center justify-between gap-4">
              <span className="truncate text-[0.82rem] text-ink-faint" title={item.label}>
                {item.label}
              </span>
              <span className="text-[0.78rem] italic text-ink-faint">
                insufficient sample · n={fmtCompact(item.n)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
