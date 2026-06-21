"use client";

import { useEffect, useState } from "react";
import { fetchPosting } from "@/lib/explore";
import { fmtMonth, fmtWage } from "@/lib/format";
import type { PostingDetail } from "@/lib/types";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "" || value === "—") return null;
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[0.62rem] font-bold uppercase tracking-[0.05em] text-ink-faint">{label}</dt>
      <dd className="text-[0.88rem] text-navy-deep">{value}</dd>
    </div>
  );
}

function wageLine(d: PostingDetail): string | null {
  if (d.wage_hourly != null) return `${fmtWage(d.wage_hourly)}/hr`;
  if (d.wage_min != null || d.wage_max != null) {
    const lo = d.wage_min != null ? fmtWage(d.wage_min) : "—";
    const hi = d.wage_max != null ? fmtWage(d.wage_max) : "—";
    const unit = d.wage_unit ? ` ${d.wage_unit}` : "";
    return `${lo} – ${hi}${unit}`;
  }
  return null;
}

export function PostingDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const [detail, setDetail] = useState<PostingDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!id) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [id, onClose]);

  if (!id) return null;

  const wage = detail ? wageLine(detail) : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Posting detail">
      <button
        type="button"
        aria-label="Close detail"
        onClick={onClose}
        className="absolute inset-0 bg-navy-deep/40 backdrop-blur-[1px]"
      />
      <aside className="relative flex h-full w-full max-w-[560px] flex-col border-l border-card-border bg-surface shadow-pop animate-[drawerIn_220ms_ease-out]" style={{ boxShadow: "var(--shadow-pop)" }}>
        {/* gradient seam */}
        <span aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={{ background: "var(--gradient)" }} />

        <div className="flex items-start justify-between gap-4 border-b border-card-border px-6 py-4">
          <div className="min-w-0">
            <div className="eyebrow mb-1">Posting</div>
            <h2 className="text-[1.08rem] font-bold leading-snug text-navy-deep">
              {detail?.job_title ?? (loading ? "Loading…" : "Posting")}
            </h2>
            {detail?.employer && <p className="mt-0.5 text-[0.85rem] text-ink-soft">{detail.employer}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="control shrink-0 border border-card-border px-2.5 py-1.5 text-[0.9rem] font-bold leading-none text-ink-soft transition-colors hover:border-orange hover:text-orange"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {loading && <div className="py-10 text-center text-[0.85rem] text-ink-faint">Loading posting…</div>}
          {error && <div className="py-10 text-center text-[0.85rem] text-neg">{error}</div>}

          {detail && (
            <div className="flex flex-col gap-6">
              {/* chips */}
              <div className="flex flex-wrap gap-1.5">
                {detail.province && (
                  <span className="border border-card-border bg-surface-alt px-2 py-1 text-[0.72rem] font-bold text-navy">
                    {detail.province}
                    {detail.market ? ` · ${detail.market}` : ""}
                  </span>
                )}
                {detail.noc_code && (
                  <span className="border border-card-border bg-surface-alt px-2 py-1 text-[0.72rem] text-ink-soft">
                    NOC {detail.noc_code}
                  </span>
                )}
                {detail.naics_code && (
                  <span className="border border-card-border bg-surface-alt px-2 py-1 text-[0.72rem] text-ink-soft">
                    NAICS {detail.naics_code}
                  </span>
                )}
                {detail.remote_class && detail.remote_class !== "Not reported" && (
                  <span className="border border-orange/40 bg-orange/5 px-2 py-1 text-[0.72rem] font-bold text-orange-deep">
                    {detail.remote_class}
                  </span>
                )}
              </div>

              <dl className="grid grid-cols-2 gap-x-5 gap-y-4">
                <Field label="Posted" value={detail.date_found ? fmtMonth(detail.date_found) : null} />
                <Field label="Reference month" value={fmtMonth(detail.month)} />
                <Field label="Wage" value={wage} />
                <Field label="Employment" value={detail.employment_type} />
                <Field label="Duration" value={detail.duration} />
                <Field label="Experience" value={detail.experience} />
                <Field label="Education" value={detail.education} />
                <Field label="Language" value={detail.primary_posting_language} />
                <Field label="Occupation (NOC)" value={detail.noc_label} />
                <Field label="Industry (NAICS)" value={detail.naics_label} />
              </dl>

              {detail.description_full ? (
                <div>
                  <div className="eyebrow mb-2 border-t border-hairline pt-4">Posting description</div>
                  <p className="whitespace-pre-wrap text-[0.86rem] leading-relaxed text-ink-soft">
                    {detail.description_full}
                  </p>
                  <p className="mt-4 text-[0.72rem] italic leading-relaxed text-ink-faint">
                    Raw text as collected from the source site, lightly trimmed. Shown for verification only.
                  </p>
                </div>
              ) : (
                <p className="border-t border-hairline pt-4 text-[0.8rem] italic text-ink-faint">
                  No description was captured for this posting.
                </p>
              )}

              {detail.data_source && (
                <p className="text-[0.72rem] text-ink-faint">
                  Source · <span className="text-ink-soft">{detail.data_source}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
