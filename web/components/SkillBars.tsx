import { fmtShare } from "@/lib/format";
import type { SkillItem } from "@/lib/types";

// Ranked skill list with a thin bar under each row.
// metric="share"  → teal bar sized by share/maxShare, value shown as percent
// metric="lift"   → orange bar sized by lift/maxLift, value shown as ×
//
// ariaLabel and emptyText come from the parent page so this component stays
// locale-agnostic.

export function SkillBars({
  items,
  metric,
  ariaLabel,
  emptyText,
}: {
  items: SkillItem[];
  metric: "share" | "lift";
  ariaLabel: string;
  emptyText: string;
}) {
  if (!items || items.length === 0) {
    return (
      <p className="py-6 text-center text-[0.85rem] text-ink-faint">
        {emptyText}
      </p>
    );
  }

  const sorted =
    metric === "share"
      ? [...items].sort((a, b) => b.share - a.share)
      : [...items].sort((a, b) => (b.lift ?? 0) - (a.lift ?? 0));

  const maxShare = Math.max(1e-9, ...sorted.map((i) => i.share));
  const maxLift = Math.max(1e-9, ...sorted.map((i) => i.lift ?? 0));

  return (
    <ul className="flex flex-col gap-2.5" role="img" aria-label={ariaLabel}>
      {sorted.map((it) => {
        const isShare = metric === "share";
        const barPct = isShare
          ? (it.share / maxShare) * 100
          : ((it.lift ?? 0) / maxLift) * 100;
        const barColor = isShare ? "var(--teal)" : "var(--orange)";
        const valueStr = isShare
          ? fmtShare(it.share)
          : `${(it.lift ?? 0).toFixed(1)}×`;
        const valueColor = isShare ? undefined : "var(--orange)";

        return (
          <li
            key={it.code}
            className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-0.5"
          >
            <div className="min-w-0">
              <span
                className="block truncate font-bold text-navy"
                title={it.label}
              >
                {it.label}
              </span>
              {it.group && (
                <span className="block text-[0.62rem] uppercase tracking-[0.04em] text-ink-faint leading-none mt-0.5">
                  {it.group}
                </span>
              )}
            </div>
            <span
              className="num text-[0.85rem] font-bold tabular-nums"
              style={valueColor ? { color: valueColor } : undefined}
            >
              {valueStr}
            </span>
            <div className="col-span-2 h-2 w-full overflow-hidden rounded-sm bg-surface-alt">
              <div
                className="h-full rounded-sm transition-[width] duration-500"
                style={{
                  width: `${Math.max(3, barPct)}%`,
                  background: barColor,
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
