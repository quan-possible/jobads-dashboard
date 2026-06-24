// Display formatting helpers. Keep numbers honest and scannable.

import type { Locale } from "./i18n/locale";

const intlLocale = (locale: Locale): string => (locale === "fr" ? "fr-CA" : "en-CA");

// Memoize the Intl formatters per locale so FR renders "1 234,5" (space thousands,
// comma decimal) and EN "1,234.5" without rebuilding a formatter on every call (S09).
const _nf = new Map<Locale, Intl.NumberFormat>();
const _nf1 = new Map<Locale, Intl.NumberFormat>();
function NF(locale: Locale): Intl.NumberFormat {
  let f = _nf.get(locale);
  if (!f) { f = new Intl.NumberFormat(intlLocale(locale)); _nf.set(locale, f); }
  return f;
}
function NF1(locale: Locale): Intl.NumberFormat {
  let f = _nf1.get(locale);
  if (!f) { f = new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: 1 }); _nf1.set(locale, f); }
  return f;
}

export function fmtInt(n: number | null | undefined, locale: Locale = "en"): string {
  if (n === null || n === undefined) return "—";
  return NF(locale).format(Math.round(n));
}

export function fmtCompact(n: number | null | undefined, locale: Locale = "en"): string {
  if (n === null || n === undefined) return "—";
  if (Math.abs(n) >= 1_000_000) return `${NF1(locale).format(n / 1_000_000)}M`;
  if (Math.abs(n) >= 10_000) return `${NF1(locale).format(n / 1_000)}k`;
  return NF(locale).format(Math.round(n));
}

export function fmtPct(n: number | null | undefined, opts: { sign?: boolean; locale?: Locale } = {}): string {
  if (n === null || n === undefined) return "—";
  // S18: French typography requires a narrow no-break space (U+202F) before "%".
  const pct = opts.locale === "fr" ? " %" : "%";
  const s = `${NF1(opts.locale ?? "en").format(Math.abs(n))}${pct}`;
  if (opts.sign) return `${n >= 0 ? "+" : "−"}${s}`;
  return n < 0 ? `−${s}` : s;
}

export function fmtWage(n: number | null | undefined, locale: Locale = "en"): string {
  if (n === null || n === undefined) return "—";
  // Locale-correct currency: "$25.50" (en) vs "25,50 $" (fr). The symbol comes
  // from the formatter, so callers must not add their own "$" (S17).
  // U07: lock to 2 decimal places so "$25.00–$25.50" is consistent, not "$25–$25.50".
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
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
