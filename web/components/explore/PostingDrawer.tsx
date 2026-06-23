"use client";

import { useEffect, useRef, useState } from "react";
import { fetchPosting } from "@/lib/explore";
import { fmtMonth, fmtWage } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import type { Locale } from "@/lib/i18n/locale";
import type { PostingDetail } from "@/lib/types";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "" || value === "—") return null;
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="t-label font-bold uppercase tracking-[0.05em] text-ink-faint">{label}</dt>
      <dd className="t-body-sm text-navy-deep">{value}</dd>
    </div>
  );
}

function wageLine(d: PostingDetail, locale: Locale, perHour: string): string | null {
  if (d.wage_hourly != null) return `${fmtWage(d.wage_hourly, locale)}${perHour}`;
  if (d.wage_min != null || d.wage_max != null) {
    const lo = d.wage_min != null ? fmtWage(d.wage_min, locale) : "—";
    const hi = d.wage_max != null ? fmtWage(d.wage_max, locale) : "—";
    const unit = d.wage_unit ? ` ${d.wage_unit}` : "";
    return `${lo} – ${hi}${unit}`;
  }
  return null;
}

export function PostingDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { t, locale } = useI18n();
  const [detail, setDetail] = useState<PostingDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Clear the previous posting *during render* the moment the id changes, so a
  // reopen with a new id never paints the prior posting for a frame before the
  // fetch effect runs (S20).
  const [shownId, setShownId] = useState(id);
  if (id !== shownId) {
    setShownId(id);
    setDetail(null);
    setError(null);
  }
  const panelRef = useRef<HTMLElement>(null);
  // Keep the latest onClose without re-running the focus/scroll-lock effect on
  // every parent render (S37).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setDetail(null);
    fetchPosting(id)
      .then((d) => !cancelled && setDetail(d))
      .catch((e) => !cancelled && setError(e?.message ?? "Could not load this posting."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Modal behaviour: lock scroll, move focus into the dialog, trap Tab, and
  // restore focus to the trigger on close (S30). Depends only on `id` (S37).
  useEffect(() => {
    if (!id) return;
    const panel = panelRef.current;
    const prevFocused = document.activeElement as HTMLElement | null;

    const focusables = (): HTMLElement[] =>
      panel
        ? Array.from(
            panel.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])',
            ),
          ).filter((el) => el.offsetParent !== null)
        : [];

    // Move focus into the dialog (the close button, marked data-autofocus).
    (panel?.querySelector<HTMLElement>("[data-autofocus]") ?? panel)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prevFocused?.focus?.();
    };
  }, [id]);

  if (!id) return null;

  const wage = detail ? wageLine(detail, locale, t.explore.perHour) : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
      <button
        type="button"
        aria-label={t.common.close}
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-navy-deep/40 backdrop-blur-[1px]"
      />
      <aside
        ref={panelRef}
        tabIndex={-1}
        className="relative flex h-full w-full max-w-[560px] flex-col border-l border-card-border bg-surface shadow-pop outline-none animate-[drawerIn_220ms_ease-out]"
        style={{ boxShadow: "var(--shadow-pop)" }}
      >
        {/* gradient seam */}
        <span aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={{ background: "var(--gradient)" }} />

        <div className="flex items-start justify-between gap-4 border-b border-card-border px-6 py-4">
          <div className="min-w-0">
            <div className="eyebrow mb-1">{t.explore.drawerPosting}</div>
            <h2 id="drawer-title" className="text-[1.08rem] font-bold leading-snug text-navy-deep">
              {detail?.job_title ?? (loading ? t.common.loading : t.explore.drawerPosting)}
            </h2>
            {detail?.employer && <p className="mt-0.5 t-body-sm text-ink-soft">{detail.employer}</p>}
          </div>
          <button
            type="button"
            data-autofocus
            onClick={onClose}
            aria-label={t.common.close}
            className="control shrink-0 border border-card-border px-2.5 py-1.5 t-body font-bold leading-none text-ink-soft transition-colors hover:border-orange hover:text-orange focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {loading && <div className="py-10 text-center t-body-sm text-ink-faint">{t.explore.loadingPosting}</div>}
          {error && <div className="py-10 text-center t-body-sm text-neg">{error}</div>}

          {detail && (
            <div className="flex flex-col gap-6">
              {/* chips */}
              <div className="flex flex-wrap gap-1.5">
                {detail.province && (
                  <span className="border border-card-border bg-surface-alt px-2 py-1 t-caption font-bold text-navy">
                    {detail.province}
                    {detail.market ? ` · ${detail.market}` : ""}
                  </span>
                )}
                {detail.noc_code && (
                  <span className="border border-card-border bg-surface-alt px-2 py-1 t-caption text-ink-soft">
                    NOC {detail.noc_code}
                  </span>
                )}
                {detail.naics_code && (
                  <span className="border border-card-border bg-surface-alt px-2 py-1 t-caption text-ink-soft">
                    NAICS {detail.naics_code}
                  </span>
                )}
                {detail.remote_class && detail.remote_class !== "Not reported" && (
                  <span className="border border-orange/40 bg-orange/5 px-2 py-1 t-caption font-bold text-orange-deep">
                    {detail.remote_class}
                  </span>
                )}
              </div>

              <dl className="grid grid-cols-2 gap-x-5 gap-y-4">
                <Field label={t.explore.fPosted} value={detail.date_found ? fmtMonth(detail.date_found, locale) : null} />
                <Field label={t.explore.fRefMonth} value={fmtMonth(detail.month, locale)} />
                <Field label={t.explore.fWage} value={wage} />
                <Field label={t.explore.fEmployment} value={detail.employment_type} />
                <Field label={t.explore.fDuration} value={detail.duration} />
                <Field label={t.explore.fExperience} value={detail.experience} />
                <Field label={t.explore.fEducation} value={detail.education} />
                <Field label={t.explore.fLanguage} value={detail.primary_posting_language} />
                <Field label={t.explore.fOccupation} value={detail.noc_label} />
                <Field label={t.explore.fIndustry} value={detail.naics_label} />
              </dl>

              {detail.description_full ? (
                <div>
                  <div className="eyebrow mb-2 border-t border-hairline pt-4">{t.explore.descHeading}</div>
                  <p className="whitespace-pre-wrap t-body-sm leading-relaxed text-ink-soft">
                    {detail.description_full}
                  </p>
                  <p className="mt-4 t-caption italic leading-relaxed text-ink-faint">{t.explore.descNote}</p>
                </div>
              ) : (
                <p className="border-t border-hairline pt-4 t-meta italic text-ink-faint">{t.explore.noDesc}</p>
              )}

              {detail.data_source && (
                <p className="t-caption text-ink-faint">
                  {t.explore.source} · <span className="text-ink-soft">{detail.data_source}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
