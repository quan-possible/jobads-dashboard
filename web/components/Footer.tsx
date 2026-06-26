"use client";

import Link from "next/link";
import { NAV } from "@/lib/nav";
import { useI18n } from "@/lib/i18n/provider";
import { PixelTiles } from "./PixelTiles";

export function Footer({ asOf, source }: { asOf?: string; source?: string }) {
  const { t } = useI18n();
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 bg-surface-navy text-ink-invert">
      <div className="gradient-bar" />
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1.2fr]">
        <div>
          <div className="flex items-center gap-3">
            <PixelTiles rows={3} cols={3} size={8} gap={2} />
            <span className="text-lg font-bold uppercase tracking-[0.01em]">ACLMR</span>
          </div>
          <p className="mt-4 max-w-sm t-body leading-relaxed text-ink-invert/70">{t.footer.tagline}</p>
        </div>

        <nav aria-label={t.footer.sections} className="flex flex-col gap-2">
          <span className="eyebrow text-orange-soft!">{t.footer.dashboard}</span>
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="w-fit t-body text-ink-invert/80 transition-colors hover:text-orange-soft">
              {t.nav[item.key]}
            </Link>
          ))}
          <Link href="/developers" className="w-fit t-body text-ink-invert/80 transition-colors hover:text-orange-soft">
            {t.nav.developers}
          </Link>
        </nav>

        <div className="flex flex-col gap-3 t-meta text-ink-invert/65">
          <span className="eyebrow text-orange-soft!">{t.footer.aboutData}</span>
          <p>{source ?? t.footer.sourceDefault}</p>
          <p>{t.footer.categoryCap}</p>
          {asOf && (
            <p className="num">
              {t.footer.dataThrough} {asOf}.
            </p>
          )}
          <p>
            {t.footer.readMethodPre}{" "}
            <Link href="/method" className="font-bold text-orange-soft underline-offset-2 hover:underline">
              {t.footer.readMethodLink}
            </Link>{" "}
            {t.footer.readMethodPost}
          </p>
          <a href="https://www.aclmr.ca/" className="mt-2 w-fit text-ink-invert/80 transition-colors hover:text-orange-soft">
            aclmr.ca →
          </a>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-start justify-between gap-2 py-5 t-caption text-ink-invert/50 sm:flex-row sm:items-center">
          <span>© {year} {t.footer.rights}</span>
          <span className="uppercase tracking-[0.04em]">{t.footer.disclaimer}</span>
        </div>
      </div>
    </footer>
  );
}
