import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n/locale";
import { fmtMonth } from "@/lib/format";

/** Shared public-route masthead: dark institutional anchor, readable lede, and gradient rail. */
export function RouteMasthead({
  eyebrow,
  title,
  lede,
  asOf,
  locale,
}: {
  eyebrow: string;
  title: string;
  lede: ReactNode;
  asOf?: string;
  locale?: Locale;
}) {
  const stamp = asOf ? ` · ${locale ? fmtMonth(asOf, locale) : asOf}` : "";
  return (
    <section className="overflow-hidden bg-surface-navy text-ink-invert">
      <div className="container-x py-12 md:py-16">
        <div className="eyebrow mb-3 !text-orange-soft">{eyebrow}{stamp}</div>
        <h1 className="h-display w-full max-w-full break-words !text-ink-invert text-balance" style={{ overflowWrap: "anywhere" }}>{title}</h1>
        <div className="lede mt-4 w-full max-w-full break-words !text-ink-invert/75" style={{ overflowWrap: "anywhere" }}>{lede}</div>
      </div>
      <div className="gradient-bar" aria-hidden="true" />
    </section>
  );
}
