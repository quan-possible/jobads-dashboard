"use client";

import { useMemo, useState } from "react";
import type { Data, Layout } from "plotly.js";
import { PC, monthDate } from "@/lib/plotly/theme";
import { fmtInt, fmtPct } from "@/lib/format";
import type { SeriesPoint } from "@/lib/types";
import { PlotlyFigure } from "./PlotlyFigure";

// The Explorer — the dashboard's centerpiece time view. One indexed/level/YoY
// series shown as a line, bars, or an exact-value table. The metric toggle adds
// density (researchers want the level and the YoY, not just the index); the view
// toggle gives a quick read (line), a per-month read (bar), and an a11y/exact
// fallback (table). Orange marks the signature index series; level/YoY use teal
// and semantic green/red so the brand accent stays reserved.

type View = "line" | "bar" | "table";
type Metric = "index" | "postings" | "yoy";

export type ExplorerLabels = {
  viewLine: string;
  viewBar: string;
  viewTable: string;
  metricIndex: string;
  metricPostings: string;
  metricYoy: string;
  colMonth: string;
  colIndex: string;
  colPostings: string;
  colYoy: string;
  baseline: string;
  notEnough: string;
};

const DEFAULT_LABELS: ExplorerLabels = {
  viewLine: "Line",
  viewBar: "Bar",
  viewTable: "Table",
  metricIndex: "Index",
  metricPostings: "Postings",
  metricYoy: "YoY",
  colMonth: "Month",
  colIndex: "Index",
  colPostings: "Postings",
  colYoy: "YoY",
  baseline: "2019 = 100",
  notEnough: "Not enough data for this selection.",
};

