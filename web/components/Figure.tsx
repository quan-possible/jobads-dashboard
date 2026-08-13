"use client";

import type { ReactNode } from "react";

// Every chart goes through Figure: a concise title, chart body, and optional
// chart-specific note. The page masthead owns the data date.

export function Figure({
  title,
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
  return (
    <figure className={`card figure-shell card-pad flex flex-col ${className}`}>
      <div className="figure-heading mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <figcaption className="t-figure-title font-bold leading-snug text-navy-deep">{title}</figcaption>
        </div>
        <div className="figure-actions flex shrink-0 items-center gap-3">
          {actions}
        </div>
      </div>
      <div className="min-w-0 flex-1">{children}</div>
      {/* A <figure> may contain only one <figcaption> (the title above); the
          source/denominator note is a plain element (S35). */}
      {note && <div className="mt-3 border-t border-hairline pt-3 t-meta leading-relaxed text-ink-soft">{note}</div>}
    </figure>
  );
}
