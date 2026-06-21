"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { fmtCompact, fmtPct } from "@/lib/format";
import type { Option } from "@/lib/options";
import type { RankItem } from "@/lib/types";

// Ranked bars where each row is a cross-filter link: clicking a group sets the
// matching filter param; clicking the active one clears it.

export function ClickableRanks({
  items,
  param,
  options,
}: {
  items: RankItem[];
  param: "occ" | "ind";
  options: Option[];
}) {
  const sp = useSearchParams();
  const pathname = usePathname();
  const current = sp.get(param);
  const maxVal = Math.max(1, ...items.map((i) => i.value));

  const valueForCode = (code: string) => options.find((o) => o.code === code)?.value;
  const hrefFor = (value: string | undefined) => {
    if (!value) return pathname;
    const next = new URLSearchParams(sp.toString());
    if (current === value) next.delete(param);
    else next.set(param, value);
    const q = next.toString();
    return q ? `${pathname}?${q}` : pathname;
  };

  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((it) => {
        const value = valueForCode(it.code);
        const active = !!value && current === value;
        return (
          <li key={it.code}>
            <Link
              href={hrefFor(value)}
              scroll={false}
              aria-pressed={active}
              className={[
                "group grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 rounded-sm px-2 py-1.5 transition-colors",
                active ? "bg-orange/10 ring-1 ring-orange/40" : "hover:bg-surface-alt",
              ].join(" ")}
            >
              <span className={["truncate text-[0.9rem] font-bold", active ? "text-orange-deep" : "text-navy"].join(" ")} title={it.label}>
                {it.label}
              </span>
              <span className="flex items-center gap-2">
                {it.yoy !== null && (
                  <span className={["num text-[0.78rem] font-bold", it.yoy >= 0 ? "text-pos" : "text-neg"].join(" ")}>
                    {fmtPct(it.yoy, { sign: true })}
                  </span>
                )}
                <span className="num w-14 text-right text-[0.85rem] font-bold text-ink">{fmtCompact(it.value)}</span>
              </span>
              <div className="col-span-2 h-1.5 w-full overflow-hidden rounded-sm bg-surface-alt">
                <div
                  className={["h-full rounded-sm transition-[width] duration-500", active ? "bg-orange" : "bg-teal"].join(" ")}
                  style={{ width: `${Math.max(2, (it.value / maxVal) * 100)}%` }}
                />
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
