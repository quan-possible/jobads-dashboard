"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AuthError, fetchExploreOverview, fetchPostings } from "@/lib/explore";
import { fmtCompact, fmtInt, fmtMonth, fmtPct, fmtWage } from "@/lib/format";
import { ALL_GEO, GEO_OPTIONS, IND_OPTIONS, OCC_OPTIONS, labelFor } from "@/lib/options";
import { useI18n } from "@/lib/i18n/provider";
import type { Locale } from "@/lib/i18n/locale";
import type { OverviewResponse, PostingRow, PostingsResponse } from "@/lib/types";
import { useFilters } from "@/lib/useFilters";
import { useExploreLock } from "./lockContext";
import { PostingDrawer } from "./PostingDrawer";
import styles from "./explore.module.css";

const SLOW_THRESHOLD_MS = 20_000;
const PAGE = 25;

function shortScope(value: string): string {
  return value.includes(" | ") ? value.split(" | ")[1] : value;
}

function rowWage(row: PostingRow, locale: Locale): string {
  if (row.wage_hourly != null) return fmtWage(row.wage_hourly, locale);
  if (row.wage_min != null && row.wage_max != null) return `${fmtWage(row.wage_min, locale)}–${fmtWage(row.wage_max, locale)}`;
  if (row.wage_min != null) return `${fmtWage(row.wage_min, locale)}+`;
  return "—";
}

