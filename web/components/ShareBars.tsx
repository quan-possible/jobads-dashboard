import { fmtShare } from "@/lib/format";
import type { CategoryShare } from "@/lib/types";

// Compact share list for requirements sub-figures (education, experience, etc.).
// Drops zero-share categories, limits to top 6, and sizes teal bars by share.

export function ShareBars({
  items,
  max,
}: {
  items: CategoryShare[];
  max?: number;
}) {
  if (!items || items.length === 0) {
    return (
      <p className="py-4 text-center text-[0.85rem] text-ink-faint">
        No data for this selection.
      </p>
    );
  }

  const limit = max ?? 6;
  const visible = items
    .filter((i) => i.share > 0)
    .sort((a, b) => b.share - a.share)
    .slice(0, limit);

  if (visible.length === 0) {
    return (
      <p className="py-4 text-center text-[0.85rem] text-ink-faint">
        No data for this selection.
      </p>
    );
  }

  const maxShare = Math.max(1e-9, ...visible.map((i) => i.share));

  return (
    <ul
      className="flex flex-col gap-2"
      role="img"
      aria-label="Category share breakdown"
    >
      {visible.map((it) => {
        const barPct = (it.share / maxShare) * 100;
        return (
          <li
            key={it.category}
            className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-0.5"
          >
            <span
              className="truncate font-bold text-navy text-[0.88rem]"
              title={it.label}
            >
              {it.label}
            </span>
            <span className="num text-[0.82rem] font-bold tabular-nums text-ink-soft">
              {fmtShare(it.share)}
            </span>
            <div className="col-span-2 h-1.5 w-full overflow-hidden rounded-sm bg-surface-alt">
              <div
                className="h-full rounded-sm transition-[width] duration-500"
                style={{ width: `${Math.max(3, barPct)}%`, background: "var(--teal)" }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
