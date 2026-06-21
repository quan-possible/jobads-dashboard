import Link from "next/link";
import { fmtCompact, fmtPct } from "@/lib/format";
import { Sparkline } from "./Sparkline";

// Dense ranked list: rank · label · value · 24-month sparkline · semantic YoY.
// Replaces the "bar-below-label" lists — four readings per row, dozens per
// screen, and a real <table> so it is the accessible fallback too.

export type SparkRow = {
  code: string;
  label: string;
  value: number;
  yoy: number | null;
  trend?: number[] | null;
  href?: string; // when set, the row label cross-filters
  active?: boolean;
};

export function SparklineTable({
  rows,
  valueLabel,
  valueFormat = fmtCompact,
  trendLabel = "24-mo trend",
  emptyHint,
}: {
  rows: SparkRow[];
  valueLabel: string;
  valueFormat?: (n: number) => string;
  trendLabel?: string;
  emptyHint?: string;
}) {
  if (!rows || rows.length === 0) {
    return <p className="py-6 text-center text-[0.85rem] text-ink-faint">{emptyHint ?? "No data for this selection."}</p>;
  }

  return (
    <table className="w-full border-collapse text-[0.9rem]">
      <thead>
        <tr className="border-b border-hairline text-[0.68rem] font-bold uppercase tracking-[0.04em] text-ink-faint">
          <th scope="col" className="w-7 py-1.5 pr-2 text-left font-bold">#</th>
          <th scope="col" className="py-1.5 pr-3 text-left font-bold">Group</th>
          <th scope="col" className="py-1.5 pr-3 text-right font-bold">{valueLabel}</th>
          <th scope="col" className="hidden w-[120px] py-1.5 pr-3 text-left font-bold sm:table-cell">{trendLabel}</th>
          <th scope="col" className="w-16 py-1.5 text-right font-bold">YoY</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          const up = (r.yoy ?? 0) >= 0;
          const labelCell = r.href ? (
            <Link
              href={r.href}
              scroll={false}
              aria-pressed={r.active}
              className={["truncate hover:underline", r.active ? "text-orange-deep" : "text-navy"].join(" ")}
              title={r.label}
            >
              {r.label}
            </Link>
          ) : (
            <span className="truncate text-navy" title={r.label}>
              {r.label}
            </span>
          );
          return (
            <tr
              key={r.code}
              className={["border-b border-hairline/70 last:border-0", r.active ? "bg-orange/5" : ""].join(" ")}
            >
              <td className="num py-2 pr-2 text-left text-[0.78rem] text-ink-faint tabular-nums">{i + 1}</td>
              <td className="max-w-0 py-2 pr-3 font-bold">{labelCell}</td>
              <td className="num py-2 pr-3 text-right font-bold tabular-nums text-ink">{valueFormat(r.value)}</td>
              <td className="hidden py-2 pr-3 align-middle sm:table-cell">
                {r.trend && r.trend.length > 1 ? (
                  <Sparkline data={r.trend} width={112} height={24} stroke="var(--teal)" fill={false} />
                ) : (
                  <span className="text-[0.72rem] text-ink-faint">—</span>
                )}
              </td>
              <td className="py-2 text-right">
                {r.yoy !== null && r.yoy !== undefined ? (
                  <span
                    className={["num inline-flex items-center justify-end gap-0.5 text-[0.8rem] font-bold tabular-nums", up ? "text-pos" : "text-neg"].join(" ")}
                  >
                    <span aria-hidden>{up ? "▲" : "▼"}</span>
                    {fmtPct(Math.abs(r.yoy), { sign: false })}
                  </span>
                ) : (
                  <span className="text-[0.72rem] text-ink-faint">—</span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
