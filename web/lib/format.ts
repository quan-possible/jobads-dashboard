// Display formatting helpers. Keep numbers honest and scannable.

const NF = new Intl.NumberFormat("en-CA");
const NF1 = new Intl.NumberFormat("en-CA", { maximumFractionDigits: 1 });

export function fmtInt(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return NF.format(Math.round(n));
}

export function fmtCompact(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  if (Math.abs(n) >= 1_000_000) return `${NF1.format(n / 1_000_000)}M`;
  if (Math.abs(n) >= 10_000) return `${NF1.format(n / 1_000)}k`;
  return NF.format(Math.round(n));
}

export function fmtPct(n: number | null | undefined, opts: { sign?: boolean } = {}): string {
  if (n === null || n === undefined) return "—";
  const s = `${NF1.format(Math.abs(n))}%`;
  if (opts.sign) return `${n >= 0 ? "+" : "−"}${s}`;
  return n < 0 ? `−${s}` : s;
}

export function fmtShare(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return `${NF1.format(n * 100)}%`;
}

export function fmtWage(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return `$${NF1.format(n)}`;
}

export function fmtIndex(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return NF.format(Math.round(n));
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtMonth(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m] = iso.split("-").map(Number);
  return `${MONTHS[(m ?? 1) - 1]} ${y}`;
}

export function fmtMonthShort(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return `${MONTHS[(m ?? 1) - 1]} ’${String(y).slice(2)}`;
}

/** Direction sign: positive = growth (teal), negative = cooling (warm red). */
export function trendClass(n: number | null | undefined): string {
  if (n === null || n === undefined) return "text-ink-faint";
  return n >= 0 ? "text-pos" : "text-neg";
}
