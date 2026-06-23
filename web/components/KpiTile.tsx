import { fmtPct } from "@/lib/format";
import type { Locale } from "@/lib/i18n/locale";
import { Sparkline } from "./Sparkline";

// One headline number. Optional delta chip + sparkline. The `accent` tile gets
// the orange treatment (used for the lead metric).

export function KpiTile({
  label,
  value,
  unit,
  context,
  delta,
  deltaLabel,
  valueTrend,
  spark,
  sparkColor,
  accent = false,
  locale = "en",
}: {
  label: string;
  value: string;
  unit?: string;
  context?: string;
  delta?: number | null;
  deltaLabel?: string;
  /** When set, the headline value itself is a trend metric: it gets the same
   *  ▲/▼ + pos/neg colour treatment as the delta chip, so all four tiles share
   *  one trend grammar (U02). */
  valueTrend?: number | null;
  spark?: number[];
  sparkColor?: string;
  accent?: boolean;
  locale?: Locale;
}) {
  const hasDelta = delta !== null && delta !== undefined;
  const up = (delta ?? 0) >= 0;
  const hasValueTrend = valueTrend !== null && valueTrend !== undefined;
  const valueUp = (valueTrend ?? 0) >= 0;
  return (
    <div
      className={[
        "card relative flex flex-col gap-3 overflow-hidden p-5",
        accent ? "ring-1 ring-orange/30" : "",
      ].join(" ")}
    >
      {accent && <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-orange" />}
      <div className="flex items-baseline justify-between gap-2">
        <span className="t-caption font-bold uppercase tracking-[0.05em] text-ink-soft">{label}</span>
        {context && <span className="t-caption text-ink-faint">{context}</span>}
      </div>
      <div className="flex items-end gap-1.5">
        {hasValueTrend && (
          <span aria-hidden className={`text-[1.5rem] leading-none ${valueUp ? "text-pos" : "text-neg"}`}>
            {valueUp ? "▲" : "▼"}
          </span>
        )}
        <span
          className={[
            "num text-[2.05rem] font-bold leading-none",
            hasValueTrend ? (valueUp ? "text-pos" : "text-neg") : "text-navy-deep",
          ].join(" ")}
        >
          {value}
        </span>
        {unit && <span className="mb-0.5 t-body-sm font-bold text-ink-soft">{unit}</span>}
      </div>
      <div className="mt-auto flex flex-col items-stretch gap-2 sm:flex-row sm:items-end">
        {hasDelta ? (
          <span
            className={[
              "num inline-flex shrink-0 items-center gap-1 whitespace-nowrap t-meta font-bold",
              up ? "text-pos" : "text-neg",
            ].join(" ")}
          >
            <span aria-hidden>{up ? "▲" : "▼"}</span>
            {fmtPct(Math.abs(delta as number), { locale })}
            {deltaLabel && <span className="font-normal text-ink-faint">{deltaLabel}</span>}
          </span>
        ) : (
          <span />
        )}
        {spark && spark.length > 1 && (
          <div className="flex min-w-0 flex-1 justify-end">
            <Sparkline data={spark} stroke={sparkColor ?? (accent ? "var(--orange)" : "var(--teal)")} />
          </div>
        )}
      </div>
    </div>
  );
}
