import { fmtCompact } from "@/lib/format";
import type { Locale } from "@/lib/i18n/locale";

// A single row showing how completely a field is populated across postings.
// The bar fills teal when the field is well-covered, orange when sparse (<40%).

export function CoverageBar({
  label,
  share,
  count,
  postingsLabel = "postings",
  locale = "en",
}: {
  label: string;
  share: number;
  count: number;
  /** Localised word for "postings" — defaults to English for backward compat. */
  postingsLabel?: string;
  locale?: Locale;
}) {
  const pct = (share * 100).toFixed(0);
  const isSparse = share < 0.4;
  const accentClass = isSparse ? "text-orange-deep" : "text-teal";
  const barClass = isSparse ? "bg-orange" : "bg-teal";

  return (
    <div
      role="img"
      aria-label={`${label}: ${pct}% coverage, ${fmtCompact(count, locale)} ${postingsLabel}`}
      className="min-w-0"
    >
      <div className="mb-1 grid grid-cols-[1fr_auto] items-baseline gap-2">
        <span className="t-body-sm font-bold text-navy">{label}</span>
        <span className={`num t-body-sm font-bold ${accentClass}`}>{pct}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-sm bg-surface-alt">
        <div
          className={`h-full rounded-sm ${barClass}`}
          style={{ width: `${Math.max(0, Math.min(1, share)) * 100}%` }}
        />
      </div>
      <p className="mt-1 t-caption text-ink-faint">{fmtCompact(count, locale)} {postingsLabel}</p>
    </div>
  );
}
