"use client";

import { fmtMonth } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import type { ReactNode } from "react";

// Every chart goes through Figure: a finding-first title, an as-of stamp, the
// chart body, and an optional source/denominator note. Enforces consistency.

export function Figure({
  eyebrow,
  title,
  asOf,
  note,
  actions,
  children,
  className = "",
}: {
  eyebrow?: string;
  title: ReactNode;
  asOf?: string;
  note?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const { locale } = useI18n();
  return (
    <figure className={`card figure-shell card-pad flex flex-col ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
          <figcaption className="t-figure-title font-bold leading-snug text-navy-deep">{title}</figcaption>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {actions}
          {asOf && (
            <span className="num whitespace-nowrap t-caption font-bold uppercase tracking-[0.03em] text-ink-faint">
              {fmtMonth(asOf, locale)}
            </span>
          )}
        </div>
      </div>
      <div className="min-w-0 flex-1">{children}</div>
      {/* A <figure> may contain only one <figcaption> (the title above); the
          source/denominator note is a plain element (S35). */}
      {note && <div className="mt-3 border-t border-hairline pt-3 t-meta leading-relaxed text-ink-soft">{note}</div>}
    </figure>
  );
}
