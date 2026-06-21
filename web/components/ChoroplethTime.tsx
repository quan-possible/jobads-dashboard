"use client";

import { useEffect, useRef, useState } from "react";
import type { FeatureCollection, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import { PC, aclmrWarm, baseConfig } from "@/lib/plotly/theme";
import type { GeoTrendResponse } from "@/lib/types";

// Time-scrubbed choropleth: the province map animated month by month via native
// Plotly frames + a slider and a play button (the gapminder mechanism). Colour
// scale is fixed across all months (global max) so the long-run growth in posted
// demand reads as the map brightening. Opens on the latest month; never autoplays
// (honours reduced-motion — the user drives the scrubber).

type ProvProps = { code: string; name: string };
const NO_DATA = "#ece4da";

export function ChoroplethTime({
  data: trend,
  height = 460,
  playLabel = "▶ Play",
  monthPrefix = "Month: ",
  ariaLabel = "Animated choropleth of posting demand by province over time",
}: {
  data: GeoTrendResponse;
  height?: number;
  playLabel?: string;
  monthPrefix?: string;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const el = ref.current;
    if (!el || !topo || trend.months.length < 2) return;
    let disposed = false;
    let plotly: typeof import("@/lib/plotly").default | undefined;
    let ro: ResizeObserver | undefined;

    const obj = topo.objects.data as GeometryCollection<ProvProps>;
    const fc = feature(topo, obj) as FeatureCollection<Geometry, ProvProps>;
    const allCodes = fc.features.map((f) => f.properties.code);
    const nameByCode = new Map(fc.features.map((f) => [f.properties.code, f.properties.name]));

    const globalMax = Math.max(
      1,
      ...trend.values.flat().filter((v): v is number => v !== null && v !== undefined),
    );
    const colorscale = PC.sequential.map((c, i) => [i / (PC.sequential.length - 1), c]) as [number, string][];
    const lastIdx = trend.months.length - 1;

    const dataTrace = (monthIdx: number) => ({
      type: "choropleth",
      geojson: fc,
      featureidkey: "properties.code",
      locations: trend.codes,
      z: trend.values[monthIdx],
      zmin: 0,
      zmax: globalMax,
      colorscale,
      marker: { line: { color: PC.ground, width: 0.8 } },
      colorbar: { thickness: 10, len: 0.9, outlinewidth: 0, tickfont: { size: 10, color: PC.inkFaint } },
      customdata: trend.codes.map((c) => nameByCode.get(c) ?? c),
      hovertemplate: "<b>%{customdata}</b><br>%{z:,} postings<extra></extra>",
    });

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
      hoverinfo: "skip",
    };

    const frames = trend.months.map((m, i) => ({ name: m, data: [base, dataTrace(i)] }));

    const layout = {
      height,
      template: aclmrWarm,
      margin: { l: 0, r: 0, t: 0, b: 0 },
      geo: {
        fitbounds: "locations",
        visible: false,
        bgcolor: "rgba(0,0,0,0)",
        projection: { type: "conic conformal", rotation: { lon: -96, lat: 0 }, parallels: [49, 77] },
      },
      sliders: [
        {
          active: lastIdx,
          x: 0,
          y: 0,
          len: 0.86,
          pad: { t: 4, b: 4 },
          currentvalue: { prefix: monthPrefix, font: { size: 11, color: PC.inkFaint } },
          font: { size: 9, color: PC.inkFaint },
          steps: trend.months.map((m) => ({
            label: m,
            method: "animate",
            args: [[m], { mode: "immediate", frame: { duration: 0, redraw: true }, transition: { duration: 0 } }],
          })),
        },
      ],
      updatemenus: [
        {
          type: "buttons",
          showactive: false,
          x: 0.92,
          y: 0,
          pad: { t: 4 },
          buttons: [
            {
              label: playLabel,
              method: "animate",
              args: [null, { fromcurrent: true, frame: { duration: 350, redraw: true }, transition: { duration: 0 } }],
            },
          ],
        },
      ],
    };

    void import("@/lib/plotly").then((mod) => {
      if (disposed || !ref.current) return;
      plotly = mod.default;
      // The partial-bundle types don't model choropleth's geojson/featureidkey
      // or frames, so cast through unknown at the Plotly boundary.
      const newPlot = plotly.newPlot as unknown as (
        el: HTMLElement, data: unknown, layout: unknown, config: unknown,
      ) => Promise<unknown>;
      const addFrames = plotly.addFrames as unknown as (el: HTMLElement, frames: unknown) => Promise<unknown>;
      void newPlot(el, [base, dataTrace(lastIdx)], layout, { ...baseConfig }).then(() => {
        if (!disposed) void addFrames(el, frames);
      });
      ro = new ResizeObserver(() => {
        if (plotly && ref.current) plotly.Plots.resize(ref.current);
      });
      ro.observe(el);
    });

    return () => {
      disposed = true;
      ro?.disconnect();
      if (plotly && el) plotly.purge(el);
    };
  }, [topo, trend, height, playLabel, monthPrefix]);

  if (trend.months.length < 2) {
    return <div style={{ height }} className="flex items-center justify-center text-[0.85rem] text-ink-faint">No history for this selection.</div>;
  }

  return <div ref={ref} style={{ height, width: "100%" }} role="img" aria-label={ariaLabel} />;
}
