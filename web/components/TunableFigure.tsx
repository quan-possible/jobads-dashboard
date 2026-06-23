"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Figure } from "@/components/Figure";
import { RemoteFigure } from "@/components/RemoteFigure";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n/provider";
import type { FigJSON } from "@/lib/types";

// A year-anchored chart made general. It is the same figure-bridge chart, but the
// Figure's actions slot carries an inline year picker; changing the years re-fetches
// the chart from /api/figure with base_year/end_year and swaps it in place. The
// curated chart stays descriptive and designed — the reader just isn't locked to a
// single comparison window. (No global filter bar: the control is intrinsic to a
// chart that is *about* comparing years.)

const range = (lo: number, hi: number): number[] => {
  const out: number[] = [];
  for (let y = lo; y <= hi; y++) out.push(y);
  return out;
};

export function TunableFigure({
  chartId,
  initialFig,
  mode,
  minYear,
  maxYear,
  defaultBaseYear,
  defaultEndYear,
  eyebrow,
  title,
  asOf,
  note,
  ariaLabel,
  height,
}: {
  chartId: string;
  initialFig: FigJSON | null;
  mode: "base" | "baseEnd";
  minYear: number;
  maxYear: number;
  defaultBaseYear: number;
  defaultEndYear?: number;
  eyebrow?: string;
  title: ReactNode;
  asOf?: string;
  note?: ReactNode;
  ariaLabel: string;
  height?: number;
}) {
  const { locale, t } = useI18n();
  const yc = t.common.yearControl;
  const [baseYear, setBaseYear] = useState(defaultBaseYear);
  const [endYear, setEndYear] = useState(defaultEndYear ?? maxYear);
  const [fig, setFig] = useState<FigJSON | null>(initialFig);
  const [loading, setLoading] = useState(false);
  const firstRun = useRef(true);

  useEffect(() => {
    // The server already rendered the default window; only re-fetch on a change.
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    let cancelled = false;
    setLoading(true);
    const extra: Record<string, number> =
      mode === "baseEnd" ? { base_year: baseYear, end_year: endYear } : { base_year: baseYear };
    void api.figureSafe(chartId, locale, extra).then((f) => {
      if (!cancelled) {
        setFig(f);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [chartId, locale, mode, baseYear, endYear]);

  const selectCls =
    "num rounded border border-card-border bg-surface-alt px-1.5 py-0.5 text-[0.72rem] font-bold text-ink-soft outline-none focus:border-brand";
  const labelCls = "text-[0.7rem] uppercase tracking-[0.03em] text-ink-faint";

  const picker =
    mode === "base" ? (
      <div className="flex items-center gap-1.5" aria-label={yc.aria}>
        <span className={labelCls}>{yc.base}</span>
        <select className={selectCls} value={baseYear} onChange={(e) => setBaseYear(+e.target.value)}>
          {range(minYear, maxYear - 1).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    ) : (
      <div className="flex items-center gap-1.5" aria-label={yc.aria}>
        <span className={labelCls}>{yc.from}</span>
        <select
          className={selectCls}
          value={baseYear}
          onChange={(e) => setBaseYear(Math.min(+e.target.value, endYear - 1))}
        >
          {range(minYear, maxYear - 1).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <span className="text-[0.7rem] text-ink-faint">{yc.to}</span>
        <select
          className={selectCls}
          value={endYear}
          onChange={(e) => setEndYear(Math.max(+e.target.value, baseYear + 1))}
        >
          {range(minYear + 1, maxYear).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    );

  return (
    <Figure eyebrow={eyebrow} title={title} asOf={asOf} note={note} actions={picker}>
      <div className={`transition-opacity duration-200 ${loading ? "opacity-50" : ""}`}>
        <RemoteFigure fig={fig} height={height} ariaLabel={ariaLabel} />
      </div>
    </Figure>
  );
}