function Seg<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className="inline-flex border border-card-border bg-surface">
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={[
              "px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-[0.02em] transition-colors",
              i > 0 ? "border-l border-card-border" : "",
              active ? "bg-navy-deep text-ink-invert" : "text-ink-soft hover:text-navy",
            ].join(" ")}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function ExplorerChart({
  series,
  height = 320,
  labels = DEFAULT_LABELS,
  ariaLabel = "Posting demand over time",
  initialMetric = "index",
}: {
  series: SeriesPoint[];
  height?: number;
  labels?: ExplorerLabels;
  ariaLabel?: string;
  initialMetric?: Metric;
}) {
  const [view, setView] = useState<View>("line");
  const [metric, setMetric] = useState<Metric>(initialMetric);

  const pts = useMemo(
    () => series.filter((p) => (metric === "index" ? p.index !== null : metric === "yoy" ? p.yoy !== null : true)),
    [series, metric],
  );

  const color = metric === "index" ? PC.primary : metric === "yoy" ? PC.teal : PC.teal;

  const { data, layout } = useMemo(() => {
    if (pts.length < 2) return { data: [] as Data[], layout: {} as Partial<Layout> };

    const valueOf = (p: SeriesPoint): number =>
      metric === "index" ? (p.index as number) : metric === "yoy" ? (p.yoy as number) : p.postings;

    const x = pts.map((p) => monthDate(p.month));
    const y = pts.map(valueOf);
    const last = pts[pts.length - 1];
    const lastV = valueOf(last);

    const hover =
      metric === "index"
        ? "Index %{y:.0f}  ·  %{customdata:,} postings<extra></extra>"
        : metric === "yoy"
          ? "%{y:+.1f}% vs a year earlier<extra></extra>"
          : "%{y:,} active postings<extra></extra>";

    const data: Data[] =
      view === "bar"
        ? [
            {
              type: "bar",
              x,
              y,
              marker: {
                color:
                  metric === "yoy"
                    ? y.map((v) => (v >= 0 ? PC.growth : PC.decline))
                    : color,
              },
              customdata: pts.map((p) => p.postings),
              hovertemplate: hover,
            },
          ]
        : [
            {
              type: "scatter",
              mode: "lines",
              x,
              y,
              line: { color, width: 2.2, shape: "spline", smoothing: 0.5 },
              fill: metric === "index" ? "tozeroy" : "none",
              fillcolor: "rgba(207,119,48,0.10)",
              customdata: pts.map((p) => p.postings),
              hovertemplate: hover,
            },
          ];

    const endLabel =
      metric === "index"
        ? `<b>${Math.round(lastV)}</b>`
        : metric === "yoy"
          ? `<b>${lastV >= 0 ? "+" : "−"}${Math.abs(Math.round(lastV))}%</b>`
          : `<b>${fmtInt(lastV)}</b>`;

    const layout: Partial<Layout> = {
      bargap: 0.15,
      xaxis: { type: "date", tickformat: "%Y", hoverformat: "%b %Y" },
      yaxis:
        metric === "index"
          ? { range: [0, Math.max(120, ...y) * 1.05] }
          : metric === "yoy"
            ? { ticksuffix: "%", zeroline: true, zerolinecolor: PC.baseline, zerolinewidth: 1 }
            : { rangemode: "tozero" },
      shapes:
        metric === "index"
          ? [
              {
                type: "line",
                xref: "paper",
                x0: 0,
                x1: 1,
                yref: "y",
                y0: 100,
                y1: 100,
                line: { color: PC.baseline, width: 1, dash: "dot" },
                opacity: 0.55,
              },
            ]
          : [],
      annotations: [
        ...(metric === "index"
          ? [
              {
                xref: "paper" as const,
                x: 0,
                y: 100,
                yref: "y" as const,
                text: labels.baseline,
                showarrow: false,
                font: { color: PC.baseline, size: 10 },
                xanchor: "left" as const,
                yanchor: "bottom" as const,
                opacity: 0.75,
              },
            ]
          : []),
        ...(view === "line"
          ? [
              {
                x: `${last.month}-01`,
                y: lastV,
                yref: "y" as const,
                text: endLabel,
                showarrow: false,
                font: { color, size: 13 },
                xanchor: "left" as const,
                yanchor: "middle" as const,
                xshift: 6,
              },
            ]
          : []),
      ],
    };

    return { data, layout };
  }, [pts, view, metric, color, labels.baseline]);

  const metricToggle = (
    <div className="flex flex-wrap items-center gap-2">
      <Seg<Metric>
        ariaLabel="Choose metric"
        value={metric}
        onChange={setMetric}
        options={[
          { value: "index", label: labels.metricIndex },
          { value: "postings", label: labels.metricPostings },
          { value: "yoy", label: labels.metricYoy },
        ]}
      />
      <Seg<View>
        ariaLabel="Choose view"
        value={view}
        onChange={setView}
        options={[
          { value: "line", label: labels.viewLine },
          { value: "bar", label: labels.viewBar },
          { value: "table", label: labels.viewTable },
        ]}
      />
    </div>
  );

  if (pts.length < 2) {
    return (
      <div>
        <div className="mb-3 flex justify-end">{metricToggle}</div>
        <div className="flex items-center justify-center text-[0.85rem] text-ink-faint" style={{ height }}>
          {labels.notEnough}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">{metricToggle}</div>
      {view === "table" ? (
        <div className="overflow-auto" style={{ maxHeight: height }}>
          <table className="w-full text-[0.82rem] tabular-nums">
            <thead className="sticky top-0 bg-surface">
              <tr className="border-b border-card-border text-left text-[0.7rem] font-bold uppercase tracking-[0.03em] text-ink-faint">
                <th className="py-1.5 pr-3 font-bold">{labels.colMonth}</th>
                <th className="py-1.5 pr-3 text-right font-bold">{labels.colIndex}</th>
                <th className="py-1.5 pr-3 text-right font-bold">{labels.colPostings}</th>
                <th className="py-1.5 text-right font-bold">{labels.colYoy}</th>
              </tr>
            </thead>
            <tbody>
              {[...pts].reverse().map((p) => (
                <tr key={p.month} className="border-b border-hairline last:border-0">
                  <td className="py-1.5 pr-3 text-ink-soft">{p.month}</td>
                  <td className="py-1.5 pr-3 text-right">{p.index !== null ? Math.round(p.index) : "—"}</td>
                  <td className="py-1.5 pr-3 text-right">{fmtInt(p.postings)}</td>
                  <td
                    className="py-1.5 text-right"
                    style={{ color: p.yoy === null ? undefined : p.yoy >= 0 ? PC.growth : PC.decline }}
                  >
                    {p.yoy !== null ? fmtPct(p.yoy, { sign: true }) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <PlotlyFigure data={data} layout={layout} height={height} ariaLabel={ariaLabel} />
      )}
    </div>
  );
}
