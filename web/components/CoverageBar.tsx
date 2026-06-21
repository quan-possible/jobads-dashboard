import { fmtCompact } from "@/lib/format";

// A single row showing how completely a field is populated across postings.
// The bar fills teal when the field is well-covered, orange when sparse (<40%).

export function CoverageBar({
  label,
  share,
  count,
  postingsLabel = "postings",
}: {
  label: string;
  share: number;
  count: number;
  /** Localised word for "postings" — defaults to English for backward compat. */
  postingsLabel?: string;
}) {
  const pct = (share * 100).toFixed(0);
  const isSparse = share < 0.4;
  const accentClass = isSparse ? "text-orange-deep" : "text-teal";
  const barClass = isSparse ? "bg-orange" : "bg-teal";

  return (
    <div
      role="img"
      aria-label={`${label}: ${pct}% coverage, ${fmtCompact(count)} ${postingsLabel}`}
    >
      <div className="mb-1 grid grid-cols-[1fr_auto] items-baseline gap-2">
        <span className="text-[0.88rem] font-bold text-navy">{label}</span>
        <span className={`num text-[0.88rem] font-bold ${accentClass}`}>{pct}%</span>
      </div>
      <div className="h-2.5 w-full rounded-sm bg-surface-alt">
        <div
          className={`h-full rounded-sm ${barClass}`}
          style={{ width: `${share * 100}%` }}
        />
      </div>
      <p className="mt-1 text-[0.74rem] text-ink-faint">{fmtCompact(count)} {postingsLabel}</p>
    </div>
  );
}
