import { fmtShare } from "@/lib/format";
import { PC } from "@/lib/plotly/theme";
import type { SkillItem } from "@/lib/types";
import { BarList, type BarRow } from "./BarList";

// Ranked skills as Plotly horizontal bars.
//   metric="share" → teal bars sized by share, value shown as a percent
//   metric="lift"  → orange bars sized by lift, with a dashed 1× reference
//                    (national average) the old CSS bars couldn't express
// ariaLabel/emptyText come from the parent page so this stays locale-agnostic.

export function SkillBars({
  items,
  metric,
  ariaLabel,
  emptyText,
  refLabel,
}: {
  items: SkillItem[];
  metric: "share" | "lift";
  ariaLabel: string;
  emptyText: string;
  refLabel?: string;
}) {
  if (!items || items.length === 0) {
    return <p className="py-6 text-center text-[0.85rem] text-ink-faint">{emptyText}</p>;
  }

  const isShare = metric === "share";
  const rows: BarRow[] = items
    .filter((i) => (isShare ? i.share > 0 : i.lift !== null))
    .map((i) => ({
      key: i.code,
      label: i.label,
      value: isShare ? i.share : (i.lift ?? 0),
      valueText: isShare ? fmtShare(i.share) : `${(i.lift ?? 0).toFixed(1)}×`,
      sublabel: i.group ? `<br>${i.group}` : undefined,
    }));

  if (rows.length === 0) {
    return <p className="py-6 text-center text-[0.85rem] text-ink-faint">{emptyText}</p>;
  }

  return (
    <BarList
      rows={rows}
      color={isShare ? PC.teal : PC.primary}
      refLine={isShare ? undefined : 1}
      refLabel={isShare ? undefined : refLabel}
      ariaLabel={ariaLabel}
    />
  );
}
