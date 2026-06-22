// Display formatting helpers. Keep numbers honest and scannable.

import type { Locale } from "./i18n/locale";

const NF = new Intl.NumberFormat("en-CA");
const NF1 = new Intl.NumberFormat("en-CA", { maximumFractionDigits: 1 });

const intlLocale = (locale: Locale): string => (locale === "fr" ? "fr-CA" : "en-CA");

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

export function fmtWage(n: number | null | undefined, locale: Locale = "en"): string {
  if (n === null || n === undefined) return "—";
  // Locale-correct currency: "$25.50" (en) vs "25,50 $" (fr). The symbol comes
  // from the formatter, so callers must not add their own "$" (S17).
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

export function fmtMonth(iso: string | null | undefined, locale: Locale = "en"): string {
  if (!iso) return "—";
  const [y, m] = iso.split("-").map(Number);
  if (!y || !m) return "—";
  return new Intl.DateTimeFormat(intlLocale(locale), {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, 1)));
}
