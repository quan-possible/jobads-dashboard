import { fmtCompact, fmtPct } from "@/lib/format";
import type { RankItem } from "@/lib/types";

// Horizontal ranked bars. `metric="yoy"` colours by direction (growth/cooling)
// and sizes by magnitude; `metric="value"` sizes by level with one accent.

export function RankedBars({
  items,
  metric = "yoy",
  emptyHint,
}: {
  items: RankItem[];
  metric?: "yoy" | "value";
  emptyHint?: string;
}) {
  if (!items || items.length === 0) {
    return <p className="py-6 text-center text-[0.85rem] text-ink-faint">{emptyHint ?? "No data for this selection."}</p>;
  }

  const maxAbs =
    metric === "yoy"
      ? Math.max(1, ...items.map((i) => Math.abs(i.yoy ?? 0)))
      : Math.max(1, ...items.map((i) => i.value));

  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((it) => {
        const raw = metric === "yoy" ? it.yoy ?? 0 : it.value;
        const pos = raw >= 0;
        const pct = (Math.abs(raw) / maxAbs) * 100;
        const color = metric === "value" ? "var(--teal)" : pos ? "var(--pos)" : "var(--neg)";
        return (
          <li key={it.code} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
            <span className="truncate text-[0.9rem] font-bold text-navy" title={it.label}>
              {it.label}
            </span>
            <span className="num text-[0.85rem] font-bold tabular-nums" style={{ color }}>
              {metric === "yoy" ? fmtPct(it.yoy, { sign: true }) : fmtCompact(it.value)}
            </span>
            <div className="col-span-2 h-2 w-full overflow-hidden rounded-sm bg-surface-alt">
              <div
                className="h-full rounded-sm transition-[width] duration-500"
                style={{ width: `${Math.max(3, pct)}%`, background: color }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
