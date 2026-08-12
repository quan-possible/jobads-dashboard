"use client";

import { useEffect, useRef, useState } from "react";
import { RemoteFigure } from "@/components/RemoteFigure";
import { Select } from "@/components/Select";
import { AuthError, fetchExploreFigure } from "@/lib/explore";
import { ALL_GEO, ALL_IND, ALL_OCC, type Option } from "@/lib/options";
import { useFilters } from "@/lib/useFilters";
import { useI18n } from "@/lib/i18n/provider";
import type { FigJSON } from "@/lib/types";
import { useExploreLock } from "./lockContext";
import styles from "./explore.module.css";

// The team-access "Build a chart" tab (rendered only inside an unlocked
// AuthGate). The reader picks one breakdown + one measure + a year window; scope
// (region / occupation / industry) is reused from the shared FilterSpine (the
// URL). Every change re-fetches /api/explore/figure (credentialed) and swaps the
// chart in place. The backend owns correctness — its three gates (axis / data /
// sample) return a friendly message figure — so this component never has to
// reason about empty or incoherent combinations. A mid-session 401 re-locks the
// gate via ExploreLockContext.

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
// colX/colY are the localized breakdown/measure labels for the header row (S20).
function downloadCsv(fig: FigJSON, filename: string, colX: string, colY: string) {
  const tr = (fig.data?.[0] ?? {}) as { x?: unknown[]; y?: unknown[] };
  if (!tr.x || !tr.y) return;
  const esc = (c: unknown) => `"${String(c ?? "").replace(/"/g, '""')}"`;
  const rows: unknown[][] = [[colX, colY], ...tr.x.map((x, i) => [x, tr.y![i]])];
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
  const lock = useExploreLock();
  // Kept in a ref so re-locking on a 401 never becomes a fetch-effect dependency.
  const lockRef = useRef(lock);
  useEffect(() => {
    lockRef.current = lock;
  });

  const [dim, setDim] = useState<Dim>("occupation");
  const [measure, setMeasure] = useState<Measure>("postings");
  const [startYear, setStartYear] = useState(minYear);
  const [endYear, setEndYear] = useState(maxYear);
  const [fig, setFig] = useState<FigJSON | null>(null);
  const [resolvedKey, setResolvedKey] = useState<string | null>(null);

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

  const requestKey = [effectiveDim, measure, startYear, endYear, filters.geo ?? "", filters.occ ?? "", filters.ind ?? "", locale].join("|");
  const loading = resolvedKey !== requestKey;

  useEffect(() => {
    let cancelled = false;
    void fetchExploreFigure({
      dim: effectiveDim,
      measure,
      geo: filters.geo,
      occ: filters.occ,
      ind: filters.ind,
      start_year: startYear,
      end_year: endYear,
      locale,
    })
      .then((f) => {
        if (!cancelled) {
          setFig(f);
          setResolvedKey(requestKey);
        }
      })
      .catch((e) => {
        if (cancelled) return;
        // Session expired mid-use → hand back to the gate for re-login.
        if (e instanceof AuthError) {
          lockRef.current();
          return;
        }
        // Any other failure (API down, etc.) degrades to the per-figure
        // "unavailable" fallback rather than blanking the tab.
        setFig(null);
        setResolvedKey(requestKey);
      });
    return () => {
      cancelled = true;
    };
  }, [effectiveDim, measure, startYear, endYear, filters.geo, filters.occ, filters.ind, locale, requestKey]);

  const dimOptions: Option[] = DIMS.filter((d) => !dimDisabled[d]).map((d) => ({ value: d, label: b.dims[d] }));
  const measureOptions: Option[] = MEASURES.map((m) => ({ value: m, label: b.measures[m] }));

  const hasTrace = Boolean((fig?.data?.[0] as { x?: unknown[] } | undefined)?.x);

  return (
    <div className="flex flex-col gap-5">
      <p className={styles.builderIntro}>{b.intro}</p>

      <div className={styles.builderControls}>
        <Select
          id="explore-dim"
          label={b.dimLabel}
          value={effectiveDim}
          options={dimOptions}
          onChange={(v) => setDim(v as Dim)}
          tone="dark"
        />
        <Select
          id="explore-measure"
          label={b.measureLabel}
          value={measure}
          options={measureOptions}
          onChange={(v) => setMeasure(v as Measure)}
          tone="dark"
        />
        <div className="flex flex-col gap-1">
          <span>{b.from}</span>
          <div className={styles.yearPair}>
            <select
              aria-label={b.from}
              className={styles.yearSelect}
              value={startYear}
              onChange={(e) => setStartYear(Math.min(+e.target.value, endYear))}
            >
              {yearRange(minYear, maxYear).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <span className={styles.yearConnector}>{b.to}</span>
            <select
              aria-label={b.to}
              className={styles.yearSelect}
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

      <figure className={styles.figureCard}>
        <div className={styles.figureHeader}>
          {/* Names what the chart shows + gives the <figure> an accessible name (U08). */}
          <figcaption className={styles.figureCaption}>
            {b.dims[effectiveDim]} · {b.measures[measure]} · {startYear}–{endYear}
          </figcaption>
          <button
            type="button"
            // Disable mid-refetch so the file can never disagree with the chart
            // it's drawn next to (U05).
            disabled={!hasTrace || loading}
            onClick={() =>
              fig &&
              downloadCsv(
                fig,
                `${t.explore.csvFilename}-${effectiveDim}-${measure}-${startYear}-${endYear}.csv`,
                b.dims[effectiveDim],
                b.measures[measure],
              )
            }
            className={styles.downloadButton}
          >
            {b.download}
          </button>
        </div>
        <div className={`${styles.figureContent} transition-opacity duration-200 ${loading ? "opacity-50" : ""}`}>
          <RemoteFigure fig={fig} height={460} ariaLabel={b.aria} loading={loading} />
        </div>
      </figure>
    </div>
  );
}
