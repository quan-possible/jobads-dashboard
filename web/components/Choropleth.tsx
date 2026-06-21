"use client";

import { useEffect, useMemo, useState } from "react";
import type { Data, Layout } from "plotly.js";
import type { FeatureCollection, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import { fmtCompact, fmtInt } from "@/lib/format";
import { PC } from "@/lib/plotly/theme";
import type { GeoItem } from "@/lib/types";
import { PlotlyFigure } from "./PlotlyFigure";

// Provincial choropleth, now drawn by Plotly (replacing the hand-rolled d3 +
// quantile SVG). Two traces over our provinces GeoJSON: a gray base so no-data
// provinces read as "no data", and the warm sequential ramp on top for the
// measured provinces. A custom HTML legend keeps the editorial look; Plotly's
// colorbar stays off.

type ProvProps = { code: string; name: string };

export type ChoroLabels = {
  per10k: string;
  lq: string;
  count: string;
  low: string;
  high: string;
  noData: string;
  postings: string;
  noPostings: string;
};

const DEFAULT_LABELS: ChoroLabels = {
  per10k: "postings per 10k labour force",
  lq: "location quotient (1.0 = national average)",
  count: "active postings",
  low: "low",
  high: "high",
  noData: "no data",
  postings: "postings",
  noPostings: "No postings recorded",
};

const NO_DATA = "#ece4da";
const SEQ = PC.sequential;
const COLORSCALE = SEQ.map((c, i) => [i / (SEQ.length - 1), c] as [number, string]);

function measureLabel(measure: string, labels: ChoroLabels): string {
  if (measure === "per10k") return labels.per10k;
  if (measure === "lq") return labels.lq;
  return labels.count;
}

function valueFmt(v: number | null, measure: string): string {
  if (v === null || v === undefined) return "—";
  if (measure === "count") return fmtCompact(v);
  if (measure === "lq") return v.toFixed(2);
  return fmtInt(v);
}

export function Choropleth({
  items,
  measure,
  height = 460,
  labels = DEFAULT_LABELS,
}: {
  items: GeoItem[];
  measure: string;
  height?: number;
  labels?: ChoroLabels;
}) {
  const [topo, setTopo] = useState<Topology | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/geo/canada_provinces.topo.json")
      .then((r) => r.json())
      .then((t) => alive && setTopo(t))
      .catch(() => alive && setTopo(null));
    return () => {
      alive = false;
    };
  }, []);

  const fc = useMemo<FeatureCollection<Geometry, ProvProps> | null>(() => {
    if (!topo) return null;
    const obj = topo.objects.data as GeometryCollection<ProvProps>;
    return feature(topo, obj) as FeatureCollection<Geometry, ProvProps>;
  }, [topo]);

  const allCodes = useMemo(
    () => (fc ? fc.features.map((f) => f.properties.code) : []),
    [fc],
  );
  const nameByCode = useMemo(
    () => new Map((fc?.features ?? []).map((f) => [f.properties.code, f.properties.name])),
    [fc],
  );

  const { data, layout } = useMemo(() => {
    if (!fc) return { data: [] as Data[], layout: {} as Partial<Layout> };

    const measured = items.filter((i) => i.value !== null && i.value !== undefined);
    const values = measured.map((i) => i.value as number);
    const ml = measureLabel(measure, labels);

    const base = {
      type: "choropleth",
      geojson: fc,
      featureidkey: "properties.code",
      locations: allCodes,
      z: allCodes.map(() => 0),
      colorscale: [
        [0, NO_DATA],
        [1, NO_DATA],
      ],
      showscale: false,
      marker: { line: { color: PC.ground, width: 0.8 } },
      text: allCodes.map((c) => nameByCode.get(c) ?? c),
      hovertemplate: `<b>%{text}</b><br>${labels.noPostings}<extra></extra>`,
    };

    const dataTrace = {
      type: "choropleth",
      geojson: fc,
      featureidkey: "properties.code",
      locations: measured.map((i) => i.code),
      z: values,
      zmin: values.length ? Math.min(...values) : 0,
      zmax: values.length ? Math.max(...values) : 1,
      colorscale: COLORSCALE,
      showscale: false,
      marker: { line: { color: PC.ground, width: 0.8 } },
      customdata: measured.map((i) => [
        nameByCode.get(i.code) ?? i.label,
        `${valueFmt(i.value, measure)} · ${ml}`,
        i.count !== null && i.count !== undefined ? `${fmtInt(i.count)} ${labels.postings}` : "—",
      ]),
      hovertemplate:
        "<b>%{customdata[0]}</b><br>%{customdata[1]}<br>%{customdata[2]}<extra></extra>",
    };

    const layout: Partial<Layout> = {
      margin: { l: 0, r: 0, t: 0, b: 0 },
      geo: {
        fitbounds: "locations",
        visible: false,
        bgcolor: "rgba(0,0,0,0)",
        projection: { type: "conic conformal", rotation: { lon: -96, lat: 0 }, parallels: [49, 77] },
      },
    } as Partial<Layout>;

    return { data: [base, dataTrace] as unknown as Data[], layout };
  }, [fc, items, measure, labels, allCodes, nameByCode]);

  if (!fc) {
    return <div style={{ height }} className="animate-pulse rounded-sm bg-surface-alt/60" aria-hidden />;
  }

  const ml = measureLabel(measure, labels);

  return (
    <div>
      <PlotlyFigure
        data={data}
        layout={layout}
        height={height}
        ariaLabel={`Choropleth of Canadian provinces by ${ml}`}
      />
      {/* Editorial legend (Plotly colorbar stays off) */}
      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-[0.68rem] font-bold uppercase tracking-[0.04em] text-ink-faint">{ml}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[0.7rem] text-ink-faint">{labels.low}</span>
          {SEQ.map((c) => (
            <span key={c} className="h-3 w-6" style={{ background: c }} />
          ))}
          <span className="text-[0.7rem] text-ink-faint">{labels.high}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-6" style={{ background: NO_DATA }} />
          <span className="text-[0.7rem] text-ink-faint">{labels.noData}</span>
        </div>
      </div>
    </div>
  );
}