export function ExploreView() {
  const { filters } = useFilters();
  const { t, locale } = useI18n();
  const lock = useExploreLock();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState<PostingsResponse | null>(null);
  const [resolvedKey, setResolvedKey] = useState<string | null>(null);
  const [slowKey, setSlowKey] = useState<string | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const tableTop = useRef<HTMLDivElement>(null);

  const lockRef = useRef(lock);
  useEffect(() => {
    lockRef.current = lock;
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(timer);
  }, [q]);

  const scopeKey = `${filters.geo ?? ""}|${filters.occ ?? ""}|${filters.ind ?? ""}|${debouncedQ}`;
  const [previousScope, setPreviousScope] = useState(scopeKey);
  if (scopeKey !== previousScope) {
    setPreviousScope(scopeKey);
    setOffset(0);
  }

  const requestKey = [filters.geo ?? "", filters.occ ?? "", filters.ind ?? "", debouncedQ, offset, fetchKey].join("|");
  const loading = resolvedKey !== requestKey;
  const errorForRequest = error?.key === requestKey ? error.message : null;
  const slow = loading && slowKey === requestKey;
  const displayData = resolvedKey === requestKey ? data : null;
  const rows = displayData?.items ?? [];
  const total = displayData?.total ?? 0;
  const from = total === 0 ? 0 : offset + 1;
  const to = Math.min(offset + PAGE, total);
  const loadingErrorMsg = t.explore.loadingError;

  useEffect(() => {
    let cancelled = false;
    const slowTimer = setTimeout(() => {
      if (!cancelled) setSlowKey(requestKey);
    }, SLOW_THRESHOLD_MS);

    fetchPostings({
      geo: filters.geo,
      occ: filters.occ,
      ind: filters.ind,
      q: debouncedQ || undefined,
      limit: PAGE,
      offset,
    })
      .then((next) => {
        if (cancelled) return;
        setData(next);
        setResolvedKey(requestKey);
      })
      .catch((reason) => {
        if (cancelled) return;
        if (reason instanceof AuthError) {
          lockRef.current();
          return;
        }
        setData(null);
        setError({ key: requestKey, message: reason?.message ?? loadingErrorMsg });
        setResolvedKey(requestKey);
      })
      .finally(() => {
        clearTimeout(slowTimer);
      });

    return () => {
      cancelled = true;
      clearTimeout(slowTimer);
    };
  }, [filters.geo, filters.occ, filters.ind, debouncedQ, offset, fetchKey, loadingErrorMsg, requestKey]);

  useEffect(() => {
    let cancelled = false;
    fetchExploreOverview(filters, locale)
      .then((next) => { if (!cancelled) setOverview(next); })
      .catch(() => { if (!cancelled) setOverview(null); });
    return () => { cancelled = true; };
  }, [filters, locale]);

  const scopeSummary = useMemo(() => {
    const parts: string[] = [];
    if (filters.geo) parts.push(labelFor(GEO_OPTIONS, filters.geo, locale));
    if (filters.occ) parts.push(labelFor(OCC_OPTIONS, filters.occ, locale));
    if (filters.ind) parts.push(labelFor(IND_OPTIONS, filters.ind, locale));
    return parts.length ? parts.join(" · ") : labelFor(GEO_OPTIONS, ALL_GEO, locale);
  }, [filters.geo, filters.occ, filters.ind, locale]);

  const goPage = (next: number) => {
    setOffset(next);
    tableTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const renderLoadingRows = () => Array.from({ length: 8 }, (_, i) => (
    <tr key={i} aria-hidden="true"><td colSpan={7}><div className={styles.skeletonRow} /></td></tr>
  ));

  return (
    <div className="flex flex-col gap-4">
      <div className={styles.lookupControls} ref={tableTop}>
        <form
          className={styles.searchForm}
          onSubmit={(event) => {
            event.preventDefault();
            setDebouncedQ(q.trim());
          }}
          role="search"
        >
          <label className={styles.searchField}>
            <span className="sr-only">{t.explore.searchPlaceholder}</span>
            <svg aria-hidden viewBox="0 0 16 16" className={styles.searchIcon} fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="7" cy="7" r="4.5" />
              <path d="M11 11l3 3" strokeLinecap="square" />
            </svg>
            <input
              type="search"
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder={t.explore.searchPlaceholder}
              className={styles.searchInput}
            />
          </label>
          <button type="submit" className={styles.searchButton} aria-label={t.common.search}>{t.common.search}</button>
        </form>
        <div className={styles.scopeSummary} aria-live="polite">
          {loading && !displayData ? (
            slow ? t.explore.loadingSlowHint : t.common.loading
          ) : (
            <><strong>{fmtInt(total, locale)}</strong> {t.explore.postings}<br />{scopeSummary}</>
          )}
        </div>
      </div>

      <div className={styles.mobileKpis} aria-label={t.explore.mobileKpis.matches}>
        <div className={styles.mobileKpi}>
          <span>{t.explore.mobileKpis.matches}</span>
          <strong>{loading && !displayData ? "—" : fmtCompact(total, locale)}</strong>
        </div>
        <div className={styles.mobileKpi}>
          <span>{t.explore.mobileKpis.medianWage}</span>
          <strong>{fmtWage(overview?.kpis.median_wage, locale)}</strong>
        </div>
        <div className={styles.mobileKpi}>
          <span>{t.explore.mobileKpis.yoyChange}</span>
          <strong className={(overview?.kpis.active_yoy_pct ?? 0) < 0 ? styles.mobileKpiNegative : styles.mobileKpiPositive}>
            {fmtPct(overview?.kpis.active_yoy_pct, { sign: true, locale })}
          </strong>
        </div>
        <div className={styles.mobileKpi}>
          <span>{t.explore.mobileKpis.wageCoverage}</span>
          <strong className={styles.mobileKpiTeal}>
            {overview?.kpis.wage_n != null && overview.kpis.active_postings
              ? fmtPct((overview.kpis.wage_n / overview.kpis.active_postings) * 100, { locale })
              : "—"}
          </strong>
        </div>
      </div>

      <section className={styles.resultsCard} aria-labelledby="explore-results-heading">
        <div className={styles.resultsHeader}>
          <h2 id="explore-results-heading" className={styles.resultsHeading}>{t.explore.colTitle}</h2>
          <span className={styles.resultsCount}>{total > 0 ? `${fmtInt(from, locale)}–${fmtInt(to, locale)} ${t.common.of} ${fmtInt(total, locale)}` : "—"}</span>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.resultsTable}>
            <thead>
              <tr>
                <th className={styles.idCell}>{t.explore.colPosted}</th>
                <th>{t.explore.colTitle}</th>
                <th>{t.explore.colEmployer}</th>
                <th className={styles.regionCell}>{t.explore.colRegion}</th>
                <th>{t.explore.colOccupation}</th>
                <th className={styles.wageCell}>{t.explore.colWage}</th>
                <th className={styles.dateCell}>{t.explore.colType}</th>
              </tr>
            </thead>
            <tbody>
              {errorForRequest && (
                <tr><td colSpan={7} className={styles.errorState}>
                  {errorForRequest}
                  <br />
                  <button type="button" className={styles.retryButton} onClick={() => setFetchKey((key) => key + 1)}>{t.explore.retryLoad}</button>
                </td></tr>
              )}
              {!errorForRequest && loading && !displayData && renderLoadingRows()}
              {!errorForRequest && !loading && rows.length === 0 && (
                <tr><td colSpan={7} className={styles.emptyState}>{t.explore.emptyRows}</td></tr>
              )}
              {!errorForRequest && rows.map((row) => (
                <tr key={row.posting_id} className={activeId === row.posting_id ? styles.selectedRow : undefined} onClick={() => setActiveId(row.posting_id)}>
                  <td className={styles.idCell}>{row.date_found ? fmtMonth(row.date_found, locale) : fmtMonth(row.month, locale)}</td>
                  <td className={styles.titleCell}>
                    <button
                      type="button"
                      className={styles.titleButton}
                      onClick={(event) => { event.stopPropagation(); setActiveId(row.posting_id); }}
                      aria-label={row.job_title ? `${t.explore.openPosting} — ${row.job_title}` : t.explore.openPosting}
                    >{row.job_title ?? "—"}</button>
                  </td>
                  <td>{row.employer ?? "—"}</td>
                  <td className={styles.regionCell}>{row.province ?? "—"}</td>
                  <td>{row.occupation ? shortScope(row.occupation) : "—"}</td>
                  <td className={styles.wageCell}>{rowWage(row, locale)}</td>
                  <td className={styles.dateCell}>{row.employment_type ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.mobileResults}>
          {errorForRequest && <div className={styles.errorState}>{errorForRequest}<br /><button type="button" className={styles.retryButton} onClick={() => setFetchKey((key) => key + 1)}>{t.explore.retryLoad}</button></div>}
          {!errorForRequest && loading && !displayData && Array.from({ length: 6 }, (_, i) => <div key={i} className={styles.skeletonRow} aria-hidden />)}
          {!errorForRequest && !loading && rows.length === 0 && <div className={styles.emptyState}>{t.explore.emptyRows}</div>}
          {!errorForRequest && rows.map((row) => (
            <button key={row.posting_id} type="button" className={`${styles.mobileRow} ${activeId === row.posting_id ? styles.mobileRowSelected : ""}`} onClick={() => setActiveId(row.posting_id)}>
              <span>
                <span className={styles.mobileTitle}>{row.job_title ?? "—"}</span>
                <span className={styles.mobileMeta}>{row.province ?? "—"}{row.employer ? ` · ${row.employer}` : ""}</span>
              </span>
              <span className={styles.mobileWage}>{rowWage(row, locale)}<span className={styles.mobileDate}>{row.date_found ? fmtMonth(row.date_found, locale) : fmtMonth(row.month, locale)}</span></span>
              <span className={styles.mobileArrow} aria-hidden>›</span>
            </button>
          ))}
        </div>
      </section>

      <div className={styles.pager}>
        <span className={styles.pagerSummary}>{total > 0 ? `${fmtInt(from, locale)}–${fmtInt(to, locale)} ${t.common.of} ${fmtInt(total, locale)}` : "—"}</span>
        <div className={styles.pagerButtons}>
          <button type="button" className={styles.pagerButton} onClick={() => goPage(Math.max(0, offset - PAGE))} disabled={offset === 0 || loading}>← {t.common.prev}</button>
          <button type="button" className={styles.pagerButton} onClick={() => goPage(offset + PAGE)} disabled={to >= total || loading}>{t.common.next} →</button>
        </div>
      </div>

      <PostingDrawer id={activeId} onClose={() => setActiveId(null)} />
    </div>
  );
}
