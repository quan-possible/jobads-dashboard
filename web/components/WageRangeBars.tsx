import { fmtCompact, fmtWage } from "@/lib/format";
import type { WageItem } from "@/lib/types";

// Horizontal wage-range bars. Each row shows a 25th–75th percentile band in
// teal with a navy median dot. Gated items (insufficient sample) render muted
// below the ranked non-gated rows.

export function WageRangeBars({ items }: { items: WageItem[] }) {
  if (!items || items.length === 0) {
    return (
      <p className="py-6 text-center text-[0.85rem] text-ink-faint">
        No wage data for this selection.
      </p>
    );
  }

  const nonGated = items
    .filter((i) => !i.gated && i.p25 !== null && i.median !== null && i.p75 !== null)
    .sort((a, b) => (b.median ?? 0) - (a.median ?? 0));

  const gated = items.filter((i) => i.gated);

  // Domain: min(p25) → max(p75) of non-gated, padded ~5%.
  const domainMin =
    nonGated.length > 0
      ? Math.min(...nonGated.map((i) => i.p25 ?? Infinity))
      : 0;
  const domainMax =
    nonGated.length > 0
      ? Math.max(...nonGated.map((i) => i.p75 ?? 0))
      : 100;
  const pad = (domainMax - domainMin) * 0.05;
  const dMin = Math.max(0, domainMin - pad);
  const dMax = domainMax + pad;
  const dRange = dMax - dMin;

  function toPercent(val: number): number {
    return Math.min(100, Math.max(0, ((val - dMin) / dRange) * 100));
  }

  return (
    <div
      role="img"
      aria-label={`Hourly wage ranges for ${nonGated.length} group${nonGated.length !== 1 ? "s" : ""}. Median ranges from ${fmtWage(nonGated[nonGated.length - 1]?.median)} to ${fmtWage(nonGated[0]?.median)}.`}
      className="flex flex-col gap-0"
    >
      {/* Domain axis header */}
      {nonGated.length > 0 && (
        <div className="mb-3 grid grid-cols-[minmax(8rem,1fr)_2.4fr_auto] items-end gap-x-4">
          <div />
          <div className="relative h-4">
            <span className="num absolute left-0 text-[0.7rem] text-ink-faint">
              {fmtWage(dMin)}
            </span>
            <span className="num absolute right-0 text-[0.7rem] text-ink-faint">
              {fmtWage(dMax)}
            </span>
          </div>
          <div />
        </div>
      )}

      {/* Non-gated rows */}
      <ul className="flex flex-col gap-y-2.5">
        {nonGated.map((item) => {
          const p25pct = toPercent(item.p25!);
          const medpct = toPercent(item.median!);
          const p75pct = toPercent(item.p75!);
          const barLeft = p25pct;
          const barWidth = p75pct - p25pct;

          return (
            <li
              key={item.code}
              className="grid grid-cols-[minmax(8rem,1fr)_2.4fr_auto] items-center gap-x-4"
            >
              {/* Label */}
              <span
                className="truncate text-[0.88rem] font-bold text-navy"
                title={item.label}
              >
                {item.label}
              </span>

              {/* Range track */}
              <div className="relative h-6" title={`n = ${fmtCompact(item.n)}`}>
                {/* Background track */}
                <div className="absolute inset-y-0 left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-hairline" />

                {/* Teal fill band */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-5 rounded-sm"
                  style={{
                    left: `${barLeft}%`,
                    width: `${Math.max(2, barWidth)}%`,
                    background: "var(--teal)",
                    opacity: 0.22,
                  }}
                />

                {/* P25 cap */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                  style={{
                    left: `${p25pct}%`,
                    background: "var(--teal)",
                  }}
                />

                {/* P75 cap */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                  style={{
                    left: `${p75pct}%`,
                    background: "var(--teal)",
                  }}
                />

                {/* Median dot */}
                <div
                  className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-navy-deep border-2 border-canvas"
                  style={{ left: `${medpct}%` }}
                />
              </div>

              {/* Median value + p25–p75 caption */}
              <div className="flex flex-col items-end gap-0.5">
                <span className="num text-[0.9rem] font-bold text-navy-deep">
                  {fmtWage(item.median)}
                </span>
                <span className="num text-[0.7rem] text-ink-faint">
                  {fmtWage(item.p25)}–{fmtWage(item.p75)}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Gated rows */}
      {gated.length > 0 && (
        <ul className="mt-4 flex flex-col gap-y-2 border-t border-hairline pt-4">
          {gated.map((item) => (
            <li
              key={item.code}
              className="grid grid-cols-[minmax(8rem,1fr)_2.4fr_auto] items-center gap-x-4"
            >
              <span
                className="truncate text-[0.85rem] text-ink-faint"
                title={item.label}
              >
                {item.label}
              </span>
              <span className="text-[0.8rem] italic text-ink-faint">
                insufficient sample
              </span>
              <span className="num text-[0.75rem] text-ink-faint">
                n={fmtCompact(item.n)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
