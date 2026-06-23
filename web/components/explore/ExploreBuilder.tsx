"use client";

import { useEffect, useState } from "react";
import { RemoteFigure } from "@/components/RemoteFigure";
import { Select } from "@/components/Select";
import { api } from "@/lib/api";
import { ALL_GEO, ALL_IND, ALL_OCC, type Option } from "@/lib/options";
import { useFilters } from "@/lib/useFilters";
import { useI18n } from "@/lib/i18n/provider";
import type { FigJSON } from "@/lib/types";

// The public "Build a chart" tab. The reader picks one breakdown + one measure +
// a year window; scope (region / occupation / industry) is reused from the shared
// FilterSpine (the URL). Every change re-fetches /api/explore/figure and swaps the
// chart in place. The backend owns correctness — its three gates (axis / data /
// sample) return a friendly message figure — so this component never has to
// reason about empty or incoherent combinations.

type Dim = "province" | "occupation" | "industry" | "time";
type Measure = "postings" | "share" | "yoy" | "two_year" | "wage";

const DIMS: Dim[] = ["province", "occupation", "industry", "time"];
const MEASURES: Measure[] = ["postings", "share", "yoy", "two_year", "wage"];

const yearRange = (lo: number, hi: number): number[] => {
  const out: number[] = [];
  for (let y = lo; y <= hi; y++) out.push(y);
  return out;
};

// CSV of the figure's first trace (bar: category→value; line: month→value). The
// gate figures carry no trace, so the button is disabled for them.
function downloadCsv(fig: FigJSON, filename: string) {
  const tr = (fig.data?.[0] ?? {}) as { x?: unknown[]; y?: unknown[] };
  if (!tr.x || !tr.y) return;
  const esc = (c: unknown) => `"${String(c ?? "").replace(/"/g, '""')}"`;
  const rows: unknown[][] = [["x", "y"], ...tr.x.map((x, i) => [x, tr.y![i]])];
  const csv = rows.map((r) => r.map(esc).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExploreBuilder({ minYear, maxYear }: { minYear: number; maxYear: number }) {
  const { locale, t } = useI18n();
  const b = t.explore.builder;
  const { filters } = useFilters();

  const [dim, setDim] = useState<Dim>("occupation");
  const [measure, setMeasure] = useState<Measure>("postings");
  const [startYear, setStartYear] = useState(minYear);
  const [endYear, setEndYear] = useState(maxYear);
  const [fig, setFig] = useState<FigJSON | null>(null);
  const [loading, setLoading] = useState(true);

  const geo = filters.geo ?? ALL_GEO;
  const occ = filters.occ ?? ALL_OCC;
  const ind = filters.ind ?? ALL_IND;

  // Axis gate (mirrors the backend): breaking down by a dimension already pinned
  // to a single scope value is incoherent. We drop those dims from the picker and
  // fall back to "over time" without forgetting the reader's earlier choice.
  const dimDisabled: Record<Dim, boolean> = {
    province: geo !== ALL_GEO,
    occupation: occ !== ALL_OCC,
    industry: ind !== ALL_IND,
    time: false,
  };
  const effectiveDim: Dim = dimDisabled[dim] ? "time" : dim;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void api
      .exploreFigure(
        {
          dim: effectiveDim,
          measure,
          geo: filters.geo,
          occ: filters.occ,
          ind: filters.ind,
          start_year: startYear,
          end_year: endYear,
        },
        locale,
      )
      .then((f) => {
        if (!cancelled) {
          setFig(f);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [effectiveDim, measure, startYear, endYear, filters.geo, filters.occ, filters.ind, locale]);

  const dimOptions: Option[] = DIMS.filter((d) => !dimDisabled[d]).map((d) => ({ value: d, label: b.dims[d] }));
  const measureOptions: Option[] = MEASURES.map((m) => ({ value: m, label: b.measures[m] }));

  const yearSelectCls =
    "num rounded border border-card-border bg-surface-alt px-2 py-2 text-[0.9rem] font-bold text-navy outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange";
  const hasTrace = Boolean((fig?.data?.[0] as { x?: unknown[] } | undefined)?.x);

  return (
    <div className="flex flex-col gap-5">
      <p className="max-w-3xl text-[0.86rem] leading-relaxed text-ink-soft">{b.intro}</p>

      <div className="card card-pad grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
        <Select
          id="explore-dim"
          label={b.dimLabel}
          value={effectiveDim}
          options={dimOptions}
          onChange={(v) => setDim(v as Dim)}
        />
        <Select
          id="explore-measure"
          label={b.measureLabel}
          value={measure}
          options={measureOptions}
          onChange={(v) => setMeasure(v as Measure)}
        />
        <div className="flex flex-col gap-1">
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.05em] text-ink-faint">{b.from}</span>
          <div className="flex items-center gap-1.5">
            <select
              aria-label={b.from}
              className={yearSelectCls}
              value={startYear}
              onChange={(e) => setStartYear(Math.min(+e.target.value, endYear))}
            >
              {yearRange(minYear, maxYear).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <span className="text-[0.78rem] text-ink-faint">{b.to}</span>
            <select
              aria-label={b.to}
              className={yearSelectCls}
              value={endYear}
              onChange={(e) => setEndYear(Math.max(+e.target.value, startYear))}
            >
              {yearRange(minYear, maxYear).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <figure className="card card-pad flex flex-col">
        <div className="mb-3 flex items-center justify-end">
          <button
            type="button"
            disabled={!hasTrace}
            onClick={() => fig && downloadCsv(fig, `explore-${effectiveDim}-${measure}.csv`)}
            className="control border border-card-border px-3 py-1.5 text-[0.72rem] font-bold uppercase tracking-[0.02em] text-ink-soft transition-colors enabled:hover:border-orange enabled:hover:text-orange disabled:opacity-40"
          >
            {b.download}
          </button>
        </div>
        <div className={`min-w-0 flex-1 transition-opacity duration-200 ${loading ? "opacity-50" : ""}`}>
          <RemoteFigure fig={fig} height={460} ariaLabel={b.aria} />
        </div>
      </figure>
    </div>
  );
}
