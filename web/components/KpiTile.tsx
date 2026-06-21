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
  spark,
  sparkColor,
  accent = false,
}: {
  label: string;
  value: string;
  unit?: string;
  context?: string;
  delta?: number | null;
  deltaLabel?: string;
  spark?: number[];
  sparkColor?: string;
  accent?: boolean;
}) {
  const hasDelta = delta !== null && delta !== undefined;
  const up = (delta ?? 0) >= 0;
  return (
    <div
      className={[
        "card relative flex flex-col gap-3 overflow-hidden p-5",
        accent ? "ring-1 ring-orange/30" : "",
      ].join(" ")}
    >
      {accent && <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-orange" />}
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[0.7rem] font-bold uppercase tracking-[0.05em] text-ink-soft">{label}</span>
        {context && <span className="text-[0.68rem] text-ink-faint">{context}</span>}
      </div>
      <div className="flex items-end gap-1.5">
        <span className="num text-[2.05rem] font-bold leading-none text-navy-deep">{value}</span>
        {unit && <span className="mb-0.5 text-[0.85rem] font-bold text-ink-soft">{unit}</span>}
      </div>
      <div className="mt-auto flex items-end justify-between gap-2">
        {hasDelta ? (
          <span
            className={[
              "num inline-flex items-center gap-1 text-[0.82rem] font-bold",
              up ? "text-pos" : "text-neg",
            ].join(" ")}
          >
            <span aria-hidden>{up ? "▲" : "▼"}</span>
            {Math.abs(delta as number).toFixed(1)}%
            {deltaLabel && <span className="font-normal text-ink-faint">{deltaLabel}</span>}
          </span>
        ) : (
          <span />
        )}
        {spark && spark.length > 1 && (
          <Sparkline data={spark} stroke={sparkColor ?? (accent ? "var(--orange)" : "var(--teal)")} />
        )}
      </div>
    </div>
  );
}
