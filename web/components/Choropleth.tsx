"use client";

import { geoConicConformal, geoPath } from "d3-geo";
import { scaleQuantile } from "d3-scale";
import type { FeatureCollection, Geometry } from "geojson";
import { useEffect, useMemo, useRef, useState } from "react";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import { fmtCompact, fmtInt } from "@/lib/format";
import type { GeoItem } from "@/lib/types";

type ProvProps = { code: string; name: string };
const RAMP = ["#efe2d2", "#e3bd92", "#d59257", "#cf7730", "#a4531b"];
const NO_DATA = "#ece4da";

function measureLabel(measure: string): string {
  if (measure === "per10k") return "postings per 10k labour force";
  if (measure === "lq") return "location quotient (1.0 = national average)";
  return "active postings";
}

function formatValue(v: number | null, measure: string): string {
  if (v === null || v === undefined) return "—";
  if (measure === "count") return fmtCompact(v);
  if (measure === "lq") return v.toFixed(2);
  return fmtInt(v);
}

export function Choropleth({
  items,
  measure,
  height = 460,
}: {
  items: GeoItem[];
  measure: string;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [topo, setTopo] = useState<Topology | null>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<{ x: number; y: number; item: GeoItem | null; name: string } | null>(null);

  useEffect(() => {
    fetch("/geo/canada_provinces.topo.json")
      .then((r) => r.json())
      .then(setTopo)
      .catch(() => setTopo(null));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth || 600);
    const ro = new ResizeObserver((e) => {
      const w = Math.floor(e[0]?.contentRect.width ?? 0);
      if (w > 0) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const byCode = useMemo(() => new Map(items.map((i) => [i.code, i])), [items]);

  const built = useMemo(() => {
    if (!topo || width === 0) return null;
    const obj = topo.objects.data as GeometryCollection<ProvProps>;
    const fc = feature(topo, obj) as FeatureCollection<Geometry, ProvProps>;
    const projection = geoConicConformal()
      .rotate([98, 0])
      .center([0, 62])
      .parallels([50, 70])
      .fitExtent([[12, 12], [width - 12, height - 12]], fc);
    const path = geoPath(projection);
    const values = items.map((i) => i.value).filter((v): v is number => v !== null && v !== undefined);
    const scale = scaleQuantile<string>().domain(values).range(RAMP);
    return { fc, path, scale };
  }, [topo, width, height, items]);

  const colorFor = (code: string): string => {
    const item = byCode.get(code);
    if (!item || item.value === null || item.value === undefined || !built) return NO_DATA;
    return built.scale(item.value);
  };

  return (
    <div className="relative">
      <div ref={ref} style={{ width: "100%", minHeight: height }}>
        {built && (
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={`Choropleth of Canadian provinces by ${measureLabel(measure)}`}
            onMouseLeave={() => setHover(null)}
          >
            {built.fc.features.map((f) => {
              const code = f.properties.code;
              const item = byCode.get(code) ?? null;
              const d = built.path(f) ?? undefined;
              return (
                <path
                  key={code}
                  d={d}
                  fill={colorFor(code)}
                  stroke="#fbf8f5"
                  strokeWidth={0.8}
                  className="cursor-pointer transition-[fill-opacity] hover:fill-opacity-80"
                  onMouseMove={(e) => {
                    const rect = ref.current?.getBoundingClientRect();
                    setHover({
                      x: e.clientX - (rect?.left ?? 0),
                      y: e.clientY - (rect?.top ?? 0),
                      item,
                      name: f.properties.name,
                    });
                  }}
                />
              );
            })}
          </svg>
        )}
      </div>

      {hover && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+10px)] whitespace-nowrap border border-card-border bg-surface px-3 py-2 text-[0.8rem] shadow-pop"
          style={{ left: hover.x, top: hover.y, boxShadow: "var(--shadow-pop)" }}
        >
          <div className="font-bold text-navy-deep">{hover.name}</div>
          {hover.item && hover.item.value !== null ? (
            <div className="num text-ink-soft">
              {formatValue(hover.item.value, measure)} · {measureLabel(measure)}
              {hover.item.count !== null && <span className="block text-ink-faint">{fmtInt(hover.item.count)} postings</span>}
            </div>
          ) : (
            <div className="text-ink-faint">No postings recorded</div>
          )}
        </div>
      )}

      {/* Legend */}
      {built && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-[0.68rem] font-bold uppercase tracking-[0.04em] text-ink-faint">
            {measureLabel(measure)}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[0.7rem] text-ink-faint">low</span>
            {RAMP.map((c) => (
              <span key={c} className="h-3 w-6" style={{ background: c }} />
            ))}
            <span className="text-[0.7rem] text-ink-faint">high</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-6" style={{ background: NO_DATA }} />
            <span className="text-[0.7rem] text-ink-faint">no data</span>
          </div>
        </div>
      )}
    </div>
  );
}
