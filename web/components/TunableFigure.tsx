"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Figure } from "@/components/Figure";
import { RemoteFigure } from "@/components/RemoteFigure";
import { fetchFigure } from "@/lib/explore";
import { useAuth } from "@/lib/auth/provider";
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
  const { authenticated } = useAuth();
  const yc = t.common.yearControl;
  const [baseYear, setBaseYear] = useState(defaultBaseYear);
  const [endYear, setEndYear] = useState(defaultEndYear ?? maxYear);
  const [fig, setFig] = useState<FigJSON | null>(initialFig);
  const [loading, setLoading] = useState(false);
  const firstRun = useRef(true);

  useEffect(() => {
    // The server already rendered the default window with the right (capped or
    // uncapped) view; only re-fetch on a change — a new year window, or auth
    // flipping (so the team view updates without a full reload). The client fetch
    // goes through the credentialed relative `/api` path and asks for `full` when
    // authenticated; the server still verifies the session.
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    let cancelled = false;
    setLoading(true);
    const extra: Record<string, number> =
      mode === "baseEnd" ? { base_year: baseYear, end_year: endYear } : { base_year: baseYear };
    void fetchFigure(chartId, locale, extra, authenticated).then((f) => {
      if (!cancelled) {
        setFig(f);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [chartId, locale, mode, baseYear, endYear, authenticated]);

  const selectCls =
    "control num min-h-8 border border-card-border bg-surface-alt px-1.5 py-0.5 t-caption font-bold text-navy focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange";
  const labelCls = "t-caption uppercase tracking-[0.03em] text-ink-faint";

  // Each <select> carries its own accessible name (the visible label spans are
  // decorative), and the pair is a labelled group so AT announces what the
  // comboboxes are for (S13).
  const picker =
    mode === "base" ? (
      <div className="flex flex-wrap items-center justify-end gap-1.5" role="group" aria-label={yc.aria}>
        <span className={labelCls} aria-hidden>{yc.base}</span>
        <select
          className={selectCls}
          aria-label={yc.base}
          value={baseYear}
          onChange={(e) => setBaseYear(+e.target.value)}
        >
          {range(minYear, maxYear - 1).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
    ) : (
      <div className="flex flex-wrap items-center justify-end gap-1.5" role="group" aria-label={yc.aria}>
        <span className={labelCls} aria-hidden>{yc.from}</span>
        <select
          className={selectCls}
          aria-label={yc.fromYear}
          value={baseYear}
          onChange={(e) => setBaseYear(Math.min(+e.target.value, endYear - 1))}
        >
          {range(minYear, maxYear - 1).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <span className="t-caption text-ink-faint" aria-hidden>{yc.to}</span>
        <select
          className={selectCls}
          aria-label={yc.toYear}
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
