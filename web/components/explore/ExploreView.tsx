"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AuthError, fetchPostings } from "@/lib/explore";
import { fmtInt, fmtMonth, fmtWage } from "@/lib/format";
import { labelFor } from "@/lib/options";
import { GEO_OPTIONS, IND_OPTIONS, OCC_OPTIONS } from "@/lib/options";
import { useI18n } from "@/lib/i18n/provider";
import type { Locale } from "@/lib/i18n/locale";
import type { PostingRow, PostingsResponse } from "@/lib/types";
import { useFilters } from "@/lib/useFilters";
import { PostingDrawer } from "./PostingDrawer";

const PAGE = 25;

function shortScope(occ: string): string {
  return occ.includes(" | ") ? occ.split(" | ")[1] : occ;
}

function rowWage(r: PostingRow, locale: Locale): string {
  if (r.wage_hourly != null) return `${fmtWage(r.wage_hourly, locale)}`;
  if (r.wage_min != null && r.wage_max != null) return `${fmtWage(r.wage_min, locale)}–${fmtWage(r.wage_max, locale)}`;
  if (r.wage_min != null) return `${fmtWage(r.wage_min, locale)}+`;
  return "—";
}

export function ExploreView({ onSessionExpired }: { onSessionExpired?: () => void }) {
  const { filters } = useFilters();
  const { t, locale } = useI18n();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<PostingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const tableTop = useRef<HTMLDivElement>(null);

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  // Scope comes from the shared FilterSpine (URL). Reset paging to page 0 the
  // moment the scope changes, during render — so the fetch effect runs exactly
  // once at offset 0, never firing a stale-offset request first (S26).
  const scopeKey = `${filters.geo ?? ""}|${filters.occ ?? ""}|${filters.ind ?? ""}|${debouncedQ}`;
  const [prevScope, setPrevScope] = useState(scopeKey);
  if (scopeKey !== prevScope) {
    setPrevScope(scopeKey);
    setOffset(0);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPostings({
      geo: filters.geo,
      occ: filters.occ,
      ind: filters.ind,
      q: debouncedQ || undefined,
      limit: PAGE,
      offset,
    })
      .then((d) => !cancelled && setData(d))
      .catch((e) => {
        if (cancelled) return;
        // Session expired mid-use → hand back to the gate for re-login (S27).
        if (e instanceof AuthError) {
          onSessionExpired?.();
          return;
        }
        setError(e?.message ?? "Could not load postings.");
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filters.geo, filters.occ, filters.ind, debouncedQ, offset, onSessionExpired]);

  const total = data?.total ?? 0;
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + PAGE, total);
  const rows = data?.items ?? [];

  const scopeSummary = useMemo(() => {
    const parts: string[] = [];
    if (filters.geo) parts.push(labelFor(GEO_OPTIONS, filters.geo));
    if (filters.occ) parts.push(labelFor(OCC_OPTIONS, filters.occ));
    if (filters.ind) parts.push(labelFor(IND_OPTIONS, filters.ind));
    return parts.length ? parts.join(" · ") : "All Canada";
  }, [filters.geo, filters.occ, filters.ind]);

  const goPage = (next: number) => {
    setOffset(next);
    tableTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3" ref={tableTop}>
        <label className="relative flex-1 sm:max-w-md">
          <span className="sr-only">{t.explore.searchPlaceholder}</span>
          <svg
            aria-hidden
            viewBox="0 0 16 16"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <circle cx="7" cy="7" r="4.5" />
            <path d="M11 11l3 3" strokeLinecap="square" />
          </svg>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.explore.searchPlaceholder}
            className="control w-full border border-card-border bg-surface py-2 pl-9 pr-3 text-[0.9rem] focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange"
          />
        </label>
        <div className="num text-[0.78rem] text-ink-soft">
          {loading && !data ? (
            t.common.loading
          ) : (
            <>
              <span className="font-bold text-navy-deep">{fmtInt(total)}</span> {t.explore.postings} · {scopeSummary}
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-[0.85rem]">
            <thead>
              <tr className="border-b border-card-border bg-surface-alt text-[0.62rem] uppercase tracking-[0.05em] text-ink-faint">
                <th className="px-4 py-2.5 font-bold">{t.explore.colPosted}</th>
                <th className="px-4 py-2.5 font-bold">{t.explore.colTitle}</th>
                <th className="hidden px-4 py-2.5 font-bold md:table-cell">{t.explore.colEmployer}</th>
                <th className="px-4 py-2.5 font-bold">{t.explore.colRegion}</th>
                <th className="hidden px-4 py-2.5 font-bold lg:table-cell">{t.explore.colOccupation}</th>
                <th className="px-4 py-2.5 text-right font-bold">{t.explore.colWage}</th>
                <th className="hidden px-4 py-2.5 font-bold sm:table-cell">{t.explore.colType}</th>
              </tr>
            </thead>
            <tbody>
              {error && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[0.85rem] text-neg">
                    {error}
                  </td>
                </tr>
              )}
              {!error && rows.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[0.85rem] text-ink-faint">
                    {t.explore.emptyRows}
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                // The row stays a real table row (semantics intact for AT). Mouse
                // users can click anywhere; keyboard/AT users activate via the
                // real <button> in the title cell (S31).
                <tr
                  key={r.posting_id}
                  onClick={() => setActiveId(r.posting_id)}
                  className="cursor-pointer border-b border-hairline transition-colors last:border-0 hover:bg-orange/[0.04] focus-within:bg-orange/[0.06]"
                >
                  <td className="num whitespace-nowrap px-4 py-3 text-ink-soft">{r.date_found ? fmtMonth(r.date_found, locale) : fmtMonth(r.month, locale)}</td>
                  <td className="max-w-[22ch] px-4 py-3 font-bold text-navy-deep">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveId(r.posting_id);
                      }}
                      aria-label={`Open ${r.job_title ?? "posting"}`}
                      className="line-clamp-2 text-left hover:underline focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange"
                    >
                      {r.job_title ?? "—"}
                    </button>
                  </td>
                  <td className="hidden max-w-[18ch] truncate px-4 py-3 text-ink-soft md:table-cell">{r.employer ?? "—"}</td>
                  <td className="num whitespace-nowrap px-4 py-3 text-ink-soft">{r.province ?? "—"}</td>
                  <td className="hidden max-w-[18ch] truncate px-4 py-3 text-ink-soft lg:table-cell">{r.occupation ? shortScope(r.occupation) : "—"}</td>
                  <td className="num whitespace-nowrap px-4 py-3 text-right text-navy">{rowWage(r, locale)}</td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-ink-soft sm:table-cell">{r.employment_type ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-3">
        <div className="num text-[0.76rem] text-ink-soft">
          {total > 0 ? (
            <>
              {fmtInt(from)}–{fmtInt(to)} {t.common.of} {fmtInt(total)}
            </>
          ) : (
            "—"
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goPage(Math.max(0, offset - PAGE))}
            disabled={offset === 0 || loading}
            className="control border border-card-border px-3 py-1.5 text-[0.74rem] font-bold uppercase tracking-[0.02em] text-ink-soft transition-colors enabled:hover:border-orange enabled:hover:text-orange disabled:opacity-40"
          >
            ← {t.common.prev}
          </button>
          <button
            type="button"
            onClick={() => goPage(offset + PAGE)}
            disabled={to >= total || loading}
            className="control border border-card-border px-3 py-1.5 text-[0.74rem] font-bold uppercase tracking-[0.02em] text-ink-soft transition-colors enabled:hover:border-orange enabled:hover:text-orange disabled:opacity-40"
          >
            {t.common.next} →
          </button>
        </div>
      </div>

      <PostingDrawer id={activeId} onClose={() => setActiveId(null)} />
    </div>
  );
}
